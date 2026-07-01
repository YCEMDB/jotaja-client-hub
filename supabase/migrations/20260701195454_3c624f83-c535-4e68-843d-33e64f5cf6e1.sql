
-- ============================================================
-- SPRINT 4.1 — COMMUNICATION PLATFORM (foundation)
-- Genérica, adapter-friendly. Evolution é só o 1º provider.
-- ============================================================

-- ------------------------------------------------------------
-- ENUMs
-- ------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.comm_channel AS ENUM
    ('whatsapp','sms','email','push','telegram','instagram','messenger','voice');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.comm_category AS ENUM
    ('orders','payment','delivery','marketing','crm','system');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.comm_health AS ENUM
    ('healthy','degraded','down','unknown');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.comm_status AS ENUM
    ('pending','processing','sent','failed','retrying','dead_letter','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.comm_log_direction AS ENUM ('outbound','inbound');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ------------------------------------------------------------
-- 1) PROVIDERS (catálogo estático)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.communication_providers (
  code         text PRIMARY KEY,
  name         text NOT NULL,
  channel      public.comm_channel NOT NULL,
  capabilities jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active    boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.communication_providers TO authenticated;
GRANT ALL    ON public.communication_providers TO service_role;
ALTER TABLE public.communication_providers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "providers_read_authenticated"
  ON public.communication_providers FOR SELECT TO authenticated USING (true);

CREATE TRIGGER trg_communication_providers_updated
  BEFORE UPDATE ON public.communication_providers
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ------------------------------------------------------------
-- 2) SETTINGS (canal por restaurante)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.communication_settings (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id     uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  provider_code     text NOT NULL REFERENCES public.communication_providers(code),
  channel           public.comm_channel NOT NULL,
  display_name      text NOT NULL,
  config            jsonb NOT NULL DEFAULT '{}'::jsonb,   -- endpoint, número, ambiente, sem segredos
  webhook_secret    text,                                  -- HMAC de webhooks inbound
  is_active         boolean NOT NULL DEFAULT true,
  last_sync_at      timestamptz,
  last_error        text,
  last_latency_ms   integer,
  health            public.comm_health NOT NULL DEFAULT 'unknown',
  deleted_at        timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_comm_settings_restaurant
  ON public.communication_settings(restaurant_id) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_comm_settings_default
  ON public.communication_settings(restaurant_id, channel)
  WHERE deleted_at IS NULL AND is_active = true;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.communication_settings TO authenticated;
GRANT ALL ON public.communication_settings TO service_role;
ALTER TABLE public.communication_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "comm_settings_owner_read" ON public.communication_settings
  FOR SELECT TO authenticated
  USING (public.is_team_owner(auth.uid(), restaurant_id));
CREATE POLICY "comm_settings_owner_write" ON public.communication_settings
  FOR ALL TO authenticated
  USING (public.is_team_owner(auth.uid(), restaurant_id))
  WITH CHECK (public.is_team_owner(auth.uid(), restaurant_id));

CREATE TRIGGER trg_communication_settings_updated
  BEFORE UPDATE ON public.communication_settings
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ------------------------------------------------------------
-- 3) SECRETS (server-only, nunca frontend)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.communication_secrets (
  settings_id  uuid PRIMARY KEY REFERENCES public.communication_settings(id) ON DELETE CASCADE,
  token        text,
  api_key      text,
  extra        jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at   timestamptz NOT NULL DEFAULT now()
);
-- Sem GRANT para authenticated/anon: apenas service_role acessa via server functions.
GRANT ALL ON public.communication_secrets TO service_role;
ALTER TABLE public.communication_secrets ENABLE ROW LEVEL SECURITY;
-- Nenhuma policy: RLS default DENY para authenticated e anon.

