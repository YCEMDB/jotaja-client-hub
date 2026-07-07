
-- Sprint 6.3 Fase A: RPCs públicas para o fluxo do QR de mesa.
-- Nenhuma nova tabela. Apenas RPCs SECURITY DEFINER validadas pelo qr_token da mesa.

-- 1) Detalhe da sessão + comandas + pedidos, para a página pública /mesa/:token
CREATE OR REPLACE FUNCTION public.get_public_table_session(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_table RECORD;
  v_session RECORD;
  v_commands jsonb;
  v_orders jsonb;
BEGIN
  SELECT t.id, t.number, t.name, t.restaurant_id, r.slug AS restaurant_slug,
         r.name AS restaurant_name, r.logo_url, r.primary_color, r.accent_color
    INTO v_table
    FROM public.restaurant_tables t
    JOIN public.restaurants r ON r.id = t.restaurant_id
   WHERE t.qr_token = p_token AND t.is_active = true AND r.is_active = true;
  IF NOT FOUND THEN RETURN NULL; END IF;

  SELECT s.* INTO v_session
    FROM public.table_sessions s
   WHERE s.table_id = v_table.id AND s.status IN ('open','closing')
   LIMIT 1;

  IF v_session.id IS NULL THEN
    RETURN jsonb_build_object(
      'table', to_jsonb(v_table),
      'session', NULL,
      'commands', '[]'::jsonb,
      'orders', '[]'::jsonb
    );
  END IF;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', c.id, 'label', c.label, 'holder_name', c.holder_name,
    'closed_at', c.closed_at, 'created_at', c.created_at
  ) ORDER BY c.created_at), '[]'::jsonb) INTO v_commands
  FROM public.table_commands c WHERE c.session_id = v_session.id;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', o.id, 'order_number', o.order_number, 'status', o.status,
    'total', o.total, 'created_at', o.created_at,
    'table_command_id', o.table_command_id,
    'items', (SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'product_name', oi.product_name, 'quantity', oi.quantity, 'subtotal', oi.subtotal
    )), '[]'::jsonb) FROM public.order_items oi WHERE oi.order_id = o.id)
  ) ORDER BY o.created_at DESC), '[]'::jsonb) INTO v_orders
  FROM public.orders o
   WHERE o.table_session_id = v_session.id
     AND o.status NOT IN ('cancelled');

  RETURN jsonb_build_object(
    'table', to_jsonb(v_table),
    'session', jsonb_build_object(
      'id', v_session.id, 'status', v_session.status,
      'customer_name', v_session.customer_name, 'party_size', v_session.party_size,
      'opened_at', v_session.opened_at
    ),
    'commands', v_commands,
    'orders', v_orders
  );
END $$;

GRANT EXECUTE ON FUNCTION public.get_public_table_session(text) TO anon, authenticated;

