CREATE OR REPLACE FUNCTION public.get_kds_orders(
  p_restaurant_id UUID,
  p_station_id UUID DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_result jsonb;
BEGIN
  IF NOT (
    public.is_team_owner(v_uid, p_restaurant_id)
    OR EXISTS (
      SELECT 1
      FROM public.user_roles ur
      WHERE ur.user_id = v_uid
        AND ur.restaurant_id = p_restaurant_id
        AND ur.role IN ('employee','manager')
    )
  ) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  SELECT COALESCE(jsonb_agg(to_jsonb(o) ORDER BY o.created_at ASC), '[]'::jsonb)
  INTO v_result
  FROM (
    SELECT
      o.id,
      o.order_number,
      o.status::text AS status,
      o.type::text AS type,
      o.payment::text AS payment,
      o.payment_status,
      o.customer_name,
      o.customer_phone,
      o.subtotal,
      o.delivery_fee,
      o.discount,
      o.total,
      o.notes,
      o.delivery_address,
      o.estimated_minutes,
      o.created_at,
      COALESCE((
        SELECT jsonb_agg(jsonb_build_object(
          'id', i.id,
          'product_name', i.product_name,
          'quantity', i.quantity,
          'notes', i.notes,
          'station_id', p.station_id
        ) ORDER BY i.id)
        FROM public.order_items i
        LEFT JOIN public.products p ON p.id = i.product_id
        WHERE i.order_id = o.id
          AND (p_station_id IS NULL OR p.station_id = p_station_id)
      ), '[]'::jsonb) AS items
    FROM public.orders o
    WHERE o.restaurant_id = p_restaurant_id
      AND o.status IN ('pending','confirmed','preparing','ready','out_for_delivery')
      AND (
        p_station_id IS NULL
        OR EXISTS (
          SELECT 1
          FROM public.order_items i2
          JOIN public.products p2 ON p2.id = i2.product_id
          WHERE i2.order_id = o.id
            AND p2.station_id = p_station_id
        )
      )
    ORDER BY o.created_at ASC
  ) o;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_kds_orders(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_kds_orders(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_kds_orders(UUID, UUID) TO service_role;

NOTIFY pgrst, 'reload schema';