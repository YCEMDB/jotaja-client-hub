
-- =============================================================================
-- Sprint 4.3 — Automações + Timeline + Mídia
-- =============================================================================

-- 1) Mídia em conversation_messages
ALTER TABLE public.conversation_messages
  ADD COLUMN IF NOT EXISTS media_type TEXT NOT NULL DEFAULT 'text',
  ADD COLUMN IF NOT EXISTS media_url  TEXT,
  ADD COLUMN IF NOT EXISTS media_mime TEXT,
  ADD COLUMN IF NOT EXISTS caption    TEXT;

ALTER TABLE public.conversation_messages
  DROP CONSTRAINT IF EXISTS conversation_messages_media_type_check;
ALTER TABLE public.conversation_messages
  ADD  CONSTRAINT conversation_messages_media_type_check
  CHECK (media_type IN ('text','image','audio','document','video','sticker','location'));

-- 2) app_plans: automations_max
UPDATE public.app_plans SET features = features || jsonb_build_object('automations_max', 0)      WHERE id = 'starter';
UPDATE public.app_plans SET features = features || jsonb_build_object('automations_max', 10)     WHERE id = 'pro';
UPDATE public.app_plans SET features = features || jsonb_build_object('automations_max', null::int) WHERE id = 'business';

-- 3) Regras de automação
CREATE TABLE IF NOT EXISTS public.conversation_automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  code TEXT,                                   -- ex: 'status','pix','menu' (opcional, para seed)
  name TEXT NOT NULL,
  trigger_type TEXT NOT NULL DEFAULT 'keyword' CHECK (trigger_type IN ('keyword','regex')),
  trigger_value TEXT NOT NULL,
  match_mode TEXT NOT NULL DEFAULT 'contains' CHECK (match_mode IN ('exact','contains','starts_with')),
  response_template_id UUID REFERENCES public.communication_templates(id) ON DELETE SET NULL,
  response_body TEXT,
  handoff BOOLEAN NOT NULL DEFAULT false,     -- se true, marca conversa como 'needs_human'
  is_active BOOLEAN NOT NULL DEFAULT true,
  priority INT NOT NULL DEFAULT 100,
  cooldown_seconds INT NOT NULL DEFAULT 60,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT car_response_required CHECK (
    handoff = true OR response_template_id IS NOT NULL OR (response_body IS NOT NULL AND length(btrim(response_body)) > 0)
  )
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversation_automation_rules TO authenticated;
GRANT ALL ON public.conversation_automation_rules TO service_role;
ALTER TABLE public.conversation_automation_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY car_team_read ON public.conversation_automation_rules FOR SELECT TO authenticated
  USING (
    public.is_team_owner(auth.uid(), restaurant_id)
    OR EXISTS (SELECT 1 FROM public.user_roles ur
               WHERE ur.user_id=auth.uid() AND ur.restaurant_id=conversation_automation_rules.restaurant_id
                 AND ur.role IN ('employee','manager'))
  );
CREATE POLICY car_owner_write ON public.conversation_automation_rules FOR ALL TO authenticated
  USING (public.is_team_owner(auth.uid(), restaurant_id))
  WITH CHECK (public.is_team_owner(auth.uid(), restaurant_id));

CREATE INDEX IF NOT EXISTS car_rest_active_prio_idx
  ON public.conversation_automation_rules(restaurant_id, is_active, priority);

CREATE TRIGGER trg_car_touch BEFORE UPDATE ON public.conversation_automation_rules
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 4) Cooldown por conversa+regra
CREATE TABLE IF NOT EXISTS public.conversation_automation_fires (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  rule_id UUID NOT NULL REFERENCES public.conversation_automation_rules(id) ON DELETE CASCADE,
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  fired_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  queue_id UUID REFERENCES public.communication_queue(id) ON DELETE SET NULL
);
GRANT SELECT, INSERT ON public.conversation_automation_fires TO authenticated;
GRANT ALL ON public.conversation_automation_fires TO service_role;
ALTER TABLE public.conversation_automation_fires ENABLE ROW LEVEL SECURITY;
CREATE POLICY caf_team_read ON public.conversation_automation_fires FOR SELECT TO authenticated
  USING (
    public.is_team_owner(auth.uid(), restaurant_id)
    OR EXISTS (SELECT 1 FROM public.user_roles ur
               WHERE ur.user_id=auth.uid() AND ur.restaurant_id=conversation_automation_fires.restaurant_id
                 AND ur.role IN ('employee','manager'))
  );
CREATE INDEX IF NOT EXISTS caf_conv_rule_idx
  ON public.conversation_automation_fires(conversation_id, rule_id, fired_at DESC);

-- 5) conversations: status 'needs_human' já é livre (status é TEXT); só documenta

