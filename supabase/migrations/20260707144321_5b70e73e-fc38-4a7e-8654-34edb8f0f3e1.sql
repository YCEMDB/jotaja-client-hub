-- Fase C · Sprint 6.3 — Junta comandas dentro da mesma sessão.
-- Reutiliza table_session_events (kind='command_opened' já existe; adicionamos 'command_merged').
-- Nenhum pedido é apagado — apenas o vínculo table_command_id é atualizado.

-- Amplia o CHECK para permitir o novo kind sem quebrar os já existentes.
ALTER TABLE public.table_session_events
  DROP CONSTRAINT IF EXISTS table_session_events_kind_check;

ALTER TABLE public.table_session_events
  ADD CONSTRAINT table_session_events_kind_check CHECK (
    kind = ANY (ARRAY[
      'opened','order_added','order_removed','transferred','merged','split',
      'closed','cancelled','blocked','unblocked',
      'command_opened','command_closed','command_merged','forced_close'
    ])
  );

CREATE OR REPLACE FUNCTION public.merge_commands(
  p_source_command_id uuid, p_target_command_id uuid
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_src public.table_commands%ROWTYPE;
  v_tgt public.table_commands%ROWTYPE;
  v_rid uuid;
  v_moved int;
BEGIN
  IF p_source_command_id = p_target_command_id THEN
    RAISE EXCEPTION 'invalid_merge: origem e destino são a mesma comanda' USING ERRCODE='check_violation';
  END IF;

  SELECT * INTO v_src FROM public.table_commands WHERE id = p_source_command_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'source_not_found' USING ERRCODE='no_data_found'; END IF;

  SELECT * INTO v_tgt FROM public.table_commands WHERE id = p_target_command_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'target_not_found' USING ERRCODE='no_data_found'; END IF;

  IF v_src.session_id <> v_tgt.session_id THEN
    RAISE EXCEPTION 'invalid_merge: comandas de sessões diferentes' USING ERRCODE='check_violation';
  END IF;

  SELECT restaurant_id INTO v_rid FROM public.table_sessions WHERE id = v_src.session_id;
  IF NOT public._tables_can_manage(v_rid) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE='42501';
  END IF;

  IF v_src.closed_at IS NOT NULL OR v_tgt.closed_at IS NOT NULL THEN
    RAISE EXCEPTION 'command_closed' USING ERRCODE='check_violation';
  END IF;

  -- Migra pedidos vinculados
  WITH u AS (
    UPDATE public.orders
       SET table_command_id = p_target_command_id
     WHERE table_command_id = p_source_command_id
     RETURNING id
  )
  SELECT count(*) INTO v_moved FROM u;

  -- Fecha origem (não apaga)
  UPDATE public.table_commands
     SET closed_at = now()
   WHERE id = p_source_command_id;

  INSERT INTO public.table_session_events(session_id, restaurant_id, kind, actor_user_id, payload)
  VALUES (
    v_src.session_id, v_rid, 'command_merged', auth.uid(),
    jsonb_build_object(
      'source_command_id', p_source_command_id,
      'source_label',      v_src.label,
      'target_command_id', p_target_command_id,
      'target_label',      v_tgt.label,
      'orders_moved',      v_moved
    )
  );
END $$;

GRANT EXECUTE ON FUNCTION public.merge_commands(uuid, uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.merge_commands(uuid, uuid) FROM anon;