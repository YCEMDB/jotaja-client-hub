
-- ============================================================
-- RC2 Hotfix — PDV server-authoritative + secrets hardening
-- ============================================================

-- ---------- 1) restaurant_secrets: encryption + hardening ----------

-- Reusable encryption helpers (reuse the pagbank vault key)
CREATE OR REPLACE FUNCTION private._mp_encrypt(p_plain text)
RETURNS bytea
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = 'pg_catalog','public','private','pg_temp'
AS $$
BEGIN
  IF p_plain IS NULL OR length(p_plain) = 0 THEN RETURN NULL; END IF;
  RETURN extensions.pgp_sym_encrypt(p_plain, private._pagbank_encryption_key());
END $$;

CREATE OR REPLACE FUNCTION private._mp_decrypt(p_cipher bytea)
RETURNS text
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = 'pg_catalog','public','private','pg_temp'
AS $$
BEGIN
  IF p_cipher IS NULL THEN RETURN NULL; END IF;
  RETURN extensions.pgp_sym_decrypt(p_cipher, private._pagbank_encryption_key());
END $$;

REVOKE ALL ON FUNCTION private._mp_encrypt(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private._mp_decrypt(bytea) FROM PUBLIC, anon, authenticated;

-- Add encrypted column + audit metadata
ALTER TABLE public.restaurant_secrets
  ADD COLUMN IF NOT EXISTS mp_access_token_encrypted bytea,
  ADD COLUMN IF NOT EXISTS mp_environment text,
  ADD COLUMN IF NOT EXISTS mp_last_rotated_at timestamptz,
  ADD COLUMN IF NOT EXISTS mp_last_rotated_by uuid;

-- Backfill from existing plaintext column, if still present
DO $mig$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_schema='public' AND table_name='restaurant_secrets' AND column_name='mp_access_token'
  ) THEN
    UPDATE public.restaurant_secrets s
       SET mp_access_token_encrypted = private._mp_encrypt(s.mp_access_token),
           mp_environment = CASE WHEN left(s.mp_access_token,5)='TEST-' THEN 'sandbox' ELSE 'production' END
     WHERE s.mp_access_token IS NOT NULL
       AND s.mp_access_token_encrypted IS NULL;
    ALTER TABLE public.restaurant_secrets DROP COLUMN mp_access_token;
  END IF;
END $mig$;

-- Lock down direct DML from clients
REVOKE INSERT, UPDATE, DELETE ON public.restaurant_secrets FROM authenticated;
REVOKE SELECT             ON public.restaurant_secrets FROM anon, authenticated;
GRANT  ALL                ON public.restaurant_secrets TO service_role;

-- Server-side accessor: decrypted token (used by backend admin code)
CREATE OR REPLACE FUNCTION private.get_restaurant_mp_token(p_restaurant_id uuid)
RETURNS text
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = 'pg_catalog','public','private','pg_temp'
AS $$
DECLARE v_cipher bytea;
BEGIN
  SELECT mp_access_token_encrypted INTO v_cipher
    FROM public.restaurant_secrets WHERE restaurant_id = p_restaurant_id;
  RETURN private._mp_decrypt(v_cipher);
END $$;
REVOKE ALL ON FUNCTION private.get_restaurant_mp_token(uuid) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION private.get_restaurant_mp_token(uuid) TO service_role;

-- Status-only accessor (no secret leaks)
CREATE OR REPLACE FUNCTION public.restaurant_mp_token_status(p_restaurant_id uuid)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = 'pg_catalog','public','private','pg_temp'
AS $$
DECLARE v_row public.restaurant_secrets%ROWTYPE;
BEGIN
  IF NOT private.has_restaurant_read_access(auth.uid(), p_restaurant_id) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE='insufficient_privilege';
  END IF;
  SELECT * INTO v_row FROM public.restaurant_secrets WHERE restaurant_id = p_restaurant_id;
  RETURN jsonb_build_object(
    'configured', COALESCE(v_row.mp_access_token_encrypted IS NOT NULL, false),
    'environment', v_row.mp_environment,
    'last_rotated_at', v_row.mp_last_rotated_at
  );
