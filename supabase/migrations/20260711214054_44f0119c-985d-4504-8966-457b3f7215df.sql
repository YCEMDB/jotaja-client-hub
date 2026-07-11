
-- =====================================================================
-- Turno 6 — Fase 1: canonical payments module + PagBank Connect scaffold
-- =====================================================================

-- ---------- Enum canônico de status financeiro ----------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'financial_payment_status') THEN
    CREATE TYPE public.financial_payment_status AS ENUM (
      'waiting','processing','authorized','paid',
      'declined','canceled','expired',
      'refunded','partially_refunded','failed'
    );
  END IF;
END $$;

-- ---------- restaurants.active_payment_provider ----------
ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS active_payment_provider text
    CHECK (active_payment_provider IN ('mercado_pago','pagbank'));

-- =====================================================================
-- 1) restaurant_payment_integrations (PagBank Connect — extensível)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.restaurant_payment_integrations (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id             uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  provider                  text NOT NULL CHECK (provider IN ('pagbank')),
  environment               text NOT NULL CHECK (environment IN ('sandbox','production')),
  status                    text NOT NULL DEFAULT 'pending_authorization'
                            CHECK (status IN ('pending_authorization','active','revoked','error')),
  provider_account_id       text,
  provider_account_masked   text,
  access_token_encrypted    bytea,
  refresh_token_encrypted   bytea,
  token_expires_at          timestamptz,
  scopes                    text[],
  webhook_key               text UNIQUE,
  connected_at              timestamptz,
  disconnected_at           timestamptz,
  last_error_code           text,
  last_error_at             timestamptz,
  last_webhook_at           timestamptz,
  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now()
);

-- Um vínculo PagBank ativo por restaurante
CREATE UNIQUE INDEX IF NOT EXISTS ux_rpi_active_per_provider
  ON public.restaurant_payment_integrations(restaurant_id, provider)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS ix_rpi_restaurant ON public.restaurant_payment_integrations(restaurant_id);

GRANT SELECT ON public.restaurant_payment_integrations TO authenticated;
GRANT ALL    ON public.restaurant_payment_integrations TO service_role;
REVOKE INSERT, UPDATE, DELETE ON public.restaurant_payment_integrations FROM authenticated;
-- tokens nunca ao cliente
REVOKE SELECT (access_token_encrypted, refresh_token_encrypted, webhook_key)
  ON public.restaurant_payment_integrations FROM authenticated, anon;

ALTER TABLE public.restaurant_payment_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "team_view_own_integration"
  ON public.restaurant_payment_integrations FOR SELECT TO authenticated
  USING (
    public.is_team_owner(auth.uid(), restaurant_id)
    OR private.is_super_admin(auth.uid())
  );

-- =====================================================================
-- 2) pagbank_oauth_states (CSRF one-shot para o callback)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.pagbank_oauth_states (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  state          text NOT NULL UNIQUE,
  restaurant_id  uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  environment    text NOT NULL CHECK (environment IN ('sandbox','production')),
  actor_id       uuid,
  redirect_after text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  expires_at     timestamptz NOT NULL,
  used_at        timestamptz
);
CREATE INDEX IF NOT EXISTS ix_pbstates_expires ON public.pagbank_oauth_states(expires_at);

GRANT ALL ON public.pagbank_oauth_states TO service_role;
ALTER TABLE public.pagbank_oauth_states ENABLE ROW LEVEL SECURITY;
-- Nada exposto a authenticated/anon; apenas service_role via RPC.

-- =====================================================================
-- 3) order_payments — canônico
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.order_payments (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id               uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE RESTRICT,
  order_id                    uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  provider                    text NOT NULL CHECK (provider IN ('mercado_pago','pagbank')),
  method                      text NOT NULL DEFAULT 'pix' CHECK (method IN ('pix','credit_card','debit_card','boleto','other')),
  provider_payment_id         text,
  provider_order_id           text,
  provider_charge_id          text,
  reference_id                text,
  idempotency_key             text,
  amount                      numeric(12,2) NOT NULL CHECK (amount >= 0),
  currency                    text NOT NULL DEFAULT 'BRL' CHECK (currency = 'BRL'),
  status                      public.financial_payment_status NOT NULL DEFAULT 'waiting',
  provider_status             text,
  qr_code_text                text,
  qr_code_image_url           text,
  expires_at                  timestamptz,
  paid_at                     timestamptz,
  canceled_at                 timestamptz,
  refunded_at                 timestamptz,
  last_webhook_at             timestamptz,
  last_reconciled_at          timestamptz,
  failure_code                text,
  failure_message_sanitized   text,
  created_at                  timestamptz NOT NULL DEFAULT now(),
  updated_at                  timestamptz NOT NULL DEFAULT now()
);

