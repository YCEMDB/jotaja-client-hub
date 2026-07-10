
-- =====================================================================
-- Ondas 2.a.2 — Ajustes finais das RPCs de Caixa
-- Autorização primeiro; restaurante derivado da sessão; tipos fechados;
-- validação monetária; tratamento explícito de corrida na abertura.
-- =====================================================================

-- Helper: valida faixa monetária e devolve valor normalizado a 2 casas.
CREATE OR REPLACE FUNCTION private.validate_money(p_amount numeric, p_allow_zero boolean DEFAULT false)
RETURNS numeric
LANGUAGE plpgsql IMMUTABLE
SET search_path = 'public','private','pg_temp'
AS $$
BEGIN
  IF p_amount IS NULL THEN
    RAISE EXCEPTION 'invalid_amount' USING ERRCODE = '22023';
  END IF;
  -- NUMERIC pode representar 'NaN'; rejeitar explicitamente.
  IF p_amount = 'NaN'::numeric THEN
    RAISE EXCEPTION 'invalid_amount' USING ERRCODE = '22023';
  END IF;
  IF p_allow_zero THEN
    IF p_amount < 0 THEN RAISE EXCEPTION 'invalid_amount' USING ERRCODE = '22023'; END IF;
  ELSE
    IF p_amount <= 0 THEN RAISE EXCEPTION 'invalid_amount' USING ERRCODE = '22023'; END IF;
  END IF;
  IF p_amount > 1000000 THEN
    RAISE EXCEPTION 'amount_out_of_range' USING ERRCODE = '22023';
  END IF;
  RETURN round(p_amount, 2);
END;
$$;

REVOKE ALL ON FUNCTION private.validate_money(numeric, boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.validate_money(numeric, boolean) TO service_role;


-- 2.1 Abertura manual — trata unique_violation do índice parcial.
CREATE OR REPLACE FUNCTION public.cash_session_open(
  p_restaurant_id uuid,
  p_opening_amount numeric,
  p_reason text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public','private','pg_temp'
AS $$
DECLARE
  v_ctx     RECORD;
  v_id      uuid;
  v_reason  text := NULLIF(btrim(p_reason),'');
  v_amount  numeric;
BEGIN
  IF p_restaurant_id IS NULL THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  -- 1) Autorização ANTES de qualquer validação de valor ou leitura de estado.
  SELECT * INTO v_ctx
    FROM private.authorize_tenant_action(p_restaurant_id, 'administrative');

  -- 2) Motivo obrigatório em suporte.
  IF NOT v_ctx.is_native AND (v_reason IS NULL OR char_length(v_reason) < 5) THEN
    RAISE EXCEPTION 'reason_required_for_support_open' USING ERRCODE = '22023';
  END IF;

  -- 3) Valor.
  v_amount := private.validate_money(p_opening_amount, true);

  -- 4) Pré-verificação (informativa, best-effort) + captura definitiva pelo índice único.
  IF EXISTS (
    SELECT 1 FROM public.cash_sessions
     WHERE restaurant_id = p_restaurant_id AND status = 'open'
  ) THEN
    RAISE EXCEPTION 'cash_already_open' USING ERRCODE = '23505';
  END IF;

  BEGIN
    INSERT INTO public.cash_sessions
      (restaurant_id, opened_by, opening_amount, status, origin, notes)
    VALUES
      (p_restaurant_id, v_ctx.actor_id, v_amount, 'open', 'manual',
       CASE WHEN NOT v_ctx.is_native THEN '[SUPORTE] ' || v_reason ELSE NULL END)
    RETURNING id INTO v_id;
  EXCEPTION WHEN unique_violation THEN
    -- Corrida vencida pelo índice cash_sessions_one_open_per_restaurant.
    RAISE EXCEPTION 'cash_already_open' USING ERRCODE = '23505';
  END;

  IF NOT v_ctx.is_native THEN
    PERFORM private.record_audit(
      'cash_session.open','cash', p_restaurant_id,'cash_session', v_id::text,
      NULL,
      jsonb_build_object('opening_amount', v_amount,'origin','manual'),
      v_reason,
      jsonb_build_object('support_level', v_ctx.support_level),
      v_ctx.support_session_id
    );
  END IF;

  RETURN jsonb_build_object('id', v_id,'via_support', NOT v_ctx.is_native);
