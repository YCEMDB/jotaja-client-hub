
-- Utility trigger fn if missing
CREATE OR REPLACE FUNCTION public.finance_touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE TABLE public.finance_reconciliations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  period_from date NOT NULL,
  period_to date NOT NULL,
  method public.payment_method NOT NULL,
  expected_amount numeric(14,2) NOT NULL DEFAULT 0,
  received_amount numeric(14,2) NOT NULL DEFAULT 0,
  difference numeric(14,2) GENERATED ALWAYS AS (received_amount - expected_amount) STORED,
  status text NOT NULL DEFAULT 'ok' CHECK (status IN ('ok','divergent')),
  reconciled_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reconciled_at timestamptz NOT NULL DEFAULT now(),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_finance_reconciliations_restaurant_period
  ON public.finance_reconciliations (restaurant_id, period_from, period_to);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.finance_reconciliations TO authenticated;
GRANT ALL ON public.finance_reconciliations TO service_role;

ALTER TABLE public.finance_reconciliations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reconciliations_select"
  ON public.finance_reconciliations FOR SELECT TO authenticated
  USING (private.has_restaurant_access(auth.uid(), restaurant_id));

CREATE POLICY "reconciliations_write"
  ON public.finance_reconciliations FOR ALL TO authenticated
  USING (private.has_restaurant_access(auth.uid(), restaurant_id))
  WITH CHECK (private.has_restaurant_access(auth.uid(), restaurant_id));

CREATE TRIGGER finance_reconciliations_touch
  BEFORE UPDATE ON public.finance_reconciliations
  FOR EACH ROW EXECUTE FUNCTION public.finance_touch_updated_at();

-- =========================================================================
-- get_reconciliation_summary
-- =========================================================================
CREATE OR REPLACE FUNCTION public.get_reconciliation_summary(
  p_restaurant_id uuid,
  p_from date DEFAULT ((now() AT TIME ZONE 'America/Sao_Paulo')::date - INTERVAL '30 days'),
  p_to   date DEFAULT (now() AT TIME ZONE 'America/Sao_Paulo')::date
)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE v_result jsonb;
BEGIN
  IF NOT private.has_restaurant_access(auth.uid(), p_restaurant_id) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  WITH expected AS (
    SELECT COALESCE(payment::text, 'other') AS method,
           COUNT(*) AS orders_count,
           SUM(total) AS expected_amount
    FROM public.orders
    WHERE restaurant_id = p_restaurant_id
      AND payment_status = 'paid'
      AND (COALESCE(paid_at, updated_at) AT TIME ZONE 'America/Sao_Paulo')::date BETWEEN p_from AND p_to
    GROUP BY 1
  ),
  received_cash AS (
    SELECT 'cash'::text AS method,
           COALESCE(SUM(amount), 0) AS received_amount
    FROM public.cash_movements
    WHERE restaurant_id = p_restaurant_id
      AND type = 'sale'
      AND (created_at AT TIME ZONE 'America/Sao_Paulo')::date BETWEEN p_from AND p_to
  ),
  received_online AS (
    SELECT COALESCE(payment::text, 'other') AS method,
           COALESCE(SUM(total), 0) AS received_amount
    FROM public.orders
    WHERE restaurant_id = p_restaurant_id
      AND payment_status = 'paid'
      AND payment IN ('pix','credit_card','debit_card','online')
      AND mp_payment_id IS NOT NULL
      AND (COALESCE(paid_at, updated_at) AT TIME ZONE 'America/Sao_Paulo')::date BETWEEN p_from AND p_to
    GROUP BY 1
  ),
  received AS (
    SELECT * FROM received_cash UNION ALL SELECT * FROM received_online
  ),
  merged AS (
    SELECT COALESCE(e.method, r.method) AS method,
           COALESCE(e.orders_count, 0)  AS orders_count,
           COALESCE(e.expected_amount, 0) AS expected_amount,
           COALESCE(r.received_amount, 0) AS received_amount
    FROM expected e FULL OUTER JOIN received r ON r.method = e.method
  )
  SELECT jsonb_build_object(
    'from', p_from, 'to', p_to,
    'items', COALESCE(jsonb_agg(jsonb_build_object(
      'method', method,
      'orders_count', orders_count,
      'expected_amount', expected_amount,
      'received_amount', received_amount,
      'difference', received_amount - expected_amount,
      'status', CASE WHEN ABS(received_amount - expected_amount) < 0.01 THEN 'ok' ELSE 'divergent' END
    ) ORDER BY method), '[]'::jsonb),
    'totals', jsonb_build_object(
      'expected_amount', COALESCE(SUM(expected_amount), 0),
      'received_amount', COALESCE(SUM(received_amount), 0),
      'difference',      COALESCE(SUM(received_amount - expected_amount), 0)
    )
  )
  INTO v_result FROM merged;

  RETURN v_result;
END $$;

REVOKE ALL ON FUNCTION public.get_reconciliation_summary(uuid,date,date) FROM public;
GRANT EXECUTE ON FUNCTION public.get_reconciliation_summary(uuid,date,date) TO authenticated;

