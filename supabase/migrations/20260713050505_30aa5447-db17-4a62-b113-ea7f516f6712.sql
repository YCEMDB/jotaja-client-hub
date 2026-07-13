
-- ============================================================
-- Delivery areas hardening (RC2 financial hotfix)
-- ============================================================

-- 1) Helper: owner/manager only (native)
CREATE OR REPLACE FUNCTION private.has_restaurant_admin_access(_user_id uuid, _restaurant_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
  SELECT EXISTS (SELECT 1 FROM public.restaurants WHERE id = _restaurant_id AND owner_id = _user_id)
      OR EXISTS (SELECT 1 FROM public.user_roles
                  WHERE user_id = _user_id AND restaurant_id = _restaurant_id
                    AND role IN ('owner'::app_role,'manager'::app_role));
$$;
REVOKE ALL ON FUNCTION private.has_restaurant_admin_access(uuid,uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.has_restaurant_admin_access(uuid,uuid) TO authenticated, service_role;

-- 2) Authorizer específico
CREATE OR REPLACE FUNCTION private.authorize_delivery_area_action(
  p_restaurant_id uuid, p_reason text
)
RETURNS TABLE(actor_id uuid, is_native boolean, support_session_id uuid, support_level text)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, private, pg_temp
AS $$
DECLARE v_uid uuid := auth.uid(); v_level text; v_session uuid;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'forbidden: not_authenticated' USING ERRCODE='42501'; END IF;
  IF p_restaurant_id IS NULL THEN RAISE EXCEPTION 'forbidden: missing_restaurant' USING ERRCODE='42501'; END IF;

  IF private.has_restaurant_admin_access(v_uid, p_restaurant_id) THEN
    actor_id:=v_uid; is_native:=true; support_session_id:=NULL; support_level:=NULL;
    RETURN NEXT; RETURN;
  END IF;

  v_level := private.active_support_level(v_uid, p_restaurant_id);
  IF v_level IS NULL THEN
    RAISE EXCEPTION 'forbidden: no_active_support_session' USING ERRCODE='42501';
  END IF;
  IF v_level <> 'administrative' THEN
    RAISE EXCEPTION 'forbidden: support_level_insufficient' USING ERRCODE='42501';
  END IF;
  IF p_reason IS NULL OR length(regexp_replace(p_reason,'\s','','g')) < 5 THEN
    RAISE EXCEPTION 'reason_required' USING ERRCODE='22023';
  END IF;
  v_session := private.current_support_session_id(p_restaurant_id);
  IF v_session IS NULL THEN
    RAISE EXCEPTION 'forbidden: support_session_not_found' USING ERRCODE='42501';
  END IF;

  actor_id:=v_uid; is_native:=false; support_session_id:=v_session; support_level:=v_level;
  RETURN NEXT; RETURN;
END; $$;
REVOKE ALL ON FUNCTION private.authorize_delivery_area_action(uuid,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.authorize_delivery_area_action(uuid,text) TO authenticated, service_role;

-- 3) Validators
CREATE OR REPLACE FUNCTION private.validate_delivery_area_fields(
  p_neighborhood text, p_city text, p_fee numeric,
  p_min_order numeric, p_estimated_minutes integer
) RETURNS void
LANGUAGE plpgsql IMMUTABLE
SET search_path = pg_catalog, pg_temp
AS $$
BEGIN
  IF p_neighborhood IS NULL OR length(btrim(p_neighborhood)) < 2 THEN
    RAISE EXCEPTION 'neighborhood_required' USING ERRCODE='22023'; END IF;
  IF length(btrim(p_neighborhood)) > 80 THEN
    RAISE EXCEPTION 'neighborhood_too_long' USING ERRCODE='22023'; END IF;
  IF p_city IS NOT NULL AND length(btrim(p_city)) > 80 THEN
    RAISE EXCEPTION 'city_too_long' USING ERRCODE='22023'; END IF;
  IF p_fee IS NULL OR p_fee < 0 THEN
    RAISE EXCEPTION 'fee_invalid' USING ERRCODE='22023'; END IF;
  IF p_fee > 500 THEN
    RAISE EXCEPTION 'fee_too_high' USING ERRCODE='22023'; END IF;
  IF round(p_fee, 2) <> p_fee THEN
    RAISE EXCEPTION 'fee_precision_invalid' USING ERRCODE='22023'; END IF;
  IF p_min_order IS NULL OR p_min_order < 0 THEN
    RAISE EXCEPTION 'min_order_invalid' USING ERRCODE='22023'; END IF;
  IF p_min_order > 100000 THEN
    RAISE EXCEPTION 'min_order_too_high' USING ERRCODE='22023'; END IF;
  IF round(p_min_order, 2) <> p_min_order THEN
    RAISE EXCEPTION 'min_order_precision_invalid' USING ERRCODE='22023'; END IF;
  IF p_estimated_minutes IS NULL OR p_estimated_minutes <= 0 THEN
    RAISE EXCEPTION 'estimated_minutes_invalid' USING ERRCODE='22023'; END IF;
  IF p_estimated_minutes > 480 THEN
    RAISE EXCEPTION 'estimated_minutes_too_high' USING ERRCODE='22023'; END IF;
END; $$;

CREATE OR REPLACE FUNCTION private.assert_restaurant_active(p_restaurant_id uuid)
RETURNS void LANGUAGE plpgsql STABLE
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE v boolean;
BEGIN
  SELECT is_active INTO v FROM public.restaurants WHERE id = p_restaurant_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'restaurant_not_found' USING ERRCODE='42704'; END IF;
  IF v IS NOT TRUE THEN RAISE EXCEPTION 'restaurant_inactive' USING ERRCODE='42501'; END IF;
END; $$;

-- 4) Revogar DML direto + policies antigas
DROP POLICY IF EXISTS delivery_areas_write ON public.delivery_areas;
REVOKE INSERT, UPDATE, DELETE ON public.delivery_areas FROM authenticated, anon;
GRANT SELECT ON public.delivery_areas TO authenticated, anon;
GRANT ALL ON public.delivery_areas TO service_role;

