
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS is_test_order boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.orders.is_test_order IS
  'Pedido criado no fluxo de tutorial. Não entra em faturamento, ticket médio, relatórios financeiros, comissões, comunicações automáticas ou limites de plano. Percorre o fluxo operacional apenas para fins didáticos.';

CREATE INDEX IF NOT EXISTS idx_orders_restaurant_not_test
  ON public.orders (restaurant_id, created_at)
  WHERE is_test_order = false;

DROP TRIGGER IF EXISTS orders_auto_open_cash ON public.orders;
CREATE TRIGGER orders_auto_open_cash
  AFTER INSERT OR UPDATE OF status ON public.orders
  FOR EACH ROW
  WHEN (NEW.is_test_order IS NOT TRUE)
  EXECUTE FUNCTION public.auto_open_cash_session_on_order();

DROP TRIGGER IF EXISTS orders_auto_stock_debit ON public.orders;
CREATE TRIGGER orders_auto_stock_debit
  AFTER INSERT OR UPDATE OF status ON public.orders
  FOR EACH ROW
  WHEN (NEW.is_test_order IS NOT TRUE)
  EXECUTE FUNCTION public.orders_auto_stock_debit();

DROP TRIGGER IF EXISTS orders_register_cash_sale ON public.orders;
CREATE TRIGGER orders_register_cash_sale
  AFTER INSERT OR UPDATE OF status ON public.orders
  FOR EACH ROW
  WHEN (NEW.is_test_order IS NOT TRUE)
  EXECUTE FUNCTION public.register_cash_sale_on_order();

DROP TRIGGER IF EXISTS orders_sync_customer_stats ON public.orders;
DROP TRIGGER IF EXISTS orders_sync_customer_stats_iu ON public.orders;
DROP TRIGGER IF EXISTS orders_sync_customer_stats_d ON public.orders;
CREATE TRIGGER orders_sync_customer_stats_iu
  AFTER INSERT OR UPDATE OF status, total, customer_id ON public.orders
  FOR EACH ROW
  WHEN (NEW.is_test_order IS NOT TRUE)
  EXECUTE FUNCTION public.sync_customer_stats();
CREATE TRIGGER orders_sync_customer_stats_d
  AFTER DELETE ON public.orders
  FOR EACH ROW
  WHEN (OLD.is_test_order IS NOT TRUE)
  EXECUTE FUNCTION public.sync_customer_stats();

DROP TRIGGER IF EXISTS orders_table_link_event ON public.orders;
CREATE TRIGGER orders_table_link_event
  AFTER INSERT OR UPDATE OF table_session_id ON public.orders
  FOR EACH ROW
  WHEN (NEW.is_test_order IS NOT TRUE)
  EXECUTE FUNCTION public.trg_order_table_link_event();

DROP TRIGGER IF EXISTS trg_comm_on_payment_status ON public.orders;
CREATE TRIGGER trg_comm_on_payment_status
  AFTER UPDATE OF payment_status ON public.orders
  FOR EACH ROW
  WHEN (NEW.is_test_order IS NOT TRUE)
  EXECUTE FUNCTION public.trg_comm_on_payment_status();

DROP TRIGGER IF EXISTS trg_enforce_plan_order_limit ON public.orders;
CREATE TRIGGER trg_enforce_plan_order_limit
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  WHEN (NEW.is_test_order IS NOT TRUE)
  EXECUTE FUNCTION public.enforce_plan_order_limit();

