
-- =====================================================================
-- Onda 2.a.1 — Helper de autorização + Pedidos
-- =====================================================================

-- 1) Helper único: private.authorize_tenant_action
--    - Descobre auth.uid() internamente.
--    - Não aceita ator/nível/sessão vindos do cliente.
--    - Retorna composite (actor_id, is_native, support_session_id, support_level).
--    - Levanta 'forbidden' quando o ator não tem nem acesso nativo nem sessão
--      de suporte com nível suficiente.
DROP FUNCTION IF EXISTS private.authorize_tenant_action(uuid, text);

CREATE OR REPLACE FUNCTION private.authorize_tenant_action(
  p_restaurant_id uuid,
  p_required_level text
) RETURNS TABLE (
  actor_id uuid,
  is_native boolean,
  support_session_id uuid,
  support_level text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = private, public, pg_temp
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
    RAISE EXCEPTION 'forbidden: missing_restaurant' USING ERRCODE = '42501';
  END IF;

  IF p_required_level NOT IN ('operational','administrative') THEN
    RAISE EXCEPTION 'invalid_required_level: %', p_required_level
      USING ERRCODE = '22023';
  END IF;

  -- Acesso nativo (dono/gerente/funcionário do próprio restaurante)
  IF private.has_tenant_native_write_access(v_uid, p_restaurant_id) THEN
    actor_id := v_uid;
    is_native := true;
    support_session_id := NULL;
    support_level := NULL;
    RETURN NEXT;
    RETURN;
  END IF;

  -- Suporte assistido
  v_level := private.active_support_level(v_uid, p_restaurant_id);
  IF v_level IS NULL THEN
    RAISE EXCEPTION 'forbidden: no_active_support_session'
      USING ERRCODE = '42501';
  END IF;

  IF p_required_level = 'administrative' AND v_level <> 'administrative' THEN
    RAISE EXCEPTION 'forbidden: support_level_insufficient'
      USING ERRCODE = '42501';
  END IF;
  IF p_required_level = 'operational'
     AND v_level NOT IN ('operational','administrative') THEN
    RAISE EXCEPTION 'forbidden: support_level_insufficient'
      USING ERRCODE = '42501';
  END IF;

  v_session := private.current_support_session_id(p_restaurant_id);
  IF v_session IS NULL THEN
    RAISE EXCEPTION 'forbidden: support_session_not_found'
      USING ERRCODE = '42501';
  END IF;

  actor_id := v_uid;
  is_native := false;
  support_session_id := v_session;
  support_level := v_level;
  RETURN NEXT;
  RETURN;
END;
$$;

REVOKE ALL ON FUNCTION private.authorize_tenant_action(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.authorize_tenant_action(uuid, text) FROM anon;
REVOKE ALL ON FUNCTION private.authorize_tenant_action(uuid, text) FROM authenticated;
-- Uso restrito ao service_role e a SECURITY DEFINER internas.
GRANT EXECUTE ON FUNCTION private.authorize_tenant_action(uuid, text) TO service_role;

COMMENT ON FUNCTION private.authorize_tenant_action(uuid, text) IS
  'Onda 2.a.1: gate de autorização para RPCs sensíveis. Descobre o ator via auth.uid(); '
  'devolve is_native=true quando o usuário tem acesso nativo, ou o id/nível da sessão de '
  'suporte ativa quando o acesso vem de assistência. Levanta forbidden quando nenhum dos '
  'caminhos é válido. Não deve ser chamada diretamente pelo cliente.';


-- =====================================================================
-- 2) update_order_status — instrumentado
-- =====================================================================
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
  v_source   TEXT := COALESCE(NULLIF(btrim(p_source),''),'panel');
  v_required TEXT := 'operational';
BEGIN
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'order_not_found' USING ERRCODE = 'no_data_found';
  END IF;

  -- Autorização (ator descoberto internamente)
  SELECT * INTO v_ctx
    FROM private.authorize_tenant_action(v_order.restaurant_id, v_required);

  -- No-op: mesma transição não duplica histórico nem auditoria
  IF v_order.status = p_new_status THEN
    RETURN jsonb_build_object(
      'id', v_order.id,
      'status', v_order.status,
      'noop', true
    );
  END IF;

  -- Cancelamento em modo suporte exige motivo consistente
  IF p_new_status = 'cancelled' AND NOT v_ctx.is_native THEN
    IF v_reason IS NULL OR char_length(v_reason) < 5 THEN
      RAISE EXCEPTION 'reason_required_for_support_cancel'
        USING ERRCODE = '22023';
    END IF;
  END IF;

  -- Matriz oficial de transições
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

  -- Auditoria transacional apenas quando a ação vier de suporte assistido.
  -- (Se a auditoria falhar, a transação inteira reverte — comportamento desejado.)
  IF NOT v_ctx.is_native THEN
    PERFORM private.record_audit(
      'order.status_change',
      'orders',
      v_order.restaurant_id,
      'order',
      p_order_id::text,
      jsonb_build_object('status', v_order.status),
      jsonb_build_object('status', p_new_status),
      v_reason,
      jsonb_build_object(
        'source', v_source,
        'support_level', v_ctx.support_level,
        'order_type', v_order.type
      ),
      v_ctx.support_session_id
    );
  END IF;

  RETURN jsonb_build_object(
    'id', p_order_id,
    'from', v_order.status,
    'to', p_new_status,
    'changed_at', now(),
    'via_support', NOT v_ctx.is_native
  );
END;
$$;

REVOKE ALL ON FUNCTION public.update_order_status(UUID, public.order_status, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_order_status(UUID, public.order_status, TEXT, TEXT) TO authenticated, service_role;


-- =====================================================================
-- 3) assign_driver — instrumentado
-- =====================================================================
CREATE OR REPLACE FUNCTION public.assign_driver(p_order_id uuid, p_driver_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public','private','pg_temp'
AS $$
DECLARE
  v_rest uuid;
  v_prev uuid;
  v_driver_rest uuid;
  v_ctx RECORD;
BEGIN
  SELECT restaurant_id, driver_id INTO v_rest, v_prev
    FROM public.orders WHERE id = p_order_id;
  IF v_rest IS NULL THEN
    RAISE EXCEPTION 'order_not_found';
  END IF;

  SELECT * INTO v_ctx
    FROM private.authorize_tenant_action(v_rest, 'operational');

  SELECT restaurant_id INTO v_driver_rest
    FROM public.delivery_drivers
    WHERE id = p_driver_id AND is_active = true;
  IF v_driver_rest IS NULL OR v_driver_rest <> v_rest THEN
    RAISE EXCEPTION 'driver_not_in_restaurant';
  END IF;

  UPDATE public.orders
    SET driver_id = p_driver_id,
        driver_assigned_at = now(),
        driver_accepted_at = NULL,
        driver_rejected_at = NULL,
        driver_reject_reason = NULL,
        updated_at = now()
    WHERE id = p_order_id;

  PERFORM public._log_order_event(
    p_order_id,
    'driver_assigned',
    jsonb_build_object('driver_id', p_driver_id, 'previous_driver_id', v_prev)
  );

  IF NOT v_ctx.is_native THEN
    PERFORM private.record_audit(
      'order.driver_assigned',
      'orders',
      v_rest,
      'order',
      p_order_id::text,
      jsonb_build_object('driver_id', v_prev),
      jsonb_build_object('driver_id', p_driver_id),
      NULL,
      jsonb_build_object('support_level', v_ctx.support_level),
      v_ctx.support_session_id
    );
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.assign_driver(uuid,uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.assign_driver(uuid,uuid) TO authenticated, service_role;


-- =====================================================================
-- 4) unassign_driver — instrumentado
-- =====================================================================
CREATE OR REPLACE FUNCTION public.unassign_driver(p_order_id uuid, p_reason text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public','private','pg_temp'
AS $$
DECLARE
  v_rest uuid;
  v_prev uuid;
  v_ctx RECORD;
  v_reason TEXT := NULLIF(btrim(p_reason),'');
BEGIN
  SELECT restaurant_id, driver_id INTO v_rest, v_prev
    FROM public.orders WHERE id = p_order_id;
  IF v_rest IS NULL THEN
    RAISE EXCEPTION 'order_not_found';
  END IF;

  SELECT * INTO v_ctx
    FROM private.authorize_tenant_action(v_rest, 'operational');

  IF NOT v_ctx.is_native AND (v_reason IS NULL OR char_length(v_reason) < 5) THEN
    RAISE EXCEPTION 'reason_required_for_support_unassign'
      USING ERRCODE = '22023';
  END IF;

  UPDATE public.orders
    SET driver_id = NULL,
        driver_assigned_at = NULL,
        driver_accepted_at = NULL,
        driver_picked_up_at = NULL,
        updated_at = now()
    WHERE id = p_order_id;

  PERFORM public._log_order_event(
    p_order_id,
    'driver_unassigned',
    jsonb_build_object('previous_driver_id', v_prev, 'reason', v_reason)
  );

  IF NOT v_ctx.is_native THEN
    PERFORM private.record_audit(
      'order.driver_unassigned',
      'orders',
      v_rest,
      'order',
      p_order_id::text,
      jsonb_build_object('driver_id', v_prev),
      jsonb_build_object('driver_id', NULL),
      v_reason,
      jsonb_build_object('support_level', v_ctx.support_level),
      v_ctx.support_session_id
    );
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.unassign_driver(uuid,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.unassign_driver(uuid,text) TO authenticated, service_role;
