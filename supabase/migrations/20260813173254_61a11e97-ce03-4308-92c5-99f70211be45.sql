-- REVERT: restaurar versões anteriores de get_public_order (total_price) e get_order_history (WHERE id = p_order_id)
CREATE OR REPLACE FUNCTION public.get_public_order(p_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_order jsonb;
  v_items jsonb;
  v_rest jsonb;
BEGIN
  SELECT to_jsonb(o) INTO v_order
  FROM (
    SELECT
      id, restaurant_id, order_number, status, type, payment, payment_status,
      customer_name, subtotal, delivery_fee, discount, total, notes,
      delivery_address, pix_qr_code, pix_qr_code_base64, pix_expires_at,
      estimated_minutes, created_at
    FROM public.orders
    WHERE id = p_id
  ) o;

  IF v_order IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT jsonb_agg(to_jsonb(i)) INTO v_items
  FROM (
    SELECT id, product_id, product_name, quantity, unit_price,
           subtotal AS total_price, options, notes
    FROM public.order_items
    WHERE order_id = p_id
  ) i;

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
$function$;

CREATE OR REPLACE FUNCTION public.get_order_history(p_order_id uuid)
 RETURNS TABLE(id uuid, from_status order_status, to_status order_status, source text, reason text, changed_by uuid, actor_name text, actor_email text, created_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_rid uuid;
  v_uid uuid := auth.uid();
BEGIN
  SELECT o.restaurant_id INTO v_rid FROM public.orders o WHERE o.id = p_order_id;
  IF v_rid IS NULL THEN
    RAISE EXCEPTION 'order_not_found' USING ERRCODE = 'no_data_found';
  END IF;
  IF NOT (
    public.is_team_owner(v_uid, v_rid)
    OR EXISTS (
      SELECT 1 FROM public.user_roles ur
       WHERE ur.user_id = v_uid
         AND ur.restaurant_id = v_rid
         AND ur.role IN ('employee','manager')
    )
  ) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
    SELECT h.id, h.from_status, h.to_status, h.source, h.reason,
           h.changed_by,
           COALESCE(pr.full_name, '') AS actor_name,
           COALESCE(u.email::text, '') AS actor_email,
           h.created_at
      FROM public.order_status_history h
      LEFT JOIN auth.users u ON u.id = h.changed_by
      LEFT JOIN public.profiles pr ON pr.id = h.changed_by
     WHERE h.order_id = p_order_id
     ORDER BY h.created_at ASC;
END;
$function$;

REVOKE ALL ON FUNCTION public.get_public_order(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_order_history(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_order(uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_order_history(uuid) TO anon, authenticated, service_role;