-- ============ REPORTS ============
CREATE OR REPLACE FUNCTION public.get_dashboard_summary(
  p_restaurant_id uuid, p_from timestamptz, p_to timestamptz,
  p_prev_from timestamptz, p_prev_to timestamptz
)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO 'pg_catalog','public','private','pg_temp'
AS $$
DECLARE
  v_tz text; v_result jsonb; v_current jsonb; v_previous jsonb;
  v_daily jsonb; v_by_channel jsonb; v_by_payment jsonb;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'unauthorized' USING ERRCODE='42501'; END IF;
  IF NOT private.has_restaurant_access(auth.uid(), p_restaurant_id) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE='42501';
  END IF;

  SELECT COALESCE(NULLIF(timezone,''),'America/Sao_Paulo') INTO v_tz
    FROM public.restaurants WHERE id=p_restaurant_id;
  IF v_tz IS NULL THEN v_tz := 'America/Sao_Paulo'; END IF;

  WITH cur AS (
    SELECT * FROM public.orders
    WHERE restaurant_id=p_restaurant_id
      AND created_at>=p_from AND created_at<p_to AND is_test_order=false
  ),
  cur_valid AS (SELECT * FROM cur WHERE status NOT IN ('cancelled','pending'))
  SELECT jsonb_build_object(
    'revenue', COALESCE((SELECT SUM(total) FROM cur_valid),0),
    'orders_count', (SELECT COUNT(*) FROM cur_valid),
    'avg_ticket', CASE WHEN (SELECT COUNT(*) FROM cur_valid)>0
                       THEN COALESCE((SELECT SUM(total) FROM cur_valid),0)/(SELECT COUNT(*) FROM cur_valid) ELSE 0 END,
    'total_orders', (SELECT COUNT(*) FROM cur),
    'cancelled_count', (SELECT COUNT(*) FROM cur WHERE status='cancelled'),
    'cancellation_rate', CASE WHEN (SELECT COUNT(*) FROM cur)>0
                              THEN (SELECT COUNT(*) FROM cur WHERE status='cancelled')::numeric/(SELECT COUNT(*) FROM cur) ELSE 0 END
  ) INTO v_current;

  WITH prv AS (
    SELECT * FROM public.orders
    WHERE restaurant_id=p_restaurant_id
      AND created_at>=p_prev_from AND created_at<p_prev_to AND is_test_order=false
  ),
  prv_valid AS (SELECT * FROM prv WHERE status NOT IN ('cancelled','pending'))
  SELECT jsonb_build_object(
    'revenue', COALESCE((SELECT SUM(total) FROM prv_valid),0),
    'orders_count', (SELECT COUNT(*) FROM prv_valid),
    'avg_ticket', CASE WHEN (SELECT COUNT(*) FROM prv_valid)>0
                       THEN COALESCE((SELECT SUM(total) FROM prv_valid),0)/(SELECT COUNT(*) FROM prv_valid) ELSE 0 END,
    'total_orders', (SELECT COUNT(*) FROM prv),
    'cancelled_count', (SELECT COUNT(*) FROM prv WHERE status='cancelled'),
    'cancellation_rate', CASE WHEN (SELECT COUNT(*) FROM prv)>0
                              THEN (SELECT COUNT(*) FROM prv WHERE status='cancelled')::numeric/(SELECT COUNT(*) FROM prv) ELSE 0 END
  ) INTO v_previous;

  SELECT COALESCE(jsonb_agg(row_to_json(s) ORDER BY (row_to_json(s)->>'day')),'[]'::jsonb) INTO v_daily
  FROM (
    SELECT to_char((created_at AT TIME ZONE v_tz)::date,'YYYY-MM-DD') AS day,
           COUNT(*) FILTER (WHERE status NOT IN ('cancelled','pending')) AS orders,
           COALESCE(SUM(total) FILTER (WHERE status NOT IN ('cancelled','pending')),0) AS revenue
    FROM public.orders
    WHERE restaurant_id=p_restaurant_id AND created_at>=p_from AND created_at<p_to
      AND is_test_order=false
    GROUP BY 1
  ) s;

  SELECT COALESCE(jsonb_agg(jsonb_build_object('name',type,'value',c,'revenue',r)),'[]'::jsonb) INTO v_by_channel
  FROM (
    SELECT type, COUNT(*) c, COALESCE(SUM(total),0) r
    FROM public.orders
    WHERE restaurant_id=p_restaurant_id AND created_at>=p_from AND created_at<p_to
      AND status NOT IN ('cancelled','pending') AND is_test_order=false
    GROUP BY type
  ) t;

  SELECT COALESCE(jsonb_agg(jsonb_build_object('name',payment,'value',c,'revenue',r)),'[]'::jsonb) INTO v_by_payment
  FROM (
    SELECT payment, COUNT(*) c, COALESCE(SUM(total),0) r
    FROM public.orders
    WHERE restaurant_id=p_restaurant_id AND created_at>=p_from AND created_at<p_to
      AND status NOT IN ('cancelled','pending') AND is_test_order=false
    GROUP BY payment
  ) p;

  v_result := jsonb_build_object(
    'timezone', v_tz, 'from', p_from, 'to', p_to,
    'prev_from', p_prev_from, 'prev_to', p_prev_to,
    'current', v_current, 'previous', v_previous,
    'daily', v_daily, 'by_channel', v_by_channel, 'by_payment', v_by_payment,
    'generated_at', now()
  );
  RETURN v_result;
END $$;