-- 6) Seed default rules
CREATE OR REPLACE FUNCTION public.seed_default_automation_rules(p_restaurant_id UUID)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_count INT := 0;
  v_defaults JSONB := '[
    {"code":"status","name":"Consultar status do pedido","trigger_value":"status","body":"Olá {{customer_name}}! Seu pedido #{{order_number}} está: *{{order_status}}*. Total: R$ {{order_total}}."},
    {"code":"pix","name":"Enviar dados PIX","trigger_value":"pix","body":"Para pagar via PIX, use o QR code enviado ou finalize pelo cardápio: {{menu_url}}"},
    {"code":"menu","name":"Enviar link do cardápio","trigger_value":"menu","body":"Confira nosso cardápio completo: {{menu_url}}"},
    {"code":"horario","name":"Horário de funcionamento","trigger_value":"horario","body":"Nosso horário: consulte no cardápio {{menu_url}}"},
    {"code":"endereco","name":"Endereço","trigger_value":"endereco","body":"Endereço e informações: {{menu_url}}"},
    {"code":"cancelar","name":"Cancelar pedido","trigger_value":"cancelar","body":"Recebemos sua solicitação. Um atendente vai confirmar em instantes.","handoff":true},
    {"code":"atendente","name":"Falar com atendente","trigger_value":"atendente","body":"Ok! Vou chamar um atendente pra você.","handoff":true}
  ]'::jsonb;
  r JSONB;
BEGIN
  IF NOT public.is_team_owner(auth.uid(), p_restaurant_id) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE='42501';
  END IF;
  FOR r IN SELECT * FROM jsonb_array_elements(v_defaults) LOOP
    IF NOT EXISTS (SELECT 1 FROM public.conversation_automation_rules
                    WHERE restaurant_id=p_restaurant_id AND code=(r->>'code')) THEN
      INSERT INTO public.conversation_automation_rules(
        restaurant_id, code, name, trigger_type, trigger_value, match_mode,
        response_body, handoff, is_active, priority, cooldown_seconds
      ) VALUES (
        p_restaurant_id, r->>'code', r->>'name', 'keyword', r->>'trigger_value', 'contains',
        r->>'body', COALESCE((r->>'handoff')::boolean, false), true, 100, 60
      );
      v_count := v_count + 1;
    END IF;
  END LOOP;
  RETURN v_count;
END $$;

