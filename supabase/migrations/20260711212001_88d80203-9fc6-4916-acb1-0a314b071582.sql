
-- Wave 5 Reports — final corrections
-- Reconcile status canonically, split completed vs open revenue,
-- server-side timezone only, explicit pg_catalog in search_path.

-- Helper: server-owned tz (ignores caller-provided p_tz)
CREATE OR REPLACE FUNCTION private.report_resolve_range(
  p_restaurant_id uuid, p_from date, p_to date, p_tz text
) RETURNS TABLE(tz text, ts_from timestamptz, ts_to timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = pg_catalog, private, public, pg_temp
AS $$
DECLARE v_tz text;
BEGIN
  -- p_tz is intentionally IGNORED. Timezone is derived from the restaurant.
  IF p_from IS NULL OR p_to IS NULL OR p_from > p_to THEN
    RAISE EXCEPTION 'invalid_date_range' USING ERRCODE = '22023';
  END IF;
  IF (p_to - p_from) > 400 THEN
    RAISE EXCEPTION 'date_range_too_large' USING ERRCODE = '22023';
  END IF;
  SELECT COALESCE(NULLIF(btrim(r.timezone),''), 'America/Sao_Paulo')
    INTO v_tz FROM public.restaurants r WHERE r.id = p_restaurant_id;
  IF v_tz IS NULL THEN
    RAISE EXCEPTION 'restaurant_not_found' USING ERRCODE = '22023';
  END IF;
  BEGIN PERFORM now() AT TIME ZONE v_tz;
  EXCEPTION WHEN OTHERS THEN v_tz := 'America/Sao_Paulo'; END;
  tz := v_tz;
  ts_from := (p_from::timestamp) AT TIME ZONE v_tz;
  ts_to   := ((p_to + 1)::timestamp) AT TIME ZONE v_tz;
  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION private.report_resolve_range(uuid,date,date,text) FROM PUBLIC;

-- OVERVIEW
CREATE OR REPLACE FUNCTION public.report_overview(
  p_restaurant_id uuid, p_from date, p_to date, p_tz text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = pg_catalog, public, private, pg_temp
AS $$
DECLARE
  v_tz text; v_from timestamptz; v_to timestamptz;
  v_prev_from timestamptz; v_prev_to timestamptz;
  v_days int;
  v_current jsonb; v_previous jsonb; v_series jsonb; v_granularity text;
BEGIN
  PERFORM private.authorize_tenant_report(p_restaurant_id);
  SELECT tz, ts_from, ts_to INTO v_tz, v_from, v_to
    FROM private.report_resolve_range(p_restaurant_id, p_from, p_to, NULL);
  v_days := (p_to - p_from) + 1;
  v_prev_to := v_from;
  v_prev_from := v_from - (v_to - v_from);

  -- Canonical status buckets:
  --   completed: delivered
  --   open:      confirmed, preparing, ready, out_for_delivery
  --   cancelled: cancelled
  --   pending:   pending
  WITH o AS (
    SELECT status, total::numeric, discount::numeric, delivery_fee::numeric, customer_id, created_at
    FROM public.orders
    WHERE restaurant_id = p_restaurant_id AND created_at >= v_from AND created_at < v_to
  ), agg AS (
    SELECT
      COALESCE(SUM(total) FILTER (WHERE status = 'delivered'),0) AS completed_revenue,
      COUNT(*)          FILTER (WHERE status = 'delivered') AS completed_orders,
      COALESCE(SUM(total) FILTER (WHERE status IN ('confirmed','preparing','ready','out_for_delivery')),0) AS open_amount,
      COUNT(*)          FILTER (WHERE status IN ('confirmed','preparing','ready','out_for_delivery')) AS open_orders,
      COUNT(*)          FILTER (WHERE status = 'cancelled') AS cancelled_orders,
      COUNT(*)          FILTER (WHERE status = 'pending')   AS pending_orders,
      COUNT(*)          FILTER (WHERE status NOT IN ('cancelled','pending')) AS valid_orders,
      COALESCE(SUM(discount)     FILTER (WHERE status = 'delivered'),0) AS total_discount,
      COALESCE(SUM(delivery_fee) FILTER (WHERE status = 'delivered'),0) AS total_delivery,
      COUNT(DISTINCT customer_id) FILTER (WHERE status = 'delivered' AND customer_id IS NOT NULL) AS unique_customers
    FROM o
  ), new_c AS (
    SELECT COUNT(*) AS c FROM public.customers
    WHERE restaurant_id = p_restaurant_id
      AND first_order_at IS NOT NULL
      AND first_order_at >= v_from AND first_order_at < v_to
  ), items AS (
    SELECT COALESCE(SUM(oi.quantity),0) AS units_sold
    FROM public.order_items oi
    JOIN public.orders ord ON ord.id = oi.order_id
    WHERE ord.restaurant_id = p_restaurant_id
      AND ord.created_at >= v_from AND ord.created_at < v_to
      AND ord.status = 'delivered'
  )
  SELECT jsonb_build_object(
    'completed_revenue', agg.completed_revenue,
    'completed_orders', agg.completed_orders,
    'open_amount', agg.open_amount,
    'open_orders', agg.open_orders,
    'valid_orders', agg.valid_orders,
    'cancelled_orders', agg.cancelled_orders,
    'pending_orders', agg.pending_orders,
    'avg_ticket_completed', CASE WHEN agg.completed_orders > 0
                                 THEN agg.completed_revenue / agg.completed_orders ELSE 0 END,
    'total_discount', agg.total_discount,
    'total_delivery_fee', agg.total_delivery,
    'unique_customers', agg.unique_customers,
    'new_customers', new_c.c,
    'units_sold', items.units_sold
  ) INTO v_current FROM agg, new_c, items;

  WITH o AS (
    SELECT status, total::numeric
    FROM public.orders
    WHERE restaurant_id = p_restaurant_id AND created_at >= v_prev_from AND created_at < v_prev_to
  )
  SELECT jsonb_build_object(
    'completed_revenue', COALESCE(SUM(total) FILTER (WHERE status = 'delivered'),0),
    'completed_orders', COUNT(*) FILTER (WHERE status = 'delivered'),
    'cancelled_orders', COUNT(*) FILTER (WHERE status = 'cancelled')
  ) INTO v_previous FROM o;

  v_granularity := CASE
    WHEN v_days <= 2 THEN 'hour'
    WHEN v_days <= 120 THEN 'day'
    ELSE 'month' END;

  IF v_granularity = 'hour' THEN
    SELECT COALESCE(jsonb_agg(row_to_json(t) ORDER BY bucket), '[]'::jsonb) INTO v_series
    FROM (
      SELECT to_char(date_trunc('hour', created_at AT TIME ZONE v_tz), 'YYYY-MM-DD"T"HH24:00') AS bucket,
             SUM(total)::numeric AS revenue,
             COUNT(*)::int AS orders
      FROM public.orders
      WHERE restaurant_id = p_restaurant_id AND created_at >= v_from AND created_at < v_to
        AND status = 'delivered'
      GROUP BY 1
    ) t;
  ELSIF v_granularity = 'day' THEN
    SELECT COALESCE(jsonb_agg(row_to_json(t) ORDER BY bucket), '[]'::jsonb) INTO v_series
    FROM (
      SELECT to_char(date_trunc('day', created_at AT TIME ZONE v_tz), 'YYYY-MM-DD') AS bucket,
             SUM(total)::numeric AS revenue,
             COUNT(*)::int AS orders
      FROM public.orders
      WHERE restaurant_id = p_restaurant_id AND created_at >= v_from AND created_at < v_to
        AND status = 'delivered'
      GROUP BY 1
    ) t;
  ELSE
    SELECT COALESCE(jsonb_agg(row_to_json(t) ORDER BY bucket), '[]'::jsonb) INTO v_series
    FROM (
      SELECT to_char(date_trunc('month', created_at AT TIME ZONE v_tz), 'YYYY-MM') AS bucket,
             SUM(total)::numeric AS revenue,
             COUNT(*)::int AS orders
      FROM public.orders
      WHERE restaurant_id = p_restaurant_id AND created_at >= v_from AND created_at < v_to
        AND status = 'delivered'
      GROUP BY 1
    ) t;
  END IF;

  RETURN jsonb_build_object(
    'tz', v_tz, 'from', p_from, 'to', p_to,
    'granularity', v_granularity,
    'current', v_current,
    'previous', v_previous,
    'series', v_series
  );
END;
$$;

REVOKE ALL ON FUNCTION public.report_overview(uuid,date,date,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.report_overview(uuid,date,date,text) TO authenticated, service_role;

-- ORDERS BREAKDOWN
CREATE OR REPLACE FUNCTION public.report_orders_breakdown(
  p_restaurant_id uuid, p_from date, p_to date, p_tz text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = pg_catalog, public, private, pg_temp
AS $$
DECLARE
  v_tz text; v_from timestamptz; v_to timestamptz;
  v_by_status jsonb; v_by_type jsonb; v_by_payment_method jsonb;
  v_by_payment_status jsonb; v_by_hour jsonb; v_by_dow jsonb;
BEGIN
  PERFORM private.authorize_tenant_report(p_restaurant_id);
  SELECT tz, ts_from, ts_to INTO v_tz, v_from, v_to
    FROM private.report_resolve_range(p_restaurant_id, p_from, p_to, NULL);

  SELECT COALESCE(jsonb_object_agg(status::text, cnt),'{}'::jsonb) INTO v_by_status
  FROM (SELECT status, COUNT(*) cnt FROM public.orders
        WHERE restaurant_id=p_restaurant_id AND created_at>=v_from AND created_at<v_to
        GROUP BY status) s;

  -- Revenue is COMPLETED (delivered) only.
  SELECT COALESCE(jsonb_object_agg(type::text, jsonb_build_object('count',cnt,'revenue',rev)),'{}'::jsonb) INTO v_by_type
  FROM (SELECT type, COUNT(*) cnt, COALESCE(SUM(total) FILTER (WHERE status = 'delivered'),0) rev
        FROM public.orders
        WHERE restaurant_id=p_restaurant_id AND created_at>=v_from AND created_at<v_to
        GROUP BY type) s;

  -- Chosen payment method — NOT confirmed payment. Revenue counted only on completed orders.
  SELECT COALESCE(jsonb_object_agg(payment::text, jsonb_build_object('count',cnt,'revenue',rev)),'{}'::jsonb) INTO v_by_payment_method
  FROM (SELECT payment, COUNT(*) cnt, COALESCE(SUM(total) FILTER (WHERE status = 'delivered'),0) rev
        FROM public.orders
        WHERE restaurant_id=p_restaurant_id AND created_at>=v_from AND created_at<v_to
        GROUP BY payment) s;

  -- Real financial status from payment_status column: paid = confirmed payment.
  SELECT COALESCE(jsonb_object_agg(payment_status::text, cnt),'{}'::jsonb) INTO v_by_payment_status
  FROM (SELECT payment_status, COUNT(*) cnt FROM public.orders
        WHERE restaurant_id=p_restaurant_id AND created_at>=v_from AND created_at<v_to
        GROUP BY payment_status) s;

  SELECT COALESCE(jsonb_agg(jsonb_build_object('hour',h,'orders',cnt) ORDER BY h),'[]'::jsonb) INTO v_by_hour
  FROM (SELECT EXTRACT(HOUR FROM created_at AT TIME ZONE v_tz)::int h, COUNT(*) cnt
        FROM public.orders
        WHERE restaurant_id=p_restaurant_id AND created_at>=v_from AND created_at<v_to
          AND status NOT IN ('cancelled','pending')
        GROUP BY 1) s;

  SELECT COALESCE(jsonb_agg(jsonb_build_object('dow',dow,'orders',cnt) ORDER BY dow),'[]'::jsonb) INTO v_by_dow
  FROM (SELECT EXTRACT(ISODOW FROM created_at AT TIME ZONE v_tz)::int dow, COUNT(*) cnt
        FROM public.orders
        WHERE restaurant_id=p_restaurant_id AND created_at>=v_from AND created_at<v_to
          AND status NOT IN ('cancelled','pending')
        GROUP BY 1) s;

  RETURN jsonb_build_object(
    'tz', v_tz, 'from', p_from, 'to', p_to,
    'by_status', v_by_status,
    'by_type', v_by_type,
    'by_payment_method', v_by_payment_method,
    'by_payment_status', v_by_payment_status,
    'by_hour', v_by_hour,
    'by_dow', v_by_dow
  );
END;
$$;

REVOKE ALL ON FUNCTION public.report_orders_breakdown(uuid,date,date,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.report_orders_breakdown(uuid,date,date,text) TO authenticated, service_role;

-- PRODUCTS (revenue only from delivered)
CREATE OR REPLACE FUNCTION public.report_products(
  p_restaurant_id uuid, p_from date, p_to date, p_tz text DEFAULT NULL, p_limit int DEFAULT 50
) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = pg_catalog, public, private, pg_temp
AS $$
DECLARE
  v_tz text; v_from timestamptz; v_to timestamptz;
  v_top jsonb; v_categories jsonb; v_unsold jsonb; v_total_rev numeric;
BEGIN
  PERFORM private.authorize_tenant_report(p_restaurant_id);
  SELECT tz, ts_from, ts_to INTO v_tz, v_from, v_to
    FROM private.report_resolve_range(p_restaurant_id, p_from, p_to, NULL);
  p_limit := GREATEST(1, LEAST(COALESCE(p_limit,50), 200));

  WITH oi AS (
    SELECT oi.product_id, COALESCE(oi.product_name,'—') AS name,
           SUM(oi.quantity)::numeric AS qty,
           SUM(oi.subtotal)::numeric AS revenue
    FROM public.order_items oi
    JOIN public.orders ord ON ord.id = oi.order_id
    WHERE ord.restaurant_id = p_restaurant_id
      AND ord.created_at >= v_from AND ord.created_at < v_to
      AND ord.status = 'delivered'
    GROUP BY oi.product_id, COALESCE(oi.product_name,'—')
  ), ranked AS (
    SELECT oi.product_id, oi.name, oi.qty, oi.revenue,
           p.archived_at IS NOT NULL AS archived,
           c.name AS category_name
    FROM oi LEFT JOIN public.products p ON p.id = oi.product_id
            LEFT JOIN public.categories c ON c.id = p.category_id
  )
  SELECT COALESCE(jsonb_agg(row_to_json(r) ORDER BY r.revenue DESC), '[]'::jsonb),
         COALESCE(SUM(r.revenue),0)
  INTO v_top, v_total_rev
  FROM (SELECT * FROM ranked ORDER BY revenue DESC LIMIT p_limit) r;

  SELECT COALESCE(jsonb_agg(row_to_json(c) ORDER BY c.revenue DESC), '[]'::jsonb) INTO v_categories
  FROM (
    SELECT COALESCE(cat.name, 'Sem categoria') AS name,
           SUM(oi.quantity)::numeric AS qty,
           SUM(oi.subtotal)::numeric AS revenue
    FROM public.order_items oi
    JOIN public.orders ord ON ord.id = oi.order_id
    LEFT JOIN public.products p ON p.id = oi.product_id
    LEFT JOIN public.categories cat ON cat.id = p.category_id
    WHERE ord.restaurant_id = p_restaurant_id
      AND ord.created_at >= v_from AND ord.created_at < v_to
      AND ord.status = 'delivered'
    GROUP BY COALESCE(cat.name, 'Sem categoria')
  ) c;

  SELECT COALESCE(jsonb_agg(jsonb_build_object('product_id',p.id,'name',p.name) ORDER BY p.name), '[]'::jsonb)
    INTO v_unsold
  FROM public.products p
  WHERE p.restaurant_id = p_restaurant_id
    AND p.archived_at IS NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.order_items oi
      JOIN public.orders ord ON ord.id = oi.order_id
      WHERE oi.product_id = p.id
        AND ord.restaurant_id = p_restaurant_id
        AND ord.created_at >= v_from AND ord.created_at < v_to
        AND ord.status = 'delivered'
    );

  RETURN jsonb_build_object(
    'tz', v_tz, 'from', p_from, 'to', p_to,
    'top_products', v_top,
    'categories', v_categories,
    'unsold_products', v_unsold,
    'total_revenue', v_total_rev
  );
END;
$$;

REVOKE ALL ON FUNCTION public.report_products(uuid,date,date,text,int) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.report_products(uuid,date,date,text,int) TO authenticated, service_role;

-- CUSTOMERS (spend and unique/recurring count only completed)
CREATE OR REPLACE FUNCTION public.report_customers(
  p_restaurant_id uuid, p_from date, p_to date, p_tz text DEFAULT NULL, p_limit int DEFAULT 50
) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = pg_catalog, public, private, pg_temp
AS $$
DECLARE
  v_tz text; v_from timestamptz; v_to timestamptz;
  v_summary jsonb; v_top jsonb;
BEGIN
  PERFORM private.authorize_tenant_report(p_restaurant_id);
  SELECT tz, ts_from, ts_to INTO v_tz, v_from, v_to
    FROM private.report_resolve_range(p_restaurant_id, p_from, p_to, NULL);
  p_limit := GREATEST(1, LEAST(COALESCE(p_limit,50), 200));

  WITH oc AS (
    SELECT customer_id, COUNT(*) cnt, SUM(total)::numeric spent
    FROM public.orders
    WHERE restaurant_id=p_restaurant_id AND created_at>=v_from AND created_at<v_to
      AND status = 'delivered' AND customer_id IS NOT NULL
    GROUP BY customer_id
  )
  SELECT jsonb_build_object(
    'unique_customers', COALESCE(COUNT(*),0),
    'recurring_customers', COALESCE(COUNT(*) FILTER (WHERE cnt > 1),0),
    'new_customers', (
      SELECT COUNT(*) FROM public.customers
      WHERE restaurant_id = p_restaurant_id
        AND first_order_at IS NOT NULL
        AND first_order_at >= v_from AND first_order_at < v_to
    ),
    'total_spent', COALESCE(SUM(spent),0),
    'avg_per_customer', CASE WHEN COUNT(*)>0 THEN COALESCE(SUM(spent),0)/COUNT(*) ELSE 0 END
  ) INTO v_summary FROM oc;

  SELECT COALESCE(jsonb_agg(row_to_json(t) ORDER BY t.spent DESC),'[]'::jsonb) INTO v_top
  FROM (
    SELECT c.id AS customer_id,
           COALESCE(c.name,'Sem nome') AS name,
           CASE WHEN c.phone IS NULL OR length(c.phone)<4 THEN NULL
                ELSE regexp_replace(c.phone, '^(.*)([0-9]{4})$', '••••\2') END AS phone_masked,
           oc.cnt AS orders,
           oc.spent,
           c.last_order_at
    FROM oc JOIN public.customers c ON c.id = oc.customer_id
    ORDER BY oc.spent DESC
    LIMIT p_limit
  ) t;

  RETURN jsonb_build_object(
    'tz', v_tz, 'from', p_from, 'to', p_to,
    'summary', v_summary,
    'top', v_top
  );
END;
$$;

REVOKE ALL ON FUNCTION public.report_customers(uuid,date,date,text,int) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.report_customers(uuid,date,date,text,int) TO authenticated, service_role;

-- CASH — unchanged logic, just pg_catalog in path and p_tz ignored via resolver
CREATE OR REPLACE FUNCTION public.report_cash(
  p_restaurant_id uuid, p_from date, p_to date, p_tz text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = pg_catalog, public, private, pg_temp
AS $$
DECLARE
  v_tz text; v_from timestamptz; v_to timestamptz;
  v_movements jsonb; v_sessions jsonb;
BEGIN
  PERFORM private.authorize_tenant_report(p_restaurant_id);
  SELECT tz, ts_from, ts_to INTO v_tz, v_from, v_to
    FROM private.report_resolve_range(p_restaurant_id, p_from, p_to, NULL);

  SELECT COALESCE(jsonb_object_agg(type::text, jsonb_build_object('count',cnt,'total',tot)),'{}'::jsonb) INTO v_movements
  FROM (SELECT type, COUNT(*) cnt, COALESCE(SUM(amount),0) tot
        FROM public.cash_movements
        WHERE restaurant_id=p_restaurant_id AND created_at>=v_from AND created_at<v_to
        GROUP BY type) s;

  SELECT COALESCE(jsonb_agg(row_to_json(t) ORDER BY t.opened_at DESC),'[]'::jsonb) INTO v_sessions
  FROM (
    SELECT id, opened_at, closed_at, status::text,
           opening_amount, closing_amount, expected_amount, difference,
           opened_by, closed_by, origin
    FROM public.cash_sessions
    WHERE restaurant_id=p_restaurant_id
      AND opened_at < v_to
      AND (closed_at IS NULL OR closed_at >= v_from)
    ORDER BY opened_at DESC
    LIMIT 200
  ) t;

  RETURN jsonb_build_object(
    'tz', v_tz, 'from', p_from, 'to', p_to,
    'movements', v_movements,
    'sessions', v_sessions
  );
END;
$$;

REVOKE ALL ON FUNCTION public.report_cash(uuid,date,date,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.report_cash(uuid,date,date,text) TO authenticated, service_role;

-- STOCK — search_path standardization
CREATE OR REPLACE FUNCTION public.report_stock(
  p_restaurant_id uuid, p_from date, p_to date, p_tz text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = pg_catalog, public, private, pg_temp
AS $$
DECLARE
  v_tz text; v_from timestamptz; v_to timestamptz;
  v_movements jsonb; v_below jsonb; v_valuation numeric; v_top jsonb;
BEGIN
  PERFORM private.authorize_tenant_report(p_restaurant_id);
  SELECT tz, ts_from, ts_to INTO v_tz, v_from, v_to
    FROM private.report_resolve_range(p_restaurant_id, p_from, p_to, NULL);

  SELECT COALESCE(jsonb_object_agg(movement_type::text, jsonb_build_object('count',cnt,'qty',qty,'cost',cost)),'{}'::jsonb) INTO v_movements
  FROM (SELECT movement_type, COUNT(*) cnt, COALESCE(SUM(quantity),0) qty, COALESCE(SUM(total_cost),0) cost
        FROM public.stock_movements
        WHERE restaurant_id=p_restaurant_id AND created_at>=v_from AND created_at<v_to
        GROUP BY movement_type) s;

  SELECT COALESCE(jsonb_agg(row_to_json(t) ORDER BY t.name),'[]'::jsonb) INTO v_below
  FROM (SELECT id, name, current_qty, min_qty, avg_cost
        FROM public.stock_ingredients
        WHERE restaurant_id=p_restaurant_id AND is_active=true
          AND min_qty > 0 AND current_qty < min_qty
        LIMIT 200) t;

  SELECT COALESCE(SUM(current_qty * avg_cost),0) INTO v_valuation
  FROM public.stock_ingredients
  WHERE restaurant_id=p_restaurant_id AND is_active=true;

  SELECT COALESCE(jsonb_agg(row_to_json(t) ORDER BY t.qty DESC),'[]'::jsonb) INTO v_top
  FROM (
    SELECT si.name,
           COALESCE(SUM(sm.quantity) FILTER (WHERE sm.movement_type IN ('exit','sale','loss')),0)::numeric AS qty
    FROM public.stock_movements sm
    JOIN public.stock_ingredients si ON si.id = sm.ingredient_id
    WHERE sm.restaurant_id=p_restaurant_id AND sm.created_at>=v_from AND sm.created_at<v_to
    GROUP BY si.name
    ORDER BY qty DESC
    LIMIT 30
  ) t;

  RETURN jsonb_build_object(
    'tz', v_tz, 'from', p_from, 'to', p_to,
    'movements', v_movements,
    'below_min', v_below,
    'valuation', v_valuation,
    'top_consumed', v_top
  );
END;
$$;

REVOKE ALL ON FUNCTION public.report_stock(uuid,date,date,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.report_stock(uuid,date,date,text) TO authenticated, service_role;

-- Also lock the private authorize helper's search_path with pg_catalog
CREATE OR REPLACE FUNCTION private.authorize_tenant_report(p_restaurant_id uuid)
RETURNS TABLE(actor_id uuid, is_native boolean, support_session_id uuid, support_level text)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = pg_catalog, private, public, pg_temp
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_level text;
  v_session uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'forbidden: not_authenticated' USING ERRCODE = '42501';
  END IF;
  IF p_restaurant_id IS NULL THEN
    RAISE EXCEPTION 'restaurant_not_found' USING ERRCODE = '22023';
  END IF;

  IF private.has_tenant_native_read_access(v_uid, p_restaurant_id) THEN
    actor_id := v_uid; is_native := true;
    support_session_id := NULL; support_level := NULL;
    RETURN NEXT; RETURN;
  END IF;

  v_level := private.active_support_level(v_uid, p_restaurant_id);
  IF v_level IS NULL THEN
    RAISE EXCEPTION 'report_access_forbidden' USING ERRCODE = '42501';
  END IF;
  v_session := private.current_support_session_id(p_restaurant_id);
  actor_id := v_uid; is_native := false;
  support_session_id := v_session; support_level := v_level;
  RETURN NEXT; RETURN;
END;
$$;

REVOKE ALL ON FUNCTION private.authorize_tenant_report(uuid) FROM PUBLIC;
