
-- =====================================================================
-- Onda 2.b.3.1 — Cardápio: colunas de arquivamento + RPCs hardened
-- =====================================================================

-- 1) Colunas archived_at
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS archived_at timestamptz NULL;
ALTER TABLE public.products   ADD COLUMN IF NOT EXISTS archived_at timestamptz NULL;

CREATE INDEX IF NOT EXISTS categories_active_idx
  ON public.categories(restaurant_id) WHERE archived_at IS NULL;
CREATE INDEX IF NOT EXISTS products_active_idx
  ON public.products(restaurant_id) WHERE archived_at IS NULL;

-- 2) Consultas públicas filtram archived_at IS NULL
CREATE OR REPLACE FUNCTION public.get_public_categories(p_slug text)
 RETURNS TABLE(id uuid, name text, "position" integer, is_active boolean)
 LANGUAGE sql STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT c.id, c.name, c."position", c.is_active
  FROM public.categories c
  JOIN public.restaurants r ON r.id = c.restaurant_id
  WHERE r.slug = p_slug
    AND c.is_active = true
    AND c.archived_at IS NULL
  ORDER BY c."position" NULLS LAST, c.name;
$$;

CREATE OR REPLACE FUNCTION public.get_public_products(p_slug text)
 RETURNS TABLE(id uuid, name text, description text, price numeric, promo_price numeric, image_url text, category_id uuid, is_available boolean)
 LANGUAGE sql STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT p.id, p.name, p.description, p.price, p.promo_price,
         p.image_url, p.category_id, p.is_available
  FROM public.products p
  JOIN public.restaurants r ON r.id = p.restaurant_id
  WHERE r.slug = p_slug
    AND p.is_available = true
    AND p.archived_at IS NULL
  ORDER BY p."position" NULLS LAST, p.name;
$$;

-- Também atualiza public policies para esconder arquivados
DROP POLICY IF EXISTS categories_public_select ON public.categories;
CREATE POLICY categories_public_select ON public.categories
  FOR SELECT USING (
    is_active = true AND archived_at IS NULL AND EXISTS (
      SELECT 1 FROM public.restaurants r
      WHERE r.id = categories.restaurant_id AND r.is_active = true
    )
  );

DROP POLICY IF EXISTS products_public_select ON public.products;
CREATE POLICY products_public_select ON public.products
  FOR SELECT USING (
    is_available = true AND archived_at IS NULL AND EXISTS (
      SELECT 1 FROM public.restaurants r
      WHERE r.id = products.restaurant_id AND r.is_active = true
    )
  );

-- =====================================================================
-- Helpers internos
-- =====================================================================

