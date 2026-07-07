
-- Sprint 9 Fase A: Financeiro — schema + RPCs + gates

-- 1. Feature gates
UPDATE public.app_plans SET features = features || jsonb_build_object(
  'finance_basic', false, 'finance_advanced', false, 'finance_dre', false, 'finance_reconcile', false
) WHERE id = 'starter';
UPDATE public.app_plans SET features = features || jsonb_build_object(
  'finance_basic', true, 'finance_advanced', false, 'finance_dre', false, 'finance_reconcile', false
) WHERE id = 'pro';
UPDATE public.app_plans SET features = features || jsonb_build_object(
  'finance_basic', true, 'finance_advanced', true, 'finance_dre', true, 'finance_reconcile', true
) WHERE id = 'business';

-- 2. Enums
DO $$ BEGIN
  CREATE TYPE public.finance_direction AS ENUM ('payable','receivable');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.finance_status AS ENUM ('pending','paid','partial','overdue','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.finance_pay_method AS ENUM ('cash','pix','credit','debit','transfer','boleto','other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. Categorias financeiras
CREATE TABLE IF NOT EXISTS public.finance_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name text NOT NULL,
  direction public.finance_direction NOT NULL,
  color text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (restaurant_id, name, direction)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.finance_categories TO authenticated;
GRANT ALL ON public.finance_categories TO service_role;
ALTER TABLE public.finance_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "finance_categories_team_all" ON public.finance_categories
  FOR ALL TO authenticated
  USING (private.has_restaurant_access(auth.uid(), restaurant_id))
  WITH CHECK (private.has_restaurant_access(auth.uid(), restaurant_id));
CREATE TRIGGER trg_finance_categories_touch BEFORE UPDATE ON public.finance_categories
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 4. Centros de custo
CREATE TABLE IF NOT EXISTS public.finance_cost_centers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (restaurant_id, name)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.finance_cost_centers TO authenticated;
GRANT ALL ON public.finance_cost_centers TO service_role;
ALTER TABLE public.finance_cost_centers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "finance_cost_centers_team_all" ON public.finance_cost_centers
  FOR ALL TO authenticated
  USING (private.has_restaurant_access(auth.uid(), restaurant_id))
  WITH CHECK (private.has_restaurant_access(auth.uid(), restaurant_id));
CREATE TRIGGER trg_finance_cost_centers_touch BEFORE UPDATE ON public.finance_cost_centers
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 5. Contas a pagar/receber
CREATE TABLE IF NOT EXISTS public.finance_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  direction public.finance_direction NOT NULL,
  category_id uuid REFERENCES public.finance_categories(id) ON DELETE SET NULL,
  cost_center_id uuid REFERENCES public.finance_cost_centers(id) ON DELETE SET NULL,
  description text NOT NULL,
  amount numeric(12,2) NOT NULL CHECK (amount >= 0),
  amount_paid numeric(12,2) NOT NULL DEFAULT 0 CHECK (amount_paid >= 0),
  status public.finance_status NOT NULL DEFAULT 'pending',
  issue_date date NOT NULL DEFAULT (now() AT TIME ZONE 'America/Sao_Paulo')::date,
  due_date date NOT NULL,
  paid_at timestamptz,
  payment_method public.finance_pay_method,
  supplier text,
  customer text,
  document text,
  notes text,
  is_fixed boolean NOT NULL DEFAULT false,
  recurrence text,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  cash_session_id uuid REFERENCES public.cash_sessions(id) ON DELETE SET NULL,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS finance_entries_restaurant_due_idx ON public.finance_entries (restaurant_id, due_date DESC);
CREATE INDEX IF NOT EXISTS finance_entries_restaurant_status_idx ON public.finance_entries (restaurant_id, status);
CREATE INDEX IF NOT EXISTS finance_entries_restaurant_direction_idx ON public.finance_entries (restaurant_id, direction, due_date DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.finance_entries TO authenticated;
GRANT ALL ON public.finance_entries TO service_role;
ALTER TABLE public.finance_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "finance_entries_team_all" ON public.finance_entries
  FOR ALL TO authenticated
  USING (private.has_restaurant_access(auth.uid(), restaurant_id))
  WITH CHECK (private.has_restaurant_access(auth.uid(), restaurant_id));
CREATE TRIGGER trg_finance_entries_touch BEFORE UPDATE ON public.finance_entries
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 6. Trigger: auto status overdue/paid
CREATE OR REPLACE FUNCTION public._finance_entries_status_guard()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.status <> 'cancelled' THEN
    IF NEW.amount_paid >= NEW.amount AND NEW.amount > 0 THEN
      NEW.status := 'paid';
      IF NEW.paid_at IS NULL THEN NEW.paid_at := now(); END IF;
    ELSIF NEW.amount_paid > 0 THEN
      NEW.status := 'partial';
    ELSIF NEW.due_date < ((now() AT TIME ZONE 'America/Sao_Paulo')::date) THEN
      NEW.status := 'overdue';
    ELSE
      NEW.status := 'pending';
    END IF;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_finance_entries_status ON public.finance_entries;
CREATE TRIGGER trg_finance_entries_status BEFORE INSERT OR UPDATE OF amount, amount_paid, due_date, status
  ON public.finance_entries FOR EACH ROW EXECUTE FUNCTION public._finance_entries_status_guard();

-- 7. RPC: pagar/receber (registra amount_paid; opcionalmente movimenta caixa)
CREATE OR REPLACE FUNCTION public.finance_entry_pay(
  p_entry_id uuid,
  p_amount numeric,
  p_payment_method public.finance_pay_method DEFAULT NULL,
  p_cash_session_id uuid DEFAULT NULL,
  p_notes text DEFAULT NULL
) RETURNS public.finance_entries
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_entry public.finance_entries;
  v_uid uuid := auth.uid();
BEGIN
  SELECT * INTO v_entry FROM public.finance_entries WHERE id = p_entry_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'finance_entry_not_found'; END IF;
  IF NOT private.has_restaurant_access(v_uid, v_entry.restaurant_id) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  IF p_amount <= 0 THEN RAISE EXCEPTION 'invalid_amount'; END IF;
  IF v_entry.status = 'cancelled' THEN RAISE EXCEPTION 'entry_cancelled'; END IF;

  UPDATE public.finance_entries
    SET amount_paid = LEAST(v_entry.amount_paid + p_amount, v_entry.amount),
        payment_method = COALESCE(p_payment_method, payment_method),
        cash_session_id = COALESCE(p_cash_session_id, cash_session_id),
        notes = COALESCE(p_notes, notes)
    WHERE id = p_entry_id
    RETURNING * INTO v_entry;

  -- Integração opcional com caixa: cria cash_movement supply/withdrawal se sessão informada
  IF p_cash_session_id IS NOT NULL AND (p_payment_method IS NULL OR p_payment_method = 'cash') THEN
    INSERT INTO public.cash_movements (session_id, restaurant_id, type, amount, description, created_by)
    VALUES (
      p_cash_session_id,
      v_entry.restaurant_id,
      CASE WHEN v_entry.direction = 'receivable' THEN 'supply'::cash_movement_type ELSE 'withdrawal'::cash_movement_type END,
      p_amount,
      'Financeiro: ' || v_entry.description,
      v_uid
    );
  END IF;

  RETURN v_entry;
END $$;
REVOKE ALL ON FUNCTION public.finance_entry_pay(uuid, numeric, public.finance_pay_method, uuid, text) FROM public;
GRANT EXECUTE ON FUNCTION public.finance_entry_pay(uuid, numeric, public.finance_pay_method, uuid, text) TO authenticated;

-- 8. RPC: cancelar
CREATE OR REPLACE FUNCTION public.finance_entry_cancel(p_entry_id uuid)
RETURNS public.finance_entries
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_entry public.finance_entries;
BEGIN
  SELECT * INTO v_entry FROM public.finance_entries WHERE id = p_entry_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'not_found'; END IF;
  IF NOT private.has_restaurant_access(auth.uid(), v_entry.restaurant_id) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  UPDATE public.finance_entries SET status = 'cancelled' WHERE id = p_entry_id RETURNING * INTO v_entry;
  RETURN v_entry;
END $$;
REVOKE ALL ON FUNCTION public.finance_entry_cancel(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.finance_entry_cancel(uuid) TO authenticated;

-- 9. RPC: dashboard financeiro
CREATE OR REPLACE FUNCTION public.get_finance_dashboard(
  p_restaurant_id uuid,
  p_from date DEFAULT (now() AT TIME ZONE 'America/Sao_Paulo')::date - INTERVAL '30 days',
  p_to date DEFAULT (now() AT TIME ZONE 'America/Sao_Paulo')::date
) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_today date := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
  v_result jsonb;
BEGIN
  IF NOT private.has_restaurant_access(auth.uid(), p_restaurant_id) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT jsonb_build_object(
    'payable_open',      COALESCE((SELECT SUM(amount - amount_paid) FROM public.finance_entries
       WHERE restaurant_id = p_restaurant_id AND direction = 'payable' AND status IN ('pending','partial','overdue')), 0),
    'receivable_open',   COALESCE((SELECT SUM(amount - amount_paid) FROM public.finance_entries
       WHERE restaurant_id = p_restaurant_id AND direction = 'receivable' AND status IN ('pending','partial','overdue')), 0),
    'payable_overdue',   COALESCE((SELECT SUM(amount - amount_paid) FROM public.finance_entries
       WHERE restaurant_id = p_restaurant_id AND direction = 'payable' AND status = 'overdue'), 0),
    'receivable_overdue',COALESCE((SELECT SUM(amount - amount_paid) FROM public.finance_entries
       WHERE restaurant_id = p_restaurant_id AND direction = 'receivable' AND status = 'overdue'), 0),
    'paid_period',       COALESCE((SELECT SUM(amount_paid) FROM public.finance_entries
       WHERE restaurant_id = p_restaurant_id AND direction = 'payable' AND status IN ('paid','partial')
         AND paid_at::date BETWEEN p_from AND p_to), 0),
    'received_period',   COALESCE((SELECT SUM(amount_paid) FROM public.finance_entries
       WHERE restaurant_id = p_restaurant_id AND direction = 'receivable' AND status IN ('paid','partial')
         AND paid_at::date BETWEEN p_from AND p_to), 0),
    'today_due_payable', COALESCE((SELECT COUNT(*) FROM public.finance_entries
       WHERE restaurant_id = p_restaurant_id AND direction = 'payable' AND status IN ('pending','partial')
         AND due_date = v_today), 0),
    'today_due_receivable', COALESCE((SELECT COUNT(*) FROM public.finance_entries
       WHERE restaurant_id = p_restaurant_id AND direction = 'receivable' AND status IN ('pending','partial')
         AND due_date = v_today), 0)
  ) INTO v_result;

  RETURN v_result;
END $$;
REVOKE ALL ON FUNCTION public.get_finance_dashboard(uuid, date, date) FROM public;
GRANT EXECUTE ON FUNCTION public.get_finance_dashboard(uuid, date, date) TO authenticated;
