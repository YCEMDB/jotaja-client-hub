
-- ============================================================================
-- SPRINT 4.2 — Conversations foundation
-- ============================================================================

-- 1) conversations ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  channel public.comm_channel NOT NULL DEFAULT 'whatsapp',
  provider_code TEXT NOT NULL DEFAULT 'evolution',
  settings_id UUID REFERENCES public.communication_settings(id) ON DELETE SET NULL,
  peer_address TEXT NOT NULL,
  peer_name TEXT,
  last_message_at TIMESTAMPTZ,
  last_message_preview TEXT,
  last_direction TEXT CHECK (last_direction IN ('inbound','outbound','system')),
  unread_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','archived')),
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (restaurant_id, channel, peer_address)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversations TO authenticated;
GRANT ALL ON public.conversations TO service_role;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "team can read own conversations" ON public.conversations
  FOR SELECT TO authenticated USING (
    public.is_team_owner(auth.uid(), restaurant_id)
    OR EXISTS (SELECT 1 FROM public.user_roles ur
               WHERE ur.user_id = auth.uid()
                 AND ur.restaurant_id = conversations.restaurant_id
                 AND ur.role IN ('employee','manager'))
  );

CREATE POLICY "team can update own conversations" ON public.conversations
  FOR UPDATE TO authenticated USING (
    public.is_team_owner(auth.uid(), restaurant_id)
    OR EXISTS (SELECT 1 FROM public.user_roles ur
               WHERE ur.user_id = auth.uid()
                 AND ur.restaurant_id = conversations.restaurant_id
                 AND ur.role IN ('employee','manager'))
  );

CREATE INDEX IF NOT EXISTS conversations_restaurant_last_idx
  ON public.conversations(restaurant_id, last_message_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS conversations_customer_idx
  ON public.conversations(customer_id) WHERE customer_id IS NOT NULL;

DROP TRIGGER IF EXISTS trg_conversations_touch ON public.conversations;
CREATE TRIGGER trg_conversations_touch BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 2) conversation_messages --------------------------------------------------
CREATE TABLE IF NOT EXISTS public.conversation_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  direction TEXT NOT NULL CHECK (direction IN ('inbound','outbound','system')),
  source TEXT NOT NULL DEFAULT 'webhook' CHECK (source IN ('manual','automated','webhook','system')),
  author_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  body TEXT NOT NULL,
  provider_message_id TEXT,
  queue_id UUID REFERENCES public.communication_queue(id) ON DELETE SET NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'received'
    CHECK (status IN ('received','pending','sent','delivered','read','failed')),
  payload_raw JSONB,
  payload_normalized JSONB,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.conversation_messages TO authenticated;
GRANT ALL ON public.conversation_messages TO service_role;
ALTER TABLE public.conversation_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "team can read own conv messages" ON public.conversation_messages
  FOR SELECT TO authenticated USING (
    public.is_team_owner(auth.uid(), restaurant_id)
    OR EXISTS (SELECT 1 FROM public.user_roles ur
               WHERE ur.user_id = auth.uid()
                 AND ur.restaurant_id = conversation_messages.restaurant_id
                 AND ur.role IN ('employee','manager'))
  );

CREATE INDEX IF NOT EXISTS conv_messages_conv_idx
  ON public.conversation_messages(conversation_id, created_at ASC);
CREATE INDEX IF NOT EXISTS conv_messages_provider_msg_idx
  ON public.conversation_messages(provider_message_id) WHERE provider_message_id IS NOT NULL;

-- 3) quick_replies ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.quick_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  shortcut TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (restaurant_id, title)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.quick_replies TO authenticated;
GRANT ALL ON public.quick_replies TO service_role;
ALTER TABLE public.quick_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "team manages own quick replies" ON public.quick_replies
  FOR ALL TO authenticated
  USING (
    public.is_team_owner(auth.uid(), restaurant_id)
    OR EXISTS (SELECT 1 FROM public.user_roles ur
               WHERE ur.user_id = auth.uid()
                 AND ur.restaurant_id = quick_replies.restaurant_id
                 AND ur.role IN ('employee','manager'))
  )
  WITH CHECK (
    public.is_team_owner(auth.uid(), restaurant_id)
    OR EXISTS (SELECT 1 FROM public.user_roles ur
               WHERE ur.user_id = auth.uid()
                 AND ur.restaurant_id = quick_replies.restaurant_id
                 AND ur.role IN ('employee','manager'))
  );

