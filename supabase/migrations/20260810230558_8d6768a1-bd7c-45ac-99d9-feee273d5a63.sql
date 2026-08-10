
-- Restaurar a assinatura original da get_public_order com segurança aprimorada (P0.3)
DROP FUNCTION IF EXISTS public.get_public_order(UUID);

CREATE OR REPLACE FUNCTION public.get_public_order(p_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_order jsonb;
  v_items jsonb;
  v_rest jsonb;
BEGIN
  -- Retorna apenas campos seguros e necessários para o acompanhamento público
  SELECT to_jsonb(o) INTO v_order
  FROM (
    SELECT
      id, 
      restaurant_id, 
      order_number, 
      status, 
      type, 
      payment, 
      payment_status,
      customer_name, 
      subtotal, 
      delivery_fee, 
      discount, 
      total, 
      notes,
      delivery_address, 
      pix_qr_code, 
      pix_qr_code_base64, 
      pix_expires_at,
      estimated_minutes, 
      created_at
    FROM public.orders 
    WHERE id = p_id
  ) o;

  IF v_order IS NULL THEN
    RETURN NULL;
  END IF;

  -- Busca itens do pedido (somente campos públicos)
  SELECT jsonb_agg(to_jsonb(i)) INTO v_items
  FROM (
    SELECT id, product_id, quantity, unit_price, total_price, notes
    FROM public.order_items 
    WHERE order_id = p_id
  ) i;

  -- Busca dados básicos do restaurante para a UI
  SELECT to_jsonb(r) INTO v_rest
  FROM (
    SELECT id, name, slug, logo_url, phone, whatsapp
    FROM public.restaurants 
    WHERE id = (v_order->>'restaurant_id')::uuid
  ) r;

  RETURN jsonb_build_object(
    'order', v_order,
    'items', COALESCE(v_items, '[]'::jsonb),
    'restaurant', v_rest
  );
END;
$$;