CREATE OR REPLACE FUNCTION public.report_overview(
  p_restaurant_id uuid, p_from date, p_to date, p_tz text DEFAULT NULL
)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO 'pg_catalog','public','private','pg_temp'
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

  WITH o AS (
    SELECT status, total::numeric, discount::numeric, delivery_fee::numeric, customer_id, created_at
    FROM public.orders
    WHERE restaurant_id=p_restaurant_id AND created_at>=v_from AND created_at<v_to
      AND is_test_order=false
  ), agg AS (
    SELECT
      COALESCE(SUM(total) FILTER (WHERE status='delivered'),0) AS completed_revenue,
      COUNT(*) FILTER (WHERE status='delivered') AS completed_orders,
      COALESCE(SUM(total) FILTER (WHERE status IN ('confirmed','preparing','ready','out_for_delivery')),0) AS open_amount,
      COUNT(*) FILTER (WHERE status IN ('confirmed','preparing','ready','out_for_delivery')) AS open_orders,
      COUNT(*) FILTER (WHERE status='cancelled') AS cancelled_orders,
      COUNT(*) FILTER (WHERE status='pending')   AS pending_orders,
      COUNT(*) FILTER (WHERE status NOT IN ('cancelled','pending')) AS valid_orders,
      COALESCE(SUM(discount)     FILTER (WHERE status='delivered'),0) AS total_discount,
      COALESCE(SUM(delivery_fee) FILTER (WHERE status='delivered'),0) AS total_delivery,
      COUNT(DISTINCT customer_id) FILTER (WHERE status='delivered' AND customer_id IS NOT NULL) AS unique_customers
    FROM o
  ), new_c AS (
    SELECT COUNT(*) AS c FROM public.customers
    WHERE restaurant_id=p_restaurant_id
      AND first_order_at IS NOT NULL
      AND first_order_at>=v_from AND first_order_at<v_to
  ), items AS (
    SELECT COALESCE(SUM(oi.quantity),0) AS units_sold
    FROM public.order_items oi
    JOIN public.orders ord ON ord.id=oi.order_id
    WHERE ord.restaurant_id=p_restaurant_id
      AND ord.created_at>=v_from AND ord.created_at<v_to
      AND ord.status='delivered' AND ord.is_test_order=false
  )
  SELECT jsonb_build_object(
    'completed_revenue', agg.completed_revenue,
    'completed_orders', agg.completed_orders,
    'open_amount', agg.open_amount,
    'open_orders', agg.open_orders,
    'valid_orders', agg.valid_orders,
    'cancelled_orders', agg.cancelled_orders,
    'pending_orders', agg.pending_orders,
    'avg_ticket_completed', CASE WHEN agg.completed_orders>0
                                 THEN agg.completed_revenue/agg.completed_orders ELSE 0 END,
    'total_discount', agg.total_discount,
    'total_delivery_fee', agg.total_delivery,
    'unique_customers', agg.unique_customers,
    'new_customers', new_c.c,
    'units_sold', items.units_sold
  ) INTO v_current FROM agg, new_c, items;

  WITH o AS (
    SELECT status, total::numeric FROM public.orders
    WHERE restaurant_id=p_restaurant_id AND created_at>=v_prev_from AND created_at<v_prev_to
      AND is_test_order=false
  )
  SELECT jsonb_build_object(
    'completed_revenue', COALESCE(SUM(total) FILTER (WHERE status='delivered'),0),
    'completed_orders', COUNT(*) FILTER (WHERE status='delivered'),
    'cancelled_orders', COUNT(*) FILTER (WHERE status='cancelled')
  ) INTO v_previous FROM o;

  v_granularity := CASE WHEN v_days<=2 THEN 'hour' WHEN v_days<=120 THEN 'day' ELSE 'month' END;

  IF v_granularity='hour' THEN
    SELECT COALESCE(jsonb_agg(row_to_json(t) ORDER BY bucket),'[]'::jsonb) INTO v_series FROM (
      SELECT to_char(date_trunc('hour', created_at AT TIME ZONE v_tz),'YYYY-MM-DD"T"HH24:00') AS bucket,
             SUM(total)::numeric AS revenue, COUNT(*)::int AS orders
      FROM public.orders
      WHERE restaurant_id=p_restaurant_id AND created_at>=v_from AND created_at<v_to
        AND status='delivered' AND is_test_order=false
      GROUP BY 1
    ) t;
  ELSIF v_granularity='day' THEN
    SELECT COALESCE(jsonb_agg(row_to_json(t) ORDER BY bucket),'[]'::jsonb) INTO v_series FROM (
      SELECT to_char(date_trunc('day', created_at AT TIME ZONE v_tz),'YYYY-MM-DD') AS bucket,
             SUM(total)::numeric AS revenue, COUNT(*)::int AS orders
      FROM public.orders
      WHERE restaurant_id=p_restaurant_id AND created_at>=v_from AND created_at<v_to
        AND status='delivered' AND is_test_order=false
      GROUP BY 1
    ) t;
  ELSE
    SELECT COALESCE(jsonb_agg(row_to_json(t) ORDER BY bucket),'[]'::jsonb) INTO v_series FROM (
      SELECT to_char(date_trunc('month', created_at AT TIME ZONE v_tz),'YYYY-MM') AS bucket,
             SUM(total)::numeric AS revenue, COUNT(*)::int AS orders
      FROM public.orders
      WHERE restaurant_id=p_restaurant_id AND created_at>=v_from AND created_at<v_to
        AND status='delivered' AND is_test_order=false
      GROUP BY 1
    ) t;
  END IF;

  RETURN jsonb_build_object(
    'tz', v_tz, 'from', p_from, 'to', p_to,
    'granularity', v_granularity,
    'current', v_current, 'previous', v_previous, 'series', v_series
  );
END $$;