DROP TRIGGER IF EXISTS trg_quick_replies_touch ON public.quick_replies;
CREATE TRIGGER trg_quick_replies_touch BEFORE UPDATE ON public.quick_replies
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 4) find_or_create_conversation -------------------------------------------
CREATE OR REPLACE FUNCTION public.find_or_create_conversation(
  p_restaurant_id UUID,
  p_channel public.comm_channel,
  p_peer_address TEXT,
  p_provider_code TEXT DEFAULT 'evolution',
  p_settings_id UUID DEFAULT NULL,
  p_peer_name TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_id UUID;
  v_peer TEXT := regexp_replace(coalesce(p_peer_address,''), '\D', '', 'g');
  v_customer UUID;
BEGIN
  IF p_restaurant_id IS NULL OR length(v_peer) < 4 THEN
    RAISE EXCEPTION 'invalid_input' USING ERRCODE = 'check_violation';
  END IF;

  SELECT id INTO v_customer FROM public.customers
    WHERE restaurant_id = p_restaurant_id AND phone = v_peer LIMIT 1;

  INSERT INTO public.conversations(
    restaurant_id, channel, provider_code, settings_id,
    peer_address, peer_name, customer_id, status
  ) VALUES (
    p_restaurant_id, p_channel, coalesce(p_provider_code,'evolution'), p_settings_id,
    v_peer, NULLIF(btrim(coalesce(p_peer_name,'')), ''), v_customer, 'open'
  )
  ON CONFLICT (restaurant_id, channel, peer_address) DO UPDATE
    SET settings_id = COALESCE(EXCLUDED.settings_id, public.conversations.settings_id),
        customer_id = COALESCE(public.conversations.customer_id, EXCLUDED.customer_id),
        peer_name   = COALESCE(public.conversations.peer_name, EXCLUDED.peer_name),
        status      = CASE WHEN public.conversations.status = 'archived'
                           THEN 'open' ELSE public.conversations.status END
  RETURNING id INTO v_id;

  RETURN v_id;
END $$;

-- 5) Trigger — atualiza resumo da conversa quando chega mensagem -----------
CREATE OR REPLACE FUNCTION public.trg_conversation_message_touch()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_preview TEXT;
BEGIN
  v_preview := substr(regexp_replace(coalesce(NEW.body,''), E'[\r\n]+', ' ', 'g'), 1, 160);
  UPDATE public.conversations
     SET last_message_at      = NEW.created_at,
         last_message_preview = v_preview,
         last_direction       = NEW.direction,
         unread_count         = CASE WHEN NEW.direction = 'inbound'
                                     THEN unread_count + 1 ELSE unread_count END,
         status               = 'open'
   WHERE id = NEW.conversation_id;

  PERFORM pg_notify('conversation_messages', jsonb_build_object(
    'conversation_id', NEW.conversation_id,
    'restaurant_id',   NEW.restaurant_id,
    'direction',       NEW.direction,
    'created_at',      NEW.created_at
  )::text);
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'trg_conversation_message_touch: %', SQLERRM;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_conv_msg_touch ON public.conversation_messages;
CREATE TRIGGER trg_conv_msg_touch AFTER INSERT ON public.conversation_messages
  FOR EACH ROW EXECUTE FUNCTION public.trg_conversation_message_touch();