-- 2) Criação de comanda a partir do QR (validado pelo token)
CREATE OR REPLACE FUNCTION public.create_public_table_command(
  p_token text, p_label text, p_holder_name text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_session RECORD; v_id uuid; v_label text;
BEGIN
  v_label := btrim(coalesce(p_label,''));
  IF length(v_label) = 0 OR length(v_label) > 60 THEN
    RAISE EXCEPTION 'invalid_label' USING ERRCODE='check_violation';
  END IF;

  SELECT s.id, s.restaurant_id
    INTO v_session
    FROM public.restaurant_tables t
    JOIN public.table_sessions s ON s.table_id = t.id AND s.status IN ('open','closing')
   WHERE t.qr_token = p_token AND t.is_active = true;
  IF NOT FOUND THEN RAISE EXCEPTION 'session_not_open' USING ERRCODE='no_data_found'; END IF;

  INSERT INTO public.table_commands (session_id, restaurant_id, label, holder_name)
  VALUES (v_session.id, v_session.restaurant_id, v_label,
          NULLIF(btrim(coalesce(p_holder_name,'')),''))
  RETURNING id INTO v_id;

  RETURN v_id;
END $$;

GRANT EXECUTE ON FUNCTION public.create_public_table_command(text, text, text) TO anon, authenticated;

-- 3) Pedido oficial vindo do QR (dine_in), validado pelo token
CREATE OR REPLACE FUNCTION public.create_public_table_order(
  p_token text,
  p_customer_name text,
  p_customer_phone text,
  p_command_id uuid,
  p_notes text,
  p_items jsonb
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_table RECORD; v_session RECORD;
  v_customer_id uuid;
  v_name text := btrim(coalesce(p_customer_name,''));
  v_phone text := regexp_replace(coalesce(p_customer_phone,''), '\D','','g');
  v_item jsonb;
  v_subtotal numeric(10,2) := 0;
  v_qty int; v_unit numeric(10,2); v_line numeric(10,2);
  v_order_id uuid; v_order_number integer;
BEGIN
  IF length(v_name) < 2 OR length(v_name) > 100 THEN
    RAISE EXCEPTION 'invalid_name' USING ERRCODE='check_violation';
  END IF;
  IF length(v_phone) < 8 OR length(v_phone) > 20 THEN
    RAISE EXCEPTION 'invalid_phone' USING ERRCODE='check_violation';
  END IF;
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'empty_cart' USING ERRCODE='check_violation';
  END IF;

  SELECT t.id AS table_id, t.number AS table_number, t.restaurant_id
    INTO v_table
    FROM public.restaurant_tables t
   WHERE t.qr_token = p_token AND t.is_active = true;
  IF NOT FOUND THEN RAISE EXCEPTION 'table_not_found' USING ERRCODE='no_data_found'; END IF;

  SELECT s.id, s.restaurant_id
    INTO v_session
    FROM public.table_sessions s
   WHERE s.table_id = v_table.table_id AND s.status IN ('open','closing')
   LIMIT 1;
  IF v_session.id IS NULL THEN
    RAISE EXCEPTION 'session_not_open' USING ERRCODE='no_data_found';
  END IF;

  -- Comanda opcional; se enviada precisa pertencer à sessão
  IF p_command_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM public.table_commands
                    WHERE id = p_command_id AND session_id = v_session.id
                      AND closed_at IS NULL) THEN
      RAISE EXCEPTION 'invalid_command' USING ERRCODE='no_data_found';
    END IF;
  END IF;

  -- Upsert do cliente por (restaurante, telefone)
  SELECT id INTO v_customer_id FROM public.customers
   WHERE restaurant_id = v_table.restaurant_id AND phone = v_phone LIMIT 1;
  IF v_customer_id IS NULL THEN
    INSERT INTO public.customers (restaurant_id, name, phone, source)
    VALUES (v_table.restaurant_id, v_name, v_phone, 'qr_table')
    RETURNING id INTO v_customer_id;
  ELSE
    UPDATE public.customers SET name = v_name, updated_at = now()
     WHERE id = v_customer_id;
  END IF;

  IF EXISTS (SELECT 1 FROM public.customers WHERE id = v_customer_id AND is_blocked = true) THEN
    RAISE EXCEPTION 'customer_blocked' USING ERRCODE='check_violation';
  END IF;

  -- Soma segura do subtotal a partir dos itens validados contra products
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_qty := GREATEST(1, COALESCE((v_item->>'quantity')::int, 1));
    SELECT COALESCE(p.promo_price, p.price) INTO v_unit
      FROM public.products p
     WHERE p.id = (v_item->>'product_id')::uuid
       AND p.restaurant_id = v_table.restaurant_id
       AND p.is_available = true;
    IF v_unit IS NULL THEN
      RAISE EXCEPTION 'invalid_product' USING ERRCODE='no_data_found';
    END IF;
    v_line := v_unit * v_qty;
    v_subtotal := v_subtotal + v_line;
  END LOOP;

  INSERT INTO public.orders (
    restaurant_id, customer_id, customer_name, customer_phone,
    type, payment, status, subtotal, delivery_fee, discount, total,
    notes, source,
    table_session_id, table_command_id, table_number
  ) VALUES (
    v_table.restaurant_id, v_customer_id, v_name, v_phone,
    'dine_in'::order_type, 'cash'::payment_method, 'pending'::order_status,
    v_subtotal, 0, 0, v_subtotal,
    NULLIF(btrim(coalesce(p_notes,'')),''), 'qr_table',
    v_session.id, p_command_id, v_table.table_number
  ) RETURNING id, order_number INTO v_order_id, v_order_number;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_qty := GREATEST(1, COALESCE((v_item->>'quantity')::int, 1));
    SELECT COALESCE(p.promo_price, p.price) INTO v_unit
      FROM public.products p WHERE p.id = (v_item->>'product_id')::uuid;
    v_line := v_unit * v_qty;
    INSERT INTO public.order_items (order_id, product_id, product_name, quantity, unit_price, subtotal, notes)
    VALUES (v_order_id, (v_item->>'product_id')::uuid,
            v_item->>'product_name', v_qty, v_unit, v_line,
            NULLIF(btrim(coalesce(v_item->>'notes','')),''));
  END LOOP;

  RETURN jsonb_build_object('id', v_order_id, 'order_number', v_order_number, 'total', v_subtotal);
END $$;

GRANT EXECUTE ON FUNCTION public.create_public_table_order(text, text, text, uuid, text, jsonb) TO anon, authenticated;