CREATE OR REPLACE FUNCTION public.report_orders_breakdown(
  p_restaurant_id uuid, p_from date, p_to date, p_tz text DEFAULT NULL
)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO 'pg_catalog','public','private','pg_temp'
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
          AND is_test_order=false
        GROUP BY status) s;

  SELECT COALESCE(jsonb_object_agg(type::text, jsonb_build_object('count',cnt,'revenue',rev)),'{}'::jsonb) INTO v_by_type
  FROM (SELECT type, COUNT(*) cnt, COALESCE(SUM(total) FILTER (WHERE status='delivered'),0) rev
        FROM public.orders
        WHERE restaurant_id=p_restaurant_id AND created_at>=v_from AND created_at<v_to
          AND is_test_order=false
        GROUP BY type) s;

  SELECT COALESCE(jsonb_object_agg(payment::text, jsonb_build_object('count',cnt,'revenue',rev)),'{}'::jsonb) INTO v_by_payment_method
  FROM (SELECT payment, COUNT(*) cnt, COALESCE(SUM(total) FILTER (WHERE status='delivered'),0) rev
        FROM public.orders
        WHERE restaurant_id=p_restaurant_id AND created_at>=v_from AND created_at<v_to
          AND is_test_order=false
        GROUP BY payment) s;

  SELECT COALESCE(jsonb_object_agg(payment_status::text, cnt),'{}'::jsonb) INTO v_by_payment_status
  FROM (SELECT payment_status, COUNT(*) cnt FROM public.orders
        WHERE restaurant_id=p_restaurant_id AND created_at>=v_from AND created_at<v_to
          AND is_test_order=false
        GROUP BY payment_status) s;

  SELECT COALESCE(jsonb_agg(jsonb_build_object('hour',h,'orders',cnt) ORDER BY h),'[]'::jsonb) INTO v_by_hour
  FROM (SELECT EXTRACT(HOUR FROM created_at AT TIME ZONE v_tz)::int h, COUNT(*) cnt
        FROM public.orders
        WHERE restaurant_id=p_restaurant_id AND created_at>=v_from AND created_at<v_to
          AND status NOT IN ('cancelled','pending') AND is_test_order=false
        GROUP BY 1) s;

  SELECT COALESCE(jsonb_agg(jsonb_build_object('dow',dow,'orders',cnt) ORDER BY dow),'[]'::jsonb) INTO v_by_dow
  FROM (SELECT EXTRACT(ISODOW FROM created_at AT TIME ZONE v_tz)::int dow, COUNT(*) cnt
        FROM public.orders
        WHERE restaurant_id=p_restaurant_id AND created_at>=v_from AND created_at<v_to
          AND status NOT IN ('cancelled','pending') AND is_test_order=false
        GROUP BY 1) s;

  RETURN jsonb_build_object(
    'tz', v_tz, 'from', p_from, 'to', p_to,
    'by_status', v_by_status, 'by_type', v_by_type,
    'by_payment_method', v_by_payment_method, 'by_payment_status', v_by_payment_status,
    'by_hour', v_by_hour, 'by_dow', v_by_dow
  );
END $$;

CREATE OR REPLACE FUNCTION public.report_customers(
  p_restaurant_id uuid, p_from date, p_to date, p_tz text DEFAULT NULL, p_limit int DEFAULT 50
)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO 'pg_catalog','public','private','pg_temp'
AS $$
DECLARE
  v_tz text; v_from timestamptz; v_to timestamptz;
  v_summary jsonb; v_top jsonb;
BEGIN
  PERFORM private.authorize_tenant_report(p_restaurant_id);
  SELECT tz, ts_from, ts_to INTO v_tz, v_from, v_to
    FROM private.report_resolve_range(p_restaurant_id, p_from, p_to, NULL);
  p_limit := GREATEST(1, LEAST(COALESCE(p_limit,50),200));

  WITH oc AS (
    SELECT customer_id, COUNT(*) cnt, SUM(total)::numeric spent
    FROM public.orders
    WHERE restaurant_id=p_restaurant_id AND created_at>=v_from AND created_at<v_to
      AND status='delivered' AND customer_id IS NOT NULL AND is_test_order=false
    GROUP BY customer_id
  )
  SELECT jsonb_build_object(
    'unique_customers', COALESCE(COUNT(*),0),
    'recurring_customers', COALESCE(COUNT(*) FILTER (WHERE cnt>1),0),
    'new_customers', (
      SELECT COUNT(*) FROM public.customers
      WHERE restaurant_id=p_restaurant_id
        AND first_order_at IS NOT NULL
        AND first_order_at>=v_from AND first_order_at<v_to
    ),
    'total_spent', COALESCE(SUM(spent),0),
    'avg_per_customer', CASE WHEN COUNT(*)>0 THEN COALESCE(SUM(spent),0)/COUNT(*) ELSE 0 END
  ) INTO v_summary FROM oc;

  SELECT COALESCE(jsonb_agg(row_to_json(t) ORDER BY t.spent DESC),'[]'::jsonb) INTO v_top
  FROM (
    SELECT c.id AS customer_id,
           COALESCE(c.name,'Sem nome') AS name,
           CASE WHEN c.phone IS NULL OR length(c.phone)<4 THEN NULL
                ELSE regexp_replace(c.phone,'^(.*)([0-9]{4})$','••••\2') END AS phone_masked,
           oc.cnt AS orders, oc.spent, c.last_order_at
    FROM oc JOIN public.customers c ON c.id=oc.customer_id
    ORDER BY oc.spent DESC LIMIT p_limit
  ) t;

  RETURN jsonb_build_object(
    'tz', v_tz, 'from', p_from, 'to', p_to,
    'summary', v_summary, 'top', v_top
  );
END $$;

CREATE OR REPLACE FUNCTION public.report_products(
  p_restaurant_id uuid, p_from date, p_to date, p_tz text DEFAULT NULL, p_limit int DEFAULT 50
)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO 'pg_catalog','public','private','pg_temp'
AS $$
DECLARE
  v_tz text; v_from timestamptz; v_to timestamptz;
  v_top jsonb; v_categories jsonb; v_unsold jsonb; v_total_rev numeric;
