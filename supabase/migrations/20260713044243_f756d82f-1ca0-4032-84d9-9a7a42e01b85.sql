
-- ============================================================
-- HOTFIX RC2: privilege-escalation + POS server-authoritative
-- ============================================================

-- 1) RESTAURANTS -----------------------------------------------

DROP POLICY IF EXISTS restaurants_insert_own ON public.restaurants;
REVOKE INSERT ON public.restaurants FROM authenticated, anon;
REVOKE UPDATE ON public.restaurants FROM authenticated, anon;

GRANT UPDATE (
  name, description, logo_url, cover_url,
  primary_color, accent_color,
  phone, whatsapp, email, cnpj,
  address_street, address_number, address_complement,
  address_neighborhood, address_city, address_state, address_zip,
  opening_hours, open_mode, timezone,
  min_order_value,
  accepts_delivery, accepts_pickup, accepts_dine_in, is_open,
  pickup_time_minutes, pickup_instructions,
  auto_print_enabled, auto_print_copies,
  accept_pix_online, accept_cash_on_delivery, accept_card_on_delivery,
  mp_public_key,
  stock_auto_debit_status, stock_reverse_on_cancel
) ON public.restaurants TO authenticated;

CREATE OR REPLACE FUNCTION private.restaurants_guard_protected_columns()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER
SET search_path TO 'public','pg_temp'
AS $$
BEGIN
  IF current_user NOT IN ('authenticated','anon') THEN
    RETURN NEW;
  END IF;
  IF NEW.owner_id IS DISTINCT FROM OLD.owner_id
     OR NEW.slug IS DISTINCT FROM OLD.slug
     OR NEW.plan IS DISTINCT FROM OLD.plan
     OR NEW.plan_id IS DISTINCT FROM OLD.plan_id
     OR NEW.trial_ends_at IS DISTINCT FROM OLD.trial_ends_at
     OR NEW.subscription_ends_at IS DISTINCT FROM OLD.subscription_ends_at
     OR NEW.is_active IS DISTINCT FROM OLD.is_active
     OR NEW.monthly_order_count IS DISTINCT FROM OLD.monthly_order_count
     OR NEW.month_reset_at IS DISTINCT FROM OLD.month_reset_at
     OR NEW.admin_notes IS DISTINCT FROM OLD.admin_notes
     OR NEW.order_number_seq IS DISTINCT FROM OLD.order_number_seq
     OR NEW.active_payment_provider IS DISTINCT FROM OLD.active_payment_provider
     OR NEW.custom_domain IS DISTINCT FROM OLD.custom_domain
     OR NEW.custom_domain_verified IS DISTINCT FROM OLD.custom_domain_verified
  THEN
    RAISE EXCEPTION 'forbidden_column_update' USING ERRCODE='insufficient_privilege';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS restaurants_guard_protected ON public.restaurants;
CREATE TRIGGER restaurants_guard_protected
  BEFORE UPDATE ON public.restaurants
  FOR EACH ROW EXECUTE FUNCTION private.restaurants_guard_protected_columns();

-- 2) PROFILES --------------------------------------------------

DROP POLICY IF EXISTS profiles_insert_self ON public.profiles;
REVOKE INSERT ON public.profiles FROM authenticated, anon;
REVOKE UPDATE ON public.profiles FROM authenticated, anon;
GRANT UPDATE (full_name, phone, avatar_url) ON public.profiles TO authenticated;

CREATE OR REPLACE FUNCTION private.profiles_guard_protected_columns()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER
SET search_path TO 'public','pg_temp'
AS $$
BEGIN
  IF current_user NOT IN ('authenticated','anon') THEN
    RETURN NEW;
  END IF;
  IF NEW.id IS DISTINCT FROM OLD.id
     OR NEW.email IS DISTINCT FROM OLD.email
     OR NEW.cpf IS DISTINCT FROM OLD.cpf
     OR NEW.position IS DISTINCT FROM OLD.position
     OR NEW.restaurant_id IS DISTINCT FROM OLD.restaurant_id
  THEN
    RAISE EXCEPTION 'forbidden_column_update' USING ERRCODE='insufficient_privilege';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS profiles_guard_protected ON public.profiles;
CREATE TRIGGER profiles_guard_protected
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION private.profiles_guard_protected_columns();

-- 3) create_owned_restaurant -----------------------------------

