
-- ============================================================
-- RC2 hardening: create_pos_order + create_owned_restaurant
-- ============================================================

-- Drop qualquer overload antigo para garantir assinatura única
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure::text AS sig
      FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
     WHERE n.nspname='public' AND p.proname='create_pos_order'
  LOOP
    EXECUTE 'DROP FUNCTION ' || r.sig || ' CASCADE';
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.create_pos_order(
  p_restaurant_id uuid,
  p_customer_name text,
  p_customer_phone text,
  p_type text,
  p_payment text,
  p_delivery_fee numeric,   -- ignorado: valor sempre vem de delivery_areas
  p_discount numeric,
  p_notes text,
  p_delivery_address jsonb,
  p_items jsonb,
  p_idempotency_key text DEFAULT NULL,
  p_discount_reason text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private, pg_temp
AS $function$
DECLARE
  v_actor uuid := auth.uid();
  v_order_id uuid; v_order_number integer;
  v_name  text := btrim(coalesce(p_customer_name,''));
  v_phone text := regexp_replace(coalesce(p_customer_phone,''), '\D','','g');
  v_customer_id uuid;
  v_type text := COALESCE(p_type,'pickup');
  v_payment text := COALESCE(p_payment,'cash');
  v_item jsonb;
  v_subtotal numeric(10,2) := 0;
  v_requested_discount numeric(10,2) := GREATEST(0, COALESCE(p_discount,0))::numeric(10,2);
  v_discount numeric(10,2) := 0;
  v_discount_reason text;
  v_delivery_fee numeric(10,2) := 0;
  v_total numeric(10,2);
  v_qty int; v_option_ids uuid[];
  v_priced record; v_line numeric(10,2);
  v_existing_id uuid; v_existing_num integer;
  v_native_write boolean;
  v_support_level text;
  v_is_privileged boolean;
  v_area record;
  v_neighborhood text;
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'unauthenticated' USING ERRCODE='insufficient_privilege';
  END IF;
  IF p_restaurant_id IS NULL OR NOT private.restaurant_is_active(p_restaurant_id) THEN
    RAISE EXCEPTION 'restaurant_not_found' USING ERRCODE='no_data_found';
  END IF;

  -- Autorização: nativo (owner/manager/employee) OU sessão de suporte ativa
  v_native_write := private.has_restaurant_write_access(v_actor, p_restaurant_id);
  v_support_level := private.active_support_level(v_actor, p_restaurant_id);
  IF NOT v_native_write AND v_support_level IS NULL THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE='insufficient_privilege';
  END IF;

  -- Privilégio p/ desconto: owner/manager nativo OU suporte administrativo.
  -- super_admin isolado NUNCA autoriza — precisa de support session.
  v_is_privileged :=
      EXISTS (SELECT 1 FROM public.restaurants WHERE id=p_restaurant_id AND owner_id=v_actor)
   OR EXISTS (SELECT 1 FROM public.user_roles
               WHERE user_id=v_actor AND restaurant_id=p_restaurant_id
                 AND role IN ('owner'::app_role,'manager'::app_role))
   OR v_support_level = 'administrative';

  IF p_idempotency_key IS NOT NULL AND length(p_idempotency_key) > 0 THEN
    SELECT id, order_number INTO v_existing_id, v_existing_num
      FROM public.orders
     WHERE restaurant_id = p_restaurant_id
       AND pos_idempotency_key = p_idempotency_key
     LIMIT 1;
    IF v_existing_id IS NOT NULL THEN
      RETURN jsonb_build_object('id', v_existing_id, 'order_number', v_existing_num, 'idempotent', true);
    END IF;
  END IF;

  IF v_type NOT IN ('pickup','delivery','dine_in') THEN
    RAISE EXCEPTION 'invalid_type' USING ERRCODE='check_violation';
  END IF;
  IF v_payment NOT IN ('cash','pix','credit_card','debit_card') THEN
    RAISE EXCEPTION 'invalid_payment' USING ERRCODE='check_violation';
  END IF;
  IF length(v_name) < 1 OR length(v_name) > 120 OR length(v_phone) < 6 OR length(v_phone) > 20 THEN
    RAISE EXCEPTION 'invalid_customer' USING ERRCODE='check_violation';
  END IF;
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'empty_cart' USING ERRCODE='check_violation';
  END IF;
  IF jsonb_array_length(p_items) > 100 THEN
    RAISE EXCEPTION 'too_many_items' USING ERRCODE='check_violation';
  END IF;

  INSERT INTO public.customers(restaurant_id, name, phone, source)
  VALUES (p_restaurant_id, v_name, v_phone, 'pos')
  ON CONFLICT (restaurant_id, phone) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO v_customer_id;

  CREATE TEMP TABLE _pos_items(
    position int, product_id uuid, product_name text,
    quantity int, unit_price numeric(10,2), subtotal numeric(10,2),
    options jsonb, notes text
  ) ON COMMIT DROP;

  FOR v_item IN
    SELECT value FROM jsonb_array_elements(p_items) WITH ORDINALITY t(value, ord) ORDER BY ord
  LOOP
    v_qty := GREATEST(1, LEAST(200, COALESCE((v_item->>'quantity')::int, 1)));
    v_option_ids := ARRAY(
      SELECT (x)::uuid FROM jsonb_array_elements_text(COALESCE(v_item->'option_item_ids','[]'::jsonb)) AS x
    );
    SELECT * INTO v_priced
      FROM private._menu_price_item(
        p_restaurant_id,
        NULLIF(v_item->>'product_id','')::uuid,
        v_option_ids
      );
    v_line := (v_priced.unit_price * v_qty)::numeric(10,2);
    INSERT INTO _pos_items(position, product_id, product_name, quantity, unit_price, subtotal, options, notes)
    SELECT
      COALESCE((SELECT max(position) FROM _pos_items), 0) + 1,
      NULLIF(v_item->>'product_id','')::uuid,
      (SELECT name FROM public.products WHERE id = NULLIF(v_item->>'product_id','')::uuid),
      v_qty, v_priced.unit_price, v_line, v_priced.options_snapshot,
      NULLIF(btrim(coalesce(v_item->>'notes','')),'');
    v_subtotal := v_subtotal + v_line;
  END LOOP;

  -- ============================================================
  -- Taxa de entrega: SEMPRE do backend. Sem fallback silencioso.
  -- ============================================================
  IF v_type = 'delivery' THEN
    v_neighborhood := NULLIF(btrim(coalesce(p_delivery_address->>'neighborhood','')),'');
    IF v_neighborhood IS NULL THEN
      RAISE EXCEPTION 'delivery_area_required' USING ERRCODE='check_violation';
    END IF;

    SELECT id, fee, COALESCE(min_order,0) AS min_order
      INTO v_area
      FROM public.delivery_areas
     WHERE restaurant_id = p_restaurant_id
       AND is_active = true
       AND lower(btrim(unaccent_immutable(neighborhood))) = lower(btrim(unaccent_immutable(v_neighborhood)))
     LIMIT 1;

    IF v_area.id IS NULL THEN
      -- fallback sem unaccent (caso helper indisponível)
      SELECT id, fee, COALESCE(min_order,0) AS min_order
        INTO v_area
        FROM public.delivery_areas
       WHERE restaurant_id = p_restaurant_id
         AND is_active = true
         AND lower(btrim(neighborhood)) = lower(btrim(v_neighborhood))
       LIMIT 1;
    END IF;

    IF v_area.id IS NULL THEN
      RAISE EXCEPTION 'delivery_area_not_found' USING ERRCODE='no_data_found';
    END IF;

    v_delivery_fee := v_area.fee::numeric(10,2);

    IF v_area.min_order > 0 AND v_subtotal < v_area.min_order THEN
      RAISE EXCEPTION 'delivery_minimum_not_met' USING ERRCODE='check_violation';
    END IF;
  ELSE
    -- pickup/dine_in: taxa sempre zero
    v_delivery_fee := 0;
  END IF;

  -- ============================================================
  -- Desconto: helper canônico + limites + auditoria
  -- ============================================================
  IF v_requested_discount > 0 THEN
    IF NOT v_is_privileged THEN
      RAISE EXCEPTION 'discount_requires_manager' USING ERRCODE='insufficient_privilege';
    END IF;
    -- precisão de duas casas
    IF round(v_requested_discount, 2) <> v_requested_discount THEN
      RAISE EXCEPTION 'discount_precision_invalid' USING ERRCODE='check_violation';
    END IF;
    IF v_requested_discount > v_subtotal THEN
      RAISE EXCEPTION 'discount_exceeds_subtotal' USING ERRCODE='check_violation';
    END IF;
    -- helper canônico exige >=5 chars não-brancos
    v_discount_reason := private.validate_reason(p_discount_reason, true);
    v_discount := v_requested_discount;
  END IF;

  v_total := GREATEST(0, v_subtotal + v_delivery_fee - v_discount)::numeric(10,2);

  INSERT INTO public.orders(
    restaurant_id, customer_id, customer_name, customer_phone,
    type, payment, status, payment_status,
    subtotal, delivery_fee, discount, total,
    notes, delivery_address, source, is_test_order,
    pos_idempotency_key, created_by
  ) VALUES (
    p_restaurant_id, v_customer_id, v_name, v_phone,
    v_type::order_type, v_payment::payment_method,
    'confirmed'::order_status, 'pending'::payment_status,
    v_subtotal, v_delivery_fee, v_discount, v_total,
    NULLIF(btrim(coalesce(p_notes,'')),''),
    p_delivery_address, 'manual', false,
    NULLIF(p_idempotency_key,''), v_actor
  ) RETURNING id, order_number INTO v_order_id, v_order_number;

  INSERT INTO public.order_items(order_id, product_id, product_name, quantity, unit_price, subtotal, options, notes)
  SELECT v_order_id, product_id, product_name, quantity, unit_price, subtotal, options, notes
    FROM _pos_items ORDER BY position;

  IF v_discount > 0 THEN
    PERFORM private.record_audit(
      'pos_manual_discount', 'orders', p_restaurant_id,
      'order', v_order_id::text,
      NULL,
      jsonb_build_object(
        'discount', v_discount,
        'subtotal', v_subtotal,
        'delivery_fee', v_delivery_fee,
        'total', v_total,
        'support_session', v_support_level IS NOT NULL
      ),
      v_discount_reason,
      NULL,
      NULL
    );
  END IF;

  RETURN jsonb_build_object(
    'id', v_order_id, 'order_number', v_order_number,
    'subtotal', v_subtotal, 'delivery_fee', v_delivery_fee,
    'discount', v_discount, 'total', v_total, 'idempotent', false
  );
END $function$;

-- Fallback para unaccent_immutable caso não exista (evita erro no runtime)
CREATE OR REPLACE FUNCTION public.unaccent_immutable(text)
RETURNS text
LANGUAGE sql IMMUTABLE PARALLEL SAFE
SET search_path = pg_catalog, public, pg_temp
AS $$
  SELECT translate($1,
    'áàâãäåéèêëíìîïóòôõöúùûüçñÁÀÂÃÄÅÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑ',
    'aaaaaaeeeeiiiiooooouuuucnAAAAAAEEEEIIIIOOOOOUUUUCN'
  );
$$;

REVOKE ALL ON FUNCTION public.create_pos_order(uuid,text,text,text,text,numeric,numeric,text,jsonb,jsonb,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_pos_order(uuid,text,text,text,text,numeric,numeric,text,jsonb,jsonb,text,text) TO authenticated, service_role;

-- ============================================================
-- create_owned_restaurant: idempotência atômica + guardas
-- ============================================================
CREATE OR REPLACE FUNCTION public.create_owned_restaurant(
  p_name text, p_whatsapp text, p_description text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $function$
DECLARE
  v_uid  uuid := auth.uid();
  v_name text := btrim(coalesce(p_name,''));
  v_wa   text := btrim(coalesce(p_whatsapp,''));
  v_desc text := NULLIF(btrim(coalesce(p_description,'')),'');
  v_base text;
  v_slug text;
  v_i    int := 0;
  v_id   uuid;
  v_existing uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'unauthenticated' USING ERRCODE='insufficient_privilege';
  END IF;

  -- Serializa chamadas concorrentes do mesmo usuário
  PERFORM pg_advisory_xact_lock(hashtextextended('create_owned_restaurant:'||v_uid::text, 0));

  -- Idempotência: se já é dono, retorna o restaurante existente. Não mexe em user_roles/profile.
  SELECT id INTO v_existing
    FROM public.restaurants
   WHERE owner_id = v_uid
   ORDER BY created_at
   LIMIT 1;
  IF v_existing IS NOT NULL THEN
    RETURN jsonb_build_object('id', v_existing, 'existing', true);
  END IF;

  IF length(v_name) < 2 OR length(v_name) > 80 THEN
    RAISE EXCEPTION 'invalid_name' USING ERRCODE='check_violation';
  END IF;
  IF length(v_wa) < 10 OR length(v_wa) > 20 THEN
    RAISE EXCEPTION 'invalid_whatsapp' USING ERRCODE='check_violation';
  END IF;
  IF v_desc IS NOT NULL AND length(v_desc) > 280 THEN
    RAISE EXCEPTION 'invalid_description' USING ERRCODE='check_violation';
  END IF;

  v_base := lower(v_name);
  v_base := translate(v_base,
    'áàâãäåéèêëíìîïóòôõöúùûüçñÁÀÂÃÄÅÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑ',
    'aaaaaaeeeeiiiiooooouuuucnaaaaaaeeeeiiiiooooouuuucn');
  v_base := regexp_replace(v_base, '[^a-z0-9]+', '-', 'g');
  v_base := regexp_replace(v_base, '(^-+|-+$)', '', 'g');
  IF v_base IS NULL OR length(v_base) < 2 THEN v_base := 'loja'; END IF;
  v_base := left(v_base, 40);
  v_slug := v_base;
  WHILE EXISTS (SELECT 1 FROM public.restaurants WHERE slug = v_slug) LOOP
    v_i := v_i + 1;
    v_slug := left(v_base, 36) || '-' || v_i::text;
    IF v_i > 50 THEN
      v_slug := v_base || '-' || substr(md5(random()::text || clock_timestamp()::text), 1, 6);
      EXIT;
    END IF;
  END LOOP;

  -- Insere apenas campos operacionais; plan/trial/is_active/contadores vêm dos DEFAULTs.
  INSERT INTO public.restaurants(owner_id, slug, name, whatsapp, description)
  VALUES (v_uid, v_slug, v_name, v_wa, v_desc)
  RETURNING id INTO v_id;

  -- Papel owner (não remove nenhum papel existente)
  INSERT INTO public.user_roles(user_id, restaurant_id, role)
  VALUES (v_uid, v_id, 'owner'::app_role)
  ON CONFLICT DO NOTHING;

  -- Não sobrescreve vínculo de funcionário em outro restaurante.
  UPDATE public.profiles SET restaurant_id = v_id
   WHERE id = v_uid AND restaurant_id IS NULL;

  RETURN jsonb_build_object('id', v_id, 'slug', v_slug, 'existing', false);
END $function$;

REVOKE ALL ON FUNCTION public.create_owned_restaurant(text,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_owned_restaurant(text,text,text) TO authenticated, service_role;

-- Índice único parcial: um restaurante como owner por usuário (defesa em profundidade)
CREATE UNIQUE INDEX IF NOT EXISTS restaurants_one_per_owner
  ON public.restaurants(owner_id)
  WHERE owner_id IS NOT NULL;
