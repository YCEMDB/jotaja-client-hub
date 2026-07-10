
CREATE OR REPLACE FUNCTION public.get_dashboard_summary(
  p_restaurant_id uuid,
  p_from timestamptz,
  p_to timestamptz,
  p_prev_from timestamptz,
  p_prev_to timestamptz
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_tz text;
  v_result jsonb;
  v_current jsonb;
  v_previous jsonb;
  v_daily jsonb;
  v_by_channel jsonb;
  v_by_payment jsonb;
BEGIN
  -- Auth: caller must belong to restaurant OR be super admin
  IF NOT (
    public.has_restaurant_access(p_restaurant_id)
    OR public.has_role(auth.uid(), 'admin'::app_role)
  ) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  SELECT COALESCE(NULLIF(timezone, ''), 'America/Sao_Paulo') INTO v_tz
  FROM public.restaurants WHERE id = p_restaurant_id;
  IF v_tz IS NULL THEN v_tz := 'America/Sao_Paulo'; END IF;

  -- Aggregate current period
  WITH cur AS (
    SELECT * FROM public.orders
    WHERE restaurant_id = p_restaurant_id
      AND created_at >= p_from AND created_at < p_to
  ),
  cur_valid AS (SELECT * FROM cur WHERE status NOT IN ('cancelled','pending'))
  SELECT jsonb_build_object(
    'revenue', COALESCE((SELECT SUM(total) FROM cur_valid), 0),
    'orders_count', (SELECT COUNT(*) FROM cur_valid),
    'avg_ticket', CASE WHEN (SELECT COUNT(*) FROM cur_valid) > 0
                       THEN COALESCE((SELECT SUM(total) FROM cur_valid),0) / (SELECT COUNT(*) FROM cur_valid)
                       ELSE 0 END,
    'total_orders', (SELECT COUNT(*) FROM cur),
    'cancelled_count', (SELECT COUNT(*) FROM cur WHERE status = 'cancelled'),
    'cancellation_rate', CASE WHEN (SELECT COUNT(*) FROM cur) > 0
                              THEN (SELECT COUNT(*) FROM cur WHERE status='cancelled')::numeric / (SELECT COUNT(*) FROM cur)
                              ELSE 0 END
  ) INTO v_current;

  -- Aggregate previous period (only totals, no series)
  WITH prv AS (
    SELECT * FROM public.orders
    WHERE restaurant_id = p_restaurant_id
      AND created_at >= p_prev_from AND created_at < p_prev_to
  ),
  prv_valid AS (SELECT * FROM prv WHERE status NOT IN ('cancelled','pending'))
  SELECT jsonb_build_object(
    'revenue', COALESCE((SELECT SUM(total) FROM prv_valid), 0),
    'orders_count', (SELECT COUNT(*) FROM prv_valid),
    'avg_ticket', CASE WHEN (SELECT COUNT(*) FROM prv_valid) > 0
                       THEN COALESCE((SELECT SUM(total) FROM prv_valid),0) / (SELECT COUNT(*) FROM prv_valid)
                       ELSE 0 END,
    'total_orders', (SELECT COUNT(*) FROM prv),
    'cancelled_count', (SELECT COUNT(*) FROM prv WHERE status='cancelled'),
    'cancellation_rate', CASE WHEN (SELECT COUNT(*) FROM prv) > 0
                              THEN (SELECT COUNT(*) FROM prv WHERE status='cancelled')::numeric / (SELECT COUNT(*) FROM prv)
                              ELSE 0 END
  ) INTO v_previous;

  -- Daily series (bucketed by restaurant tz)
  SELECT COALESCE(jsonb_agg(row_to_json(s) ORDER BY (row_to_json(s)->>'day')), '[]'::jsonb) INTO v_daily
  FROM (
    SELECT
      to_char((created_at AT TIME ZONE v_tz)::date, 'YYYY-MM-DD') AS day,
      COUNT(*) FILTER (WHERE status NOT IN ('cancelled','pending')) AS orders,
      COALESCE(SUM(total) FILTER (WHERE status NOT IN ('cancelled','pending')), 0) AS revenue
    FROM public.orders
    WHERE restaurant_id = p_restaurant_id
      AND created_at >= p_from AND created_at < p_to
    GROUP BY 1
  ) s;

  -- By channel (type)
  SELECT COALESCE(jsonb_agg(jsonb_build_object('name', type, 'value', c, 'revenue', r)), '[]'::jsonb) INTO v_by_channel
  FROM (
    SELECT type, COUNT(*) AS c, COALESCE(SUM(total),0) AS r
    FROM public.orders
    WHERE restaurant_id = p_restaurant_id
      AND created_at >= p_from AND created_at < p_to
      AND status NOT IN ('cancelled','pending')
    GROUP BY type
  ) t;

  -- By payment
  SELECT COALESCE(jsonb_agg(jsonb_build_object('name', payment, 'value', c, 'revenue', r)), '[]'::jsonb) INTO v_by_payment
  FROM (
    SELECT payment, COUNT(*) AS c, COALESCE(SUM(total),0) AS r
    FROM public.orders
    WHERE restaurant_id = p_restaurant_id
      AND created_at >= p_from AND created_at < p_to
      AND status NOT IN ('cancelled','pending')
    GROUP BY payment
  ) p;

  v_result := jsonb_build_object(
    'timezone', v_tz,
    'from', p_from,
    'to', p_to,
    'prev_from', p_prev_from,
    'prev_to', p_prev_to,
    'current', v_current,
    'previous', v_previous,
    'daily', v_daily,
    'by_channel', v_by_channel,
    'by_payment', v_by_payment,
    'generated_at', now()
  );
  RETURN v_result;
END $$;

REVOKE ALL ON FUNCTION public.get_dashboard_summary(uuid, timestamptz, timestamptz, timestamptz, timestamptz) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_dashboard_summary(uuid, timestamptz, timestamptz, timestamptz, timestamptz) TO authenticated, service_role;

CREATE INDEX IF NOT EXISTS idx_orders_restaurant_created_status ON public.orders (restaurant_id, created_at DESC, status);

NOTIFY pgrst, 'reload schema';