END;
$$;

REVOKE ALL ON FUNCTION public.cash_session_open(uuid, numeric, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cash_session_open(uuid, numeric, text) TO authenticated, service_role;


-- 2.2 Fechamento — autorização antes de qualquer info de estado.
CREATE OR REPLACE FUNCTION public.cash_session_close(
  p_session_id uuid,
  p_closing_amount numeric,
  p_notes text DEFAULT NULL,
  p_reason text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public','private','pg_temp'
AS $$
DECLARE
  v_ctx      RECORD;
  v_rest_id  uuid;
  v_session  public.cash_sessions%ROWTYPE;
  v_reason   text := NULLIF(btrim(p_reason),'');
  v_notes    text := NULLIF(btrim(p_notes),'');
  v_closing  numeric;
  v_sales numeric := 0; v_reinf numeric := 0;
  v_wdraw numeric := 0; v_exp   numeric := 0;
  v_opening  numeric;
  v_expected numeric; v_diff numeric;
BEGIN
  IF p_session_id IS NULL THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  -- 1) Descobrir restaurante da sessão SEM revelar nada. Sessão inexistente vira forbidden.
  SELECT restaurant_id INTO v_rest_id
    FROM public.cash_sessions WHERE id = p_session_id;
  IF v_rest_id IS NULL THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  -- 2) Autorização usa o restaurante derivado da própria sessão.
  SELECT * INTO v_ctx
    FROM private.authorize_tenant_action(v_rest_id, 'administrative');

  -- 3) Motivo em suporte.
  IF NOT v_ctx.is_native AND (v_reason IS NULL OR char_length(v_reason) < 5) THEN
    RAISE EXCEPTION 'reason_required_for_support_close' USING ERRCODE = '22023';
  END IF;

  -- 4) Valor.
  v_closing := private.validate_money(p_closing_amount, true);

  -- 5) Agora sim pode revelar estado — sob lock.
  SELECT * INTO v_session FROM public.cash_sessions
   WHERE id = p_session_id FOR UPDATE;
  IF v_session.status <> 'open' THEN
    RAISE EXCEPTION 'cash_session_not_open' USING ERRCODE = '22023';
  END IF;

  SELECT
    COALESCE(SUM(CASE WHEN type='sale'          THEN amount END),0),
    COALESCE(SUM(CASE WHEN type='reinforcement' THEN amount END),0),
    COALESCE(SUM(CASE WHEN type='withdrawal'    THEN amount END),0),
    COALESCE(SUM(CASE WHEN type='expense'       THEN amount END),0)
  INTO v_sales, v_reinf, v_wdraw, v_exp
  FROM public.cash_movements
  WHERE session_id = p_session_id AND restaurant_id = v_rest_id;

  v_opening  := round(v_session.opening_amount, 2);
  v_expected := round(v_opening + v_sales + v_reinf - v_wdraw - v_exp, 2);
  v_diff     := round(v_closing - v_expected, 2);

  UPDATE public.cash_sessions
     SET status = 'closed',
         closed_by = v_ctx.actor_id,
         closed_at = now(),
         closing_amount = v_closing,
         expected_amount = v_expected,
         difference = v_diff,
         notes = COALESCE(NULLIF(concat_ws(E'\n', notes, v_notes,
            CASE WHEN NOT v_ctx.is_native THEN '[SUPORTE] '|| v_reason END),''), notes),
         updated_at = now()
   WHERE id = p_session_id AND status = 'open';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'cash_session_close_race' USING ERRCODE = '40001';
  END IF;

  IF NOT v_ctx.is_native THEN
    PERFORM private.record_audit(
      'cash_session.close','cash', v_rest_id,'cash_session', p_session_id::text,
      jsonb_build_object('status','open','opening_amount', v_opening),
      jsonb_build_object('status','closed','closing_amount', v_closing,
                         'expected_amount', v_expected,'difference', v_diff),
      v_reason,
      jsonb_build_object('support_level', v_ctx.support_level),
      v_ctx.support_session_id
    );
  END IF;

  RETURN jsonb_build_object(
    'id', p_session_id,
    'closing_amount', v_closing,
    'expected_amount', v_expected,
    'difference', v_diff,
    'via_support', NOT v_ctx.is_native
  );
