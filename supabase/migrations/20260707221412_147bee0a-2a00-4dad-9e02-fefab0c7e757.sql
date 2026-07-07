
-- Fluxo de caixa consolidado
CREATE OR REPLACE FUNCTION public.get_finance_cashflow(
  p_restaurant_id uuid,
  p_from date DEFAULT ((now() AT TIME ZONE 'America/Sao_Paulo')::date - INTERVAL '30 days'),
  p_to date DEFAULT (now() AT TIME ZONE 'America/Sao_Paulo')::date
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_series jsonb;
  v_totals jsonb;
  v_cash jsonb;
BEGIN
  IF NOT private.has_restaurant_access(auth.uid(), p_restaurant_id) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  -- Série diária. Entradas: cash_movements(sale, reinforcement) + finance_entries(receivable pago, método != cash).
  -- Saídas:   cash_movements(withdrawal, expense)             + finance_entries(payable pago,    método != cash).
  WITH days AS (
    SELECT generate_series(p_from, p_to, interval '1 day')::date AS d
  ),
  cash_in AS (
    SELECT (created_at AT TIME ZONE 'America/Sao_Paulo')::date AS d, SUM(amount) AS v
    FROM public.cash_movements
    WHERE restaurant_id = p_restaurant_id
      AND type IN ('sale','reinforcement')
      AND (created_at AT TIME ZONE 'America/Sao_Paulo')::date BETWEEN p_from AND p_to
    GROUP BY 1
  ),
  cash_out AS (
    SELECT (created_at AT TIME ZONE 'America/Sao_Paulo')::date AS d, SUM(amount) AS v
    FROM public.cash_movements
    WHERE restaurant_id = p_restaurant_id
      AND type IN ('withdrawal','expense')
      AND (created_at AT TIME ZONE 'America/Sao_Paulo')::date BETWEEN p_from AND p_to
    GROUP BY 1
  ),
  fin_in AS (
    SELECT (COALESCE(paid_at, updated_at) AT TIME ZONE 'America/Sao_Paulo')::date AS d, SUM(amount_paid) AS v
    FROM public.finance_entries
    WHERE restaurant_id = p_restaurant_id
      AND direction = 'receivable'
      AND status IN ('paid','partial')
      AND (payment_method IS NULL OR payment_method <> 'cash' OR cash_session_id IS NULL)
      AND (COALESCE(paid_at, updated_at) AT TIME ZONE 'America/Sao_Paulo')::date BETWEEN p_from AND p_to
    GROUP BY 1
  ),
  fin_out AS (
    SELECT (COALESCE(paid_at, updated_at) AT TIME ZONE 'America/Sao_Paulo')::date AS d, SUM(amount_paid) AS v
    FROM public.finance_entries
    WHERE restaurant_id = p_restaurant_id
      AND direction = 'payable'
      AND status IN ('paid','partial')
      AND (payment_method IS NULL OR payment_method <> 'cash' OR cash_session_id IS NULL)
      AND (COALESCE(paid_at, updated_at) AT TIME ZONE 'America/Sao_Paulo')::date BETWEEN p_from AND p_to
    GROUP BY 1
  ),
  merged AS (
    SELECT d.d AS date,
           COALESCE(ci.v,0) + COALESCE(fi.v,0) AS inflow,
           COALESCE(co.v,0) + COALESCE(fo.v,0) AS outflow
    FROM days d
    LEFT JOIN cash_in  ci ON ci.d = d.d
    LEFT JOIN cash_out co ON co.d = d.d
    LEFT JOIN fin_in   fi ON fi.d = d.d
    LEFT JOIN fin_out  fo ON fo.d = d.d
  ),
  cumulative AS (
    SELECT date, inflow, outflow,
           SUM(inflow - outflow) OVER (ORDER BY date) AS balance
    FROM merged
  )
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'date', to_char(date, 'YYYY-MM-DD'),
    'inflow', inflow,
    'outflow', outflow,
    'net', inflow - outflow,
    'balance', balance
  ) ORDER BY date), '[]'::jsonb)
  INTO v_series
  FROM cumulative;

  SELECT jsonb_build_object(
    'total_inflow',  COALESCE(SUM((x->>'inflow')::numeric),0),
    'total_outflow', COALESCE(SUM((x->>'outflow')::numeric),0),
    'net',           COALESCE(SUM((x->>'inflow')::numeric - (x->>'outflow')::numeric),0),
    'final_balance', COALESCE((v_series->-1->>'balance')::numeric, 0)
  ) INTO v_totals
  FROM jsonb_array_elements(v_series) x;

  SELECT jsonb_build_object(
    'sales',         COALESCE(SUM(CASE WHEN type='sale'          THEN amount END),0),
    'reinforcements',COALESCE(SUM(CASE WHEN type='reinforcement' THEN amount END),0),
    'withdrawals',   COALESCE(SUM(CASE WHEN type='withdrawal'    THEN amount END),0),
    'expenses',      COALESCE(SUM(CASE WHEN type='expense'       THEN amount END),0)
  ) INTO v_cash
  FROM public.cash_movements
  WHERE restaurant_id = p_restaurant_id
    AND (created_at AT TIME ZONE 'America/Sao_Paulo')::date BETWEEN p_from AND p_to;

  RETURN jsonb_build_object(
    'from', p_from,
    'to',   p_to,
    'series', v_series,
    'totals', v_totals,
    'cash_operational', v_cash
  );
END $$;