CREATE OR REPLACE FUNCTION public.create_owned_restaurant(
  p_name text, p_whatsapp text, p_description text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public','pg_temp'
AS $$
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
  IF length(v_name) < 2 OR length(v_name) > 80 THEN
    RAISE EXCEPTION 'invalid_name' USING ERRCODE='check_violation';
  END IF;
  IF length(v_wa) < 10 OR length(v_wa) > 20 THEN
    RAISE EXCEPTION 'invalid_whatsapp' USING ERRCODE='check_violation';
  END IF;
  IF v_desc IS NOT NULL AND length(v_desc) > 280 THEN
    RAISE EXCEPTION 'invalid_description' USING ERRCODE='check_violation';
  END IF;

  -- Idempotência simples: se já é dono de algum restaurante, retorna.
  SELECT id INTO v_existing
    FROM public.restaurants
   WHERE owner_id = v_uid
   ORDER BY created_at
   LIMIT 1;
  IF v_existing IS NOT NULL THEN
    RETURN jsonb_build_object('id', v_existing, 'existing', true);
  END IF;

  -- Slug: transliteração básica de acentos + normalização
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

  -- Insere apenas com campos operacionais; plan/trial/is_active/contadores vêm dos DEFAULTs.
  INSERT INTO public.restaurants(owner_id, slug, name, whatsapp, description)
  VALUES (v_uid, v_slug, v_name, v_wa, v_desc)
  RETURNING id INTO v_id;

  INSERT INTO public.user_roles(user_id, restaurant_id, role)
  VALUES (v_uid, v_id, 'owner'::app_role)
  ON CONFLICT DO NOTHING;

  UPDATE public.profiles SET restaurant_id = v_id WHERE id = v_uid;

  RETURN jsonb_build_object('id', v_id, 'slug', v_slug, 'existing', false);
END $$;

REVOKE ALL ON FUNCTION public.create_owned_restaurant(text,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_owned_restaurant(text,text,text) TO authenticated;

-- 4) create_pos_order server-authoritative ---------------------

DROP FUNCTION IF EXISTS public.create_pos_order(uuid,text,text,text,text,numeric,numeric,text,jsonb,jsonb,text);

CREATE OR REPLACE FUNCTION public.create_pos_order(
  p_restaurant_id uuid,
  p_customer_name text, p_customer_phone text,
  p_type text, p_payment text,
  p_delivery_fee numeric, p_discount numeric,
  p_notes text, p_delivery_address jsonb, p_items jsonb,
  p_idempotency_key text DEFAULT NULL,
  p_discount_reason text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'pg_catalog','public','private','pg_temp'
AS $$
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
  v_requested_fee numeric(10,2) := GREATEST(0, COALESCE(p_delivery_fee,0))::numeric(10,2);
  v_delivery_fee numeric(10,2) := 0;
  v_requested_discount numeric(10,2) := GREATEST(0, COALESCE(p_discount,0))::numeric(10,2);
  v_discount numeric(10,2) := 0;
  v_discount_reason text := NULLIF(btrim(coalesce(p_discount_reason,'')),'');
  v_total numeric(10,2);
  v_qty int; v_option_ids uuid[];
  v_priced record; v_line numeric(10,2);
  v_existing_id uuid; v_existing_num integer;
  v_is_privileged boolean;
  v_area_fee numeric(10,2);
  v_neighborhood text;
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'unauthenticated' USING ERRCODE='insufficient_privilege';
  END IF;
  IF p_restaurant_id IS NULL OR NOT private.restaurant_is_active(p_restaurant_id) THEN
    RAISE EXCEPTION 'restaurant_not_found' USING ERRCODE='no_data_found';
  END IF;
  IF NOT private.has_restaurant_write_access(v_actor, p_restaurant_id) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE='insufficient_privilege';
  END IF;

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

  v_is_privileged := EXISTS (
      SELECT 1 FROM public.restaurants WHERE id = p_restaurant_id AND owner_id = v_actor
    )
    OR EXISTS (
      SELECT 1 FROM public.user_roles
       WHERE user_id = v_actor AND restaurant_id = p_restaurant_id
         AND role IN ('owner'::app_role,'manager'::app_role)
    )
    OR private.is_super_admin(v_actor);

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

  -- Taxa de entrega: nunca confia no navegador de employee
  IF v_type = 'delivery' THEN
    v_neighborhood := NULLIF(btrim(coalesce(p_delivery_address->>'neighborhood','')),'');
    IF v_neighborhood IS NOT NULL THEN
      SELECT fee INTO v_area_fee
        FROM public.delivery_areas
       WHERE restaurant_id = p_restaurant_id
         AND is_active = true
         AND lower(neighborhood) = lower(v_neighborhood)
       LIMIT 1;
    END IF;
    IF v_area_fee IS NOT NULL THEN
      v_delivery_fee := v_area_fee::numeric(10,2);
    ELSIF v_is_privileged THEN
      v_delivery_fee := v_requested_fee;
    ELSE
      v_delivery_fee := 0;
    END IF;
  END IF;

  -- Desconto: employee = 0. Owner/manager exige motivo (>=3 chars) e é auditado.
  IF v_requested_discount > 0 THEN
    IF NOT v_is_privileged THEN
      RAISE EXCEPTION 'discount_requires_manager' USING ERRCODE='insufficient_privilege';
    END IF;
    IF v_discount_reason IS NULL OR length(v_discount_reason) < 3 THEN
      RAISE EXCEPTION 'discount_reason_required' USING ERRCODE='check_violation';
    END IF;
    v_discount := LEAST(v_requested_discount, v_subtotal);
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
      jsonb_build_object('discount', v_discount, 'subtotal', v_subtotal, 'delivery_fee', v_delivery_fee, 'total', v_total),
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
END $$;

REVOKE ALL ON FUNCTION public.create_pos_order(uuid,text,text,text,text,numeric,numeric,text,jsonb,jsonb,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_pos_order(uuid,text,text,text,text,numeric,numeric,text,jsonb,jsonb,text,text) TO authenticated;