END;
$$;

REVOKE ALL ON FUNCTION public.cash_session_close(uuid, numeric, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cash_session_close(uuid, numeric, text, text) TO authenticated, service_role;


-- 2.3 Movimentação manual — mesma disciplina.
CREATE OR REPLACE FUNCTION public.cash_session_add_movement(
  p_session_id uuid,
  p_type public.cash_movement_type,
  p_amount numeric,
  p_description text DEFAULT NULL,
  p_reason text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public','private','pg_temp'
AS $$
DECLARE
  v_ctx     RECORD;
  v_rest_id uuid;
  v_session public.cash_sessions%ROWTYPE;
  v_reason  text := NULLIF(btrim(p_reason),'');
  v_desc    text := NULLIF(btrim(p_description),'');
  v_amount  numeric;
  v_id      uuid;
BEGIN
  IF p_session_id IS NULL THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  -- 1) Whitelist ANTES de qualquer coisa que dependa da sessão.
  IF p_type IS NULL OR p_type NOT IN ('reinforcement','withdrawal','expense') THEN
    RAISE EXCEPTION 'invalid_movement_type' USING ERRCODE = '22023';
  END IF;

  -- 2) Descobrir restaurante SEM revelar estado.
  SELECT restaurant_id INTO v_rest_id
    FROM public.cash_sessions WHERE id = p_session_id;
  IF v_rest_id IS NULL THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  -- 3) Autorização.
  SELECT * INTO v_ctx
    FROM private.authorize_tenant_action(v_rest_id, 'administrative');

  IF NOT v_ctx.is_native AND (v_reason IS NULL OR char_length(v_reason) < 5) THEN
    RAISE EXCEPTION 'reason_required_for_support_movement' USING ERRCODE = '22023';
  END IF;

  -- 4) Valor.
  v_amount := private.validate_money(p_amount, false);

  -- 5) Lock e verificação de status.
  SELECT * INTO v_session FROM public.cash_sessions
   WHERE id = p_session_id FOR UPDATE;
  IF v_session.status <> 'open' THEN
    RAISE EXCEPTION 'cash_session_not_open' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.cash_movements
    (session_id, restaurant_id, type, amount, description, created_by)
  VALUES
    (p_session_id, v_rest_id, p_type, v_amount,
     COALESCE(v_desc,'') ||
       CASE WHEN NOT v_ctx.is_native THEN
         CASE WHEN v_desc IS NULL THEN '[SUPORTE] '||v_reason
              ELSE ' — [SUPORTE] '||v_reason END
       ELSE '' END,
     v_ctx.actor_id)
  RETURNING id INTO v_id;

  IF NOT v_ctx.is_native THEN
    PERFORM private.record_audit(
      'cash_movement.create','cash', v_rest_id,'cash_movement', v_id::text,
      NULL,
      jsonb_build_object('type', p_type,'amount', v_amount,'session_id', p_session_id),
      v_reason,
      jsonb_build_object('support_level', v_ctx.support_level),
      v_ctx.support_session_id
    );
  END IF;

  RETURN jsonb_build_object('id', v_id,'via_support', NOT v_ctx.is_native);
END;
$$;

REVOKE ALL ON FUNCTION public.cash_session_add_movement(uuid, public.cash_movement_type, numeric, text, text)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cash_session_add_movement(uuid, public.cash_movement_type, numeric, text, text)
  TO authenticated, service_role;