-- 7) process_inbound_automation
CREATE OR REPLACE FUNCTION public.process_inbound_automation(
  p_conversation_id UUID,
  p_inbound_body TEXT
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_conv public.conversations%ROWTYPE;
  v_norm TEXT := lower(unaccent_safe(coalesce(p_inbound_body,'')));
  r RECORD;
  v_rule public.conversation_automation_rules%ROWTYPE;
  v_matched BOOLEAN;
  v_settings_id UUID;
  v_body TEXT;
  v_tpl public.communication_templates%ROWTYPE;
  v_queue_id UUID;
  v_customer public.customers%ROWTYPE;
  v_order public.orders%ROWTYPE;
  v_vars JSONB;
  v_menu_url TEXT;
  v_rest_slug TEXT;
BEGIN
  SELECT * INTO v_conv FROM public.conversations WHERE id = p_conversation_id;
  IF NOT FOUND OR length(coalesce(p_inbound_body,'')) < 1 THEN RETURN NULL; END IF;

  SELECT slug INTO v_rest_slug FROM public.restaurants WHERE id = v_conv.restaurant_id;
  v_menu_url := 'https://comandex.com.br/' || coalesce(v_rest_slug,'');

  IF v_conv.customer_id IS NOT NULL THEN
    SELECT * INTO v_customer FROM public.customers WHERE id = v_conv.customer_id;
  END IF;
  SELECT * INTO v_order FROM public.orders
    WHERE restaurant_id = v_conv.restaurant_id
      AND customer_phone = v_conv.peer_address
    ORDER BY created_at DESC LIMIT 1;

  v_vars := jsonb_build_object(
    'customer_name', COALESCE(v_customer.name, v_conv.peer_name, ''),
    'order_number',  COALESCE(v_order.order_number::text, ''),
    'order_status',  COALESCE(v_order.status::text, ''),
    'order_total',   to_char(COALESCE(v_order.total,0),'FM999999990.00'),
    'menu_url',      v_menu_url
  );

  FOR r IN
    SELECT * FROM public.conversation_automation_rules
     WHERE restaurant_id = v_conv.restaurant_id AND is_active = true
     ORDER BY priority ASC, created_at ASC
  LOOP
    v_matched := false;
    IF r.trigger_type = 'regex' THEN
      BEGIN
        v_matched := v_norm ~* r.trigger_value;
      EXCEPTION WHEN OTHERS THEN v_matched := false;
      END;
    ELSE
      IF r.match_mode = 'exact' THEN
        v_matched := btrim(v_norm) = lower(unaccent_safe(r.trigger_value));
      ELSIF r.match_mode = 'starts_with' THEN
        v_matched := position(lower(unaccent_safe(r.trigger_value)) IN btrim(v_norm)) = 1;
      ELSE
        v_matched := position(lower(unaccent_safe(r.trigger_value)) IN v_norm) > 0;
      END IF;
    END IF;
    IF v_matched THEN v_rule := r; EXIT; END IF;
  END LOOP;

  IF v_rule.id IS NULL THEN RETURN NULL; END IF;

  -- cooldown
  IF EXISTS (
    SELECT 1 FROM public.conversation_automation_fires
     WHERE conversation_id = p_conversation_id AND rule_id = v_rule.id
       AND fired_at > now() - (v_rule.cooldown_seconds || ' seconds')::interval
  ) THEN
    RETURN NULL;
  END IF;

  -- handoff sem resposta
  IF v_rule.handoff THEN
    UPDATE public.conversations
       SET status = 'needs_human', unread_count = unread_count
     WHERE id = p_conversation_id;
  END IF;

  -- monta corpo
  IF v_rule.response_template_id IS NOT NULL THEN
    SELECT * INTO v_tpl FROM public.communication_templates WHERE id = v_rule.response_template_id;
    v_body := private.comm_render(v_tpl.body, v_vars);
  ELSIF v_rule.response_body IS NOT NULL THEN
    v_body := private.comm_render(v_rule.response_body, v_vars);
  ELSE
    v_body := NULL;
  END IF;

  IF v_body IS NOT NULL AND length(btrim(v_body)) > 0 THEN
    v_settings_id := v_conv.settings_id;
    IF v_settings_id IS NULL THEN
      SELECT id INTO v_settings_id FROM public.communication_settings
        WHERE restaurant_id = v_conv.restaurant_id AND channel = v_conv.channel
          AND is_active = true AND deleted_at IS NULL
        ORDER BY created_at DESC LIMIT 1;
    END IF;

    IF v_settings_id IS NOT NULL THEN
      INSERT INTO public.communication_queue(
        restaurant_id, settings_id, channel, event_name, to_address,
        variables, rendered_body, status
      ) VALUES (
        v_conv.restaurant_id, v_settings_id, v_conv.channel,
        'automation:' || COALESCE(v_rule.code, v_rule.id::text),
        v_conv.peer_address, v_vars, v_body, 'pending'
      ) RETURNING id INTO v_queue_id;

      INSERT INTO public.conversation_messages(
        conversation_id, restaurant_id, direction, source,
        body, queue_id, status, payload_normalized
      ) VALUES (
        p_conversation_id, v_conv.restaurant_id, 'outbound', 'automated',
        v_body, v_queue_id, 'pending',
        jsonb_build_object('rule_code', v_rule.code, 'rule_id', v_rule.id)
      );

      PERFORM pg_notify('comm_queue', jsonb_build_object(
        'id', v_queue_id, 'restaurant_id', v_conv.restaurant_id
      )::text);
    END IF;
  END IF;

  INSERT INTO public.conversation_automation_fires(conversation_id, rule_id, restaurant_id, queue_id)
  VALUES (p_conversation_id, v_rule.id, v_conv.restaurant_id, v_queue_id);

  RETURN v_rule.id;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'process_inbound_automation: %', SQLERRM;
  RETURN NULL;
END $$;

-- unaccent seguro (fallback)
CREATE OR REPLACE FUNCTION public.unaccent_safe(t TEXT) RETURNS TEXT
LANGUAGE plpgsql IMMUTABLE SET search_path = public, pg_temp AS $$
BEGIN
  RETURN translate(coalesce(t,''),
    'áàâãäéèêëíìîïóòôõöúùûüçÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ',
    'aaaaaeeeeiiiiooooouuuucAAAAAEEEEIIIIOOOOOUUUUC');
END $$;

-- 8) Dashboards / timelines
CREATE OR REPLACE FUNCTION public.get_conversations_dashboard(p_restaurant_id UUID)
RETURNS JSONB
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_open INT; v_unanswered INT; v_avg NUMERIC;
  v_sent_today INT; v_recv_today INT; v_failed_today INT;
