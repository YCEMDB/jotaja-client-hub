
-- ============================================================
-- SPRINT 7 — FASE D: Delivery Reports & Metrics
-- ============================================================

-- Financial summary: totals + per-driver breakdown for a period
CREATE OR REPLACE FUNCTION public.get_delivery_financial_summary(
  p_restaurant_id uuid,
  p_from timestamptz,
  p_to   timestamptz,
  p_driver_id uuid DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_result jsonb; v_totals jsonb; v_drivers jsonb;
BEGIN
  IF NOT public.is_team_owner(auth.uid(), p_restaurant_id) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = 'insufficient_privilege';
  END IF;

  WITH base AS (
    SELECT o.*
    FROM public.orders o
    WHERE o.restaurant_id = p_restaurant_id
      AND o.type = 'delivery'
      AND (p_driver_id IS NULL OR o.driver_id = p_driver_id)
      AND (
        (o.status = 'delivered'  AND o.driver_delivered_at >= p_from AND o.driver_delivered_at < p_to) OR
        (o.status = 'cancelled'  AND o.updated_at         >= p_from AND o.updated_at         < p_to)
      )
  )
  SELECT jsonb_build_object(
    'delivered_count',   COUNT(*) FILTER (WHERE status = 'delivered'),
    'cancelled_count',   COUNT(*) FILTER (WHERE status = 'cancelled'),
    'gross_total',       COALESCE(SUM(total)         FILTER (WHERE status = 'delivered'), 0),
    'delivery_fees',     COALESCE(SUM(delivery_fee)  FILTER (WHERE status = 'delivered'), 0),
    'commissions_total', COALESCE(SUM(driver_commission_amount) FILTER (WHERE status = 'delivered'), 0),
    'avg_ticket',        COALESCE(AVG(total) FILTER (WHERE status = 'delivered'), 0)
  ) INTO v_totals FROM base;

  SELECT COALESCE(jsonb_agg(row_to_json(x)), '[]'::jsonb) INTO v_drivers
  FROM (
    SELECT
      d.id AS driver_id,
      d.name AS driver_name,
      COUNT(*) FILTER (WHERE o.status = 'delivered')                            AS delivered_count,
      COUNT(*) FILTER (WHERE o.status = 'cancelled')                            AS cancelled_count,
      COALESCE(SUM(o.total) FILTER (WHERE o.status = 'delivered'), 0)           AS gross_total,
      COALESCE(SUM(o.delivery_fee) FILTER (WHERE o.status = 'delivered'), 0)    AS delivery_fees,
      COALESCE(SUM(o.driver_commission_amount) FILTER (WHERE o.status = 'delivered'), 0) AS commissions_total,
      COALESCE(AVG(EXTRACT(EPOCH FROM (o.driver_delivered_at - o.driver_picked_up_at))/60)
        FILTER (WHERE o.status='delivered' AND o.driver_delivered_at IS NOT NULL AND o.driver_picked_up_at IS NOT NULL), 0) AS avg_delivery_min
    FROM public.delivery_drivers d
    LEFT JOIN public.orders o
      ON o.driver_id = d.id
     AND o.restaurant_id = p_restaurant_id
     AND o.type = 'delivery'
     AND (
       (o.status='delivered' AND o.driver_delivered_at >= p_from AND o.driver_delivered_at < p_to) OR
       (o.status='cancelled' AND o.updated_at         >= p_from AND o.updated_at         < p_to)
     )
    WHERE d.restaurant_id = p_restaurant_id
      AND (p_driver_id IS NULL OR d.id = p_driver_id)
    GROUP BY d.id, d.name
    ORDER BY commissions_total DESC, delivered_count DESC
  ) x;

  v_result := jsonb_build_object(
    'from', p_from, 'to', p_to,
    'totals', v_totals,
    'drivers', v_drivers
  );
  RETURN v_result;
END $$;

-- Advanced metrics: SLA times + acceptance rates
CREATE OR REPLACE FUNCTION public.get_delivery_metrics(
  p_restaurant_id uuid,
  p_from timestamptz,
  p_to   timestamptz
) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_result jsonb;
BEGIN
  IF NOT public.is_team_owner(auth.uid(), p_restaurant_id) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = 'insufficient_privilege';
  END IF;

  WITH base AS (
    SELECT * FROM public.orders
    WHERE restaurant_id = p_restaurant_id
      AND type = 'delivery'
      AND created_at >= p_from AND created_at < p_to
  ),
  events AS (
    SELECT h.order_id, h.reason, h.created_at
    FROM public.order_status_history h
    WHERE h.restaurant_id = p_restaurant_id
      AND h.source = 'delivery'
      AND h.created_at >= p_from AND h.created_at < p_to
  )
  SELECT jsonb_build_object(
    'total_orders',      (SELECT COUNT(*) FROM base),
    'delivered_count',   (SELECT COUNT(*) FROM base WHERE status='delivered'),
    'cancelled_count',   (SELECT COUNT(*) FROM base WHERE status='cancelled'),
    'awaiting_now',      (SELECT COUNT(*) FROM public.orders WHERE restaurant_id=p_restaurant_id AND type='delivery' AND driver_id IS NULL AND status IN ('confirmed','preparing','ready')),
    'in_route_now',      (SELECT COUNT(*) FROM public.orders WHERE restaurant_id=p_restaurant_id AND status='out_for_delivery'),
    'delivered_today',   (SELECT COUNT(*) FROM public.orders WHERE restaurant_id=p_restaurant_id AND status='delivered' AND driver_delivered_at >= date_trunc('day', now())),
    'avg_accept_min',    (SELECT ROUND(AVG(EXTRACT(EPOCH FROM (driver_accepted_at - driver_assigned_at))/60)::numeric, 1)
                          FROM base WHERE driver_accepted_at IS NOT NULL AND driver_assigned_at IS NOT NULL),
    'avg_pickup_min',    (SELECT ROUND(AVG(EXTRACT(EPOCH FROM (driver_picked_up_at - driver_assigned_at))/60)::numeric, 1)
                          FROM base WHERE driver_picked_up_at IS NOT NULL AND driver_assigned_at IS NOT NULL),
    'avg_in_route_min',  (SELECT ROUND(AVG(EXTRACT(EPOCH FROM (driver_delivered_at - driver_picked_up_at))/60)::numeric, 1)
                          FROM base WHERE driver_delivered_at IS NOT NULL AND driver_picked_up_at IS NOT NULL),
    'avg_total_min',     (SELECT ROUND(AVG(EXTRACT(EPOCH FROM (driver_delivered_at - driver_assigned_at))/60)::numeric, 1)
                          FROM base WHERE driver_delivered_at IS NOT NULL AND driver_assigned_at IS NOT NULL),
    'accept_events',     (SELECT COUNT(*) FROM events WHERE reason='driver_accepted'),
    'reject_events',     (SELECT COUNT(*) FROM events WHERE reason='driver_rejected'),
    'acceptance_rate',   (
      SELECT CASE WHEN (a+r) > 0 THEN ROUND((a::numeric*100)/(a+r), 1) ELSE NULL END
      FROM (SELECT
              (SELECT COUNT(*) FROM events WHERE reason='driver_accepted') AS a,
              (SELECT COUNT(*) FROM events WHERE reason='driver_rejected') AS r) s
    ),
    'per_driver', COALESCE((
      SELECT jsonb_agg(row_to_json(x)) FROM (
        SELECT d.id AS driver_id, d.name AS driver_name,
               COUNT(*) FILTER (WHERE o.status='delivered') AS delivered_count,
               COUNT(*) FILTER (WHERE o.status='cancelled') AS cancelled_count,
               ROUND(AVG(EXTRACT(EPOCH FROM (o.driver_delivered_at - o.driver_assigned_at))/60)
                 FILTER (WHERE o.driver_delivered_at IS NOT NULL AND o.driver_assigned_at IS NOT NULL)::numeric, 1) AS avg_total_min
        FROM public.delivery_drivers d
        LEFT JOIN base o ON o.driver_id = d.id
        WHERE d.restaurant_id = p_restaurant_id AND d.is_active = true
        GROUP BY d.id, d.name
        ORDER BY delivered_count DESC NULLS LAST
      ) x
    ), '[]'::jsonb)
  ) INTO v_result;
  RETURN v_result;
END $$;

-- Map: last known location per active driver
CREATE OR REPLACE FUNCTION public.get_driver_last_locations(p_restaurant_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_result jsonb;
BEGIN
  IF NOT public.is_team_owner(auth.uid(), p_restaurant_id) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = 'insufficient_privilege';
  END IF;

  SELECT COALESCE(jsonb_agg(row_to_json(x) ORDER BY x.name), '[]'::jsonb) INTO v_result
  FROM (
    SELECT d.id, d.name, d.status, d.vehicle,
           d.current_latitude AS latitude,
           d.current_longitude AS longitude,
           d.last_location_at,
           (SELECT COUNT(*) FROM public.orders o
             WHERE o.driver_id = d.id AND o.status = 'out_for_delivery') AS active_orders
    FROM public.delivery_drivers d
    WHERE d.restaurant_id = p_restaurant_id AND d.is_active = true
  ) x;

  RETURN v_result;
END $$;

REVOKE ALL ON FUNCTION public.get_delivery_financial_summary(uuid,timestamptz,timestamptz,uuid) FROM public;
REVOKE ALL ON FUNCTION public.get_delivery_metrics(uuid,timestamptz,timestamptz) FROM public;
REVOKE ALL ON FUNCTION public.get_driver_last_locations(uuid) FROM public;

GRANT EXECUTE ON FUNCTION public.get_delivery_financial_summary(uuid,timestamptz,timestamptz,uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_delivery_metrics(uuid,timestamptz,timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_driver_last_locations(uuid) TO authenticated;
