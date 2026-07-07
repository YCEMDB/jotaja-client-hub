-- ============================================================================
-- Sprint 6 · Módulo Mesas & Comandas · Migração 2 (RPCs + triggers)
-- ============================================================================

-- ------------------------------------------------------------------
-- Helpers internos
-- ------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public._tables_can_manage(_rid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT public.is_team_owner(auth.uid(), _rid)
      OR EXISTS (SELECT 1 FROM public.user_roles ur
                  WHERE ur.user_id=auth.uid()
                    AND ur.restaurant_id=_rid
                    AND ur.role IN ('employee','manager'));
$$;

CREATE OR REPLACE FUNCTION public._tables_max_for(_rid uuid)
RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT NULLIF((p.features->>'tables_max'),'null')::int
    FROM public.restaurants r
    JOIN public.app_plans p ON p.id = COALESCE(r.plan_id,'starter')
   WHERE r.id = _rid;
$$;
-- Retorna NULL se ilimitado (business) ou se tables_max='null'; 0 = bloqueado.

-- ------------------------------------------------------------------
-- Trigger: enforce_tables_max
-- ------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_tables_max()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_max int; v_count int; v_plan text;
BEGIN
  SELECT plan_id INTO v_plan FROM public.restaurants WHERE id = NEW.restaurant_id;
  v_max := public._tables_max_for(NEW.restaurant_id);
  IF v_max IS NULL THEN RETURN NEW; END IF; -- ilimitado
  IF v_max <= 0 THEN
    RAISE EXCEPTION 'plan_feature_locked: seu plano (%) não inclui mesas. Faça upgrade para Pro.', v_plan
      USING ERRCODE='check_violation';
  END IF;
  SELECT count(*) INTO v_count FROM public.restaurant_tables WHERE restaurant_id = NEW.restaurant_id;
  IF v_count >= v_max THEN
    RAISE EXCEPTION 'plan_limit_reached: seu plano (%) permite % mesas. Faça upgrade.', v_plan, v_max
      USING ERRCODE='check_violation';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS restaurant_tables_enforce_max ON public.restaurant_tables;
CREATE TRIGGER restaurant_tables_enforce_max
  BEFORE INSERT ON public.restaurant_tables
  FOR EACH ROW EXECUTE FUNCTION public.enforce_tables_max();

-- ------------------------------------------------------------------
-- Trigger: log de eventos ao mudar status da sessão
-- ------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trg_table_session_status_event()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF TG_OP='INSERT' THEN
    INSERT INTO public.table_session_events(session_id, restaurant_id, kind, actor_user_id, payload)
    VALUES (NEW.id, NEW.restaurant_id, 'opened', NEW.opened_by,
            jsonb_build_object('table_id', NEW.table_id, 'party_size', NEW.party_size));
    RETURN NEW;
  END IF;
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.table_session_events(session_id, restaurant_id, kind, actor_user_id, payload)
    VALUES (NEW.id, NEW.restaurant_id,
            CASE NEW.status::text
              WHEN 'closed'    THEN 'closed'
              WHEN 'cancelled' THEN 'cancelled'
              WHEN 'blocked'   THEN 'blocked'
              WHEN 'closing'   THEN 'closed'
              ELSE 'unblocked'
            END,
            auth.uid(),
            jsonb_build_object('from', OLD.status::text, 'to', NEW.status::text));
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS table_sessions_status_event ON public.table_sessions;
CREATE TRIGGER table_sessions_status_event
  AFTER INSERT OR UPDATE OF status ON public.table_sessions
  FOR EACH ROW EXECUTE FUNCTION public.trg_table_session_status_event();

-- ------------------------------------------------------------------
-- Trigger: quando order recebe table_session_id, loga evento
-- ------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trg_order_table_link_event()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NEW.table_session_id IS NOT NULL
     AND (TG_OP='INSERT' OR NEW.table_session_id IS DISTINCT FROM OLD.table_session_id) THEN
    INSERT INTO public.table_session_events(session_id, restaurant_id, kind, actor_user_id, payload)
    VALUES (NEW.table_session_id, NEW.restaurant_id, 'order_added', auth.uid(),
            jsonb_build_object('order_id', NEW.id, 'order_number', NEW.order_number,
                               'total', NEW.total, 'command_id', NEW.table_command_id));
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS orders_table_link_event ON public.orders;
CREATE TRIGGER orders_table_link_event
  AFTER INSERT OR UPDATE OF table_session_id ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.trg_order_table_link_event();

-- ============================================================================
-- RPCs · Cadastro de mesa
-- ============================================================================

CREATE OR REPLACE FUNCTION public.create_table(
  p_restaurant_id uuid, p_number int, p_name text DEFAULT NULL,
  p_area text DEFAULT NULL, p_capacity int DEFAULT 2, p_notes text DEFAULT NULL
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_id uuid;
BEGIN
  IF NOT public.is_team_owner(auth.uid(), p_restaurant_id) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE='42501';
  END IF;
  INSERT INTO public.restaurant_tables(restaurant_id, number, name, area, capacity, notes)
  VALUES (p_restaurant_id, p_number, NULLIF(btrim(p_name),''), NULLIF(btrim(p_area),''),
          COALESCE(p_capacity,2), NULLIF(btrim(p_notes),''))
  RETURNING id INTO v_id;
  RETURN v_id;
END $$;

CREATE OR REPLACE FUNCTION public.update_table(p_table_id uuid, p_patch jsonb)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_rid uuid;
BEGIN
  SELECT restaurant_id INTO v_rid FROM public.restaurant_tables WHERE id=p_table_id;
  IF v_rid IS NULL THEN RAISE EXCEPTION 'not_found' USING ERRCODE='no_data_found'; END IF;
  IF NOT public.is_team_owner(auth.uid(), v_rid) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE='42501';
  END IF;
  UPDATE public.restaurant_tables SET
    number     = COALESCE((p_patch->>'number')::int, number),
    name       = CASE WHEN p_patch ? 'name' THEN NULLIF(btrim(p_patch->>'name'),'') ELSE name END,
    area       = CASE WHEN p_patch ? 'area' THEN NULLIF(btrim(p_patch->>'area'),'') ELSE area END,
    capacity   = COALESCE((p_patch->>'capacity')::int, capacity),
    notes      = CASE WHEN p_patch ? 'notes' THEN NULLIF(btrim(p_patch->>'notes'),'') ELSE notes END,
    is_active  = COALESCE((p_patch->>'is_active')::boolean, is_active),
    position_x = COALESCE((p_patch->>'position_x')::int, position_x),
    position_y = COALESCE((p_patch->>'position_y')::int, position_y)
  WHERE id = p_table_id;
END $$;

CREATE OR REPLACE FUNCTION public.delete_table(p_table_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_rid uuid;
BEGIN
  SELECT restaurant_id INTO v_rid FROM public.restaurant_tables WHERE id=p_table_id;
  IF v_rid IS NULL THEN RETURN; END IF;
  IF NOT public.is_team_owner(auth.uid(), v_rid) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE='42501';
  END IF;
  IF EXISTS (SELECT 1 FROM public.table_sessions WHERE table_id=p_table_id AND status IN ('open','closing')) THEN
    RAISE EXCEPTION 'table_in_use: mesa tem sessão aberta' USING ERRCODE='check_violation';
  END IF;
  DELETE FROM public.restaurant_tables WHERE id=p_table_id;
END $$;

CREATE OR REPLACE FUNCTION public.regen_table_qr(p_table_id uuid)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_rid uuid; v_tok text;
BEGIN
  SELECT restaurant_id INTO v_rid FROM public.restaurant_tables WHERE id=p_table_id;
  IF v_rid IS NULL THEN RAISE EXCEPTION 'not_found' USING ERRCODE='no_data_found'; END IF;
  IF NOT public.is_team_owner(auth.uid(), v_rid) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE='42501';
  END IF;
  UPDATE public.restaurant_tables
     SET qr_token = encode(gen_random_bytes(18),'hex')
   WHERE id = p_table_id
  RETURNING qr_token INTO v_tok;
  RETURN v_tok;
END $$;

-- ============================================================================
-- RPCs · Sessões
-- ============================================================================

CREATE OR REPLACE FUNCTION public.open_table_session(
  p_table_id uuid, p_party_size int DEFAULT NULL,
  p_customer_name text DEFAULT NULL, p_notes text DEFAULT NULL
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_rid uuid; v_id uuid; v_active boolean;
BEGIN
  SELECT restaurant_id, is_active INTO v_rid, v_active
    FROM public.restaurant_tables WHERE id=p_table_id;
  IF v_rid IS NULL THEN RAISE EXCEPTION 'not_found' USING ERRCODE='no_data_found'; END IF;
  IF NOT public._tables_can_manage(v_rid) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE='42501';
  END IF;
  IF NOT v_active THEN
    RAISE EXCEPTION 'table_inactive' USING ERRCODE='check_violation';
  END IF;
  IF EXISTS (SELECT 1 FROM public.table_sessions WHERE table_id=p_table_id AND status IN ('open','closing')) THEN
    RAISE EXCEPTION 'table_busy: mesa já possui sessão aberta' USING ERRCODE='unique_violation';
  END IF;

  INSERT INTO public.table_sessions(restaurant_id, table_id, opened_by, party_size, customer_name, notes)
  VALUES (v_rid, p_table_id, auth.uid(), p_party_size,
          NULLIF(btrim(p_customer_name),''), NULLIF(btrim(p_notes),''))
  RETURNING id INTO v_id;
  RETURN v_id;
END $$;

CREATE OR REPLACE FUNCTION public.cancel_table_session(p_session_id uuid, p_reason text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_rid uuid;
BEGIN
  SELECT restaurant_id INTO v_rid FROM public.table_sessions WHERE id=p_session_id;
  IF v_rid IS NULL THEN RAISE EXCEPTION 'not_found' USING ERRCODE='no_data_found'; END IF;
  IF NOT public._tables_can_manage(v_rid) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE='42501';
  END IF;
  UPDATE public.table_sessions
     SET status='cancelled', closed_at=now(), closed_by=auth.uid(),
         notes = COALESCE(notes,'') || CASE WHEN p_reason IS NOT NULL THEN E'\ncancelado: '||p_reason ELSE '' END
   WHERE id = p_session_id AND status IN ('open','closing');
END $$;

CREATE OR REPLACE FUNCTION public.block_table(p_table_id uuid, p_reason text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_rid uuid; v_sid uuid;
BEGIN
  SELECT restaurant_id INTO v_rid FROM public.restaurant_tables WHERE id=p_table_id;
  IF v_rid IS NULL THEN RAISE EXCEPTION 'not_found' USING ERRCODE='no_data_found'; END IF;
  IF NOT public.is_team_owner(auth.uid(), v_rid) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE='42501';
  END IF;
  -- Fecha sessão aberta se houver e cria uma bloqueada
  UPDATE public.table_sessions SET status='cancelled', closed_at=now(), closed_by=auth.uid()
   WHERE table_id=p_table_id AND status IN ('open','closing');
  INSERT INTO public.table_sessions(restaurant_id, table_id, opened_by, status, notes)
  VALUES (v_rid, p_table_id, auth.uid(), 'blocked', p_reason)
  RETURNING id INTO v_sid;
END $$;

CREATE OR REPLACE FUNCTION public.unblock_table(p_table_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_rid uuid;
BEGIN
  SELECT restaurant_id INTO v_rid FROM public.restaurant_tables WHERE id=p_table_id;
  IF v_rid IS NULL THEN RAISE EXCEPTION 'not_found' USING ERRCODE='no_data_found'; END IF;
  IF NOT public.is_team_owner(auth.uid(), v_rid) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE='42501';
  END IF;
  UPDATE public.table_sessions
     SET status='closed', closed_at=now(), closed_by=auth.uid()
   WHERE table_id=p_table_id AND status='blocked';
END $$;

-- Fechamento com split + cash movements + comunicação
CREATE OR REPLACE FUNCTION public.close_table_session(
  p_session_id uuid, p_splits jsonb DEFAULT '[]'::jsonb, p_force boolean DEFAULT false
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  v_sess public.table_sessions%ROWTYPE;
  v_total numeric(10,2) := 0;
  v_paid  numeric(10,2) := 0;
  v_open_orders int;
  v_split jsonb; v_method text; v_amount numeric;
  v_cash_session uuid;
  v_table_number int;
BEGIN
  SELECT * INTO v_sess FROM public.table_sessions WHERE id=p_session_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'not_found' USING ERRCODE='no_data_found'; END IF;
  IF NOT public._tables_can_manage(v_sess.restaurant_id) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE='42501';
  END IF;
  IF v_sess.status NOT IN ('open','closing') THEN
    RAISE EXCEPTION 'session_not_open' USING ERRCODE='check_violation';
  END IF;

  -- Só permite fechar quando todos pedidos estão em estado terminal, ou se p_force + é owner
  SELECT count(*) INTO v_open_orders
    FROM public.orders
   WHERE table_session_id = p_session_id
     AND status::text NOT IN ('delivered','cancelled');

  IF v_open_orders > 0 AND NOT p_force THEN
    RAISE EXCEPTION 'session_has_open_orders: % pedidos ainda em preparo. Use forçar para fechar mesmo assim.', v_open_orders
      USING ERRCODE='check_violation';
  END IF;
  IF v_open_orders > 0 AND p_force
     AND NOT public.is_team_owner(auth.uid(), v_sess.restaurant_id) THEN
    RAISE EXCEPTION 'forbidden: apenas o dono pode forçar fechamento' USING ERRCODE='42501';
  END IF;

  SELECT COALESCE(SUM(total),0) INTO v_total FROM public.orders
   WHERE table_session_id = p_session_id AND status::text <> 'cancelled';

  -- Grava splits
  IF jsonb_array_length(COALESCE(p_splits,'[]'::jsonb)) > 0 THEN
    FOR v_split IN SELECT * FROM jsonb_array_elements(p_splits) LOOP
      v_method := COALESCE(v_split->>'method','cash');
      v_amount := GREATEST(0, COALESCE((v_split->>'amount')::numeric, 0));
      IF v_amount > 0 THEN
        INSERT INTO public.table_split_payments(session_id, restaurant_id, method, amount, payer_label)
        VALUES (p_session_id, v_sess.restaurant_id, v_method, v_amount, v_split->>'payer_label');
        v_paid := v_paid + v_amount;
      END IF;
    END LOOP;
  END IF;

  -- Alimenta caixa aberto se existir (não obrigatório)
  SELECT id INTO v_cash_session FROM public.cash_sessions
   WHERE restaurant_id = v_sess.restaurant_id AND closed_at IS NULL
   LIMIT 1;
  IF v_cash_session IS NOT NULL AND v_paid > 0 THEN
    INSERT INTO public.cash_movements(session_id, kind, amount, description, created_by)
    VALUES (v_cash_session, 'sale', v_paid,
            'Mesa fechada · sessão '||left(p_session_id::text,8), auth.uid());
  END IF;

  SELECT number INTO v_table_number FROM public.restaurant_tables WHERE id = v_sess.table_id;

  UPDATE public.table_sessions
     SET status='closed', closed_at=now(), closed_by=auth.uid()
   WHERE id=p_session_id;

  -- Fecha comandas abertas
  UPDATE public.table_commands SET closed_at = now()
   WHERE session_id = p_session_id AND closed_at IS NULL;

  -- Dispara comunicação (se houver telefone de algum pedido da sessão)
  BEGIN
    PERFORM public.enqueue_communication(
      v_sess.restaurant_id, 'table_closed',
      jsonb_build_object('table_number', v_table_number, 'total', to_char(v_total,'FM999999990.00')),
      COALESCE((SELECT customer_phone FROM public.orders
                 WHERE table_session_id=p_session_id AND customer_phone IS NOT NULL
                 ORDER BY created_at DESC LIMIT 1),''),
      'whatsapp'::public.comm_channel,
      'table_closed:'||p_session_id::text
    );
  EXCEPTION WHEN OTHERS THEN NULL; END;

  RETURN jsonb_build_object(
    'session_id', p_session_id,
    'total',      v_total,
    'paid',       v_paid,
    'balance',    v_total - v_paid,
    'forced',     (v_open_orders > 0 AND p_force)
  );
END $$;

-- ============================================================================
-- RPCs · Comandas
-- ============================================================================

CREATE OR REPLACE FUNCTION public.open_command(
  p_session_id uuid, p_label text, p_holder_name text DEFAULT NULL
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_rid uuid; v_id uuid;
BEGIN
  SELECT restaurant_id INTO v_rid FROM public.table_sessions WHERE id=p_session_id AND status='open';
  IF v_rid IS NULL THEN RAISE EXCEPTION 'session_not_open' USING ERRCODE='check_violation'; END IF;
  IF NOT public._tables_can_manage(v_rid) THEN RAISE EXCEPTION 'forbidden' USING ERRCODE='42501'; END IF;
  INSERT INTO public.table_commands(session_id, restaurant_id, label, holder_name)
  VALUES (p_session_id, v_rid, COALESCE(NULLIF(btrim(p_label),''),'Comanda'),
          NULLIF(btrim(p_holder_name),''))
  RETURNING id INTO v_id;
  INSERT INTO public.table_session_events(session_id, restaurant_id, kind, actor_user_id, payload)
  VALUES (p_session_id, v_rid, 'command_opened', auth.uid(),
          jsonb_build_object('command_id', v_id, 'label', p_label));
  RETURN v_id;
END $$;

CREATE OR REPLACE FUNCTION public.close_command(p_command_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_rid uuid; v_sid uuid;
BEGIN
  SELECT restaurant_id, session_id INTO v_rid, v_sid
    FROM public.table_commands WHERE id=p_command_id;
  IF v_rid IS NULL THEN RETURN; END IF;
  IF NOT public._tables_can_manage(v_rid) THEN RAISE EXCEPTION 'forbidden' USING ERRCODE='42501'; END IF;
  UPDATE public.table_commands SET closed_at = now() WHERE id=p_command_id AND closed_at IS NULL;
  INSERT INTO public.table_session_events(session_id, restaurant_id, kind, actor_user_id, payload)
  VALUES (v_sid, v_rid, 'command_closed', auth.uid(), jsonb_build_object('command_id', p_command_id));
END $$;

-- ============================================================================
-- RPCs · Vincular / transferir / mesclar / dividir
-- ============================================================================

CREATE OR REPLACE FUNCTION public.attach_order_to_session(
  p_order_id uuid, p_session_id uuid, p_command_id uuid DEFAULT NULL
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_rid uuid; v_sess_rid uuid; v_num int;
BEGIN
  SELECT restaurant_id INTO v_rid FROM public.orders WHERE id=p_order_id;
  SELECT restaurant_id INTO v_sess_rid FROM public.table_sessions WHERE id=p_session_id AND status='open';
  IF v_rid IS NULL OR v_sess_rid IS NULL OR v_rid <> v_sess_rid THEN
    RAISE EXCEPTION 'invalid_link' USING ERRCODE='check_violation';
  END IF;
  IF NOT public._tables_can_manage(v_rid) THEN RAISE EXCEPTION 'forbidden' USING ERRCODE='42501'; END IF;
  IF p_command_id IS NOT NULL AND NOT EXISTS
     (SELECT 1 FROM public.table_commands WHERE id=p_command_id AND session_id=p_session_id) THEN
    RAISE EXCEPTION 'invalid_command' USING ERRCODE='check_violation';
  END IF;
  SELECT rt.number INTO v_num
    FROM public.table_sessions ts JOIN public.restaurant_tables rt ON rt.id=ts.table_id
   WHERE ts.id=p_session_id;
  UPDATE public.orders
     SET table_session_id=p_session_id, table_command_id=p_command_id, table_number=v_num
   WHERE id=p_order_id;
END $$;

CREATE OR REPLACE FUNCTION public.transfer_orders(
  p_order_ids uuid[], p_target_session_id uuid, p_target_command_id uuid DEFAULT NULL
) RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_rid uuid; v_num int; v_n int;
BEGIN
  SELECT restaurant_id INTO v_rid FROM public.table_sessions WHERE id=p_target_session_id AND status='open';
  IF v_rid IS NULL THEN RAISE EXCEPTION 'target_session_not_open' USING ERRCODE='check_violation'; END IF;
  IF NOT public._tables_can_manage(v_rid) THEN RAISE EXCEPTION 'forbidden' USING ERRCODE='42501'; END IF;
  IF p_target_command_id IS NOT NULL AND NOT EXISTS
     (SELECT 1 FROM public.table_commands WHERE id=p_target_command_id AND session_id=p_target_session_id) THEN
    RAISE EXCEPTION 'invalid_command' USING ERRCODE='check_violation';
  END IF;
  SELECT rt.number INTO v_num
    FROM public.table_sessions ts JOIN public.restaurant_tables rt ON rt.id=ts.table_id
   WHERE ts.id=p_target_session_id;

  WITH u AS (
    UPDATE public.orders
       SET table_session_id=p_target_session_id, table_command_id=p_target_command_id, table_number=v_num
     WHERE id = ANY(p_order_ids) AND restaurant_id = v_rid
     RETURNING id
  )
  SELECT count(*) INTO v_n FROM u;

  INSERT INTO public.table_session_events(session_id, restaurant_id, kind, actor_user_id, payload)
  VALUES (p_target_session_id, v_rid, 'transferred', auth.uid(),
          jsonb_build_object('count', v_n, 'order_ids', to_jsonb(p_order_ids),
                             'command_id', p_target_command_id));
  RETURN v_n;
END $$;

CREATE OR REPLACE FUNCTION public.merge_sessions(
  p_source_session_id uuid, p_target_session_id uuid
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_rid uuid; v_trid uuid; v_num int;
BEGIN
  SELECT restaurant_id INTO v_rid FROM public.table_sessions WHERE id=p_source_session_id AND status='open';
  SELECT restaurant_id INTO v_trid FROM public.table_sessions WHERE id=p_target_session_id AND status='open';
  IF v_rid IS NULL OR v_trid IS NULL OR v_rid <> v_trid THEN
    RAISE EXCEPTION 'invalid_merge' USING ERRCODE='check_violation';
  END IF;
  IF NOT public._tables_can_manage(v_rid) THEN RAISE EXCEPTION 'forbidden' USING ERRCODE='42501'; END IF;

  SELECT rt.number INTO v_num
    FROM public.table_sessions ts JOIN public.restaurant_tables rt ON rt.id=ts.table_id
   WHERE ts.id=p_target_session_id;

  UPDATE public.orders SET table_session_id=p_target_session_id, table_number=v_num
   WHERE table_session_id=p_source_session_id;
  UPDATE public.table_commands SET session_id=p_target_session_id
   WHERE session_id=p_source_session_id;
  UPDATE public.table_sessions
     SET status='closed', closed_at=now(), closed_by=auth.uid(),
         merged_into_session_id=p_target_session_id
   WHERE id=p_source_session_id;

  INSERT INTO public.table_session_events(session_id, restaurant_id, kind, actor_user_id, payload)
  VALUES (p_target_session_id, v_rid, 'merged', auth.uid(),
          jsonb_build_object('source_session_id', p_source_session_id));
END $$;

-- ============================================================================
-- RPCs · Leitura
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_table_map(p_restaurant_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE v_out jsonb;
BEGIN
  IF NOT public._tables_can_manage(p_restaurant_id) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE='42501';
  END IF;
  SELECT COALESCE(jsonb_agg(row_to_json(x) ORDER BY x.number), '[]'::jsonb) INTO v_out FROM (
    SELECT
      t.id, t.number, t.name, t.area, t.capacity, t.qr_token, t.is_active,
      t.position_x, t.position_y,
      s.id           AS session_id,
      s.status       AS session_status,
      s.opened_at,
      s.party_size,
      s.customer_name,
      COALESCE(o.total_open,0)::numeric(10,2) AS current_total,
      COALESCE(o.n_open,0)::int               AS open_orders,
      CASE
        WHEN NOT t.is_active           THEN 'inactive'
        WHEN s.status = 'blocked'      THEN 'blocked'
        WHEN s.status IN ('open','closing') THEN s.status::text
        ELSE 'free'
      END AS ui_status
    FROM public.restaurant_tables t
    LEFT JOIN LATERAL (
      SELECT * FROM public.table_sessions
       WHERE table_id = t.id AND status IN ('open','closing','blocked')
       ORDER BY opened_at DESC LIMIT 1
    ) s ON true
    LEFT JOIN LATERAL (
      SELECT COALESCE(SUM(o.total),0) AS total_open, count(*) AS n_open
        FROM public.orders o
       WHERE o.table_session_id = s.id AND o.status::text <> 'cancelled'
    ) o ON true
    WHERE t.restaurant_id = p_restaurant_id
  ) x;
  RETURN v_out;
END $$;

CREATE OR REPLACE FUNCTION public.get_session_detail(p_session_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE v_rid uuid; v_out jsonb;
BEGIN
  SELECT restaurant_id INTO v_rid FROM public.table_sessions WHERE id=p_session_id;
  IF v_rid IS NULL THEN RAISE EXCEPTION 'not_found' USING ERRCODE='no_data_found'; END IF;
  IF NOT public._tables_can_manage(v_rid) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE='42501';
  END IF;
  SELECT jsonb_build_object(
    'session', (SELECT to_jsonb(ts) FROM public.table_sessions ts WHERE ts.id=p_session_id),
    'table',   (SELECT to_jsonb(rt) FROM public.restaurant_tables rt
                 JOIN public.table_sessions ts ON ts.table_id=rt.id
                WHERE ts.id=p_session_id),
    'commands', (SELECT COALESCE(jsonb_agg(to_jsonb(c) ORDER BY c.created_at),'[]'::jsonb)
                   FROM public.table_commands c WHERE c.session_id=p_session_id),
    'orders', (SELECT COALESCE(jsonb_agg(jsonb_build_object(
                     'id', o.id, 'order_number', o.order_number, 'status', o.status,
                     'total', o.total, 'payment', o.payment,
                     'command_id', o.table_command_id, 'created_at', o.created_at,
                     'items', (SELECT COALESCE(jsonb_agg(jsonb_build_object(
                                     'id', oi.id, 'name', oi.product_name,
                                     'quantity', oi.quantity, 'unit_price', oi.unit_price,
                                     'subtotal', oi.subtotal)),'[]'::jsonb)
                                 FROM public.order_items oi WHERE oi.order_id=o.id)
                   ) ORDER BY o.created_at),'[]'::jsonb)
                   FROM public.orders o WHERE o.table_session_id=p_session_id),
    'splits', (SELECT COALESCE(jsonb_agg(to_jsonb(sp) ORDER BY sp.created_at),'[]'::jsonb)
                 FROM public.table_split_payments sp WHERE sp.session_id=p_session_id),
    'events', (SELECT COALESCE(jsonb_agg(to_jsonb(e) ORDER BY e.created_at DESC),'[]'::jsonb)
                 FROM public.table_session_events e WHERE e.session_id=p_session_id),
    'totals', (SELECT jsonb_build_object(
                   'orders_total', COALESCE(SUM(total) FILTER (WHERE status::text <> 'cancelled'),0),
                   'orders_count', count(*) FILTER (WHERE status::text <> 'cancelled'),
                   'paid',         COALESCE((SELECT SUM(amount) FROM public.table_split_payments
                                              WHERE session_id=p_session_id),0)
                 ) FROM public.orders WHERE table_session_id=p_session_id)
  ) INTO v_out;
  RETURN v_out;
END $$;

-- QR público: sem auth (chamado via server publishable client)
CREATE OR REPLACE FUNCTION public.get_public_table_by_qr(p_token text)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE v_out jsonb;
BEGIN
  SELECT jsonb_build_object(
    'table_id',       t.id,
    'table_number',   t.number,
    'table_name',     t.name,
    'restaurant_id',  r.id,
    'restaurant_slug', r.slug,
    'restaurant_name', r.name,
    'session_id',     s.id
  ) INTO v_out
    FROM public.restaurant_tables t
    JOIN public.restaurants r ON r.id = t.restaurant_id
    LEFT JOIN LATERAL (
      SELECT id FROM public.table_sessions
       WHERE table_id=t.id AND status IN ('open','closing') LIMIT 1
    ) s ON true
   WHERE t.qr_token = p_token AND t.is_active = true AND r.is_active = true;
  RETURN v_out;
END $$;

REVOKE ALL ON FUNCTION public.get_public_table_by_qr(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_table_by_qr(text) TO anon, authenticated;