-- 6) mark_conversation_read ------------------------------------------------
CREATE OR REPLACE FUNCTION public.mark_conversation_read(p_conversation_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_rid UUID;
BEGIN
  SELECT restaurant_id INTO v_rid FROM public.conversations WHERE id = p_conversation_id;
  IF v_rid IS NULL THEN RETURN; END IF;
  IF NOT (
    public.is_team_owner(auth.uid(), v_rid)
    OR EXISTS (SELECT 1 FROM public.user_roles ur
               WHERE ur.user_id = auth.uid() AND ur.restaurant_id = v_rid
                 AND ur.role IN ('employee','manager'))
  ) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  UPDATE public.conversations SET unread_count = 0 WHERE id = p_conversation_id;
END $$;

-- 7) send_manual_conversation_message ---------------------------------------
-- Reutiliza a fila da Sprint 4.1: insere em communication_queue e conversation_messages.
CREATE OR REPLACE FUNCTION public.send_manual_conversation_message(
  p_conversation_id UUID,
  p_body TEXT
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_conv public.conversations%ROWTYPE;
  v_settings_id UUID;
  v_channel public.comm_channel;
  v_body TEXT := btrim(coalesce(p_body,''));
  v_queue_id UUID;
  v_msg_id UUID;
BEGIN
  IF length(v_body) < 1 OR length(v_body) > 4000 THEN
    RAISE EXCEPTION 'invalid_body' USING ERRCODE = 'check_violation';
  END IF;

  SELECT * INTO v_conv FROM public.conversations WHERE id = p_conversation_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'conversation_not_found' USING ERRCODE = 'no_data_found'; END IF;

  IF NOT (
    public.is_team_owner(auth.uid(), v_conv.restaurant_id)
    OR EXISTS (SELECT 1 FROM public.user_roles ur
               WHERE ur.user_id = auth.uid() AND ur.restaurant_id = v_conv.restaurant_id
                 AND ur.role IN ('employee','manager'))
  ) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  v_channel := v_conv.channel;
  v_settings_id := v_conv.settings_id;
  IF v_settings_id IS NULL THEN
    SELECT id INTO v_settings_id FROM public.communication_settings
      WHERE restaurant_id = v_conv.restaurant_id
        AND channel = v_channel AND is_active = true AND deleted_at IS NULL
      ORDER BY created_at DESC LIMIT 1;
  END IF;
  IF v_settings_id IS NULL THEN
    RAISE EXCEPTION 'no_active_channel' USING ERRCODE = 'check_violation';
  END IF;

  INSERT INTO public.communication_queue(
    restaurant_id, settings_id, channel, event_name, to_address,
    variables, rendered_body, status
  ) VALUES (
    v_conv.restaurant_id, v_settings_id, v_channel, 'manual_reply', v_conv.peer_address,
    jsonb_build_object('body', v_body), v_body, 'pending'
  ) RETURNING id INTO v_queue_id;

  INSERT INTO public.conversation_messages(
    conversation_id, restaurant_id, direction, source, author_user_id,
    body, queue_id, status
  ) VALUES (
    p_conversation_id, v_conv.restaurant_id, 'outbound', 'manual', auth.uid(),
    v_body, v_queue_id, 'pending'
  ) RETURNING id INTO v_msg_id;

  PERFORM pg_notify('comm_queue', jsonb_build_object(
    'id', v_queue_id, 'restaurant_id', v_conv.restaurant_id
  )::text);

  RETURN v_msg_id;
END $$;

GRANT EXECUTE ON FUNCTION public.find_or_create_conversation(UUID, public.comm_channel, TEXT, TEXT, UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.mark_conversation_read(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.send_manual_conversation_message(UUID, TEXT) TO authenticated;

-- 8) Sync automático: quando a queue vai a 'sent'/'failed', reflete em conversation_messages.
CREATE OR REPLACE FUNCTION public.trg_sync_conv_msg_from_queue()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    UPDATE public.conversation_messages
       SET status = CASE
             WHEN NEW.status IN ('sent','delivered','read') THEN NEW.status
             WHEN NEW.status IN ('failed','dead_letter') THEN 'failed'
             ELSE status END,
           provider_message_id = COALESCE(NEW.provider_message_id, provider_message_id)
     WHERE queue_id = NEW.id;
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'trg_sync_conv_msg_from_queue: %', SQLERRM;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_queue_to_conv_msg ON public.communication_queue;
CREATE TRIGGER trg_queue_to_conv_msg AFTER UPDATE ON public.communication_queue
  FOR EACH ROW EXECUTE FUNCTION public.trg_sync_conv_msg_from_queue();