BEGIN
  PERFORM private.authorize_tenant_report(p_restaurant_id);
  SELECT tz, ts_from, ts_to INTO v_tz, v_from, v_to
    FROM private.report_resolve_range(p_restaurant_id, p_from, p_to, NULL);
  p_limit := GREATEST(1, LEAST(COALESCE(p_limit,50),200));

  WITH oi AS (
    SELECT oi.product_id, COALESCE(oi.product_name,'—') AS name,
           SUM(oi.quantity)::numeric AS qty, SUM(oi.subtotal)::numeric AS revenue
    FROM public.order_items oi
    JOIN public.orders ord ON ord.id=oi.order_id
    WHERE ord.restaurant_id=p_restaurant_id
      AND ord.created_at>=v_from AND ord.created_at<v_to
      AND ord.status='delivered' AND ord.is_test_order=false
    GROUP BY oi.product_id, COALESCE(oi.product_name,'—')
  ), ranked AS (
    SELECT oi.product_id, oi.name, oi.qty, oi.revenue,
           p.archived_at IS NOT NULL AS archived, c.name AS category_name
    FROM oi LEFT JOIN public.products p ON p.id=oi.product_id
            LEFT JOIN public.categories c ON c.id=p.category_id
  )
  SELECT COALESCE(jsonb_agg(row_to_json(r) ORDER BY r.revenue DESC),'[]'::jsonb),
         COALESCE(SUM(r.revenue),0)
  INTO v_top, v_total_rev
  FROM (SELECT * FROM ranked ORDER BY revenue DESC LIMIT p_limit) r;

  SELECT COALESCE(jsonb_agg(row_to_json(c) ORDER BY c.revenue DESC),'[]'::jsonb) INTO v_categories
  FROM (
    SELECT COALESCE(cat.name,'Sem categoria') AS name,
           SUM(oi.quantity)::numeric AS qty, SUM(oi.subtotal)::numeric AS revenue
    FROM public.order_items oi
    JOIN public.orders ord ON ord.id=oi.order_id
    LEFT JOIN public.products p ON p.id=oi.product_id
    LEFT JOIN public.categories cat ON cat.id=p.category_id
    WHERE ord.restaurant_id=p_restaurant_id
      AND ord.created_at>=v_from AND ord.created_at<v_to
      AND ord.status='delivered' AND ord.is_test_order=false
    GROUP BY COALESCE(cat.name,'Sem categoria')
  ) c;

  SELECT COALESCE(jsonb_agg(jsonb_build_object('product_id',p.id,'name',p.name) ORDER BY p.name),'[]'::jsonb)
    INTO v_unsold
  FROM public.products p
  WHERE p.restaurant_id=p_restaurant_id AND p.archived_at IS NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.order_items oi
      JOIN public.orders ord ON ord.id=oi.order_id
      WHERE oi.product_id=p.id
        AND ord.restaurant_id=p_restaurant_id
        AND ord.created_at>=v_from AND ord.created_at<v_to
        AND ord.status='delivered' AND ord.is_test_order=false
    );

  RETURN jsonb_build_object(
    'tz', v_tz, 'from', p_from, 'to', p_to,
    'top_products', v_top, 'categories', v_categories,
    'unsold_products', v_unsold, 'total_revenue', v_total_rev
  );
END $$;