CREATE TRIGGER trg_communication_secrets_updated
  BEFORE UPDATE ON public.communication_secrets
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ------------------------------------------------------------
-- 4) TEMPLATES (versionados)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.communication_templates (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid REFERENCES public.restaurants(id) ON DELETE CASCADE, -- NULL = global
  channel       public.comm_channel NOT NULL,
  category      public.comm_category NOT NULL,
  code          text NOT NULL,           -- slug estável (ex.: "order_confirmed")
  name          text NOT NULL,
  subject       text,                    -- p/ email/push
  body          text NOT NULL,
  variables     text[] NOT NULL DEFAULT '{}'::text[],
  version       integer NOT NULL DEFAULT 1,
  parent_id     uuid REFERENCES public.communication_templates(id) ON DELETE SET NULL,
  is_active     boolean NOT NULL DEFAULT true,
  deleted_at    timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_comm_templates_code_ver
  ON public.communication_templates(COALESCE(restaurant_id,'00000000-0000-0000-0000-000000000000'::uuid), code, version)
  WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_comm_templates_restaurant
  ON public.communication_templates(restaurant_id) WHERE deleted_at IS NULL;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.communication_templates TO authenticated;
GRANT ALL ON public.communication_templates TO service_role;
ALTER TABLE public.communication_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "comm_tpl_read" ON public.communication_templates
  FOR SELECT TO authenticated USING (
    restaurant_id IS NULL
    OR public.is_team_owner(auth.uid(), restaurant_id)
  );
CREATE POLICY "comm_tpl_write" ON public.communication_templates
  FOR ALL TO authenticated
  USING (restaurant_id IS NOT NULL AND public.is_team_owner(auth.uid(), restaurant_id))
  WITH CHECK (restaurant_id IS NOT NULL AND public.is_team_owner(auth.uid(), restaurant_id));

CREATE TRIGGER trg_communication_templates_updated
  BEFORE UPDATE ON public.communication_templates
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ------------------------------------------------------------
-- 5) EVENT BINDINGS (evento → template)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.communication_event_bindings (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  event_name    text NOT NULL,     -- 'order_confirmed', 'payment_paid', ...
  channel       public.comm_channel NOT NULL,
  template_id   uuid NOT NULL REFERENCES public.communication_templates(id) ON DELETE CASCADE,
  settings_id   uuid REFERENCES public.communication_settings(id) ON DELETE SET NULL,
  conditions    jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active     boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_comm_event_lookup
  ON public.communication_event_bindings(restaurant_id, event_name, channel) WHERE is_active;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.communication_event_bindings TO authenticated;
GRANT ALL ON public.communication_event_bindings TO service_role;
ALTER TABLE public.communication_event_bindings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "comm_evt_owner_read" ON public.communication_event_bindings
  FOR SELECT TO authenticated
  USING (public.is_team_owner(auth.uid(), restaurant_id));
CREATE POLICY "comm_evt_owner_write" ON public.communication_event_bindings
  FOR ALL TO authenticated
  USING (public.is_team_owner(auth.uid(), restaurant_id))
  WITH CHECK (public.is_team_owner(auth.uid(), restaurant_id));

CREATE TRIGGER trg_comm_event_bindings_updated
  BEFORE UPDATE ON public.communication_event_bindings
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ------------------------------------------------------------
-- 6) QUEUE
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.communication_queue (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id       uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  settings_id         uuid REFERENCES public.communication_settings(id) ON DELETE SET NULL,
  channel             public.comm_channel NOT NULL,
  template_id         uuid REFERENCES public.communication_templates(id) ON DELETE SET NULL,
  template_code       text,
  event_name          text,
  to_address          text NOT NULL,
  variables           jsonb NOT NULL DEFAULT '{}'::jsonb,
  rendered_subject    text,
  rendered_body       text,
  payload             jsonb NOT NULL DEFAULT '{}'::jsonb,
  status              public.comm_status NOT NULL DEFAULT 'pending',
  attempts            integer NOT NULL DEFAULT 0,
  max_attempts        integer NOT NULL DEFAULT 5,
  next_retry_at       timestamptz,
  locked_at           timestamptz,
  locked_by           text,
  idempotency_key     text UNIQUE,
  provider_message_id text,
  error_code          text,
  error_message       text,
  sent_at             timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT comm_queue_attempts_ok CHECK (attempts >= 0 AND attempts <= 20)
);
CREATE INDEX IF NOT EXISTS idx_comm_queue_ready
  ON public.communication_queue(next_retry_at NULLS FIRST, created_at)
  WHERE status IN ('pending','retrying');
