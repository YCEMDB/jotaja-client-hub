
-- =========================================================================
-- Onda 2.b.3.1.1 — Correções de Cardápio (limites, locks, disponibilidade, preço)
-- =========================================================================

-- 1) Helper canônico de limite do plano (conta apenas não arquivados) --------
CREATE OR REPLACE FUNCTION private.count_active_menu_resource(
  p_restaurant_id uuid, p_resource text
) RETURNS int
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public','pg_temp'
AS $$
DECLARE v_n int;
BEGIN
  IF p_resource = 'products' THEN
    SELECT count(*) INTO v_n FROM public.products
     WHERE restaurant_id = p_restaurant_id AND archived_at IS NULL;
  ELSIF p_resource = 'categories' THEN
    SELECT count(*) INTO v_n FROM public.categories
     WHERE restaurant_id = p_restaurant_id AND archived_at IS NULL;
  ELSE
    RAISE EXCEPTION 'invalid_resource: %', p_resource USING ERRCODE='22023';
  END IF;
  RETURN v_n;
END $$;

CREATE OR REPLACE FUNCTION private.assert_plan_menu_limit(
  p_restaurant_id uuid, p_resource text
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public','private','pg_temp'
AS $$
DECLARE v_plan text; v_feature text; v_limit int; v_count int;
BEGIN
  IF p_resource = 'products' THEN v_feature := 'max_products';
  ELSIF p_resource = 'categories' THEN v_feature := 'max_categories';
  ELSE RAISE EXCEPTION 'invalid_resource: %', p_resource USING ERRCODE='22023';
  END IF;

  SELECT plan_id INTO v_plan FROM public.restaurants WHERE id = p_restaurant_id;
  SELECT COALESCE((features->>v_feature)::int, NULL) INTO v_limit
    FROM public.app_plans WHERE id = COALESCE(v_plan,'starter');
  IF v_limit IS NULL THEN RETURN; END IF;

  v_count := private.count_active_menu_resource(p_restaurant_id, p_resource);
  IF v_count >= v_limit THEN
    RAISE EXCEPTION 'plan_limit_reached: limite de % % do plano % atingido', v_limit, p_resource, v_plan
      USING ERRCODE='check_violation';
  END IF;
END $$;

-- Helper: lock advisory por restaurante+recurso (dentro da transação) --------
CREATE OR REPLACE FUNCTION private.lock_menu_resource(
  p_restaurant_id uuid, p_resource text
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'pg_temp'
AS $$
BEGIN
  PERFORM pg_advisory_xact_lock(
    hashtextextended('menu:'||p_resource||':'||p_restaurant_id::text, 0)
  );
END $$;

REVOKE ALL ON FUNCTION private.count_active_menu_resource(uuid,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.assert_plan_menu_limit(uuid,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.lock_menu_resource(uuid,text) FROM PUBLIC;

-- 2) Reescrever triggers de limite para contar apenas não arquivados --------
CREATE OR REPLACE FUNCTION public.enforce_plan_product_limit()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public','private','pg_temp'
AS $$
DECLARE v_plan text; v_limit int; v_count int;
BEGIN
  SELECT plan_id INTO v_plan FROM public.restaurants WHERE id = NEW.restaurant_id;
  SELECT COALESCE((features->>'max_products')::int, NULL) INTO v_limit
    FROM public.app_plans WHERE id = COALESCE(v_plan,'starter');
  IF v_limit IS NULL THEN RETURN NEW; END IF;
  SELECT count(*) INTO v_count FROM public.products
    WHERE restaurant_id = NEW.restaurant_id AND archived_at IS NULL;
  IF v_count >= v_limit THEN
    RAISE EXCEPTION 'plan_limit_reached: limite de % produtos do plano % atingido', v_limit, v_plan
      USING ERRCODE='check_violation';
  END IF;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.enforce_plan_category_limit()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public','private','pg_temp'
AS $$
DECLARE v_plan text; v_limit int; v_count int;
BEGIN
  SELECT plan_id INTO v_plan FROM public.restaurants WHERE id = NEW.restaurant_id;
  SELECT COALESCE((features->>'max_categories')::int, NULL) INTO v_limit
    FROM public.app_plans WHERE id = COALESCE(v_plan,'starter');
  IF v_limit IS NULL THEN RETURN NEW; END IF;
  SELECT count(*) INTO v_count FROM public.categories
    WHERE restaurant_id = NEW.restaurant_id AND archived_at IS NULL;
  IF v_count >= v_limit THEN
    RAISE EXCEPTION 'plan_limit_reached: limite de % categorias do plano % atingido', v_limit, v_plan
      USING ERRCODE='check_violation';
  END IF;
  RETURN NEW;
END $$;

-- 3) create_category — lock por recurso + limite explícito -------------------
CREATE OR REPLACE FUNCTION public.create_category(
  p_restaurant_id uuid, p_name text,
  p_description text DEFAULT NULL, p_position int DEFAULT NULL,
  p_station_id uuid DEFAULT NULL, p_reason text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public','private','pg_temp'
AS $$
DECLARE v_auth record; v_reason text; v_id uuid; v_pos int;
BEGIN
  IF coalesce(btrim(p_name),'') = '' THEN
    RAISE EXCEPTION 'invalid_name' USING ERRCODE='22023';
  END IF;
  IF p_position IS NOT NULL AND (p_position < 0 OR p_position > 100000) THEN
    RAISE EXCEPTION 'invalid_position' USING ERRCODE='22023';
  END IF;

  SELECT * INTO v_auth FROM private.authorize_tenant_action(p_restaurant_id, 'operational');
  v_reason := private.validate_reason(p_reason, NOT v_auth.is_native);
  PERFORM private.assert_kitchen_station(p_restaurant_id, p_station_id);

  PERFORM private.lock_menu_resource(p_restaurant_id, 'categories');
  PERFORM private.assert_plan_menu_limit(p_restaurant_id, 'categories');

  v_pos := COALESCE(p_position, (SELECT COALESCE(max("position"),0)+1
                                   FROM public.categories
                                  WHERE restaurant_id = p_restaurant_id));
  INSERT INTO public.categories(restaurant_id, name, description, "position", station_id, is_active)
  VALUES (p_restaurant_id, btrim(p_name), NULLIF(btrim(p_description),''), v_pos, p_station_id, true)
  RETURNING id INTO v_id;

  IF NOT v_auth.is_native THEN
    PERFORM private.record_audit('category.create','menu',p_restaurant_id,'category',v_id::text,
      NULL,
      jsonb_build_object('name',btrim(p_name),'position',v_pos,'station_id',p_station_id,'description_present',(p_description IS NOT NULL)),
      v_reason, NULL, v_auth.support_session_id);
  END IF;
  RETURN v_id;
END $$;

-- 4) restore_category — reaplica limite + lock ------------------------------
CREATE OR REPLACE FUNCTION public.restore_category(
  p_id uuid, p_reason text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public','private','pg_temp'
AS $$
DECLARE v_rest uuid; v_auth record; v_reason text; v_before record;
BEGIN
  SELECT restaurant_id INTO v_rest FROM public.categories WHERE id = p_id;
  IF v_rest IS NULL THEN RAISE EXCEPTION 'not_found' USING ERRCODE='02000'; END IF;
  SELECT * INTO v_auth FROM private.authorize_tenant_action(v_rest, 'administrative');
  v_reason := private.validate_reason(p_reason, true);

  SELECT * INTO v_before FROM public.categories WHERE id = p_id AND restaurant_id = v_rest FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'not_found' USING ERRCODE='02000'; END IF;
  IF v_before.archived_at IS NULL THEN RETURN; END IF;

  PERFORM private.lock_menu_resource(v_rest, 'categories');
  PERFORM private.assert_plan_menu_limit(v_rest, 'categories');

  UPDATE public.categories SET archived_at = NULL, is_active = true WHERE id = p_id;

  PERFORM private.record_audit('category.restore','menu',v_rest,'category',p_id::text,
    jsonb_build_object('archived',true),
    jsonb_build_object('archived',false,'is_active',true),
    v_reason, NULL, v_auth.support_session_id);
END $$;

-- 5) create_product — lock por recurso + limite + lock da categoria ---------
CREATE OR REPLACE FUNCTION public.create_product(
  p_restaurant_id uuid, p_name text, p_price numeric,
  p_category_id uuid DEFAULT NULL, p_description text DEFAULT NULL,
  p_promo_price numeric DEFAULT NULL, p_image_url text DEFAULT NULL,
  p_position int DEFAULT NULL, p_station_id uuid DEFAULT NULL,
  p_is_available boolean DEFAULT true, p_reason text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public','private','pg_temp'
AS $$
DECLARE v_auth record; v_reason text; v_id uuid; v_pos int;
        v_cat_is_active boolean; v_cat_archived timestamptz;
BEGIN
  IF coalesce(btrim(p_name),'') = '' THEN RAISE EXCEPTION 'invalid_name' USING ERRCODE='22023'; END IF;
  IF p_price IS NULL OR p_price < 0 OR p_price > 1000000 THEN
    RAISE EXCEPTION 'invalid_price' USING ERRCODE='22023';
  END IF;
  IF p_promo_price IS NOT NULL THEN
    IF p_promo_price < 0 OR p_promo_price >= p_price THEN
      RAISE EXCEPTION 'invalid_promo_price' USING ERRCODE='22023';
    END IF;
  END IF;
  IF p_position IS NOT NULL AND (p_position < 0 OR p_position > 100000) THEN
    RAISE EXCEPTION 'invalid_position' USING ERRCODE='22023';
  END IF;

  SELECT * INTO v_auth FROM private.authorize_tenant_action(p_restaurant_id, 'administrative');
  v_reason := private.validate_reason(p_reason, NOT v_auth.is_native);

  PERFORM private.assert_kitchen_station(p_restaurant_id, p_station_id);

  -- Lock advisory por recurso + limite do plano (não arquivados) -----------
  PERFORM private.lock_menu_resource(p_restaurant_id, 'products');
  PERFORM private.assert_plan_menu_limit(p_restaurant_id, 'products');

  -- Lock da categoria em modo compatível com leitura, incompatível com
  -- archive_category (FOR UPDATE), impedindo arquivamento concorrente.
  IF p_category_id IS NOT NULL THEN
    SELECT is_active, archived_at INTO v_cat_is_active, v_cat_archived
      FROM public.categories
     WHERE id = p_category_id AND restaurant_id = p_restaurant_id
     FOR KEY SHARE;
    IF NOT FOUND THEN RAISE EXCEPTION 'invalid_category' USING ERRCODE='22023'; END IF;
    IF v_cat_archived IS NOT NULL THEN RAISE EXCEPTION 'category_archived' USING ERRCODE='22023'; END IF;
    IF COALESCE(v_cat_is_active,false) = false THEN RAISE EXCEPTION 'category_inactive' USING ERRCODE='22023'; END IF;
  END IF;

  v_pos := COALESCE(p_position, (SELECT COALESCE(max("position"),0)+1
                                   FROM public.products
                                  WHERE restaurant_id = p_restaurant_id));

  INSERT INTO public.products(
    restaurant_id, category_id, name, description, price, promo_price,
    image_url, "position", station_id, is_available
  ) VALUES (
    p_restaurant_id, p_category_id, btrim(p_name), NULLIF(btrim(p_description),''),
    round(p_price::numeric, 2),
    CASE WHEN p_promo_price IS NULL THEN NULL ELSE round(p_promo_price::numeric,2) END,
    NULLIF(btrim(p_image_url),''), v_pos, p_station_id, COALESCE(p_is_available,true)
  )
  RETURNING id INTO v_id;

  IF NOT v_auth.is_native THEN
    PERFORM private.record_audit('product.create','menu',p_restaurant_id,'product',v_id::text,
      NULL,
      jsonb_build_object(
        'name',btrim(p_name),
        'price',round(p_price::numeric,2),
        'promo_price', CASE WHEN p_promo_price IS NULL THEN NULL ELSE round(p_promo_price::numeric,2) END,
        'category_id',p_category_id,
        'station_id',p_station_id,
        'is_available',COALESCE(p_is_available,true),
        'position',v_pos,
        'image_present',(p_image_url IS NOT NULL AND btrim(p_image_url) <> '')
      ),
      v_reason, NULL, v_auth.support_session_id);
  END IF;
  RETURN v_id;
END $$;

-- 6) update_product — lock da categoria quando muda de categoria ------------
CREATE OR REPLACE FUNCTION public.update_product(
  p_id uuid, p_name text DEFAULT NULL, p_description text DEFAULT NULL,
  p_category_id uuid DEFAULT NULL, p_station_id uuid DEFAULT NULL,
  p_image_url text DEFAULT NULL, p_clear_image boolean DEFAULT false,
  p_position int DEFAULT NULL, p_reason text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public','private','pg_temp'
AS $$
DECLARE v_rest uuid; v_auth record; v_reason text;
        v_before record; v_diff jsonb := '{}'::jsonb;
        v_new_name text; v_new_desc text; v_new_cat uuid; v_new_station uuid;
        v_new_image text; v_new_pos int;
        v_cat_active boolean; v_cat_archived timestamptz;
BEGIN
  SELECT restaurant_id INTO v_rest FROM public.products WHERE id = p_id;
  IF v_rest IS NULL THEN RAISE EXCEPTION 'not_found' USING ERRCODE='02000'; END IF;
  SELECT * INTO v_auth FROM private.authorize_tenant_action(v_rest, 'operational');
  v_reason := private.validate_reason(p_reason, NOT v_auth.is_native);

  SELECT * INTO v_before FROM public.products WHERE id = p_id AND restaurant_id = v_rest FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'not_found' USING ERRCODE='02000'; END IF;
  IF v_before.archived_at IS NOT NULL THEN RAISE EXCEPTION 'product_archived' USING ERRCODE='22023'; END IF;

  IF p_station_id IS NOT NULL THEN
    PERFORM private.assert_kitchen_station(v_rest, p_station_id);
  END IF;
  IF p_position IS NOT NULL AND (p_position < 0 OR p_position > 100000) THEN
    RAISE EXCEPTION 'invalid_position' USING ERRCODE='22023';
  END IF;

  -- Lock da nova categoria para impedir arquivamento concorrente
  IF p_category_id IS NOT NULL AND p_category_id IS DISTINCT FROM v_before.category_id THEN
    SELECT is_active, archived_at INTO v_cat_active, v_cat_archived
      FROM public.categories
     WHERE id = p_category_id AND restaurant_id = v_rest
     FOR KEY SHARE;
    IF NOT FOUND THEN RAISE EXCEPTION 'invalid_category' USING ERRCODE='22023'; END IF;
    IF v_cat_archived IS NOT NULL THEN RAISE EXCEPTION 'category_archived' USING ERRCODE='22023'; END IF;
    IF COALESCE(v_cat_active,false) = false THEN RAISE EXCEPTION 'category_inactive' USING ERRCODE='22023'; END IF;
  END IF;

  v_new_name    := COALESCE(NULLIF(btrim(p_name),''), v_before.name);
  v_new_desc    := CASE WHEN p_description IS NULL THEN v_before.description ELSE NULLIF(btrim(p_description),'') END;
  v_new_cat     := COALESCE(p_category_id, v_before.category_id);
  v_new_station := COALESCE(p_station_id, v_before.station_id);
  v_new_image   := CASE
                     WHEN p_clear_image THEN NULL
                     WHEN p_image_url IS NULL THEN v_before.image_url
                     ELSE NULLIF(btrim(p_image_url),'')
                   END;
  v_new_pos     := COALESCE(p_position, v_before."position");

  IF v_new_name <> v_before.name THEN
    v_diff := v_diff || jsonb_build_object('name',jsonb_build_object('from',v_before.name,'to',v_new_name));
  END IF;
  IF v_new_desc IS DISTINCT FROM v_before.description THEN
    v_diff := v_diff || jsonb_build_object('description_changed', true);
  END IF;
  IF v_new_cat IS DISTINCT FROM v_before.category_id THEN
    v_diff := v_diff || jsonb_build_object('category_id',jsonb_build_object('from',v_before.category_id,'to',v_new_cat));
  END IF;
  IF v_new_station IS DISTINCT FROM v_before.station_id THEN
    v_diff := v_diff || jsonb_build_object('station_id',jsonb_build_object('from',v_before.station_id,'to',v_new_station));
  END IF;
  IF v_new_image IS DISTINCT FROM v_before.image_url THEN
    v_diff := v_diff || jsonb_build_object('image_changed', true);
  END IF;
  IF v_new_pos IS DISTINCT FROM v_before."position" THEN
    v_diff := v_diff || jsonb_build_object('position',jsonb_build_object('from',v_before."position",'to',v_new_pos));
  END IF;

  IF v_diff = '{}'::jsonb THEN RETURN; END IF;

  UPDATE public.products SET
    name = v_new_name,
    description = v_new_desc,
    category_id = v_new_cat,
    station_id = v_new_station,
    image_url = v_new_image,
    "position" = v_new_pos,
    updated_at = now()
  WHERE id = p_id;

  IF NOT v_auth.is_native THEN
    PERFORM private.record_audit('product.update','menu',v_rest,'product',p_id::text,
      NULL, v_diff, v_reason, NULL, v_auth.support_session_id);
  END IF;
END $$;

-- 7) restore_product — reaplica limite ------------------------------------
CREATE OR REPLACE FUNCTION public.restore_product(
  p_id uuid, p_reason text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public','private','pg_temp'
AS $$
DECLARE v_rest uuid; v_auth record; v_reason text; v_before record;
BEGIN
  SELECT restaurant_id INTO v_rest FROM public.products WHERE id = p_id;
  IF v_rest IS NULL THEN RAISE EXCEPTION 'not_found' USING ERRCODE='02000'; END IF;
  SELECT * INTO v_auth FROM private.authorize_tenant_action(v_rest, 'administrative');
  v_reason := private.validate_reason(p_reason, true);

  SELECT * INTO v_before FROM public.products WHERE id = p_id AND restaurant_id = v_rest FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'not_found' USING ERRCODE='02000'; END IF;
  IF v_before.archived_at IS NULL THEN RETURN; END IF;

  PERFORM private.lock_menu_resource(v_rest, 'products');
  PERFORM private.assert_plan_menu_limit(v_rest, 'products');

  UPDATE public.products SET archived_at = NULL, is_available = false, updated_at = now() WHERE id = p_id;

  PERFORM private.record_audit('product.restore','menu',v_rest,'product',p_id::text,
    jsonb_build_object('archived',true),
    jsonb_build_object('archived',false,'is_available',false),
    v_reason, NULL, v_auth.support_session_id);
END $$;

-- 8) set_product_availability — valida estado da categoria ao publicar -----
CREATE OR REPLACE FUNCTION public.set_product_availability(
  p_id uuid, p_is_available boolean, p_reason text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public','private','pg_temp'
AS $$
DECLARE v_rest uuid; v_auth record; v_reason text; v_before record;
        v_cat_active boolean; v_cat_archived timestamptz;
BEGIN
  IF p_is_available IS NULL THEN RAISE EXCEPTION 'invalid_availability' USING ERRCODE='22023'; END IF;
  SELECT restaurant_id INTO v_rest FROM public.products WHERE id = p_id;
  IF v_rest IS NULL THEN RAISE EXCEPTION 'not_found' USING ERRCODE='02000'; END IF;
  SELECT * INTO v_auth FROM private.authorize_tenant_action(v_rest, 'operational');
  v_reason := private.validate_reason(p_reason, NOT v_auth.is_native);

  SELECT * INTO v_before FROM public.products WHERE id = p_id AND restaurant_id = v_rest FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'not_found' USING ERRCODE='02000'; END IF;
  IF v_before.archived_at IS NOT NULL THEN RAISE EXCEPTION 'product_archived' USING ERRCODE='22023'; END IF;

  -- Só bloqueia ao publicar; ao despublicar sempre permite
  IF p_is_available = true AND v_before.category_id IS NOT NULL THEN
    SELECT is_active, archived_at INTO v_cat_active, v_cat_archived
      FROM public.categories
     WHERE id = v_before.category_id AND restaurant_id = v_rest
     FOR KEY SHARE;
    IF NOT FOUND THEN RAISE EXCEPTION 'invalid_category' USING ERRCODE='22023'; END IF;
    IF v_cat_archived IS NOT NULL THEN RAISE EXCEPTION 'category_archived' USING ERRCODE='22023'; END IF;
    IF COALESCE(v_cat_active,false) = false THEN RAISE EXCEPTION 'category_inactive' USING ERRCODE='22023'; END IF;
  END IF;

  IF v_before.is_available IS NOT DISTINCT FROM p_is_available THEN
    RETURN jsonb_build_object('noop', true);
  END IF;

  UPDATE public.products SET is_available = p_is_available, updated_at = now() WHERE id = p_id;

  IF NOT v_auth.is_native THEN
    PERFORM private.record_audit('product.availability','menu',v_rest,'product',p_id::text,
      jsonb_build_object('is_available',v_before.is_available),
      jsonb_build_object('is_available',p_is_available),
      v_reason, NULL, v_auth.support_session_id);
  END IF;
  RETURN jsonb_build_object('noop', false);
END $$;

-- 9) set_product_price — concorrência segura para NULL --------------------
DROP FUNCTION IF EXISTS public.set_product_price(uuid, numeric, numeric, numeric, numeric, text);

CREATE OR REPLACE FUNCTION public.set_product_price(
  p_id uuid,
  p_price numeric,
  p_promo_price numeric DEFAULT NULL,
  p_expected_current_price numeric DEFAULT NULL,
  p_expected_current_promo_price numeric DEFAULT NULL,
  p_check_expected boolean DEFAULT true,
  p_reason text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public','private','pg_temp'
AS $$
DECLARE v_rest uuid; v_auth record; v_reason text; v_before record;
        v_price numeric; v_promo numeric;
        v_before_price numeric; v_before_promo numeric;
        v_expected_price numeric; v_expected_promo numeric;
BEGIN
  IF p_price IS NULL OR p_price < 0 OR p_price > 1000000 THEN
    RAISE EXCEPTION 'invalid_price' USING ERRCODE='22023';
  END IF;
  IF p_promo_price IS NOT NULL THEN
    IF p_promo_price < 0 OR p_promo_price >= p_price THEN
      RAISE EXCEPTION 'invalid_promo_price' USING ERRCODE='22023';
    END IF;
  END IF;
  v_price := round(p_price::numeric, 2);
  v_promo := CASE WHEN p_promo_price IS NULL THEN NULL ELSE round(p_promo_price::numeric,2) END;

  SELECT restaurant_id INTO v_rest FROM public.products WHERE id = p_id;
  IF v_rest IS NULL THEN RAISE EXCEPTION 'not_found' USING ERRCODE='02000'; END IF;
  SELECT * INTO v_auth FROM private.authorize_tenant_action(v_rest, 'administrative');
  v_reason := private.validate_reason(p_reason, NOT v_auth.is_native);

  SELECT * INTO v_before FROM public.products WHERE id = p_id AND restaurant_id = v_rest FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'not_found' USING ERRCODE='02000'; END IF;
  IF v_before.archived_at IS NOT NULL THEN RAISE EXCEPTION 'product_archived' USING ERRCODE='22023'; END IF;

  v_before_price := round(v_before.price::numeric, 2);
  v_before_promo := CASE WHEN v_before.promo_price IS NULL THEN NULL ELSE round(v_before.promo_price::numeric,2) END;

  IF p_check_expected THEN
    v_expected_price := CASE WHEN p_expected_current_price IS NULL THEN NULL ELSE round(p_expected_current_price::numeric,2) END;
    v_expected_promo := CASE WHEN p_expected_current_promo_price IS NULL THEN NULL ELSE round(p_expected_current_promo_price::numeric,2) END;
    IF v_expected_price IS DISTINCT FROM v_before_price
       OR v_expected_promo IS DISTINCT FROM v_before_promo THEN
      RAISE EXCEPTION 'price_changed_by_another_user' USING ERRCODE='40001';
    END IF;
  END IF;

  IF v_before_price IS NOT DISTINCT FROM v_price
     AND v_before_promo IS NOT DISTINCT FROM v_promo THEN
    RETURN jsonb_build_object('noop', true);
  END IF;

  UPDATE public.products SET price = v_price, promo_price = v_promo, updated_at = now()
   WHERE id = p_id;

  IF NOT v_auth.is_native THEN
    PERFORM private.record_audit('product.price','menu',v_rest,'product',p_id::text,
      jsonb_build_object('price',v_before_price,'promo_price',v_before_promo),
      jsonb_build_object('price',v_price,'promo_price',v_promo),
      v_reason, NULL, v_auth.support_session_id);
  END IF;
  RETURN jsonb_build_object('noop', false);
END $$;

-- 10) Grants (mesmo padrão das demais RPCs) --------------------------------
REVOKE ALL ON FUNCTION public.create_category(uuid,text,text,int,uuid,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.restore_category(uuid,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_product(uuid,text,numeric,uuid,text,numeric,text,int,uuid,boolean,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_product(uuid,text,text,uuid,uuid,text,boolean,int,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.restore_product(uuid,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.set_product_availability(uuid,boolean,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.set_product_price(uuid,numeric,numeric,numeric,numeric,boolean,text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.create_category(uuid,text,text,int,uuid,text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.restore_category(uuid,text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.create_product(uuid,text,numeric,uuid,text,numeric,text,int,uuid,boolean,text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.update_product(uuid,text,text,uuid,uuid,text,boolean,int,text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.restore_product(uuid,text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.set_product_availability(uuid,boolean,text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.set_product_price(uuid,numeric,numeric,numeric,numeric,boolean,text) TO authenticated, service_role;

NOTIFY pgrst, 'reload schema';
