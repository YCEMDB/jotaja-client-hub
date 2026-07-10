
-- =====================================================================
-- Parte 1 — Ajustes finais da 2.a.1
-- =====================================================================

-- 1.1 Whitelist de source em update_order_status
CREATE OR REPLACE FUNCTION public.update_order_status(
  p_order_id UUID,
  p_new_status public.order_status,
  p_source TEXT DEFAULT 'panel',
  p_reason TEXT DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public','private','pg_temp'
AS $$
DECLARE
  v_order    public.orders%ROWTYPE;
  v_ctx      RECORD;
  v_reason   TEXT := NULLIF(btrim(p_reason), '');
  v_source   TEXT;
  v_required TEXT := 'operational';
  -- Origens que o cliente pode declarar; qualquer outra coisa vira 'panel'.
  -- 'system' e 'webhook_mp' NÃO estão na lista — só código server-side pode gravá-las.
  v_allowed_sources TEXT[] := ARRAY['panel','admin','kds','tables','delivery','pos'];
BEGIN
  v_source := lower(COALESCE(NULLIF(btrim(p_source),''),'panel'));
  IF NOT (v_source = ANY (v_allowed_sources)) THEN
    v_source := 'panel';
  END IF;

  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'order_not_found' USING ERRCODE = 'no_data_found';
  END IF;

  SELECT * INTO v_ctx
    FROM private.authorize_tenant_action(v_order.restaurant_id, v_required);

  IF v_order.status = p_new_status THEN
    RETURN jsonb_build_object('id', v_order.id, 'status', v_order.status, 'noop', true);
  END IF;

  IF p_new_status = 'cancelled' AND NOT v_ctx.is_native THEN
    IF v_reason IS NULL OR char_length(v_reason) < 5 THEN
      RAISE EXCEPTION 'reason_required_for_support_cancel' USING ERRCODE = '22023';
    END IF;
  END IF;

  IF NOT private.is_valid_order_transition(v_order.status, p_new_status, v_order.type) THEN
    RAISE EXCEPTION 'invalid_transition: % → %', v_order.status, p_new_status
      USING ERRCODE = 'check_violation';
  END IF;

  PERFORM set_config('app.status_change_ok', 'on', true);
  UPDATE public.orders SET status = p_new_status WHERE id = p_order_id;
  PERFORM set_config('app.status_change_ok', 'off', true);

  INSERT INTO public.order_status_history(
    order_id, restaurant_id, from_status, to_status, changed_by, source, reason
  ) VALUES (
    p_order_id, v_order.restaurant_id, v_order.status, p_new_status,
    v_ctx.actor_id, v_source, v_reason
  );

  IF NOT v_ctx.is_native THEN
    PERFORM private.record_audit(
      'order.status_change','orders', v_order.restaurant_id,'order', p_order_id::text,
      jsonb_build_object('status', v_order.status),
      jsonb_build_object('status', p_new_status),
      v_reason,
      jsonb_build_object('source', v_source,'support_level', v_ctx.support_level,'order_type', v_order.type),
      v_ctx.support_session_id
    );
  END IF;

  RETURN jsonb_build_object(
    'id', p_order_id,'from', v_order.status,'to', p_new_status,
    'changed_at', now(),'via_support', NOT v_ctx.is_native
  );
END;
$$;

-- 1.2 assign_driver — restrito a owner-only na trilha nativa
CREATE OR REPLACE FUNCTION public.assign_driver(p_order_id uuid, p_driver_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public','private','pg_temp'
AS $$
DECLARE
  v_rest uuid; v_prev uuid; v_driver_rest uuid; v_ctx RECORD; v_is_owner boolean;
BEGIN
  SELECT restaurant_id, driver_id INTO v_rest, v_prev
    FROM public.orders WHERE id = p_order_id;
  IF v_rest IS NULL THEN RAISE EXCEPTION 'order_not_found'; END IF;

  SELECT * INTO v_ctx
    FROM private.authorize_tenant_action(v_rest, 'operational');

  -- Regra nativa original: apenas dono do restaurante.
  IF v_ctx.is_native THEN
    SELECT EXISTS (SELECT 1 FROM public.restaurants WHERE id = v_rest AND owner_id = v_ctx.actor_id)
      INTO v_is_owner;
    IF NOT v_is_owner THEN
      RAISE EXCEPTION 'forbidden: driver_assign_owner_only' USING ERRCODE = '42501';
    END IF;
  END IF;

  SELECT restaurant_id INTO v_driver_rest
    FROM public.delivery_drivers
    WHERE id = p_driver_id AND is_active = true;
  IF v_driver_rest IS NULL OR v_driver_rest <> v_rest THEN
    RAISE EXCEPTION 'driver_not_in_restaurant';
  END IF;

  UPDATE public.orders
    SET driver_id = p_driver_id, driver_assigned_at = now(),
        driver_accepted_at = NULL, driver_rejected_at = NULL,
        driver_reject_reason = NULL, updated_at = now()
    WHERE id = p_order_id;

  PERFORM public._log_order_event(
    p_order_id,'driver_assigned',
    jsonb_build_object('driver_id', p_driver_id,'previous_driver_id', v_prev)
  );

  IF NOT v_ctx.is_native THEN
    PERFORM private.record_audit(
      'order.driver_assigned','orders', v_rest,'order', p_order_id::text,
      jsonb_build_object('driver_id', v_prev),
      jsonb_build_object('driver_id', p_driver_id),
      NULL,
      jsonb_build_object('support_level', v_ctx.support_level),
      v_ctx.support_session_id
    );
  END IF;
END;
$$;

-- 1.3 unassign_driver — owner-only nativo + no-op sem entregador anterior
CREATE OR REPLACE FUNCTION public.unassign_driver(p_order_id uuid, p_reason text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public','private','pg_temp'
AS $$
DECLARE
  v_rest uuid; v_prev uuid; v_ctx RECORD; v_is_owner boolean;
  v_reason TEXT := NULLIF(btrim(p_reason),'');
BEGIN
  SELECT restaurant_id, driver_id INTO v_rest, v_prev
    FROM public.orders WHERE id = p_order_id;
  IF v_rest IS NULL THEN RAISE EXCEPTION 'order_not_found'; END IF;

  SELECT * INTO v_ctx
    FROM private.authorize_tenant_action(v_rest, 'operational');

  IF v_ctx.is_native THEN
    SELECT EXISTS (SELECT 1 FROM public.restaurants WHERE id = v_rest AND owner_id = v_ctx.actor_id)
      INTO v_is_owner;
    IF NOT v_is_owner THEN
      RAISE EXCEPTION 'forbidden: driver_unassign_owner_only' USING ERRCODE = '42501';
    END IF;
  END IF;

  -- No-op silencioso quando não havia entregador atribuído (evita auditoria duplicada)
  IF v_prev IS NULL THEN
    RETURN;
  END IF;

  IF NOT v_ctx.is_native AND (v_reason IS NULL OR char_length(v_reason) < 5) THEN
    RAISE EXCEPTION 'reason_required_for_support_unassign' USING ERRCODE = '22023';
  END IF;

  UPDATE public.orders
    SET driver_id = NULL, driver_assigned_at = NULL,
        driver_accepted_at = NULL, driver_picked_up_at = NULL,
        updated_at = now()
    WHERE id = p_order_id;

  PERFORM public._log_order_event(
    p_order_id,'driver_unassigned',
    jsonb_build_object('previous_driver_id', v_prev,'reason', v_reason)
  );

  IF NOT v_ctx.is_native THEN
    PERFORM private.record_audit(
      'order.driver_unassigned','orders', v_rest,'order', p_order_id::text,
      jsonb_build_object('driver_id', v_prev),
      jsonb_build_object('driver_id', NULL),
      v_reason,
      jsonb_build_object('support_level', v_ctx.support_level),
      v_ctx.support_session_id
    );
  END IF;
END;
$$;


-- =====================================================================
-- Parte 2 — Onda 2.a.2 — RPCs de Caixa
-- =====================================================================

-- 2.1 Abertura manual do caixa
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
  v_ctx RECORD;
  v_id uuid;
  v_reason text := NULLIF(btrim(p_reason),'');
  v_existing uuid;
BEGIN
  IF p_opening_amount IS NULL OR p_opening_amount < 0 THEN
    RAISE EXCEPTION 'invalid_opening_amount' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_ctx
    FROM private.authorize_tenant_action(p_restaurant_id, 'administrative');
  -- Trilha nativa: qualquer papel operacional (owner/manager/employee) já autorizado hoje.
  -- Trilha suporte: exige administrative (definido acima).

  IF NOT v_ctx.is_native AND (v_reason IS NULL OR char_length(v_reason) < 5) THEN
    RAISE EXCEPTION 'reason_required_for_support_open' USING ERRCODE = '22023';
  END IF;

  -- Trava lógica: um caixa aberto por restaurante (independente do índice único parcial)
  SELECT id INTO v_existing FROM public.cash_sessions
   WHERE restaurant_id = p_restaurant_id AND status = 'open'
   FOR UPDATE SKIP LOCKED
   LIMIT 1;
  IF v_existing IS NOT NULL THEN
    RAISE EXCEPTION 'cash_already_open' USING ERRCODE = '23505';
  END IF;

  INSERT INTO public.cash_sessions
    (restaurant_id, opened_by, opening_amount, status, origin, notes)
  VALUES
    (p_restaurant_id, v_ctx.actor_id, p_opening_amount, 'open', 'manual',
     CASE WHEN NOT v_ctx.is_native THEN '[SUPORTE] ' || v_reason ELSE NULL END)
  RETURNING id INTO v_id;

  IF NOT v_ctx.is_native THEN
    PERFORM private.record_audit(
      'cash_session.open','cash', p_restaurant_id,'cash_session', v_id::text,
      NULL,
      jsonb_build_object('opening_amount', p_opening_amount,'origin','manual'),
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


-- 2.2 Fechamento
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
  v_ctx RECORD; v_session public.cash_sessions%ROWTYPE;
  v_reason text := NULLIF(btrim(p_reason),'');
  v_notes text := NULLIF(btrim(p_notes),'');
  v_sales numeric := 0; v_reinf numeric := 0; v_wdraw numeric := 0; v_exp numeric := 0;
  v_expected numeric; v_diff numeric;
BEGIN
  IF p_closing_amount IS NULL OR p_closing_amount < 0 THEN
    RAISE EXCEPTION 'invalid_closing_amount' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_session FROM public.cash_sessions
   WHERE id = p_session_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'cash_session_not_found'; END IF;
  IF v_session.status <> 'open' THEN
    RAISE EXCEPTION 'cash_session_not_open' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_ctx
    FROM private.authorize_tenant_action(v_session.restaurant_id, 'administrative');

  IF NOT v_ctx.is_native AND (v_reason IS NULL OR char_length(v_reason) < 5) THEN
    RAISE EXCEPTION 'reason_required_for_support_close' USING ERRCODE = '22023';
  END IF;

  SELECT
    COALESCE(SUM(CASE WHEN type='sale' THEN amount END),0),
    COALESCE(SUM(CASE WHEN type='reinforcement' THEN amount END),0),
    COALESCE(SUM(CASE WHEN type='withdrawal' THEN amount END),0),
    COALESCE(SUM(CASE WHEN type='expense' THEN amount END),0)
  INTO v_sales, v_reinf, v_wdraw, v_exp
  FROM public.cash_movements WHERE session_id = p_session_id;

  v_expected := v_session.opening_amount + v_sales + v_reinf - v_wdraw - v_exp;
  v_diff := p_closing_amount - v_expected;

  UPDATE public.cash_sessions
     SET status = 'closed',
         closed_by = v_ctx.actor_id,
         closed_at = now(),
         closing_amount = p_closing_amount,
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
      'cash_session.close','cash', v_session.restaurant_id,'cash_session', p_session_id::text,
      jsonb_build_object('status','open','opening_amount', v_session.opening_amount),
      jsonb_build_object('status','closed','closing_amount', p_closing_amount,
                         'expected_amount', v_expected,'difference', v_diff),
      v_reason,
      jsonb_build_object('support_level', v_ctx.support_level),
      v_ctx.support_session_id
    );
  END IF;

  RETURN jsonb_build_object(
    'id', p_session_id,'closing_amount', p_closing_amount,
    'expected_amount', v_expected,'difference', v_diff,
    'via_support', NOT v_ctx.is_native
  );
END;
$$;

REVOKE ALL ON FUNCTION public.cash_session_close(uuid, numeric, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cash_session_close(uuid, numeric, text, text) TO authenticated, service_role;


-- 2.3 Movimentação manual (reforço, sangria, despesa)
--     'sale' NÃO é aceito aqui — é gerado por trigger operacional do pedido.
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
  v_ctx RECORD; v_session public.cash_sessions%ROWTYPE;
  v_reason text := NULLIF(btrim(p_reason),'');
  v_desc text := NULLIF(btrim(p_description),'');
  v_id uuid;
BEGIN
  IF p_type NOT IN ('reinforcement','withdrawal','expense') THEN
    RAISE EXCEPTION 'invalid_movement_type: sales_are_system_generated'
      USING ERRCODE = '22023';
  END IF;
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'invalid_amount' USING ERRCODE = '22023';
  END IF;

  -- Lock na sessão para serializar leituras de saldo concomitantes
  SELECT * INTO v_session FROM public.cash_sessions
   WHERE id = p_session_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'cash_session_not_found'; END IF;
  IF v_session.status <> 'open' THEN
    RAISE EXCEPTION 'cash_session_not_open' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_ctx
    FROM private.authorize_tenant_action(v_session.restaurant_id, 'administrative');

  IF NOT v_ctx.is_native AND (v_reason IS NULL OR char_length(v_reason) < 5) THEN
    RAISE EXCEPTION 'reason_required_for_support_movement' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.cash_movements
    (session_id, restaurant_id, type, amount, description, created_by)
  VALUES
    (p_session_id, v_session.restaurant_id, p_type, p_amount,
     COALESCE(v_desc,'') ||
       CASE WHEN NOT v_ctx.is_native THEN
         CASE WHEN v_desc IS NULL THEN '[SUPORTE] '||v_reason
              ELSE ' — [SUPORTE] '||v_reason END
       ELSE '' END,
     v_ctx.actor_id)
  RETURNING id INTO v_id;

  IF NOT v_ctx.is_native THEN
    PERFORM private.record_audit(
      'cash_movement.create','cash', v_session.restaurant_id,'cash_movement', v_id::text,
      NULL,
      jsonb_build_object('type', p_type,'amount', p_amount,'session_id', p_session_id),
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