BEGIN
  IF NOT (public.is_team_owner(v_uid, p_restaurant_id)
    OR EXISTS (SELECT 1 FROM public.user_roles ur
               WHERE ur.user_id=v_uid AND ur.restaurant_id=p_restaurant_id
                 AND ur.role IN ('employee','manager'))) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE='42501';
  END IF;

  SELECT count(*) INTO v_open   FROM public.conversations
    WHERE restaurant_id=p_restaurant_id AND status IN ('open','needs_human');
  SELECT count(*) INTO v_unanswered FROM public.conversations
    WHERE restaurant_id=p_restaurant_id AND last_direction='inbound' AND status<>'archived';

  SELECT AVG(EXTRACT(EPOCH FROM (out_msg.created_at - in_msg.created_at)))::numeric
    INTO v_avg
    FROM public.conversation_messages in_msg
    JOIN LATERAL (
      SELECT created_at FROM public.conversation_messages
       WHERE conversation_id = in_msg.conversation_id
         AND direction='outbound'
         AND created_at > in_msg.created_at
       ORDER BY created_at ASC LIMIT 1
    ) out_msg ON true
   WHERE in_msg.restaurant_id=p_restaurant_id
     AND in_msg.direction='inbound'
     AND in_msg.created_at > now() - interval '7 days';

  SELECT count(*) INTO v_sent_today FROM public.conversation_messages
    WHERE restaurant_id=p_restaurant_id AND direction='outbound'
      AND created_at >= date_trunc('day', now());
  SELECT count(*) INTO v_recv_today FROM public.conversation_messages
    WHERE restaurant_id=p_restaurant_id AND direction='inbound'
      AND created_at >= date_trunc('day', now());
  SELECT count(*) INTO v_failed_today FROM public.communication_queue
    WHERE restaurant_id=p_restaurant_id AND status IN ('failed','dead_letter')
      AND created_at >= date_trunc('day', now());

  RETURN jsonb_build_object(
    'open_count', COALESCE(v_open,0),
    'unanswered_count', COALESCE(v_unanswered,0),
    'avg_response_seconds', COALESCE(v_avg,0),
    'messages_sent_today', COALESCE(v_sent_today,0),
    'messages_received_today', COALESCE(v_recv_today,0),
    'failures_today', COALESCE(v_failed_today,0)
  );
END $$;

CREATE OR REPLACE FUNCTION public.get_order_communication_timeline(p_order_id UUID)
RETURNS TABLE(
  id UUID, direction TEXT, source TEXT, body TEXT, media_type TEXT,
  media_url TEXT, caption TEXT, status TEXT, created_at TIMESTAMPTZ,
  rule_code TEXT
)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_rid UUID; v_phone TEXT;
BEGIN
  SELECT restaurant_id, customer_phone INTO v_rid, v_phone
    FROM public.orders WHERE id = p_order_id;
  IF v_rid IS NULL THEN RETURN; END IF;
  IF NOT (public.is_team_owner(v_uid, v_rid)
    OR EXISTS (SELECT 1 FROM public.user_roles ur
               WHERE ur.user_id=v_uid AND ur.restaurant_id=v_rid
                 AND ur.role IN ('employee','manager'))) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE='42501';
  END IF;

  RETURN QUERY
    SELECT m.id, m.direction, m.source, m.body, m.media_type,
           m.media_url, m.caption, m.status, m.created_at,
           (m.payload_normalized->>'rule_code')::text
      FROM public.conversation_messages m
      JOIN public.conversations c ON c.id = m.conversation_id
     WHERE m.restaurant_id = v_rid
       AND (m.order_id = p_order_id OR c.peer_address = v_phone)
     ORDER BY m.created_at ASC;
END $$;

CREATE OR REPLACE FUNCTION public.get_customer_conversation_timeline(p_customer_id UUID)
RETURNS JSONB
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_cust public.customers%ROWTYPE;
  v_msgs JSONB;
  v_orders JSONB;
BEGIN
  SELECT * INTO v_cust FROM public.customers WHERE id = p_customer_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('error','not_found'); END IF;
  IF NOT (public.is_team_owner(v_uid, v_cust.restaurant_id)
    OR EXISTS (SELECT 1 FROM public.user_roles ur
               WHERE ur.user_id=v_uid AND ur.restaurant_id=v_cust.restaurant_id
                 AND ur.role IN ('employee','manager'))) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE='42501';
  END IF;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', m.id, 'direction', m.direction, 'source', m.source, 'body', m.body,
    'media_type', m.media_type, 'media_url', m.media_url, 'caption', m.caption,
    'status', m.status, 'created_at', m.created_at,
    'rule_code', m.payload_normalized->>'rule_code'
  ) ORDER BY m.created_at DESC), '[]'::jsonb) INTO v_msgs
  FROM public.conversation_messages m
  JOIN public.conversations c ON c.id = m.conversation_id
  WHERE c.restaurant_id = v_cust.restaurant_id
    AND c.peer_address = v_cust.phone;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', o.id, 'order_number', o.order_number, 'status', o.status,
    'total', o.total, 'created_at', o.created_at
  ) ORDER BY o.created_at DESC), '[]'::jsonb) INTO v_orders
  FROM public.orders o
  WHERE o.customer_id = p_customer_id;

  RETURN jsonb_build_object('customer', to_jsonb(v_cust), 'messages', v_msgs, 'orders', v_orders);
END $$;