-- 5) Índice único (não há duplicatas ativas atualmente)
CREATE UNIQUE INDEX IF NOT EXISTS delivery_areas_unique_active_neighborhood
ON public.delivery_areas (
  restaurant_id,
  lower(public.unaccent_immutable(btrim(neighborhood)))
) WHERE is_active = true;

-- 6) RPCs

-- create_delivery_area
DROP FUNCTION IF EXISTS public.create_delivery_area(uuid,text,text,numeric,numeric,integer,text);
CREATE FUNCTION public.create_delivery_area(
  p_restaurant_id uuid,
  p_neighborhood text,
  p_city text,
  p_fee numeric,
  p_min_order numeric,
  p_estimated_minutes integer,
  p_reason text DEFAULT NULL
) RETURNS public.delivery_areas
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, private, pg_temp
AS $$
DECLARE v_auth record; v_row public.delivery_areas; v_dup uuid;
BEGIN
  SELECT * INTO v_auth FROM private.authorize_delivery_area_action(p_restaurant_id, p_reason);
  PERFORM private.assert_restaurant_active(p_restaurant_id);
  PERFORM private.validate_delivery_area_fields(p_neighborhood, p_city, p_fee, p_min_order, p_estimated_minutes);

  SELECT id INTO v_dup FROM public.delivery_areas
   WHERE restaurant_id = p_restaurant_id
     AND is_active = true
     AND lower(public.unaccent_immutable(btrim(neighborhood)))
       = lower(public.unaccent_immutable(btrim(p_neighborhood)))
   LIMIT 1;
  IF v_dup IS NOT NULL THEN
    RAISE EXCEPTION 'neighborhood_already_active' USING ERRCODE='23505';
  END IF;

  INSERT INTO public.delivery_areas (restaurant_id, neighborhood, city, fee, min_order, estimated_minutes, is_active)
  VALUES (p_restaurant_id, btrim(p_neighborhood), NULLIF(btrim(p_city),''), p_fee, p_min_order, p_estimated_minutes, true)
  RETURNING * INTO v_row;

  PERFORM private.record_audit(
    'create_delivery_area','delivery',p_restaurant_id,'delivery_area',v_row.id::text,
    NULL, to_jsonb(v_row), p_reason,
    jsonb_build_object('is_native', v_auth.is_native, 'support_level', v_auth.support_level),
    v_auth.support_session_id
  );
  RETURN v_row;