REVOKE ALL ON FUNCTION public.get_finance_cashflow(uuid,date,date) FROM public;
GRANT EXECUTE ON FUNCTION public.get_finance_cashflow(uuid,date,date) TO authenticated;

-- DRE simplificada
CREATE OR REPLACE FUNCTION public.get_finance_dre(
  p_restaurant_id uuid,
  p_from date DEFAULT ((now() AT TIME ZONE 'America/Sao_Paulo')::date - INTERVAL '30 days'),
  p_to date DEFAULT (now() AT TIME ZONE 'America/Sao_Paulo')::date,
  p_cost_center_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_rev_total numeric;
  v_exp_total numeric;
  v_rev_cat jsonb;
  v_exp_cat jsonb;
  v_rev_cc jsonb;
  v_exp_cc jsonb;
BEGIN
  IF NOT private.has_restaurant_access(auth.uid(), p_restaurant_id) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  -- Receitas por categoria
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'category_id', cat_id,
    'name', COALESCE(name, 'Sem categoria'),
    'color', color,
    'total', total
  ) ORDER BY total DESC), '[]'::jsonb), COALESCE(SUM(total),0)
  INTO v_rev_cat, v_rev_total
  FROM (
    SELECT fe.category_id AS cat_id, fc.name, fc.color, SUM(fe.amount_paid) AS total
    FROM public.finance_entries fe
    LEFT JOIN public.finance_categories fc ON fc.id = fe.category_id
    WHERE fe.restaurant_id = p_restaurant_id
      AND fe.direction = 'receivable'
      AND fe.status IN ('paid','partial')
      AND (COALESCE(fe.paid_at, fe.updated_at) AT TIME ZONE 'America/Sao_Paulo')::date BETWEEN p_from AND p_to
      AND (p_cost_center_id IS NULL OR fe.cost_center_id = p_cost_center_id)
    GROUP BY fe.category_id, fc.name, fc.color
  ) r;

  -- Despesas por categoria
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'category_id', cat_id,
    'name', COALESCE(name, 'Sem categoria'),
    'color', color,
    'total', total
  ) ORDER BY total DESC), '[]'::jsonb), COALESCE(SUM(total),0)
  INTO v_exp_cat, v_exp_total
  FROM (
    SELECT fe.category_id AS cat_id, fc.name, fc.color, SUM(fe.amount_paid) AS total
    FROM public.finance_entries fe
    LEFT JOIN public.finance_categories fc ON fc.id = fe.category_id
    WHERE fe.restaurant_id = p_restaurant_id
      AND fe.direction = 'payable'
      AND fe.status IN ('paid','partial')
      AND (COALESCE(fe.paid_at, fe.updated_at) AT TIME ZONE 'America/Sao_Paulo')::date BETWEEN p_from AND p_to
      AND (p_cost_center_id IS NULL OR fe.cost_center_id = p_cost_center_id)
    GROUP BY fe.category_id, fc.name, fc.color
  ) e;

  -- Por centro de custo
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'cost_center_id', cc_id,
    'name', COALESCE(name, 'Sem centro de custo'),
    'total', total
  ) ORDER BY total DESC), '[]'::jsonb)
  INTO v_rev_cc
  FROM (
    SELECT fe.cost_center_id AS cc_id, cc.name, SUM(fe.amount_paid) AS total
    FROM public.finance_entries fe
    LEFT JOIN public.finance_cost_centers cc ON cc.id = fe.cost_center_id
    WHERE fe.restaurant_id = p_restaurant_id
      AND fe.direction = 'receivable'
      AND fe.status IN ('paid','partial')
      AND (COALESCE(fe.paid_at, fe.updated_at) AT TIME ZONE 'America/Sao_Paulo')::date BETWEEN p_from AND p_to
    GROUP BY fe.cost_center_id, cc.name
  ) rc;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'cost_center_id', cc_id,
    'name', COALESCE(name, 'Sem centro de custo'),
    'total', total
  ) ORDER BY total DESC), '[]'::jsonb)
  INTO v_exp_cc
  FROM (
    SELECT fe.cost_center_id AS cc_id, cc.name, SUM(fe.amount_paid) AS total
    FROM public.finance_entries fe
    LEFT JOIN public.finance_cost_centers cc ON cc.id = fe.cost_center_id
    WHERE fe.restaurant_id = p_restaurant_id
      AND fe.direction = 'payable'
      AND fe.status IN ('paid','partial')
      AND (COALESCE(fe.paid_at, fe.updated_at) AT TIME ZONE 'America/Sao_Paulo')::date BETWEEN p_from AND p_to
    GROUP BY fe.cost_center_id, cc.name
  ) ec;

  RETURN jsonb_build_object(
    'from', p_from,
    'to',   p_to,
    'revenue', jsonb_build_object('total', v_rev_total, 'by_category', v_rev_cat, 'by_cost_center', v_rev_cc),
    'expense', jsonb_build_object('total', v_exp_total, 'by_category', v_exp_cat, 'by_cost_center', v_exp_cc),
    'operating_profit', v_rev_total - v_exp_total,
    'margin', CASE WHEN v_rev_total > 0 THEN ROUND(((v_rev_total - v_exp_total) / v_rev_total * 100)::numeric, 2) ELSE 0 END
  );
END $$;

REVOKE ALL ON FUNCTION public.get_finance_dre(uuid,date,date,uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.get_finance_dre(uuid,date,date,uuid) TO authenticated;