-- IDs externos únicos por provider quando presentes
CREATE UNIQUE INDEX IF NOT EXISTS ux_op_provider_payment_id
  ON public.order_payments(provider, provider_payment_id)
  WHERE provider_payment_id IS NOT NULL;

-- No máximo um pagamento ATIVO por pedido (independente de provider)
CREATE UNIQUE INDEX IF NOT EXISTS ux_op_active_per_order
  ON public.order_payments(order_id)
  WHERE status IN ('waiting','processing','authorized');

CREATE INDEX IF NOT EXISTS ix_op_restaurant  ON public.order_payments(restaurant_id);
CREATE INDEX IF NOT EXISTS ix_op_order       ON public.order_payments(order_id);
CREATE INDEX IF NOT EXISTS ix_op_status      ON public.order_payments(status);

GRANT SELECT ON public.order_payments TO authenticated;
GRANT ALL    ON public.order_payments TO service_role;
REVOKE INSERT, UPDATE, DELETE ON public.order_payments FROM authenticated, anon;

ALTER TABLE public.order_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team_view_own_payments"
  ON public.order_payments FOR SELECT TO authenticated
  USING (
    public.is_team_owner(auth.uid(), restaurant_id)
    OR private.is_super_admin(auth.uid())
  );

-- =====================================================================
-- 4) payment_webhook_events — idempotência
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.payment_webhook_events (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider            text NOT NULL CHECK (provider IN ('mercado_pago','pagbank')),
  external_event_id   text,
  payload_hash        text NOT NULL,
  restaurant_id       uuid,
  order_payment_id    uuid REFERENCES public.order_payments(id) ON DELETE SET NULL,
  received_at         timestamptz NOT NULL DEFAULT now(),
  processed_at        timestamptz,
  result              text,
  error_code          text
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_pwe_provider_event
  ON public.payment_webhook_events(provider, external_event_id)
  WHERE external_event_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS ux_pwe_provider_hash
  ON public.payment_webhook_events(provider, payload_hash);

GRANT ALL ON public.payment_webhook_events TO service_role;
ALTER TABLE public.payment_webhook_events ENABLE ROW LEVEL SECURITY;
-- sem policies: só service_role acessa

-- =====================================================================
-- Trigger updated_at
-- =====================================================================
CREATE OR REPLACE FUNCTION public.tg_touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$ BEGIN NEW.updated_at := now(); RETURN NEW; END $$;

DROP TRIGGER IF EXISTS trg_op_touch ON public.order_payments;
CREATE TRIGGER trg_op_touch BEFORE UPDATE ON public.order_payments
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();

DROP TRIGGER IF EXISTS trg_rpi_touch ON public.restaurant_payment_integrations;
CREATE TRIGGER trg_rpi_touch BEFORE UPDATE ON public.restaurant_payment_integrations
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();

-- =====================================================================
-- Helpers privados de criptografia (vault-based)
-- =====================================================================
CREATE OR REPLACE FUNCTION private._pagbank_encryption_key()
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, private, pg_temp
AS $$
DECLARE v_key text;
BEGIN
  SELECT decrypted_secret INTO v_key
    FROM vault.decrypted_secrets
   WHERE name = 'pagbank_token_encryption_key'
   LIMIT 1;
  IF v_key IS NULL OR length(v_key) < 32 THEN
    RAISE EXCEPTION 'pagbank_encryption_key_missing'
      USING ERRCODE = '42501',
            HINT = 'Configure vault secret pagbank_token_encryption_key (>= 32 chars)';
  END IF;
  RETURN v_key;
END $$;

CREATE OR REPLACE FUNCTION private._pagbank_encrypt(p_plain text)
RETURNS bytea
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private, pg_temp
AS $$
BEGIN
  IF p_plain IS NULL THEN RETURN NULL; END IF;
  RETURN pgp_sym_encrypt(p_plain, private._pagbank_encryption_key());
END $$;

CREATE OR REPLACE FUNCTION private._pagbank_decrypt(p_cipher bytea)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private, pg_temp
AS $$
BEGIN
  IF p_cipher IS NULL THEN RETURN NULL; END IF;
  RETURN pgp_sym_decrypt(p_cipher, private._pagbank_encryption_key());
END $$;

REVOKE ALL ON FUNCTION private._pagbank_encryption_key(),
                       private._pagbank_encrypt(text),
                       private._pagbank_decrypt(bytea)
  FROM PUBLIC, authenticated, anon;

-- =====================================================================
-- RPC: iniciar conexão PagBank Connect
-- =====================================================================
CREATE OR REPLACE FUNCTION public.pagbank_connect_init(
  p_restaurant_id uuid,
  p_environment   text,
  p_redirect_after text DEFAULT '/admin/configuracoes?tab=pagamentos'
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private, pg_temp
AS $$
DECLARE
  v_ctx    RECORD;
  v_state  text;
  v_env    text := lower(coalesce(p_environment,'sandbox'));
BEGIN
  IF v_env NOT IN ('sandbox','production') THEN
    RAISE EXCEPTION 'invalid_environment' USING ERRCODE = '22023';
  END IF;
  SELECT * INTO v_ctx FROM private.authorize_tenant_action(p_restaurant_id, 'administrative');

  v_state := encode(gen_random_bytes(32), 'hex');
  INSERT INTO public.pagbank_oauth_states(state, restaurant_id, environment, actor_id, redirect_after, expires_at)
    VALUES (v_state, p_restaurant_id, v_env, v_ctx.actor_id, p_redirect_after, now() + interval '10 minutes');

  IF NOT v_ctx.is_native THEN
    PERFORM private.record_audit('payment.pagbank.connect_init','payments',p_restaurant_id,
      'integration', p_restaurant_id::text, NULL,
      jsonb_build_object('environment', v_env),
      NULL,
      jsonb_build_object('support_level', v_ctx.support_level),
      v_ctx.support_session_id);
  END IF;

  RETURN jsonb_build_object('state', v_state, 'environment', v_env, 'expires_at', now() + interval '10 minutes');
END $$;

-- =====================================================================
-- RPC: completar conexão (server-only)
-- =====================================================================
CREATE OR REPLACE FUNCTION public.pagbank_connect_complete(
  p_state             text,
  p_access_token      text,
  p_refresh_token     text,
  p_expires_in        integer,
  p_scopes            text[],
  p_provider_account_id text,
  p_provider_account_masked text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private, pg_temp
AS $$
DECLARE
  v_state       public.pagbank_oauth_states%ROWTYPE;
  v_integration public.restaurant_payment_integrations%ROWTYPE;
  v_webhook_key text := encode(gen_random_bytes(24), 'base64');
BEGIN
  IF p_access_token IS NULL OR length(p_access_token) < 8 THEN
    RAISE EXCEPTION 'invalid_access_token' USING ERRCODE='22023';
  END IF;

  SELECT * INTO v_state FROM public.pagbank_oauth_states
    WHERE state = p_state FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'oauth_state_not_found' USING ERRCODE='no_data_found'; END IF;
  IF v_state.used_at IS NOT NULL THEN RAISE EXCEPTION 'oauth_state_already_used'; END IF;
  IF v_state.expires_at < now() THEN RAISE EXCEPTION 'oauth_state_expired'; END IF;

  UPDATE public.pagbank_oauth_states SET used_at = now() WHERE id = v_state.id;
  -- torna webhook_key url-safe
  v_webhook_key := replace(replace(replace(v_webhook_key,'+','-'),'/','_'),'=','');

  -- upsert: uma linha ativa por restaurante+provider
  UPDATE public.restaurant_payment_integrations
     SET status='revoked', disconnected_at=now()
   WHERE restaurant_id = v_state.restaurant_id AND provider='pagbank' AND status='active';

  INSERT INTO public.restaurant_payment_integrations(
    restaurant_id, provider, environment, status,
    provider_account_id, provider_account_masked,
    access_token_encrypted, refresh_token_encrypted,
    token_expires_at, scopes, webhook_key, connected_at
  ) VALUES (
    v_state.restaurant_id, 'pagbank', v_state.environment, 'active',
    p_provider_account_id, p_provider_account_masked,
    private._pagbank_encrypt(p_access_token),
    private._pagbank_encrypt(p_refresh_token),
    CASE WHEN p_expires_in IS NULL THEN NULL ELSE now() + (p_expires_in || ' seconds')::interval END,
    p_scopes, v_webhook_key, now()
  ) RETURNING * INTO v_integration;

  PERFORM private.record_audit('payment.pagbank.connected','payments',v_state.restaurant_id,
    'integration', v_integration.id::text, NULL,
    jsonb_build_object('environment', v_state.environment, 'account_masked', p_provider_account_masked),
    NULL,
    jsonb_build_object('actor_id', v_state.actor_id),
    NULL);

  RETURN jsonb_build_object(
    'integration_id', v_integration.id,
    'restaurant_id', v_state.restaurant_id,
    'redirect_after', v_state.redirect_after,
    'environment', v_state.environment
  );
END $$;

-- =====================================================================
-- RPC: consultar integração (mascarado) para lookup interno por webhook_key
-- (server-only, retorna tokens)
-- =====================================================================
CREATE OR REPLACE FUNCTION public.pagbank_lookup_integration_by_webhook_key(p_webhook_key text)
RETURNS TABLE(
  integration_id uuid, restaurant_id uuid, environment text,
  status text, access_token text, provider_account_id text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private, pg_temp
AS $$
DECLARE r public.restaurant_payment_integrations%ROWTYPE;
BEGIN
  SELECT * INTO r FROM public.restaurant_payment_integrations WHERE webhook_key = p_webhook_key;
  IF NOT FOUND THEN RETURN; END IF;
  integration_id := r.id; restaurant_id := r.restaurant_id;
  environment := r.environment; status := r.status;
  access_token := private._pagbank_decrypt(r.access_token_encrypted);
  provider_account_id := r.provider_account_id;
  RETURN NEXT;
END $$;

CREATE OR REPLACE FUNCTION public.pagbank_get_access_token(p_restaurant_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private, pg_temp
AS $$
DECLARE r public.restaurant_payment_integrations%ROWTYPE;
BEGIN
  SELECT * INTO r FROM public.restaurant_payment_integrations
   WHERE restaurant_id = p_restaurant_id AND provider='pagbank' AND status='active'
   LIMIT 1;
  IF NOT FOUND THEN RETURN NULL; END IF;
  RETURN private._pagbank_decrypt(r.access_token_encrypted);
END $$;

REVOKE ALL ON FUNCTION public.pagbank_lookup_integration_by_webhook_key(text),
                       public.pagbank_get_access_token(uuid)
  FROM PUBLIC, authenticated, anon;

-- =====================================================================
-- RPC: desconectar
-- =====================================================================
CREATE OR REPLACE FUNCTION public.pagbank_disconnect(p_restaurant_id uuid, p_reason text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private, pg_temp
AS $$
DECLARE
  v_ctx RECORD;
  v_reason text := nullif(btrim(p_reason),'');
BEGIN
  SELECT * INTO v_ctx FROM private.authorize_tenant_action(p_restaurant_id,'administrative');
  IF v_reason IS NULL OR length(v_reason) < 5 THEN
    RAISE EXCEPTION 'reason_required' USING ERRCODE='22023';
  END IF;

  UPDATE public.restaurant_payment_integrations
     SET status='revoked', disconnected_at=now(),
         access_token_encrypted=NULL, refresh_token_encrypted=NULL
   WHERE restaurant_id=p_restaurant_id AND provider='pagbank' AND status='active';

  UPDATE public.restaurants
     SET active_payment_provider = NULL
   WHERE id = p_restaurant_id AND active_payment_provider = 'pagbank';

  PERFORM private.record_audit('payment.pagbank.disconnected','payments',p_restaurant_id,
    'integration', p_restaurant_id::text, NULL, NULL, v_reason,
    jsonb_build_object('support_level', v_ctx.support_level), v_ctx.support_session_id);
  RETURN jsonb_build_object('ok', true);
END $$;

-- =====================================================================
-- RPC: rotate webhook key
-- =====================================================================
CREATE OR REPLACE FUNCTION public.pagbank_rotate_webhook_key(p_restaurant_id uuid, p_reason text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private, pg_temp
AS $$
DECLARE
  v_ctx RECORD;
  v_new text := replace(replace(replace(encode(gen_random_bytes(24),'base64'),'+','-'),'/','_'),'=','');
BEGIN
  SELECT * INTO v_ctx FROM private.authorize_tenant_action(p_restaurant_id,'administrative');
  IF p_reason IS NULL OR length(btrim(p_reason)) < 5 THEN
    RAISE EXCEPTION 'reason_required' USING ERRCODE='22023';
  END IF;
  UPDATE public.restaurant_payment_integrations
     SET webhook_key = v_new
   WHERE restaurant_id=p_restaurant_id AND provider='pagbank' AND status='active';
  PERFORM private.record_audit('payment.pagbank.webhook_key_rotated','payments',p_restaurant_id,
    'integration', p_restaurant_id::text, NULL, NULL, p_reason, NULL, v_ctx.support_session_id);
  RETURN jsonb_build_object('webhook_key', v_new);
END $$;

-- =====================================================================
-- RPC: escolher provider ativo do restaurante
-- =====================================================================
CREATE OR REPLACE FUNCTION public.set_active_payment_provider(
  p_restaurant_id uuid, p_provider text, p_reason text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private, pg_temp
AS $$
DECLARE
  v_ctx RECORD;
  v_reason text := nullif(btrim(p_reason),'');
  v_current text;
  v_ok boolean;
BEGIN
  SELECT * INTO v_ctx FROM private.authorize_tenant_action(p_restaurant_id,'administrative');
  IF p_provider IS NOT NULL AND p_provider NOT IN ('mercado_pago','pagbank') THEN
    RAISE EXCEPTION 'invalid_provider' USING ERRCODE='22023';
  END IF;
  IF v_reason IS NULL OR length(v_reason)<5 THEN
    RAISE EXCEPTION 'reason_required' USING ERRCODE='22023';
  END IF;

  IF p_provider = 'pagbank' THEN
    SELECT true INTO v_ok FROM public.restaurant_payment_integrations
     WHERE restaurant_id=p_restaurant_id AND provider='pagbank' AND status='active' LIMIT 1;
    IF NOT COALESCE(v_ok,false) THEN
      RAISE EXCEPTION 'pagbank_not_connected';
    END IF;
  END IF;
  IF p_provider = 'mercado_pago' THEN
    PERFORM 1 FROM public.restaurant_secrets
     WHERE restaurant_id=p_restaurant_id AND mp_access_token IS NOT NULL;
    IF NOT FOUND THEN RAISE EXCEPTION 'mercado_pago_not_connected'; END IF;
  END IF;

  SELECT active_payment_provider INTO v_current FROM public.restaurants WHERE id=p_restaurant_id;
  UPDATE public.restaurants SET active_payment_provider = p_provider WHERE id=p_restaurant_id;

  PERFORM private.record_audit('payment.active_provider_changed','payments',p_restaurant_id,
    'restaurant', p_restaurant_id::text,
    jsonb_build_object('provider', v_current),
    jsonb_build_object('provider', p_provider),
    v_reason, NULL, v_ctx.support_session_id);
  RETURN jsonb_build_object('provider', p_provider);
END $$;

-- =====================================================================
-- RPC: verificar disponibilidade de pagamento online
--     Retorna código de motivo quando NÃO puder usar; NULL quando OK.
-- =====================================================================
CREATE OR REPLACE FUNCTION public.tenant_online_payment_blocker(p_restaurant_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, private, pg_temp
AS $$
DECLARE
  v_active boolean;
  v_plan_ok boolean;
  v_provider text;
  v_int public.restaurant_payment_integrations%ROWTYPE;
BEGIN
  SELECT COALESCE(r.is_active,true), COALESCE((p.features->>'online_payment')::boolean,false), r.active_payment_provider
    INTO v_active, v_plan_ok, v_provider
    FROM public.restaurants r
    LEFT JOIN public.app_plans p ON p.id = r.plan_id
   WHERE r.id = p_restaurant_id;

  IF v_active IS NULL THEN RETURN 'restaurant_not_found'; END IF;
  IF NOT v_active THEN RETURN 'restaurant_inactive'; END IF;
  IF NOT v_plan_ok THEN RETURN 'feature_not_available'; END IF;
  IF v_provider IS NULL THEN RETURN 'pagbank_not_connected'; END IF;

  IF v_provider = 'pagbank' THEN
    SELECT * INTO v_int FROM public.restaurant_payment_integrations
     WHERE restaurant_id=p_restaurant_id AND provider='pagbank' AND status='active' LIMIT 1;
    IF NOT FOUND THEN RETURN 'pagbank_not_connected'; END IF;
    IF v_int.token_expires_at IS NOT NULL AND v_int.token_expires_at < now() THEN
      RETURN 'pagbank_authorization_expired';
    END IF;
  ELSIF v_provider = 'mercado_pago' THEN
    PERFORM 1 FROM public.restaurant_secrets WHERE restaurant_id=p_restaurant_id AND mp_access_token IS NOT NULL;
    IF NOT FOUND THEN RETURN 'mercado_pago_not_connected'; END IF;
  END IF;

  RETURN NULL;
END $$;

GRANT EXECUTE ON FUNCTION public.tenant_online_payment_blocker(uuid) TO authenticated, anon;

-- =====================================================================
-- RPC (server-only): criar pagamento pending
-- =====================================================================
CREATE OR REPLACE FUNCTION public.payment_create_pending(
  p_order_id             uuid,
  p_provider             text,
  p_provider_payment_id  text,
  p_provider_order_id    text,
  p_amount               numeric,
  p_currency             text,
  p_method               text,
  p_qr_text              text,
  p_qr_image_url         text,
  p_expires_at           timestamptz,
  p_reference_id         text,
  p_idempotency_key      text
) RETURNS public.order_payments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private, pg_temp
AS $$
DECLARE
  v_order public.orders%ROWTYPE;
  v_row   public.order_payments%ROWTYPE;
BEGIN
  IF p_provider NOT IN ('mercado_pago','pagbank') THEN
    RAISE EXCEPTION 'invalid_provider' USING ERRCODE='22023';
  END IF;

  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'order_not_found' USING ERRCODE='no_data_found'; END IF;
  IF ROUND(v_order.total, 2) <> ROUND(p_amount, 2) THEN
    RAISE EXCEPTION 'payment_amount_mismatch' USING ERRCODE='22023';
  END IF;
  IF p_currency IS NOT NULL AND p_currency <> 'BRL' THEN
    RAISE EXCEPTION 'currency_not_supported' USING ERRCODE='22023';
  END IF;

  -- idempotência: se já existe ativo, retorna
  SELECT * INTO v_row FROM public.order_payments
   WHERE order_id = p_order_id AND status IN ('waiting','processing','authorized')
   LIMIT 1;
  IF FOUND THEN RETURN v_row; END IF;

  INSERT INTO public.order_payments(
    restaurant_id, order_id, provider, method,
    provider_payment_id, provider_order_id,
    reference_id, idempotency_key,
    amount, currency, status,
    qr_code_text, qr_code_image_url, expires_at
  ) VALUES (
    v_order.restaurant_id, p_order_id, p_provider, COALESCE(p_method,'pix'),
    p_provider_payment_id, p_provider_order_id,
    p_reference_id, p_idempotency_key,
    p_amount, COALESCE(p_currency,'BRL'), 'waiting',
    p_qr_text, p_qr_image_url, p_expires_at
  ) RETURNING * INTO v_row;

  RETURN v_row;
END $$;

REVOKE ALL ON FUNCTION public.payment_create_pending(
  uuid, text, text, text, numeric, text, text, text, text, timestamptz, text, text
) FROM PUBLIC, authenticated, anon;

-- =====================================================================
-- RPC (server-only): aplicar evento de provider idempotente
-- =====================================================================
CREATE OR REPLACE FUNCTION public.payment_apply_provider_event(
  p_provider             text,
  p_provider_payment_id  text,
  p_external_event_id    text,
  p_payload_hash         text,
  p_new_status           public.financial_payment_status,
  p_provider_status_raw  text,
  p_amount               numeric,
  p_paid_at              timestamptz,
  p_failure_code         text,
  p_failure_message      text,
  p_source               text  -- 'webhook' | 'reconciliation'
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private, pg_temp
AS $$
DECLARE
  v_pay   public.order_payments%ROWTYPE;
  v_ord   public.orders%ROWTYPE;
  v_evt   public.payment_webhook_events%ROWTYPE;
  v_prev  public.financial_payment_status;
BEGIN
  IF p_provider NOT IN ('mercado_pago','pagbank') THEN
    RAISE EXCEPTION 'invalid_provider' USING ERRCODE='22023';
  END IF;

  -- Deduplicação por payload_hash + provider
  BEGIN
    INSERT INTO public.payment_webhook_events(provider, external_event_id, payload_hash, received_at)
    VALUES (p_provider, p_external_event_id, p_payload_hash, now())
    RETURNING * INTO v_evt;
  EXCEPTION WHEN unique_violation THEN
    SELECT * INTO v_evt FROM public.payment_webhook_events
     WHERE provider=p_provider AND (
       (external_event_id IS NOT NULL AND external_event_id = p_external_event_id) OR payload_hash = p_payload_hash
     ) LIMIT 1;
    IF v_evt.processed_at IS NOT NULL THEN
      RETURN jsonb_build_object('deduped', true);
    END IF;
  END;

  SELECT * INTO v_pay FROM public.order_payments
   WHERE provider = p_provider AND provider_payment_id = p_provider_payment_id
   FOR UPDATE;
  IF NOT FOUND THEN
    UPDATE public.payment_webhook_events
       SET processed_at=now(), result='payment_not_found', error_code='payment_not_found'
     WHERE id = v_evt.id;
    RAISE EXCEPTION 'payment_not_found' USING ERRCODE='no_data_found';
  END IF;

  SELECT * INTO v_ord FROM public.orders WHERE id = v_pay.order_id FOR UPDATE;

  -- Validar valor quando informado
  IF p_amount IS NOT NULL AND ROUND(p_amount, 2) <> ROUND(v_pay.amount, 2) THEN
    UPDATE public.order_payments
       SET failure_code='amount_mismatch', failure_message_sanitized='Valor divergente do provedor',
           last_webhook_at = CASE WHEN p_source='webhook' THEN now() ELSE last_webhook_at END,
           provider_status = COALESCE(p_provider_status_raw, provider_status)
     WHERE id = v_pay.id;
    UPDATE public.payment_webhook_events
       SET processed_at=now(), result='amount_mismatch', error_code='payment_amount_mismatch',
           order_payment_id = v_pay.id, restaurant_id = v_pay.restaurant_id
     WHERE id = v_evt.id;
    RAISE EXCEPTION 'payment_amount_mismatch' USING ERRCODE='22023';
  END IF;

  v_prev := v_pay.status;

  UPDATE public.order_payments SET
    status = p_new_status,
    provider_status = COALESCE(p_provider_status_raw, provider_status),
    paid_at = CASE WHEN p_new_status='paid' THEN COALESCE(p_paid_at, now()) ELSE paid_at END,
    canceled_at = CASE WHEN p_new_status IN ('canceled','declined','expired') THEN now() ELSE canceled_at END,
    refunded_at = CASE WHEN p_new_status IN ('refunded','partially_refunded') THEN now() ELSE refunded_at END,
    failure_code = COALESCE(p_failure_code, failure_code),
    failure_message_sanitized = COALESCE(p_failure_message, failure_message_sanitized),
    last_webhook_at = CASE WHEN p_source='webhook' THEN now() ELSE last_webhook_at END,
    last_reconciled_at = CASE WHEN p_source='reconciliation' THEN now() ELSE last_reconciled_at END
   WHERE id = v_pay.id;

  -- Espelhar em orders.payment_status (compat) e disparar transição operacional
  IF p_new_status = 'paid' AND v_prev <> 'paid' THEN
    UPDATE public.orders
       SET payment_status = 'paid', paid_at = COALESCE(p_paid_at, now())
     WHERE id = v_ord.id;
    -- Confirmar pedido se ainda pending — via caminho oficial
    IF v_ord.status = 'pending' THEN
      PERFORM set_config('app.status_change_ok','on', true);
      UPDATE public.orders SET status='confirmed' WHERE id=v_ord.id;
      PERFORM set_config('app.status_change_ok','off', true);
      INSERT INTO public.order_status_history(
        order_id, restaurant_id, from_status, to_status, changed_by, source, reason
      ) VALUES (
        v_ord.id, v_ord.restaurant_id, 'pending', 'confirmed', NULL,
        CASE WHEN p_source='webhook' THEN 'pagbank_webhook' ELSE 'pagbank_reconciliation' END,
        NULL
      );
    END IF;
  ELSIF p_new_status IN ('declined','canceled','failed','expired') THEN
    UPDATE public.orders SET payment_status = CASE p_new_status
      WHEN 'expired' THEN 'expired'::payment_status
      WHEN 'refunded' THEN 'refunded'::payment_status
      ELSE 'failed'::payment_status END
     WHERE id = v_ord.id;
  ELSIF p_new_status IN ('refunded','partially_refunded') THEN
    UPDATE public.orders SET payment_status='refunded' WHERE id=v_ord.id;
  END IF;

  UPDATE public.payment_webhook_events
     SET processed_at=now(), result='ok', order_payment_id=v_pay.id, restaurant_id=v_pay.restaurant_id
   WHERE id = v_evt.id;

  RETURN jsonb_build_object(
    'payment_id', v_pay.id,
    'order_id', v_pay.order_id,
    'previous_status', v_prev,
    'new_status', p_new_status,
    'source', p_source
  );
END $$;

REVOKE ALL ON FUNCTION public.payment_apply_provider_event(
  text, text, text, text, public.financial_payment_status, text, numeric, timestamptz, text, text, text
) FROM PUBLIC, authenticated, anon;

-- =====================================================================
-- RPC (server-only): marcar expirado
-- =====================================================================
CREATE OR REPLACE FUNCTION public.payment_mark_expired(p_payment_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private, pg_temp
AS $$
BEGIN
  UPDATE public.order_payments
     SET status='expired', canceled_at=now()
   WHERE id=p_payment_id AND status IN ('waiting','processing');
  RETURN jsonb_build_object('ok', FOUND);
END $$;
REVOKE ALL ON FUNCTION public.payment_mark_expired(uuid) FROM PUBLIC, authenticated, anon;

-- =====================================================================
-- Admin view: resumo mascarado
-- =====================================================================
CREATE OR REPLACE FUNCTION public.admin_view_payment_integrations(p_restaurant_id uuid)
RETURNS TABLE(
  provider text, environment text, status text,
  provider_account_masked text, connected_at timestamptz,
  disconnected_at timestamptz, last_error_code text, last_error_at timestamptz,
  last_webhook_at timestamptz, token_expires_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, private, pg_temp
AS $$
BEGIN
  IF NOT (public.is_team_owner(auth.uid(), p_restaurant_id) OR private.is_super_admin(auth.uid())) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE='42501';
  END IF;
  RETURN QUERY
  SELECT r.provider, r.environment, r.status, r.provider_account_masked,
         r.connected_at, r.disconnected_at, r.last_error_code, r.last_error_at,
         r.last_webhook_at, r.token_expires_at
    FROM public.restaurant_payment_integrations r
   WHERE r.restaurant_id = p_restaurant_id
   ORDER BY r.connected_at DESC NULLS LAST;
END $$;
GRANT EXECUTE ON FUNCTION public.admin_view_payment_integrations(uuid) TO authenticated;

-- =====================================================================
-- BACKFILL: pedidos existentes com mp_payment_id
-- =====================================================================
INSERT INTO public.order_payments(
  restaurant_id, order_id, provider, method,
  provider_payment_id, amount, currency, status,
  qr_code_text, qr_code_image_url, paid_at, expires_at, created_at
)
SELECT
  o.restaurant_id, o.id, 'mercado_pago', 'pix',
  o.mp_payment_id, o.total, 'BRL',
  CASE o.payment_status
    WHEN 'paid'     THEN 'paid'::public.financial_payment_status
    WHEN 'failed'   THEN 'failed'::public.financial_payment_status
    WHEN 'refunded' THEN 'refunded'::public.financial_payment_status
    WHEN 'expired'  THEN 'expired'::public.financial_payment_status
    ELSE 'waiting'::public.financial_payment_status
  END,
  o.pix_qr_code, o.pix_qr_code_base64, o.paid_at, o.pix_expires_at, o.created_at
FROM public.orders o
WHERE o.mp_payment_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.order_payments p
     WHERE p.provider='mercado_pago' AND p.provider_payment_id = o.mp_payment_id
  );

-- Backfill de active_payment_provider: restaurantes com MP token viram 'mercado_pago'
UPDATE public.restaurants r
   SET active_payment_provider='mercado_pago'
 WHERE active_payment_provider IS NULL
   AND EXISTS (SELECT 1 FROM public.restaurant_secrets s WHERE s.restaurant_id=r.id AND s.mp_access_token IS NOT NULL);

-- =====================================================================
-- Grants finais
-- =====================================================================
GRANT EXECUTE ON FUNCTION
  public.pagbank_connect_init(uuid, text, text),
  public.pagbank_disconnect(uuid, text),
  public.pagbank_rotate_webhook_key(uuid, text),
  public.set_active_payment_provider(uuid, text, text)
TO authenticated;

REVOKE EXECUTE ON FUNCTION
  public.pagbank_connect_complete(text, text, text, integer, text[], text, text)
FROM PUBLIC, authenticated, anon;

COMMENT ON TABLE public.order_payments IS 'Fonte canônica de status financeiro. Ambos providers (mercado_pago, pagbank) gravam aqui via payment_apply_provider_event.';
COMMENT ON TABLE public.restaurant_payment_integrations IS 'Vínculo PagBank Connect por restaurante. Tokens criptografados via vault secret pagbank_token_encryption_key.';