-- ============ ONBOARDING TABLE ============
CREATE TABLE IF NOT EXISTS public.restaurant_onboarding (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL UNIQUE REFERENCES public.restaurants(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'not_started'
    CHECK (status IN ('not_started','in_progress','completed','dismissed')),
  current_step text,
  started_at timestamptz,
  completed_at timestamptz,
  dismissed_at timestamptz,
  last_seen_at timestamptz,
  version int NOT NULL DEFAULT 1,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.restaurant_onboarding TO authenticated;
GRANT ALL    ON public.restaurant_onboarding TO service_role;

ALTER TABLE public.restaurant_onboarding ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "onboarding read for tenant members and support" ON public.restaurant_onboarding;
CREATE POLICY "onboarding read for tenant members and support"
  ON public.restaurant_onboarding FOR SELECT
  TO authenticated
  USING (
    private.has_tenant_native_read_access(auth.uid(), restaurant_id)
    OR private.has_active_support_access(auth.uid(), restaurant_id)
  );

DROP TRIGGER IF EXISTS trg_restaurant_onboarding_updated ON public.restaurant_onboarding;
CREATE TRIGGER trg_restaurant_onboarding_updated
  BEFORE UPDATE ON public.restaurant_onboarding
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ ONBOARDING RPCs ============
CREATE OR REPLACE FUNCTION private.authorize_onboarding_write(p_restaurant_id uuid, p_reason text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'pg_catalog','public','private','pg_temp'
AS $$
DECLARE v_uid uuid := auth.uid(); v_native boolean; v_support boolean;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'onboarding_access_forbidden' USING ERRCODE='42501';
  END IF;
  v_native := EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id=v_uid AND ur.restaurant_id=p_restaurant_id
      AND ur.role IN ('owner','manager')
  );
  v_support := private.has_support_administrative_access(v_uid, p_restaurant_id);
  IF NOT v_native AND NOT v_support THEN
    RAISE EXCEPTION 'onboarding_access_forbidden' USING ERRCODE='42501';
  END IF;
  IF NOT v_native AND v_support THEN
    IF p_reason IS NULL OR length(btrim(p_reason)) < 5 THEN
      RAISE EXCEPTION 'reason_required' USING ERRCODE='22023';
    END IF;
  END IF;
END $$;
REVOKE ALL ON FUNCTION private.authorize_onboarding_write(uuid, text) FROM PUBLIC;

CREATE OR REPLACE FUNCTION private.authorize_onboarding_read(p_restaurant_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'pg_catalog','public','private','pg_temp'
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'onboarding_access_forbidden' USING ERRCODE='42501';
  END IF;
  IF NOT (
    private.has_tenant_native_read_access(auth.uid(), p_restaurant_id)
    OR private.has_active_support_access(auth.uid(), p_restaurant_id)
  ) THEN
    RAISE EXCEPTION 'onboarding_access_forbidden' USING ERRCODE='42501';
  END IF;
END $$;
REVOKE ALL ON FUNCTION private.authorize_onboarding_read(uuid) FROM PUBLIC;

CREATE OR REPLACE FUNCTION private.derive_onboarding_steps(p_restaurant_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO 'pg_catalog','public','private','pg_temp'
AS $$
DECLARE
  r public.restaurants%ROWTYPE;
  v_profile boolean; v_address boolean; v_operation boolean;
  v_delivery boolean; v_tables boolean; v_category boolean; v_product boolean;
  v_payment boolean; v_menu_published boolean; v_test_order boolean;
  v_hours_ok boolean := false; v_hours_json jsonb;
BEGIN
  SELECT * INTO r FROM public.restaurants WHERE id=p_restaurant_id;
  IF NOT FOUND THEN RETURN '[]'::jsonb; END IF;

  v_profile := (
    r.name IS NOT NULL AND length(btrim(r.name))>0
    AND r.phone IS NOT NULL AND length(btrim(r.phone))>0
    AND r.slug IS NOT NULL AND length(btrim(r.slug))>0
  );

  v_hours_json := COALESCE(r.opening_hours,'{}'::jsonb);
  v_hours_ok := (
    r.timezone IS NOT NULL AND length(btrim(r.timezone))>0
    AND jsonb_typeof(v_hours_json) IN ('object','array')
    AND v_hours_json <> '{}'::jsonb AND v_hours_json <> '[]'::jsonb
  );

  v_address := (
    r.address_street IS NOT NULL AND length(btrim(r.address_street))>0
    AND r.address_city IS NOT NULL AND length(btrim(r.address_city))>0
    AND r.address_state IS NOT NULL AND length(btrim(r.address_state))>0
  );

  v_operation := COALESCE(r.accepts_delivery,false)
              OR COALESCE(r.accepts_pickup,false)
              OR COALESCE(r.accepts_dine_in,false);

  v_delivery := NOT COALESCE(r.accepts_delivery,false)
    OR EXISTS (
      SELECT 1 FROM public.delivery_areas
      WHERE restaurant_id=p_restaurant_id AND is_active=true
    );

  v_tables := NOT COALESCE(r.accepts_dine_in,false)
    OR EXISTS (
      SELECT 1 FROM public.restaurant_tables
      WHERE restaurant_id=p_restaurant_id AND is_active=true
    );

  v_category := EXISTS (
    SELECT 1 FROM public.categories
    WHERE restaurant_id=p_restaurant_id AND is_active=true AND archived_at IS NULL
  );

  v_product := EXISTS (
    SELECT 1 FROM public.products
    WHERE restaurant_id=p_restaurant_id AND archived_at IS NULL
  );

  v_payment := (
    COALESCE(r.accept_cash_on_delivery,false)
    OR COALESCE(r.accept_card_on_delivery,false)
    OR COALESCE(r.accept_pix_online,false)
    OR r.active_payment_provider IS NOT NULL
    OR EXISTS (
      SELECT 1 FROM public.restaurant_payment_integrations rpi
      WHERE rpi.restaurant_id=p_restaurant_id AND rpi.status='active'
    )
  );

  v_menu_published := COALESCE(r.is_active,false)
    AND r.slug IS NOT NULL AND length(btrim(r.slug))>0
    AND v_category AND v_product;

  v_test_order := EXISTS (
    SELECT 1 FROM public.orders
    WHERE restaurant_id=p_restaurant_id AND is_test_order=true
  );

  RETURN jsonb_build_array(
    jsonb_build_object('key','welcome','completed',true,'required',true),
    jsonb_build_object('key','restaurant_profile','completed',v_profile,'required',true),
    jsonb_build_object('key','opening_hours','completed',v_hours_ok,'required',true),
    jsonb_build_object('key','address_operation','completed',v_operation AND v_address,'required',true),
    jsonb_build_object('key','delivery_or_tables','completed', v_delivery AND v_tables AND v_operation,'required',true),
    jsonb_build_object('key','category','completed',v_category,'required',true),
    jsonb_build_object('key','product','completed',v_product,'required',true),
    jsonb_build_object('key','payment','completed',v_payment,'required',true),
    jsonb_build_object('key','menu_published','completed',v_menu_published,'required',true),
    jsonb_build_object('key','test_order','completed',v_test_order,'required',false),
    jsonb_build_object('key','panel_tour','completed',false,'required',false),
    jsonb_build_object('key','done','completed',false,'required',false)
  );
END $$;
REVOKE ALL ON FUNCTION private.derive_onboarding_steps(uuid) FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.get_onboarding_status(p_restaurant_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO 'pg_catalog','public','private','pg_temp'
AS $$
DECLARE
  v_state public.restaurant_onboarding%ROWTYPE; v_steps jsonb;
  v_next text; v_total int; v_done int;
  v_required_total int; v_required_done int;
BEGIN
  PERFORM private.authorize_onboarding_read(p_restaurant_id);
  SELECT * INTO v_state FROM public.restaurant_onboarding WHERE restaurant_id=p_restaurant_id;
  v_steps := private.derive_onboarding_steps(p_restaurant_id);
  SELECT COUNT(*), COUNT(*) FILTER (WHERE (s->>'completed')::boolean),
         COUNT(*) FILTER (WHERE (s->>'required')::boolean),
         COUNT(*) FILTER (WHERE (s->>'required')::boolean AND (s->>'completed')::boolean)
    INTO v_total, v_done, v_required_total, v_required_done
    FROM jsonb_array_elements(v_steps) s;
  SELECT s->>'key' INTO v_next
    FROM jsonb_array_elements(v_steps) s
   WHERE (s->>'required')::boolean AND NOT (s->>'completed')::boolean
   LIMIT 1;
  RETURN jsonb_build_object(
    'restaurant_id', p_restaurant_id,
    'status', COALESCE(v_state.status,'not_started'),
    'current_step', v_state.current_step,
    'started_at', v_state.started_at,
    'completed_at', v_state.completed_at,
    'dismissed_at', v_state.dismissed_at,
    'last_seen_at', v_state.last_seen_at,
    'version', COALESCE(v_state.version,1),
    'steps', v_steps,
    'progress_pct', CASE WHEN v_required_total>0
      THEN round((v_required_done::numeric / v_required_total) * 100)::int ELSE 0 END,
    'required_total', v_required_total,
    'required_completed', v_required_done,
    'total_steps', v_total,
    'completed_steps', v_done,
    'recommended_next_step', v_next,
    'is_ready_to_receive', v_required_done >= v_required_total
  );
END $$;
REVOKE ALL ON FUNCTION public.get_onboarding_status(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_onboarding_status(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.start_onboarding(p_restaurant_id uuid, p_reason text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'pg_catalog','public','private','pg_temp'
AS $$
DECLARE v_uid uuid := auth.uid(); v_native boolean;
BEGIN
  PERFORM private.authorize_onboarding_write(p_restaurant_id, p_reason);
  INSERT INTO public.restaurant_onboarding (restaurant_id, status, current_step, started_at, last_seen_at)
  VALUES (p_restaurant_id, 'in_progress', 'welcome', now(), now())
  ON CONFLICT (restaurant_id) DO UPDATE
    SET status = CASE WHEN public.restaurant_onboarding.status='completed'
                      THEN public.restaurant_onboarding.status ELSE 'in_progress' END,
        started_at = COALESCE(public.restaurant_onboarding.started_at, now()),
        last_seen_at = now(),
        dismissed_at = NULL,
        updated_at = now();
  v_native := EXISTS (SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id=v_uid AND ur.restaurant_id=p_restaurant_id
      AND ur.role IN ('owner','manager'));
  PERFORM private.record_audit(
    'onboarding_start', 'onboarding', p_restaurant_id,
    'restaurant_onboarding', p_restaurant_id::text,
    NULL, NULL,
    CASE WHEN v_native THEN NULL ELSE p_reason END,
    jsonb_build_object('actor_native', v_native),
    private.current_support_session_id(p_restaurant_id)
  );
  RETURN public.get_onboarding_status(p_restaurant_id);
END $$;
REVOKE ALL ON FUNCTION public.start_onboarding(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.start_onboarding(uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.set_onboarding_current_step(
  p_restaurant_id uuid, p_step text, p_reason text DEFAULT NULL
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'pg_catalog','public','private','pg_temp'
AS $$
BEGIN
  PERFORM private.authorize_onboarding_write(p_restaurant_id, p_reason);
  IF p_step IS NULL OR p_step NOT IN (
    'welcome','restaurant_profile','opening_hours','address_operation',
    'delivery_or_tables','category','product','payment','menu_published',
    'test_order','panel_tour','done'
  ) THEN
    RAISE EXCEPTION 'step_not_available' USING ERRCODE='22023';
  END IF;
  INSERT INTO public.restaurant_onboarding (restaurant_id, status, current_step, started_at, last_seen_at)
  VALUES (p_restaurant_id, 'in_progress', p_step, now(), now())
  ON CONFLICT (restaurant_id) DO UPDATE
    SET current_step = p_step,
        status = CASE WHEN public.restaurant_onboarding.status='completed'
                      THEN public.restaurant_onboarding.status ELSE 'in_progress' END,
        started_at = COALESCE(public.restaurant_onboarding.started_at, now()),
        last_seen_at = now(),
        dismissed_at = NULL,
        updated_at = now();
  RETURN public.get_onboarding_status(p_restaurant_id);
END $$;
REVOKE ALL ON FUNCTION public.set_onboarding_current_step(uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_onboarding_current_step(uuid, text, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.dismiss_onboarding(p_restaurant_id uuid, p_reason text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'pg_catalog','public','private','pg_temp'
AS $$
DECLARE v_uid uuid := auth.uid(); v_native boolean;
BEGIN
  PERFORM private.authorize_onboarding_write(p_restaurant_id, p_reason);
  INSERT INTO public.restaurant_onboarding (restaurant_id, status, dismissed_at, last_seen_at)
  VALUES (p_restaurant_id, 'dismissed', now(), now())
  ON CONFLICT (restaurant_id) DO UPDATE
    SET status = CASE WHEN public.restaurant_onboarding.status='completed'
                      THEN public.restaurant_onboarding.status ELSE 'dismissed' END,
        dismissed_at = now(), last_seen_at = now(), updated_at = now();
  v_native := EXISTS (SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id=v_uid AND ur.restaurant_id=p_restaurant_id
      AND ur.role IN ('owner','manager'));
  PERFORM private.record_audit(
    'onboarding_dismiss', 'onboarding', p_restaurant_id,
    'restaurant_onboarding', p_restaurant_id::text,
    NULL, NULL,
    CASE WHEN v_native THEN NULL ELSE p_reason END,
    jsonb_build_object('actor_native', v_native),
    private.current_support_session_id(p_restaurant_id)
  );
  RETURN public.get_onboarding_status(p_restaurant_id);
END $$;
REVOKE ALL ON FUNCTION public.dismiss_onboarding(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.dismiss_onboarding(uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.complete_onboarding(p_restaurant_id uuid, p_reason text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'pg_catalog','public','private','pg_temp'
AS $$
DECLARE v_uid uuid := auth.uid(); v_native boolean;
BEGIN
  PERFORM private.authorize_onboarding_write(p_restaurant_id, p_reason);
  INSERT INTO public.restaurant_onboarding (restaurant_id, status, current_step, completed_at, last_seen_at)
  VALUES (p_restaurant_id, 'completed', 'done', now(), now())
  ON CONFLICT (restaurant_id) DO UPDATE
    SET status='completed', current_step='done',
        completed_at=COALESCE(public.restaurant_onboarding.completed_at, now()),
        dismissed_at=NULL, last_seen_at=now(), updated_at=now();
  v_native := EXISTS (SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id=v_uid AND ur.restaurant_id=p_restaurant_id
      AND ur.role IN ('owner','manager'));
  PERFORM private.record_audit(
    'onboarding_complete', 'onboarding', p_restaurant_id,
    'restaurant_onboarding', p_restaurant_id::text,
    NULL, NULL,
    CASE WHEN v_native THEN NULL ELSE p_reason END,
    jsonb_build_object('actor_native', v_native),
    private.current_support_session_id(p_restaurant_id)
  );
  RETURN public.get_onboarding_status(p_restaurant_id);
END $$;
REVOKE ALL ON FUNCTION public.complete_onboarding(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.complete_onboarding(uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.reset_onboarding(p_restaurant_id uuid, p_reason text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'pg_catalog','public','private','pg_temp'
AS $$
DECLARE v_uid uuid := auth.uid(); v_native boolean; v_old jsonb;
BEGIN
  IF p_reason IS NULL OR length(btrim(p_reason)) < 5 THEN
    RAISE EXCEPTION 'reason_required' USING ERRCODE='22023';
  END IF;
  PERFORM private.authorize_onboarding_write(p_restaurant_id, p_reason);
  SELECT to_jsonb(o) INTO v_old FROM public.restaurant_onboarding o WHERE restaurant_id=p_restaurant_id;
  INSERT INTO public.restaurant_onboarding (restaurant_id, status, current_step, started_at, last_seen_at, version)
  VALUES (p_restaurant_id, 'in_progress', 'welcome', now(), now(), 2)
  ON CONFLICT (restaurant_id) DO UPDATE
    SET status='in_progress', current_step='welcome',
        started_at=now(), completed_at=NULL, dismissed_at=NULL,
        last_seen_at=now(),
        version=public.restaurant_onboarding.version + 1,
        updated_at=now();
  v_native := EXISTS (SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id=v_uid AND ur.restaurant_id=p_restaurant_id
      AND ur.role IN ('owner','manager'));
  PERFORM private.record_audit(
    'onboarding_reset', 'onboarding', p_restaurant_id,
    'restaurant_onboarding', p_restaurant_id::text,
    v_old, NULL, p_reason,
    jsonb_build_object('actor_native', v_native),
    private.current_support_session_id(p_restaurant_id)
  );
  RETURN public.get_onboarding_status(p_restaurant_id);
END $$;
REVOKE ALL ON FUNCTION public.reset_onboarding(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reset_onboarding(uuid, text) TO authenticated;