-- Valida estação: mesmo restaurante e ativa. NULL é permitido (sem estação).
CREATE OR REPLACE FUNCTION private.assert_kitchen_station(
  p_restaurant_id uuid, p_station_id uuid
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path='public','pg_temp'
AS $$
DECLARE v_ok boolean;
BEGIN
  IF p_station_id IS NULL THEN RETURN; END IF;
  SELECT true INTO v_ok FROM public.kitchen_stations
   WHERE id = p_station_id
     AND restaurant_id = p_restaurant_id
     AND is_active = true;
  IF NOT COALESCE(v_ok,false) THEN
    RAISE EXCEPTION 'invalid_kitchen_station' USING ERRCODE='22023';
  END IF;
END $$;

-- Valida categoria: mesmo restaurante; opcionalmente exige ativa/não arquivada.
CREATE OR REPLACE FUNCTION private.assert_category_usable(
  p_restaurant_id uuid, p_category_id uuid, p_must_be_active boolean
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path='public','pg_temp'
AS $$
DECLARE v_active boolean; v_arch timestamptz;
BEGIN
  IF p_category_id IS NULL THEN RETURN; END IF;
  SELECT is_active, archived_at INTO v_active, v_arch
   FROM public.categories
   WHERE id = p_category_id AND restaurant_id = p_restaurant_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'invalid_category' USING ERRCODE='22023';
  END IF;
  IF p_must_be_active AND (v_arch IS NOT NULL OR COALESCE(v_active,false) = false) THEN
    RAISE EXCEPTION 'category_archived' USING ERRCODE='22023';
  END IF;
END $$;

-- Valida motivo (>=5 non-blank chars). Nulo/vazio = "".
CREATE OR REPLACE FUNCTION private.validate_reason(p_reason text, p_required boolean)
RETURNS text LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE v text := coalesce(btrim(p_reason),'');
BEGIN
  IF p_required THEN
    IF length(regexp_replace(v,'\s','','g')) < 5 THEN
      RAISE EXCEPTION 'reason_required' USING ERRCODE='22023';
    END IF;
  END IF;
  RETURN NULLIF(v,'');
END $$;

-- =====================================================================
-- CATEGORIAS
-- =====================================================================

CREATE OR REPLACE FUNCTION public.create_category(
  p_restaurant_id uuid,
  p_name text,
  p_description text DEFAULT NULL,
  p_position integer DEFAULT NULL,
  p_station_id uuid DEFAULT NULL,
  p_reason text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path='public','private','pg_temp'
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
  v_pos := COALESCE(p_position, (SELECT COALESCE(max("position"),0)+1 FROM public.categories WHERE restaurant_id=p_restaurant_id));
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

CREATE OR REPLACE FUNCTION public.update_category(
  p_id uuid,
  p_name text DEFAULT NULL,
  p_description text DEFAULT NULL,
  p_position integer DEFAULT NULL,
  p_station_id uuid DEFAULT NULL,
  p_is_active boolean DEFAULT NULL,
  p_reason text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path='public','private','pg_temp'
AS $$
DECLARE v_rest uuid; v_auth record; v_reason text;
        v_before record; v_diff jsonb := '{}'::jsonb;
        v_new_name text; v_new_desc text; v_new_pos int; v_new_station uuid; v_new_active boolean;
BEGIN
  SELECT restaurant_id INTO v_rest FROM public.categories WHERE id = p_id;
  IF v_rest IS NULL THEN RAISE EXCEPTION 'not_found' USING ERRCODE='02000'; END IF;
  SELECT * INTO v_auth FROM private.authorize_tenant_action(v_rest, 'operational');
  v_reason := private.validate_reason(p_reason, NOT v_auth.is_native);

  SELECT * INTO v_before FROM public.categories WHERE id = p_id AND restaurant_id = v_rest FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'not_found' USING ERRCODE='02000'; END IF;
  IF v_before.archived_at IS NOT NULL THEN RAISE EXCEPTION 'category_archived' USING ERRCODE='22023'; END IF;

  IF p_station_id IS NOT NULL THEN
    PERFORM private.assert_kitchen_station(v_rest, p_station_id);
  END IF;
  IF p_position IS NOT NULL AND (p_position < 0 OR p_position > 100000) THEN
    RAISE EXCEPTION 'invalid_position' USING ERRCODE='22023';
  END IF;

  v_new_name    := COALESCE(NULLIF(btrim(p_name),''), v_before.name);
  v_new_desc    := CASE WHEN p_description IS NULL THEN v_before.description ELSE NULLIF(btrim(p_description),'') END;
  v_new_pos     := COALESCE(p_position, v_before."position");
  v_new_station := COALESCE(p_station_id, v_before.station_id);
  v_new_active  := COALESCE(p_is_active, v_before.is_active);

  IF v_new_name <> v_before.name THEN
    v_diff := v_diff || jsonb_build_object('name',jsonb_build_object('from',v_before.name,'to',v_new_name));
  END IF;
  IF v_new_desc IS DISTINCT FROM v_before.description THEN
    v_diff := v_diff || jsonb_build_object('description_changed', true);
  END IF;
  IF v_new_pos IS DISTINCT FROM v_before."position" THEN
    v_diff := v_diff || jsonb_build_object('position',jsonb_build_object('from',v_before."position",'to',v_new_pos));
  END IF;
  IF v_new_station IS DISTINCT FROM v_before.station_id THEN
    v_diff := v_diff || jsonb_build_object('station_id',jsonb_build_object('from',v_before.station_id,'to',v_new_station));
  END IF;
  IF v_new_active IS DISTINCT FROM v_before.is_active THEN
    v_diff := v_diff || jsonb_build_object('is_active',jsonb_build_object('from',v_before.is_active,'to',v_new_active));
  END IF;

  IF v_diff = '{}'::jsonb THEN RETURN; END IF;

  UPDATE public.categories SET
    name = v_new_name,
    description = v_new_desc,
    "position" = v_new_pos,
    station_id = v_new_station,
    is_active = v_new_active
  WHERE id = p_id;

  IF NOT v_auth.is_native THEN
    PERFORM private.record_audit('category.update','menu',v_rest,'category',p_id::text,
      NULL, v_diff, v_reason, NULL, v_auth.support_session_id);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.archive_category(p_id uuid, p_reason text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path='public','private','pg_temp'
AS $$
DECLARE v_rest uuid; v_auth record; v_reason text; v_active_products int; v_before record;
BEGIN
  SELECT restaurant_id INTO v_rest FROM public.categories WHERE id = p_id;
  IF v_rest IS NULL THEN RAISE EXCEPTION 'not_found' USING ERRCODE='02000'; END IF;
  SELECT * INTO v_auth FROM private.authorize_tenant_action(v_rest, 'administrative');
  v_reason := private.validate_reason(p_reason, true);

  SELECT * INTO v_before FROM public.categories WHERE id = p_id AND restaurant_id = v_rest FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'not_found' USING ERRCODE='02000'; END IF;
  IF v_before.archived_at IS NOT NULL THEN RETURN; END IF;

  SELECT count(*) INTO v_active_products FROM public.products
    WHERE category_id = p_id AND archived_at IS NULL;
  IF v_active_products > 0 THEN
    RAISE EXCEPTION 'category_has_active_products' USING ERRCODE='23000';
  END IF;

  UPDATE public.categories SET archived_at = now(), is_active = false WHERE id = p_id;

  PERFORM private.record_audit('category.archive','menu',v_rest,'category',p_id::text,
    jsonb_build_object('is_active',v_before.is_active),
    jsonb_build_object('archived',true),
    v_reason, NULL, v_auth.support_session_id);
END $$;

CREATE OR REPLACE FUNCTION public.restore_category(p_id uuid, p_reason text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path='public','private','pg_temp'
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

  UPDATE public.categories SET archived_at = NULL, is_active = true WHERE id = p_id;

  PERFORM private.record_audit('category.restore','menu',v_rest,'category',p_id::text,
    jsonb_build_object('archived',true),
    jsonb_build_object('archived',false,'is_active',true),
    v_reason, NULL, v_auth.support_session_id);
END $$;

-- =====================================================================
-- PRODUTOS
-- =====================================================================

CREATE OR REPLACE FUNCTION public.create_product(
  p_restaurant_id uuid,
  p_name text,
  p_price numeric,
  p_category_id uuid DEFAULT NULL,
  p_description text DEFAULT NULL,
  p_promo_price numeric DEFAULT NULL,
  p_image_url text DEFAULT NULL,
  p_position integer DEFAULT NULL,
  p_station_id uuid DEFAULT NULL,
  p_is_available boolean DEFAULT true,
  p_reason text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path='public','private','pg_temp'
AS $$
DECLARE v_auth record; v_reason text; v_id uuid; v_pos int;
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

  PERFORM private.assert_category_usable(p_restaurant_id, p_category_id, true);
  PERFORM private.assert_kitchen_station(p_restaurant_id, p_station_id);

  v_pos := COALESCE(p_position, (SELECT COALESCE(max("position"),0)+1 FROM public.products WHERE restaurant_id=p_restaurant_id));

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

-- update_product: campos operacionais somente. Nunca aceita price/promo/is_available/archived_at.
CREATE OR REPLACE FUNCTION public.update_product(
  p_id uuid,
  p_name text DEFAULT NULL,
  p_description text DEFAULT NULL,
  p_category_id uuid DEFAULT NULL,
  p_station_id uuid DEFAULT NULL,
  p_image_url text DEFAULT NULL,
  p_clear_image boolean DEFAULT false,
  p_position integer DEFAULT NULL,
  p_reason text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path='public','private','pg_temp'
AS $$
DECLARE v_rest uuid; v_auth record; v_reason text;
        v_before record; v_diff jsonb := '{}'::jsonb;
        v_new_name text; v_new_desc text; v_new_cat uuid; v_new_station uuid;
        v_new_image text; v_new_pos int;
BEGIN
  SELECT restaurant_id INTO v_rest FROM public.products WHERE id = p_id;
  IF v_rest IS NULL THEN RAISE EXCEPTION 'not_found' USING ERRCODE='02000'; END IF;
  SELECT * INTO v_auth FROM private.authorize_tenant_action(v_rest, 'operational');
  v_reason := private.validate_reason(p_reason, NOT v_auth.is_native);

  SELECT * INTO v_before FROM public.products WHERE id = p_id AND restaurant_id = v_rest FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'not_found' USING ERRCODE='02000'; END IF;
  IF v_before.archived_at IS NOT NULL THEN RAISE EXCEPTION 'product_archived' USING ERRCODE='22023'; END IF;

  IF p_category_id IS NOT NULL THEN
    PERFORM private.assert_category_usable(v_rest, p_category_id, true);
  END IF;
  IF p_station_id IS NOT NULL THEN
    PERFORM private.assert_kitchen_station(v_rest, p_station_id);
  END IF;
  IF p_position IS NOT NULL AND (p_position < 0 OR p_position > 100000) THEN
    RAISE EXCEPTION 'invalid_position' USING ERRCODE='22023';
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

CREATE OR REPLACE FUNCTION public.set_product_availability(
  p_id uuid, p_is_available boolean, p_reason text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='public','private','pg_temp'
AS $$
DECLARE v_rest uuid; v_auth record; v_reason text; v_before record;
BEGIN
  IF p_is_available IS NULL THEN RAISE EXCEPTION 'invalid_availability' USING ERRCODE='22023'; END IF;
  SELECT restaurant_id INTO v_rest FROM public.products WHERE id = p_id;
  IF v_rest IS NULL THEN RAISE EXCEPTION 'not_found' USING ERRCODE='02000'; END IF;
  SELECT * INTO v_auth FROM private.authorize_tenant_action(v_rest, 'operational');
  v_reason := private.validate_reason(p_reason, NOT v_auth.is_native);

  SELECT * INTO v_before FROM public.products WHERE id = p_id AND restaurant_id = v_rest FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'not_found' USING ERRCODE='02000'; END IF;
  IF v_before.archived_at IS NOT NULL THEN RAISE EXCEPTION 'product_archived' USING ERRCODE='22023'; END IF;

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

CREATE OR REPLACE FUNCTION public.set_product_price(
  p_id uuid,
  p_price numeric,
  p_promo_price numeric DEFAULT NULL,
  p_expected_current_price numeric DEFAULT NULL,
  p_expected_current_promo_price numeric DEFAULT NULL,
  p_reason text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='public','private','pg_temp'
AS $$
DECLARE v_rest uuid; v_auth record; v_reason text; v_before record;
        v_price numeric; v_promo numeric;
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

  IF p_expected_current_price IS NOT NULL
     AND round(p_expected_current_price::numeric,2) IS DISTINCT FROM round(v_before.price::numeric,2) THEN
    RAISE EXCEPTION 'price_changed_by_another_user' USING ERRCODE='40001';
  END IF;
  IF p_expected_current_promo_price IS NOT NULL
     AND (CASE WHEN p_expected_current_promo_price IS NULL THEN NULL ELSE round(p_expected_current_promo_price::numeric,2) END)
         IS DISTINCT FROM (CASE WHEN v_before.promo_price IS NULL THEN NULL ELSE round(v_before.promo_price::numeric,2) END) THEN
    RAISE EXCEPTION 'price_changed_by_another_user' USING ERRCODE='40001';
  END IF;

  IF round(v_before.price::numeric,2) IS NOT DISTINCT FROM v_price
     AND (CASE WHEN v_before.promo_price IS NULL THEN NULL ELSE round(v_before.promo_price::numeric,2) END)
         IS NOT DISTINCT FROM v_promo THEN
    RETURN jsonb_build_object('noop', true);
  END IF;

  UPDATE public.products SET price = v_price, promo_price = v_promo, updated_at = now()
   WHERE id = p_id;

  IF NOT v_auth.is_native THEN
    PERFORM private.record_audit('product.price','menu',v_rest,'product',p_id::text,
      jsonb_build_object('price',round(v_before.price::numeric,2),'promo_price',
        CASE WHEN v_before.promo_price IS NULL THEN NULL ELSE round(v_before.promo_price::numeric,2) END),
      jsonb_build_object('price',v_price,'promo_price',v_promo),
      v_reason, NULL, v_auth.support_session_id);
  END IF;
  RETURN jsonb_build_object('noop', false);
END $$;

CREATE OR REPLACE FUNCTION public.archive_product(p_id uuid, p_reason text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path='public','private','pg_temp'
AS $$
DECLARE v_rest uuid; v_auth record; v_reason text; v_before record;
BEGIN
  SELECT restaurant_id INTO v_rest FROM public.products WHERE id = p_id;
  IF v_rest IS NULL THEN RAISE EXCEPTION 'not_found' USING ERRCODE='02000'; END IF;
  SELECT * INTO v_auth FROM private.authorize_tenant_action(v_rest, 'administrative');
  v_reason := private.validate_reason(p_reason, true);

  SELECT * INTO v_before FROM public.products WHERE id = p_id AND restaurant_id = v_rest FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'not_found' USING ERRCODE='02000'; END IF;
  IF v_before.archived_at IS NOT NULL THEN RETURN; END IF;

  UPDATE public.products SET archived_at = now(), is_available = false, updated_at = now() WHERE id = p_id;

  PERFORM private.record_audit('product.archive','menu',v_rest,'product',p_id::text,
    jsonb_build_object('is_available',v_before.is_available),
    jsonb_build_object('archived',true,'is_available',false),
    v_reason, NULL, v_auth.support_session_id);
END $$;

CREATE OR REPLACE FUNCTION public.restore_product(p_id uuid, p_reason text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path='public','private','pg_temp'
AS $$
DECLARE v_rest uuid; v_auth record; v_reason text; v_before record; v_cat_ok boolean;
BEGIN
  SELECT restaurant_id INTO v_rest FROM public.products WHERE id = p_id;
  IF v_rest IS NULL THEN RAISE EXCEPTION 'not_found' USING ERRCODE='02000'; END IF;
  SELECT * INTO v_auth FROM private.authorize_tenant_action(v_rest, 'administrative');
  v_reason := private.validate_reason(p_reason, true);

  SELECT * INTO v_before FROM public.products WHERE id = p_id AND restaurant_id = v_rest FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'not_found' USING ERRCODE='02000'; END IF;
  IF v_before.archived_at IS NULL THEN RETURN; END IF;

  -- Se produto tinha categoria e ela está arquivada/inativa, restauração deixa is_available=false
  -- e a UI precisará mover a categoria antes de disponibilizar.
  IF v_before.category_id IS NOT NULL THEN
    SELECT (archived_at IS NULL AND is_active = true) INTO v_cat_ok
      FROM public.categories WHERE id = v_before.category_id AND restaurant_id = v_rest;
    IF NOT COALESCE(v_cat_ok,false) THEN
      -- não bloqueia a restauração; apenas mantém indisponível (padrão já é false abaixo)
      NULL;
    END IF;
  END IF;

  UPDATE public.products SET archived_at = NULL, is_available = false, updated_at = now() WHERE id = p_id;

  PERFORM private.record_audit('product.restore','menu',v_rest,'product',p_id::text,
    jsonb_build_object('archived',true),
    jsonb_build_object('archived',false,'is_available',false),
    v_reason, NULL, v_auth.support_session_id);
END $$;

-- =====================================================================
-- Grants: revoga PUBLIC, concede a authenticated
-- =====================================================================
DO $$
DECLARE fn text;
BEGIN
  FOR fn IN SELECT unnest(ARRAY[
    'public.create_category(uuid,text,text,integer,uuid,text)',
    'public.update_category(uuid,text,text,integer,uuid,boolean,text)',
    'public.archive_category(uuid,text)',
    'public.restore_category(uuid,text)',
    'public.create_product(uuid,text,numeric,uuid,text,numeric,text,integer,uuid,boolean,text)',
    'public.update_product(uuid,text,text,uuid,uuid,text,boolean,integer,text)',
    'public.set_product_availability(uuid,boolean,text)',
    'public.set_product_price(uuid,numeric,numeric,numeric,numeric,text)',
    'public.archive_product(uuid,text)',
    'public.restore_product(uuid,text)'
  ]) LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC', fn);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated, service_role', fn);
  END LOOP;
END $$;

NOTIFY pgrst, 'reload schema';
