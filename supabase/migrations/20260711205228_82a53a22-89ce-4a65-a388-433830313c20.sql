
-- =========================================================================
-- Onda 2.c — Super Admin platform RPCs
-- Substitui DML direto nas telas /super por RPCs auditadas com search_path fixo
-- =========================================================================

-- Guard reutilizável (interno)
CREATE OR REPLACE FUNCTION private.assert_super_admin()
RETURNS uuid
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = private, public, pg_temp
AS $$
DECLARE v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'unauthorized' USING ERRCODE = '42501';
  END IF;
  IF NOT private.is_super_admin(v_uid) THEN
    RAISE EXCEPTION 'forbidden: super_admin_required' USING ERRCODE = '42501';
  END IF;
  RETURN v_uid;
END $$;

REVOKE ALL ON FUNCTION private.assert_super_admin() FROM PUBLIC, anon, authenticated;

-- -------------------------------------------------------------------------
-- Restaurante: metadados (plano, ativação, notas)
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_update_restaurant_meta(
  p_restaurant_id uuid,
  p_plan_id text DEFAULT NULL,
  p_is_active boolean DEFAULT NULL,
  p_admin_notes text DEFAULT NULL,
  p_reason text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE
  v_actor uuid;
  v_old record;
  v_legacy_plan text;
  v_changes_sensitive boolean;
BEGIN
  v_actor := private.assert_super_admin();

  SELECT id, name, plan_id, is_active, admin_notes, plan::text AS plan_enum
    INTO v_old
    FROM public.restaurants
    WHERE id = p_restaurant_id
    FOR UPDATE;
  IF v_old.id IS NULL THEN
    RAISE EXCEPTION 'restaurant not found' USING ERRCODE = 'P0002';
  END IF;

  IF p_plan_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.app_plans WHERE id = p_plan_id
  ) THEN
    RAISE EXCEPTION 'invalid_plan_id' USING ERRCODE = '22023';
  END IF;

  v_changes_sensitive :=
    (p_plan_id IS NOT NULL AND p_plan_id IS DISTINCT FROM v_old.plan_id)
    OR (p_is_active IS NOT NULL AND p_is_active IS DISTINCT FROM v_old.is_active);

  IF v_changes_sensitive
     AND (p_reason IS NULL OR char_length(trim(p_reason)) < 5) THEN
    RAISE EXCEPTION 'reason_required_min_5_chars' USING ERRCODE = '22023';
  END IF;

  v_legacy_plan := CASE
    WHEN p_plan_id IS NULL THEN v_old.plan_enum
    WHEN p_plan_id = 'starter' THEN 'essential'
    WHEN p_plan_id IN ('pro','business') THEN 'professional'
    ELSE v_old.plan_enum
  END;

  UPDATE public.restaurants
     SET plan_id      = COALESCE(p_plan_id, plan_id),
         plan         = COALESCE(v_legacy_plan::app_plan, plan),
         is_active    = COALESCE(p_is_active, is_active),
         admin_notes  = CASE WHEN p_admin_notes IS NULL THEN admin_notes ELSE p_admin_notes END
   WHERE id = p_restaurant_id;

  PERFORM private.record_audit(
    'restaurant_meta_updated', 'billing', p_restaurant_id,
    'restaurant', p_restaurant_id::text,
    jsonb_build_object('plan_id', v_old.plan_id, 'is_active', v_old.is_active,
                       'admin_notes', v_old.admin_notes),
    jsonb_build_object('plan_id', COALESCE(p_plan_id, v_old.plan_id),
                       'is_active', COALESCE(p_is_active, v_old.is_active),
                       'admin_notes', COALESCE(p_admin_notes, v_old.admin_notes)),
    NULLIF(trim(COALESCE(p_reason,'')), ''), NULL, NULL
  );
  RETURN jsonb_build_object('ok', true);
END $$;