CREATE INDEX IF NOT EXISTS idx_comm_queue_restaurant
  ON public.communication_queue(restaurant_id, created_at DESC);

GRANT SELECT ON public.communication_queue TO authenticated;
GRANT ALL ON public.communication_queue TO service_role;
ALTER TABLE public.communication_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "comm_queue_owner_read" ON public.communication_queue
  FOR SELECT TO authenticated
  USING (public.is_team_owner(auth.uid(), restaurant_id));
-- Escrita: só service_role via server functions.

CREATE TRIGGER trg_comm_queue_updated
  BEFORE UPDATE ON public.communication_queue
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ------------------------------------------------------------
-- 7) LOGS (append-only, imutáveis)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.communication_logs (
  id            bigserial PRIMARY KEY,
  queue_id      uuid REFERENCES public.communication_queue(id) ON DELETE SET NULL,
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  settings_id   uuid REFERENCES public.communication_settings(id) ON DELETE SET NULL,
  direction     public.comm_log_direction NOT NULL,
  attempt       integer NOT NULL DEFAULT 1,
  status        text NOT NULL,
  latency_ms    integer,
  raw_request   jsonb,
  raw_response  jsonb,
  error         text,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_comm_logs_queue ON public.communication_logs(queue_id);
CREATE INDEX IF NOT EXISTS idx_comm_logs_restaurant ON public.communication_logs(restaurant_id, created_at DESC);

GRANT SELECT ON public.communication_logs TO authenticated;
GRANT INSERT, SELECT ON public.communication_logs TO service_role;
ALTER TABLE public.communication_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "comm_logs_owner_read" ON public.communication_logs
  FOR SELECT TO authenticated
  USING (public.is_team_owner(auth.uid(), restaurant_id));
-- UPDATE/DELETE nunca permitidos (nem service_role via RLS): revogamos privilégio.
REVOKE UPDATE, DELETE ON public.communication_logs FROM PUBLIC, authenticated, anon;

-- ============================================================
-- RPCs
-- ============================================================

-- Render simples {{var}} → texto (server-side sanitizado no worker também)
CREATE OR REPLACE FUNCTION private.comm_render(p_body text, p_vars jsonb)
RETURNS text LANGUAGE plpgsql IMMUTABLE
SET search_path = public, pg_temp
AS $$
DECLARE k text; v text; out_body text := coalesce(p_body,'');
BEGIN
  IF p_vars IS NULL THEN RETURN out_body; END IF;
  FOR k, v IN SELECT key, value::text FROM jsonb_each_text(p_vars) LOOP
    out_body := replace(out_body, '{{'||k||'}}', coalesce(v,''));
  END LOOP;
  RETURN out_body;
END $$;

-- Enfileira (SECURITY DEFINER; chamável pelo backend/triggers)
CREATE OR REPLACE FUNCTION public.enqueue_communication(
  p_restaurant_id uuid,
  p_event         text,
  p_variables     jsonb,
  p_to            text,
  p_channel       public.comm_channel DEFAULT 'whatsapp',
  p_idempotency_key text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_binding public.communication_event_bindings%ROWTYPE;
  v_tpl public.communication_templates%ROWTYPE;
  v_settings_id uuid;
  v_id uuid;
  v_rendered text;
BEGIN
  IF p_restaurant_id IS NULL OR coalesce(btrim(p_event),'') = '' OR coalesce(btrim(p_to),'') = '' THEN
    RAISE EXCEPTION 'invalid_input' USING ERRCODE='check_violation';
  END IF;

  -- Idempotência: se já existe, retorna
  IF p_idempotency_key IS NOT NULL THEN
    SELECT id INTO v_id FROM public.communication_queue
      WHERE idempotency_key = p_idempotency_key LIMIT 1;
    IF v_id IS NOT NULL THEN RETURN v_id; END IF;
  END IF;

  SELECT * INTO v_binding FROM public.communication_event_bindings
    WHERE restaurant_id = p_restaurant_id
      AND event_name = p_event
      AND channel = p_channel
      AND is_active = true
    ORDER BY created_at DESC LIMIT 1;
  IF NOT FOUND THEN
    RETURN NULL;  -- nenhuma automação configurada
  END IF;

  SELECT * INTO v_tpl FROM public.communication_templates
    WHERE id = v_binding.template_id AND is_active = true AND deleted_at IS NULL;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  v_settings_id := v_binding.settings_id;
  IF v_settings_id IS NULL THEN
    SELECT id INTO v_settings_id FROM public.communication_settings
      WHERE restaurant_id = p_restaurant_id AND channel = p_channel
        AND is_active = true AND deleted_at IS NULL
      LIMIT 1;
  END IF;

  v_rendered := private.comm_render(v_tpl.body, p_variables);

  INSERT INTO public.communication_queue(
    restaurant_id, settings_id, channel, template_id, template_code,
    event_name, to_address, variables, rendered_subject, rendered_body,
    status, idempotency_key
  ) VALUES (
    p_restaurant_id, v_settings_id, p_channel, v_tpl.id, v_tpl.code,
    p_event, p_to, coalesce(p_variables,'{}'::jsonb),
    private.comm_render(v_tpl.subject, p_variables), v_rendered,
    'pending', p_idempotency_key
  ) RETURNING id INTO v_id;

  PERFORM pg_notify('comm_queue', jsonb_build_object('id', v_id, 'restaurant_id', p_restaurant_id)::text);
  RETURN v_id;
END $$;

REVOKE ALL ON FUNCTION public.enqueue_communication(uuid,text,jsonb,text,public.comm_channel,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.enqueue_communication(uuid,text,jsonb,text,public.comm_channel,text) TO service_role, authenticated;

-- Worker: reserva lote (service_role apenas)
CREATE OR REPLACE FUNCTION public.claim_communication_batch(
  p_worker_id text,
  p_size integer DEFAULT 20,
  p_lock_seconds integer DEFAULT 60
) RETURNS SETOF public.communication_queue
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN QUERY
  WITH picked AS (
    SELECT id FROM public.communication_queue
     WHERE status IN ('pending','retrying')
       AND (next_retry_at IS NULL OR next_retry_at <= now())
       AND (locked_at IS NULL OR locked_at < now() - (p_lock_seconds || ' seconds')::interval)
     ORDER BY next_retry_at NULLS FIRST, created_at
     LIMIT GREATEST(1, LEAST(p_size, 100))
     FOR UPDATE SKIP LOCKED
  )
  UPDATE public.communication_queue q
     SET status = 'processing',
         locked_at = now(),
         locked_by = p_worker_id,
         attempts  = q.attempts + 1
    FROM picked
   WHERE q.id = picked.id
   RETURNING q.*;
END $$;
REVOKE ALL ON FUNCTION public.claim_communication_batch(text,integer,integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_communication_batch(text,integer,integer) TO service_role;

-- Marca enviada
CREATE OR REPLACE FUNCTION public.mark_communication_sent(
  p_id uuid, p_provider_message_id text, p_latency_ms integer
) RETURNS void
LANGUAGE sql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  UPDATE public.communication_queue
     SET status='sent', sent_at=now(), provider_message_id=p_provider_message_id,
         locked_at=NULL, locked_by=NULL, error_code=NULL, error_message=NULL
   WHERE id=p_id;
$$;
REVOKE ALL ON FUNCTION public.mark_communication_sent(uuid,text,integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mark_communication_sent(uuid,text,integer) TO service_role;

-- Marca falha (com backoff)
CREATE OR REPLACE FUNCTION public.mark_communication_failed(
  p_id uuid, p_error_code text, p_error_message text, p_retryable boolean
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_row public.communication_queue%ROWTYPE;
  v_delay integer;
BEGIN
  SELECT * INTO v_row FROM public.communication_queue WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN RETURN; END IF;

  IF NOT p_retryable OR v_row.attempts >= v_row.max_attempts THEN
    UPDATE public.communication_queue
       SET status='dead_letter', locked_at=NULL, locked_by=NULL,
           error_code=p_error_code, error_message=p_error_message
     WHERE id=p_id;
  ELSE
    -- backoff: 30s * 2^(attempts-1), cap 3600s
    v_delay := LEAST(3600, 30 * (2 ^ GREATEST(0, v_row.attempts - 1))::int);
    UPDATE public.communication_queue
       SET status='retrying',
           next_retry_at = now() + (v_delay || ' seconds')::interval,
           locked_at=NULL, locked_by=NULL,
           error_code=p_error_code, error_message=p_error_message
     WHERE id=p_id;
  END IF;
END $$;
REVOKE ALL ON FUNCTION public.mark_communication_failed(uuid,text,text,boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mark_communication_failed(uuid,text,text,boolean) TO service_role;

-- Atualiza saúde do canal
CREATE OR REPLACE FUNCTION public.set_settings_health(
  p_settings_id uuid, p_health public.comm_health,
  p_latency_ms integer, p_error text
) RETURNS void
LANGUAGE sql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  UPDATE public.communication_settings
     SET health=p_health, last_latency_ms=p_latency_ms,
         last_error=p_error, last_sync_at=now()
   WHERE id=p_settings_id;
$$;
REVOKE ALL ON FUNCTION public.set_settings_health(uuid,public.comm_health,integer,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_settings_health(uuid,public.comm_health,integer,text) TO service_role, authenticated;

-- ============================================================
-- TRIGGERS DE EVENTOS
-- ============================================================
CREATE OR REPLACE FUNCTION public.trg_comm_on_order_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_event text;
  v_order public.orders%ROWTYPE;
  v_vars jsonb;
  v_rest_name text;
BEGIN
  v_event := 'order_' || NEW.to_status::text;

  SELECT * INTO v_order FROM public.orders WHERE id = NEW.order_id;
  IF NOT FOUND OR v_order.customer_phone IS NULL OR length(v_order.customer_phone) < 6 THEN
    RETURN NEW;
  END IF;

  SELECT name INTO v_rest_name FROM public.restaurants WHERE id = NEW.restaurant_id;

  v_vars := jsonb_build_object(
    'customer_name',  COALESCE(v_order.customer_name,''),
    'order_number',   v_order.order_number::text,
    'order_status',   NEW.to_status::text,
    'order_total',    to_char(COALESCE(v_order.total,0),'FM999999990.00'),
    'restaurant_name',COALESCE(v_rest_name,''),
    'estimated_minutes', COALESCE(v_order.estimated_minutes,0)::text
  );

  PERFORM public.enqueue_communication(
    NEW.restaurant_id, v_event, v_vars, v_order.customer_phone,
    'whatsapp'::public.comm_channel,
    'order:'||NEW.order_id::text||':'||v_event
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'trg_comm_on_order_status: %', SQLERRM;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_comm_on_order_status ON public.order_status_history;
CREATE TRIGGER trg_comm_on_order_status
  AFTER INSERT ON public.order_status_history
  FOR EACH ROW EXECUTE FUNCTION public.trg_comm_on_order_status();

CREATE OR REPLACE FUNCTION public.trg_comm_on_payment_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE v_event text; v_vars jsonb; v_rest_name text;
BEGIN
  IF NEW.payment_status IS NOT DISTINCT FROM OLD.payment_status THEN RETURN NEW; END IF;
  IF NEW.customer_phone IS NULL OR length(NEW.customer_phone) < 6 THEN RETURN NEW; END IF;

  v_event := 'payment_' || COALESCE(NEW.payment_status,'unknown');
  SELECT name INTO v_rest_name FROM public.restaurants WHERE id = NEW.restaurant_id;

  v_vars := jsonb_build_object(
    'customer_name', COALESCE(NEW.customer_name,''),
    'order_number',  NEW.order_number::text,
    'order_total',   to_char(COALESCE(NEW.total,0),'FM999999990.00'),
    'restaurant_name', COALESCE(v_rest_name,'')
  );

  PERFORM public.enqueue_communication(
    NEW.restaurant_id, v_event, v_vars, NEW.customer_phone,
    'whatsapp'::public.comm_channel,
    'order:'||NEW.id::text||':'||v_event
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'trg_comm_on_payment_status: %', SQLERRM;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_comm_on_payment_status ON public.orders;
CREATE TRIGGER trg_comm_on_payment_status
  AFTER UPDATE OF payment_status ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.trg_comm_on_payment_status();

-- ============================================================
-- FEATURE GATES: enforce max canais + flags
-- ============================================================
CREATE OR REPLACE FUNCTION public.enforce_comm_channel_limit()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE v_plan text; v_max int; v_count int;
BEGIN
  SELECT plan_id INTO v_plan FROM public.restaurants WHERE id = NEW.restaurant_id;
  SELECT COALESCE((features->>'communication_channels_max')::int, 0) INTO v_max
    FROM public.app_plans WHERE id = COALESCE(v_plan,'starter');
  IF v_max <= 0 THEN
    RAISE EXCEPTION 'plan_feature_locked: canais de comunicação requerem plano Pro ou superior'
      USING ERRCODE='check_violation';
  END IF;
  SELECT count(*) INTO v_count FROM public.communication_settings
    WHERE restaurant_id = NEW.restaurant_id AND deleted_at IS NULL;
  IF v_count >= v_max THEN
    RAISE EXCEPTION 'plan_limit_channels: limite de % canais do plano % atingido', v_max, v_plan
      USING ERRCODE='check_violation';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_enforce_comm_channel_limit ON public.communication_settings;
CREATE TRIGGER trg_enforce_comm_channel_limit
  BEFORE INSERT ON public.communication_settings
  FOR EACH ROW EXECUTE FUNCTION public.enforce_comm_channel_limit();

-- ============================================================
-- SEEDS
-- ============================================================
INSERT INTO public.communication_providers(code, name, channel, capabilities) VALUES
  ('evolution',      'Evolution API',        'whatsapp', '{"webhooks":true,"media":true,"templates":false}'),
  ('whatsapp_cloud', 'WhatsApp Cloud (Meta)','whatsapp', '{"webhooks":true,"media":true,"templates":true}'),
  ('zapi',           'Z-API',                'whatsapp', '{"webhooks":true,"media":true}'),
  ('twilio',         'Twilio',               'sms',      '{"webhooks":true}'),
  ('sendgrid',       'SendGrid',             'email',    '{"webhooks":true,"templates":true}')
ON CONFLICT (code) DO NOTHING;

-- Feature flags nos planos
UPDATE public.app_plans SET features = features
  || jsonb_build_object(
    'transactional_messages', false,
    'marketing_campaigns',    false,
    'communication_channels_max', 0
  )
  WHERE id = 'starter';

UPDATE public.app_plans SET features = features
  || jsonb_build_object(
    'transactional_messages', true,
    'marketing_campaigns',    false,
    'communication_channels_max', 1
  )
  WHERE id = 'pro';

UPDATE public.app_plans SET features = features
  || jsonb_build_object(
    'transactional_messages', true,
    'marketing_campaigns',    true,
    'communication_channels_max', 5
  )
  WHERE id = 'business';

-- REVERT (rollback resumido):
-- DROP TRIGGER trg_comm_on_order_status ON public.order_status_history;
-- DROP TRIGGER trg_comm_on_payment_status ON public.orders;
-- DROP TABLE public.communication_logs, public.communication_queue,
--            public.communication_event_bindings, public.communication_templates,
--            public.communication_secrets, public.communication_settings,
--            public.communication_providers CASCADE;
-- DROP TYPE public.comm_log_direction, public.comm_status, public.comm_health,
--           public.comm_category, public.comm_channel;