END; $$;
REVOKE ALL ON FUNCTION public.create_delivery_area(uuid,text,text,numeric,numeric,integer,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_delivery_area(uuid,text,text,numeric,numeric,integer,text) TO authenticated, service_role;

-- update_delivery_area
DROP FUNCTION IF EXISTS public.update_delivery_area(uuid,text,text,numeric,numeric,integer,text);
CREATE FUNCTION public.update_delivery_area(
  p_area_id uuid,
  p_neighborhood text,
  p_city text,
  p_fee numeric,
  p_min_order numeric,
  p_estimated_minutes integer,
  p_reason text DEFAULT NULL
) RETURNS public.delivery_areas
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, private, pg_temp
AS $$
DECLARE v_auth record; v_old public.delivery_areas; v_new public.delivery_areas; v_dup uuid;
BEGIN
  SELECT * INTO v_old FROM public.delivery_areas WHERE id = p_area_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'delivery_area_not_found' USING ERRCODE='42704'; END IF;

  SELECT * INTO v_auth FROM private.authorize_delivery_area_action(v_old.restaurant_id, p_reason);
  PERFORM private.assert_restaurant_active(v_old.restaurant_id);
  PERFORM private.validate_delivery_area_fields(p_neighborhood, p_city, p_fee, p_min_order, p_estimated_minutes);

  IF v_old.is_active THEN
    SELECT id INTO v_dup FROM public.delivery_areas
     WHERE restaurant_id = v_old.restaurant_id
       AND is_active = true
       AND id <> p_area_id
       AND lower(public.unaccent_immutable(btrim(neighborhood)))
         = lower(public.unaccent_immutable(btrim(p_neighborhood)))
     LIMIT 1;
    IF v_dup IS NOT NULL THEN
      RAISE EXCEPTION 'neighborhood_already_active' USING ERRCODE='23505';
    END IF;
  END IF;

  UPDATE public.delivery_areas
     SET neighborhood = btrim(p_neighborhood),
         city = NULLIF(btrim(p_city),''),
         fee = p_fee,
         min_order = p_min_order,
         estimated_minutes = p_estimated_minutes
   WHERE id = p_area_id
  RETURNING * INTO v_new;

  IF to_jsonb(v_old) = to_jsonb(v_new) THEN
    RETURN v_new;
  END IF;

  PERFORM private.record_audit(
    'update_delivery_area','delivery',v_old.restaurant_id,'delivery_area',v_new.id::text,
    to_jsonb(v_old), to_jsonb(v_new), p_reason,
    jsonb_build_object('is_native', v_auth.is_native, 'support_level', v_auth.support_level),
    v_auth.support_session_id
  );
  RETURN v_new;
END; $$;
REVOKE ALL ON FUNCTION public.update_delivery_area(uuid,text,text,numeric,numeric,integer,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_delivery_area(uuid,text,text,numeric,numeric,integer,text) TO authenticated, service_role;

-- set_delivery_area_active
DROP FUNCTION IF EXISTS public.set_delivery_area_active(uuid,boolean,text);
CREATE FUNCTION public.set_delivery_area_active(
  p_area_id uuid, p_active boolean, p_reason text DEFAULT NULL
) RETURNS public.delivery_areas
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, private, pg_temp
AS $$
DECLARE v_auth record; v_old public.delivery_areas; v_new public.delivery_areas; v_dup uuid;
BEGIN
  SELECT * INTO v_old FROM public.delivery_areas WHERE id = p_area_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'delivery_area_not_found' USING ERRCODE='42704'; END IF;

  SELECT * INTO v_auth FROM private.authorize_delivery_area_action(v_old.restaurant_id, p_reason);
  PERFORM private.assert_restaurant_active(v_old.restaurant_id);

  IF COALESCE(v_old.is_active,false) = COALESCE(p_active,false) THEN
    RETURN v_old;
  END IF;

  IF p_active THEN
    SELECT id INTO v_dup FROM public.delivery_areas
     WHERE restaurant_id = v_old.restaurant_id AND is_active = true AND id <> p_area_id
       AND lower(public.unaccent_immutable(btrim(neighborhood)))
         = lower(public.unaccent_immutable(btrim(v_old.neighborhood)))
     LIMIT 1;
    IF v_dup IS NOT NULL THEN
      RAISE EXCEPTION 'neighborhood_already_active' USING ERRCODE='23505';
    END IF;
  END IF;

  UPDATE public.delivery_areas SET is_active = p_active
   WHERE id = p_area_id RETURNING * INTO v_new;

  PERFORM private.record_audit(
    CASE WHEN p_active THEN 'activate_delivery_area' ELSE 'deactivate_delivery_area' END,
    'delivery', v_old.restaurant_id, 'delivery_area', v_new.id::text,
    to_jsonb(v_old), to_jsonb(v_new), p_reason,
    jsonb_build_object('is_native', v_auth.is_native, 'support_level', v_auth.support_level),
    v_auth.support_session_id
  );
  RETURN v_new;
END; $$;
REVOKE ALL ON FUNCTION public.set_delivery_area_active(uuid,boolean,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_delivery_area_active(uuid,boolean,text) TO authenticated, service_role;

-- archive_delivery_area (soft-delete via is_active=false + auditoria explícita)
DROP FUNCTION IF EXISTS public.archive_delivery_area(uuid,text);
CREATE FUNCTION public.archive_delivery_area(
  p_area_id uuid, p_reason text DEFAULT NULL
) RETURNS public.delivery_areas
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, private, pg_temp
AS $$
DECLARE v_auth record; v_old public.delivery_areas; v_new public.delivery_areas;
BEGIN
  SELECT * INTO v_old FROM public.delivery_areas WHERE id = p_area_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'delivery_area_not_found' USING ERRCODE='42704'; END IF;
  SELECT * INTO v_auth FROM private.authorize_delivery_area_action(v_old.restaurant_id, p_reason);
  PERFORM private.assert_restaurant_active(v_old.restaurant_id);

  IF v_old.is_active IS NOT TRUE THEN RETURN v_old; END IF;

  UPDATE public.delivery_areas SET is_active = false
   WHERE id = p_area_id RETURNING * INTO v_new;

  PERFORM private.record_audit(
    'archive_delivery_area','delivery',v_old.restaurant_id,'delivery_area',v_new.id::text,
    to_jsonb(v_old), to_jsonb(v_new), p_reason,
    jsonb_build_object('is_native', v_auth.is_native, 'support_level', v_auth.support_level),
    v_auth.support_session_id
  );
  RETURN v_new;
END; $$;
REVOKE ALL ON FUNCTION public.archive_delivery_area(uuid,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.archive_delivery_area(uuid,text) TO authenticated, service_role;

-- import_delivery_areas (transacional)
DROP FUNCTION IF EXISTS public.import_delivery_areas(uuid,jsonb,text);
CREATE FUNCTION public.import_delivery_areas(
  p_restaurant_id uuid, p_rows jsonb, p_reason text DEFAULT NULL
) RETURNS SETOF public.delivery_areas
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, private, pg_temp
AS $$
DECLARE
  v_auth record;
  v_item jsonb;
  v_neighborhood text; v_city text;
  v_fee numeric; v_min numeric; v_min_int integer;
  v_row public.delivery_areas;
  v_seen text[] := ARRAY[]::text[];
  v_key text;
BEGIN
  IF p_rows IS NULL OR jsonb_typeof(p_rows) <> 'array' OR jsonb_array_length(p_rows) = 0 THEN
    RAISE EXCEPTION 'rows_required' USING ERRCODE='22023';
  END IF;
  IF jsonb_array_length(p_rows) > 500 THEN
    RAISE EXCEPTION 'too_many_rows' USING ERRCODE='22023';
  END IF;

  SELECT * INTO v_auth FROM private.authorize_delivery_area_action(p_restaurant_id, p_reason);
  PERFORM private.assert_restaurant_active(p_restaurant_id);

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_rows) LOOP
    v_neighborhood := v_item->>'neighborhood';
    v_city := v_item->>'city';
    v_fee := (v_item->>'fee')::numeric;
    v_min := COALESCE((v_item->>'min_order')::numeric, 0);
    v_min_int := COALESCE((v_item->>'estimated_minutes')::integer, 30);

    PERFORM private.validate_delivery_area_fields(v_neighborhood, v_city, v_fee, v_min, v_min_int);
    v_key := lower(public.unaccent_immutable(btrim(v_neighborhood)));
    IF v_key = ANY (v_seen) THEN
      RAISE EXCEPTION 'duplicate_in_batch: %', v_neighborhood USING ERRCODE='22023';
    END IF;
    v_seen := array_append(v_seen, v_key);

    IF EXISTS (
      SELECT 1 FROM public.delivery_areas
       WHERE restaurant_id = p_restaurant_id AND is_active = true
         AND lower(public.unaccent_immutable(btrim(neighborhood))) = v_key
    ) THEN
      RAISE EXCEPTION 'neighborhood_already_active: %', v_neighborhood USING ERRCODE='23505';
    END IF;

    INSERT INTO public.delivery_areas (restaurant_id, neighborhood, city, fee, min_order, estimated_minutes, is_active)
    VALUES (p_restaurant_id, btrim(v_neighborhood), NULLIF(btrim(v_city),''), v_fee, v_min, v_min_int, true)
    RETURNING * INTO v_row;

    PERFORM private.record_audit(
      'import_delivery_area','delivery',p_restaurant_id,'delivery_area',v_row.id::text,
      NULL, to_jsonb(v_row), p_reason,
      jsonb_build_object('batch', true, 'is_native', v_auth.is_native, 'support_level', v_auth.support_level),
      v_auth.support_session_id
    );
    RETURN NEXT v_row;
  END LOOP;
  RETURN;
END; $$;
REVOKE ALL ON FUNCTION public.import_delivery_areas(uuid,jsonb,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.import_delivery_areas(uuid,jsonb,text) TO authenticated, service_role;