REVOKE ALL ON FUNCTION public.admin_update_restaurant_meta(uuid, text, boolean, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_update_restaurant_meta(uuid, text, boolean, text, text) TO authenticated;

-- -------------------------------------------------------------------------
-- Restaurante: assinatura (definir/limpar fim manualmente)
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_set_subscription_end(
  p_restaurant_id uuid,
  p_ends_at timestamptz,
  p_reason text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE
  v_actor uuid;
  v_old timestamptz;
BEGIN
  v_actor := private.assert_super_admin();
  IF p_reason IS NULL OR char_length(trim(p_reason)) < 5 THEN
    RAISE EXCEPTION 'reason_required_min_5_chars' USING ERRCODE = '22023';
  END IF;

  SELECT subscription_ends_at INTO v_old
    FROM public.restaurants WHERE id = p_restaurant_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'restaurant not found' USING ERRCODE = 'P0002';
  END IF;

  UPDATE public.restaurants SET subscription_ends_at = p_ends_at
    WHERE id = p_restaurant_id;

  PERFORM private.record_audit(
    'subscription_end_updated', 'billing', p_restaurant_id,
    'restaurant', p_restaurant_id::text,
    jsonb_build_object('subscription_ends_at', v_old),
    jsonb_build_object('subscription_ends_at', p_ends_at),
    trim(p_reason), NULL, NULL
  );
  RETURN jsonb_build_object('ok', true, 'old', v_old, 'new', p_ends_at);
END $$;

REVOKE ALL ON FUNCTION public.admin_set_subscription_end(uuid, timestamptz, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_subscription_end(uuid, timestamptz, text) TO authenticated;

-- -------------------------------------------------------------------------
-- Restaurante: suspender / reativar
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_suspend_restaurant(
  p_restaurant_id uuid,
  p_reason text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE v_actor uuid; v_was boolean;
BEGIN
  v_actor := private.assert_super_admin();
  IF p_reason IS NULL OR char_length(trim(p_reason)) < 5 THEN
    RAISE EXCEPTION 'reason_required_min_5_chars' USING ERRCODE = '22023';
  END IF;
  SELECT is_active INTO v_was FROM public.restaurants
    WHERE id = p_restaurant_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'restaurant not found' USING ERRCODE='P0002'; END IF;
  IF v_was = false THEN
    RETURN jsonb_build_object('ok', true, 'already', true);
  END IF;
  UPDATE public.restaurants SET is_active = false WHERE id = p_restaurant_id;
  PERFORM private.record_audit(
    'restaurant_suspended', 'billing', p_restaurant_id,
    'restaurant', p_restaurant_id::text,
    jsonb_build_object('is_active', true),
    jsonb_build_object('is_active', false),
    trim(p_reason), NULL, NULL
  );
  RETURN jsonb_build_object('ok', true);
END $$;

REVOKE ALL ON FUNCTION public.admin_suspend_restaurant(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_suspend_restaurant(uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_reactivate_restaurant(
  p_restaurant_id uuid,
  p_reason text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE v_actor uuid; v_was boolean;
BEGIN
  v_actor := private.assert_super_admin();
  IF p_reason IS NULL OR char_length(trim(p_reason)) < 5 THEN
    RAISE EXCEPTION 'reason_required_min_5_chars' USING ERRCODE = '22023';
  END IF;
  SELECT is_active INTO v_was FROM public.restaurants
    WHERE id = p_restaurant_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'restaurant not found' USING ERRCODE='P0002'; END IF;
  IF v_was = true THEN
    RETURN jsonb_build_object('ok', true, 'already', true);
  END IF;
  UPDATE public.restaurants SET is_active = true WHERE id = p_restaurant_id;
  PERFORM private.record_audit(
    'restaurant_reactivated', 'billing', p_restaurant_id,
    'restaurant', p_restaurant_id::text,
    jsonb_build_object('is_active', false),
    jsonb_build_object('is_active', true),
    trim(p_reason), NULL, NULL
  );
  RETURN jsonb_build_object('ok', true);
END $$;

REVOKE ALL ON FUNCTION public.admin_reactivate_restaurant(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_reactivate_restaurant(uuid, text) TO authenticated;

-- -------------------------------------------------------------------------
-- Pagamento manual (atomicamente insere + estende assinatura + reativa)
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_register_payment(
  p_restaurant_id uuid,
  p_amount numeric,
  p_months integer,
  p_method text,
  p_notes text,
  p_reason text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE
  v_actor uuid;
  v_old_sub timestamptz;
  v_old_active boolean;
  v_plan text;
  v_start timestamptz;
  v_end timestamptz;
  v_payment_id uuid;
BEGIN
  v_actor := private.assert_super_admin();
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'invalid_amount' USING ERRCODE='22023';
  END IF;
  IF p_months IS NULL OR p_months < 1 OR p_months > 60 THEN
    RAISE EXCEPTION 'invalid_months' USING ERRCODE='22023';
  END IF;
  IF p_reason IS NULL OR char_length(trim(p_reason)) < 5 THEN
    RAISE EXCEPTION 'reason_required_min_5_chars' USING ERRCODE='22023';
  END IF;

  SELECT subscription_ends_at, is_active, plan::text
    INTO v_old_sub, v_old_active, v_plan
    FROM public.restaurants WHERE id = p_restaurant_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'restaurant not found' USING ERRCODE='P0002';
  END IF;

  v_start := CASE
    WHEN v_old_sub IS NOT NULL AND v_old_sub > now() THEN v_old_sub
    ELSE now()
  END;
  v_end := v_start + make_interval(months => p_months);

  INSERT INTO public.restaurant_payments
    (restaurant_id, amount, plan, period_start, period_end,
     method, notes, created_by)
  VALUES
    (p_restaurant_id, p_amount, v_plan, v_start, v_end,
     NULLIF(trim(p_method), ''), NULLIF(trim(p_notes), ''), v_actor)
  RETURNING id INTO v_payment_id;

  UPDATE public.restaurants
     SET subscription_ends_at = v_end,
         is_active = true
   WHERE id = p_restaurant_id;

  PERFORM private.record_audit(
    'payment_registered', 'billing', p_restaurant_id,
    'restaurant_payment', v_payment_id::text,
    jsonb_build_object('subscription_ends_at', v_old_sub, 'is_active', v_old_active),
    jsonb_build_object('subscription_ends_at', v_end, 'is_active', true,
                       'amount', p_amount, 'months', p_months),
    trim(p_reason), NULL, NULL
  );
  RETURN jsonb_build_object('ok', true, 'payment_id', v_payment_id,
                            'subscription_ends_at', v_end);
END $$;

REVOKE ALL ON FUNCTION public.admin_register_payment(uuid, numeric, integer, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_register_payment(uuid, numeric, integer, text, text, text) TO authenticated;

-- -------------------------------------------------------------------------
-- Avisos globais
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_upsert_announcement(
  p_id uuid,
  p_message text,
  p_variant text,
  p_is_active boolean,
  p_expires_at timestamptz
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE v_actor uuid; v_id uuid;
BEGIN
  v_actor := private.assert_super_admin();
  IF p_message IS NULL OR char_length(trim(p_message)) = 0 THEN
    RAISE EXCEPTION 'message_required' USING ERRCODE='22023';
  END IF;
  IF p_variant NOT IN ('info','success','warning','danger') THEN
    RAISE EXCEPTION 'invalid_variant' USING ERRCODE='22023';
  END IF;

  IF p_id IS NULL THEN
    INSERT INTO public.global_announcements (message, variant, is_active, expires_at)
      VALUES (trim(p_message), p_variant, COALESCE(p_is_active, true), p_expires_at)
      RETURNING id INTO v_id;
    PERFORM private.record_audit(
      'announcement_created', 'general', NULL,
      'global_announcement', v_id::text, NULL,
      jsonb_build_object('message', p_message, 'variant', p_variant,
                         'is_active', p_is_active, 'expires_at', p_expires_at),
      NULL, NULL, NULL);
  ELSE
    UPDATE public.global_announcements
       SET message = trim(p_message),
           variant = p_variant,
           is_active = COALESCE(p_is_active, is_active),
           expires_at = p_expires_at
     WHERE id = p_id
     RETURNING id INTO v_id;
    IF v_id IS NULL THEN
      RAISE EXCEPTION 'announcement_not_found' USING ERRCODE='P0002';
    END IF;
    PERFORM private.record_audit(
      'announcement_updated', 'general', NULL,
      'global_announcement', v_id::text, NULL,
      jsonb_build_object('message', p_message, 'variant', p_variant,
                         'is_active', p_is_active, 'expires_at', p_expires_at),
      NULL, NULL, NULL);
  END IF;
  RETURN jsonb_build_object('ok', true, 'id', v_id);
END $$;

REVOKE ALL ON FUNCTION public.admin_upsert_announcement(uuid, text, text, boolean, timestamptz) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_upsert_announcement(uuid, text, text, boolean, timestamptz) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_delete_announcement(p_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE v_actor uuid; v_row record;
BEGIN
  v_actor := private.assert_super_admin();
  SELECT id, message, variant INTO v_row FROM public.global_announcements
    WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'announcement_not_found' USING ERRCODE='P0002'; END IF;
  DELETE FROM public.global_announcements WHERE id = p_id;
  PERFORM private.record_audit(
    'announcement_deleted', 'general', NULL,
    'global_announcement', p_id::text,
    jsonb_build_object('message', v_row.message, 'variant', v_row.variant),
    NULL, NULL, NULL, NULL);
  RETURN jsonb_build_object('ok', true);
END $$;

REVOKE ALL ON FUNCTION public.admin_delete_announcement(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_delete_announcement(uuid) TO authenticated;

-- -------------------------------------------------------------------------
-- Catálogo de planos
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_upsert_plan(
  p_id text,
  p_name text,
  p_price_monthly numeric,
  p_features jsonb,
  p_position integer,
  p_is_active boolean
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE v_actor uuid; v_existed boolean;
BEGIN
  v_actor := private.assert_super_admin();
  IF p_id IS NULL OR char_length(trim(p_id)) = 0 THEN
    RAISE EXCEPTION 'id_required' USING ERRCODE='22023';
  END IF;
  IF p_id !~ '^[a-z0-9_]+$' THEN
    RAISE EXCEPTION 'invalid_id_format' USING ERRCODE='22023';
  END IF;
  IF p_name IS NULL OR char_length(trim(p_name)) = 0 THEN
    RAISE EXCEPTION 'name_required' USING ERRCODE='22023';
  END IF;
  IF p_price_monthly IS NULL OR p_price_monthly < 0 THEN
    RAISE EXCEPTION 'invalid_price' USING ERRCODE='22023';
  END IF;

  SELECT EXISTS(SELECT 1 FROM public.app_plans WHERE id = p_id) INTO v_existed;

  INSERT INTO public.app_plans (id, name, price_monthly, features, position, is_active)
    VALUES (p_id, trim(p_name), p_price_monthly, COALESCE(p_features, '[]'::jsonb),
            COALESCE(p_position, 0), COALESCE(p_is_active, true))
  ON CONFLICT (id) DO UPDATE
    SET name = EXCLUDED.name,
        price_monthly = EXCLUDED.price_monthly,
        features = EXCLUDED.features,
        position = EXCLUDED.position,
        is_active = EXCLUDED.is_active,
        updated_at = now();

  PERFORM private.record_audit(
    CASE WHEN v_existed THEN 'plan_updated' ELSE 'plan_created' END,
    'billing', NULL, 'app_plan', p_id, NULL,
    jsonb_build_object('name', p_name, 'price_monthly', p_price_monthly,
                       'position', p_position, 'is_active', p_is_active),
    NULL, NULL, NULL);
  RETURN jsonb_build_object('ok', true, 'id', p_id, 'created', NOT v_existed);
END $$;

REVOKE ALL ON FUNCTION public.admin_upsert_plan(text, text, numeric, jsonb, integer, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_upsert_plan(text, text, numeric, jsonb, integer, boolean) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_delete_plan(p_id text, p_reason text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE v_actor uuid; v_in_use int;
BEGIN
  v_actor := private.assert_super_admin();
  IF p_reason IS NULL OR char_length(trim(p_reason)) < 5 THEN
    RAISE EXCEPTION 'reason_required_min_5_chars' USING ERRCODE='22023';
  END IF;

  SELECT count(*) INTO v_in_use FROM public.restaurants WHERE plan_id = p_id;
  IF v_in_use > 0 THEN
    RAISE EXCEPTION 'plan_in_use_by_% restaurants', v_in_use USING ERRCODE='23503';
  END IF;

  DELETE FROM public.app_plans WHERE id = p_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'plan_not_found' USING ERRCODE='P0002';
  END IF;

  PERFORM private.record_audit(
    'plan_deleted', 'billing', NULL, 'app_plan', p_id,
    jsonb_build_object('id', p_id), NULL,
    trim(p_reason), NULL, NULL);
  RETURN jsonb_build_object('ok', true);
END $$;

REVOKE ALL ON FUNCTION public.admin_delete_plan(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_delete_plan(text, text) TO authenticated;

-- -------------------------------------------------------------------------
-- Leads
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_update_lead(
  p_id uuid,
  p_status text,
  p_notes text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE v_actor uuid; v_old record;
BEGIN
  v_actor := private.assert_super_admin();
  IF p_status IS NOT NULL
     AND p_status NOT IN ('new','contacted','approved','rejected') THEN
    RAISE EXCEPTION 'invalid_status' USING ERRCODE='22023';
  END IF;

  SELECT id, status, notes INTO v_old FROM public.signup_leads
    WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'lead_not_found' USING ERRCODE='P0002'; END IF;

  UPDATE public.signup_leads
     SET status = COALESCE(p_status, status),
         notes  = CASE WHEN p_notes IS NULL THEN notes ELSE p_notes END
   WHERE id = p_id;

  PERFORM private.record_audit(
    'lead_updated', 'general', NULL, 'signup_lead', p_id::text,
    jsonb_build_object('status', v_old.status, 'notes', v_old.notes),
    jsonb_build_object('status', COALESCE(p_status, v_old.status),
                       'notes',  COALESCE(p_notes,  v_old.notes)),
    NULL, NULL, NULL);
  RETURN jsonb_build_object('ok', true);
END $$;

REVOKE ALL ON FUNCTION public.admin_update_lead(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_update_lead(uuid, text, text) TO authenticated;
