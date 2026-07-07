
CREATE OR REPLACE FUNCTION public.finance_entry_pay(
  p_entry_id uuid,
  p_amount numeric,
  p_payment_method finance_pay_method DEFAULT NULL::finance_pay_method,
  p_cash_session_id uuid DEFAULT NULL::uuid,
  p_notes text DEFAULT NULL::text
)
RETURNS finance_entries
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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

  -- Integração opcional com caixa: cria cash_movement usando os valores válidos do enum.
  -- receivable  -> reinforcement (entrada de dinheiro no caixa)
  -- payable     -> expense       (saída de dinheiro do caixa)
  IF p_cash_session_id IS NOT NULL AND (p_payment_method IS NULL OR p_payment_method = 'cash') THEN
    INSERT INTO public.cash_movements (session_id, restaurant_id, type, amount, description, created_by)
    VALUES (
      p_cash_session_id,
      v_entry.restaurant_id,
      CASE WHEN v_entry.direction = 'receivable'
           THEN 'reinforcement'::cash_movement_type
           ELSE 'expense'::cash_movement_type END,
      p_amount,
      'Financeiro: ' || v_entry.description,
      v_uid
    );
  END IF;

  RETURN v_entry;
END $function$;
