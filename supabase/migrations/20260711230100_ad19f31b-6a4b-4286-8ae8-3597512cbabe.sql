
CREATE OR REPLACE FUNCTION private._pagbank_encrypt(p_plain text)
RETURNS bytea
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'private', 'extensions', 'pg_temp'
AS $function$
BEGIN
  IF p_plain IS NULL THEN RETURN NULL; END IF;
  RETURN extensions.pgp_sym_encrypt(p_plain, private._pagbank_encryption_key());
END $function$;

CREATE OR REPLACE FUNCTION private._pagbank_decrypt(p_cipher bytea)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'private', 'extensions', 'pg_temp'
AS $function$
BEGIN
  IF p_cipher IS NULL THEN RETURN NULL; END IF;
  RETURN extensions.pgp_sym_decrypt(p_cipher, private._pagbank_encryption_key());
END $function$;

CREATE OR REPLACE FUNCTION public.pagbank_connect_init(
  p_restaurant_id uuid,
  p_environment text,
  p_redirect_after text DEFAULT '/admin/configuracoes?tab=pagamentos'::text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'private', 'extensions', 'pg_temp'
AS $function$
DECLARE
  v_ctx    RECORD;
  v_state  text;
  v_env    text := lower(coalesce(p_environment,'sandbox'));
BEGIN
  IF v_env NOT IN ('sandbox','production') THEN
    RAISE EXCEPTION 'invalid_environment' USING ERRCODE = '22023';
  END IF;
  SELECT * INTO v_ctx FROM private.authorize_tenant_action(p_restaurant_id, 'administrative');

  v_state := encode(extensions.gen_random_bytes(32), 'hex');
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
END $function$;

CREATE OR REPLACE FUNCTION public.pagbank_rotate_webhook_key(p_restaurant_id uuid, p_reason text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'private', 'extensions', 'pg_temp'
AS $function$
DECLARE
  v_ctx RECORD;
  v_new text;
BEGIN
  SELECT * INTO v_ctx FROM private.authorize_tenant_action(p_restaurant_id,'administrative');
  IF p_reason IS NULL OR length(btrim(p_reason)) < 5 THEN
    RAISE EXCEPTION 'reason_required' USING ERRCODE='22023';
  END IF;
  v_new := replace(replace(replace(encode(extensions.gen_random_bytes(24),'base64'),'+','-'),'/','_'),'=','');
  UPDATE public.restaurant_payment_integrations
     SET webhook_key = v_new
   WHERE restaurant_id=p_restaurant_id AND provider='pagbank' AND status='active';
  PERFORM private.record_audit('payment.pagbank.webhook_key_rotated','payments',p_restaurant_id,
    'integration', p_restaurant_id::text, NULL, NULL, p_reason, NULL, v_ctx.support_session_id);
  RETURN jsonb_build_object('webhook_key', v_new);
END $function$;