END $$;
REVOKE ALL ON FUNCTION public.restaurant_mp_token_status(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.restaurant_mp_token_status(uuid) TO authenticated;

-- Write RPC (owner / admin-support only) — whitelisted provider + shape
CREATE OR REPLACE FUNCTION public.set_restaurant_integration_secret(
  p_restaurant_id uuid,
  p_provider text,
  p_value text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = 'pg_catalog','public','private','pg_temp'
AS $$
DECLARE v_actor uuid := auth.uid(); v_env text; v_trim text;
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'unauthenticated' USING ERRCODE='insufficient_privilege';
  END IF;
  IF p_provider NOT IN ('mercadopago') THEN
    RAISE EXCEPTION 'provider_not_allowed' USING ERRCODE='check_violation';
  END IF;
  -- owner-only (Super Admin needs administrative support session)
  IF NOT private.has_restaurant_admin_access(v_actor, p_restaurant_id) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE='insufficient_privilege';
  END IF;

  v_trim := NULLIF(btrim(coalesce(p_value,'')), '');
  IF v_trim IS NOT NULL AND length(v_trim) > 4096 THEN
    RAISE EXCEPTION 'value_too_long' USING ERRCODE='check_violation';
  END IF;

  IF p_provider = 'mercadopago' THEN
    v_env := CASE WHEN v_trim IS NULL THEN NULL
                  WHEN left(v_trim,5) = 'TEST-' THEN 'sandbox'
                  ELSE 'production' END;
    INSERT INTO public.restaurant_secrets(
      restaurant_id, mp_access_token_encrypted, mp_environment,
      mp_last_rotated_at, mp_last_rotated_by, updated_at)
    VALUES (
      p_restaurant_id, private._mp_encrypt(v_trim), v_env,
      now(), v_actor, now())
    ON CONFLICT (restaurant_id) DO UPDATE
      SET mp_access_token_encrypted = EXCLUDED.mp_access_token_encrypted,
          mp_environment            = EXCLUDED.mp_environment,
          mp_last_rotated_at        = EXCLUDED.mp_last_rotated_at,
          mp_last_rotated_by        = EXCLUDED.mp_last_rotated_by,
          updated_at                = now();
  END IF;

  -- Audit metadata only (never the value)
  PERFORM private.record_audit(
    p_restaurant_id,
    CASE WHEN v_trim IS NULL THEN 'integration_secret.cleared'
         ELSE 'integration_secret.rotated' END,
    jsonb_build_object('provider', p_provider, 'actor', v_actor)
  );

  RETURN jsonb_build_object('ok', true, 'provider', p_provider,
                            'configured', v_trim IS NOT NULL);
EXCEPTION WHEN undefined_function THEN
  -- record_audit optional; ignore if absent
  RETURN jsonb_build_object('ok', true, 'provider', p_provider,
                            'configured', v_trim IS NOT NULL);
END $$;
REVOKE ALL ON FUNCTION public.set_restaurant_integration_secret(uuid,text,text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.set_restaurant_integration_secret(uuid,text,text) TO authenticated;

-- ---------- 2) PDV: server-authoritative order creation ----------

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS pos_idempotency_key text;

CREATE UNIQUE INDEX IF NOT EXISTS uq_orders_pos_idem
  ON public.orders(restaurant_id, pos_idempotency_key)
  WHERE pos_idempotency_key IS NOT NULL;

CREATE OR REPLACE FUNCTION public.create_pos_order(
  p_restaurant_id uuid,
  p_customer_name text,
  p_customer_phone text,
  p_type text,
  p_payment text,
  p_delivery_fee numeric,
  p_discount numeric,
  p_notes text,
  p_delivery_address jsonb,
  p_items jsonb,
  p_idempotency_key text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = 'pg_catalog','public','private','pg_temp'
AS $fn$
DECLARE
  v_actor uuid := auth.uid();
  v_order_id uuid; v_order_number integer;
  v_name  text := btrim(coalesce(p_customer_name,''));
  v_phone text := regexp_replace(coalesce(p_customer_phone,''), '\D','','g');
  v_customer_id uuid;
  v_type text := COALESCE(p_type,'pickup');
  v_payment text := COALESCE(p_payment,'cash');
  v_item jsonb;
  v_subtotal NUMERIC(10,2) := 0;
  v_delivery_fee NUMERIC(10,2) := 0;
  v_discount NUMERIC(10,2) := GREATEST(0, COALESCE(p_discount,0))::numeric(10,2);
  v_total NUMERIC(10,2);
  v_qty int; v_option_ids uuid[];
  v_priced record; v_line NUMERIC(10,2);
  v_existing_id uuid; v_existing_num integer;
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

  -- Idempotência: se já existe pedido com essa chave para o restaurante, devolve-o.
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

  IF v_type = 'delivery' THEN
    v_delivery_fee := GREATEST(0, COALESCE(p_delivery_fee,0))::numeric(10,2);
  END IF;

  v_discount := LEAST(v_discount, v_subtotal);
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

  RETURN jsonb_build_object(
    'id', v_order_id, 'order_number', v_order_number,
    'subtotal', v_subtotal, 'delivery_fee', v_delivery_fee,
    'discount', v_discount, 'total', v_total, 'idempotent', false
  );
END $fn$;

REVOKE ALL ON FUNCTION public.create_pos_order(uuid,text,text,text,text,numeric,numeric,text,jsonb,jsonb,text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.create_pos_order(uuid,text,text,text,text,numeric,numeric,text,jsonb,jsonb,text) TO authenticated;