-- =========================================================================
-- create_reconciliation
-- =========================================================================
CREATE OR REPLACE FUNCTION public.create_reconciliation(
  p_restaurant_id uuid,
  p_from date,
  p_to date,
  p_method public.payment_method,
  p_expected_amount numeric,
  p_received_amount numeric,
  p_notes text DEFAULT NULL
)
RETURNS public.finance_reconciliations
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE v_row public.finance_reconciliations; v_uid uuid := auth.uid(); v_status text;
BEGIN
  IF NOT private.has_restaurant_access(v_uid, p_restaurant_id) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  IF p_from > p_to THEN RAISE EXCEPTION 'invalid_period'; END IF;

  v_status := CASE WHEN ABS(COALESCE(p_received_amount,0) - COALESCE(p_expected_amount,0)) < 0.01
                   THEN 'ok' ELSE 'divergent' END;

  INSERT INTO public.finance_reconciliations
    (restaurant_id, period_from, period_to, method, expected_amount, received_amount, status, notes, reconciled_by)
  VALUES
    (p_restaurant_id, p_from, p_to, p_method,
     COALESCE(p_expected_amount,0), COALESCE(p_received_amount,0),
     v_status, p_notes, v_uid)
  RETURNING * INTO v_row;

  RETURN v_row;
END $$;

REVOKE ALL ON FUNCTION public.create_reconciliation(uuid,date,date,public.payment_method,numeric,numeric,text) FROM public;
GRANT EXECUTE ON FUNCTION public.create_reconciliation(uuid,date,date,public.payment_method,numeric,numeric,text) TO authenticated;

-- =========================================================================
-- get_finance_by_payment_method
-- =========================================================================
CREATE OR REPLACE FUNCTION public.get_finance_by_payment_method(
  p_restaurant_id uuid,
  p_from date DEFAULT ((now() AT TIME ZONE 'America/Sao_Paulo')::date - INTERVAL '30 days'),
  p_to   date DEFAULT (now() AT TIME ZONE 'America/Sao_Paulo')::date
)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE v_items jsonb; v_total numeric;
BEGIN
  IF NOT private.has_restaurant_access(auth.uid(), p_restaurant_id) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'method', method,
      'orders_count', orders_count,
      'gross_total', gross_total,
      'discounts', discounts,
      'net_total', net_total,
      'avg_ticket', CASE WHEN orders_count > 0 THEN ROUND((net_total / orders_count)::numeric, 2) ELSE 0 END
    ) ORDER BY gross_total DESC), '[]'::jsonb),
    COALESCE(SUM(net_total), 0)
  INTO v_items, v_total
  FROM (
    SELECT COALESCE(payment::text,'other') AS method,
           COUNT(*) AS orders_count,
           SUM(total) AS gross_total,
           SUM(COALESCE(discount,0)) AS discounts,
           SUM(total) AS net_total
    FROM public.orders
    WHERE restaurant_id = p_restaurant_id
      AND payment_status = 'paid'
      AND (COALESCE(paid_at, updated_at) AT TIME ZONE 'America/Sao_Paulo')::date BETWEEN p_from AND p_to
    GROUP BY 1
  ) x;

  RETURN jsonb_build_object(
    'from', p_from, 'to', p_to,
    'items', v_items, 'total_net', v_total
  );
END $$;

REVOKE ALL ON FUNCTION public.get_finance_by_payment_method(uuid,date,date) FROM public;
GRANT EXECUTE ON FUNCTION public.get_finance_by_payment_method(uuid,date,date) TO authenticated;

-- =========================================================================
-- get_finance_final_report
-- =========================================================================
CREATE OR REPLACE FUNCTION public.get_finance_final_report(
  p_restaurant_id uuid,
  p_from date DEFAULT ((now() AT TIME ZONE 'America/Sao_Paulo')::date - INTERVAL '30 days'),
  p_to   date DEFAULT (now() AT TIME ZONE 'America/Sao_Paulo')::date
)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE v_dre jsonb; v_cashflow jsonb; v_methods jsonb; v_reconcile jsonb;
BEGIN
  IF NOT private.has_restaurant_access(auth.uid(), p_restaurant_id) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  v_dre       := public.get_finance_dre(p_restaurant_id, p_from, p_to, NULL);
  v_cashflow  := public.get_finance_cashflow(p_restaurant_id, p_from, p_to);
  v_methods   := public.get_finance_by_payment_method(p_restaurant_id, p_from, p_to);
  v_reconcile := public.get_reconciliation_summary(p_restaurant_id, p_from, p_to);

  RETURN jsonb_build_object(
    'from', p_from, 'to', p_to,
    'dre', v_dre, 'cashflow', v_cashflow,
    'payment_methods', v_methods, 'reconciliation', v_reconcile
  );
END $$;

REVOKE ALL ON FUNCTION public.get_finance_final_report(uuid,date,date) FROM public;
GRANT EXECUTE ON FUNCTION public.get_finance_final_report(uuid,date,date) TO authenticated;
