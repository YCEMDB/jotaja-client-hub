
CREATE OR REPLACE FUNCTION public.payment_apply_provider_event(
  p_provider text,
  p_provider_payment_id text,
  p_external_event_id text,
  p_payload_hash text,
  p_new_status financial_payment_status,
  p_provider_status_raw text,
  p_amount numeric,
  p_paid_at timestamp with time zone,
  p_failure_code text,
  p_failure_message text,
  p_source text,
  p_expected_reference_id text DEFAULT NULL,
  p_expected_currency text DEFAULT NULL,
  p_expected_restaurant_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog','public','private','pg_temp'
AS $function$
DECLARE
  v_pay   public.order_payments%ROWTYPE;
  v_ord   public.orders%ROWTYPE;
  v_evt   public.payment_webhook_events%ROWTYPE;
  v_prev  public.financial_payment_status;

  -- Helper: registra rejeição no evento e retorna JSON estruturado
  v_reject_code text;
  v_reject_msg  text;
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
      RETURN jsonb_build_object(
        'processed', true,
        'applied', (v_evt.result = 'ok'),
        'duplicate', true,
        'error_code', v_evt.error_code
      );
    END IF;
  END;

  -- Pagamento desconhecido → rejeição estruturada (sem exception)
  SELECT * INTO v_pay FROM public.order_payments
   WHERE provider = p_provider AND provider_payment_id = p_provider_payment_id
   FOR UPDATE;
  IF NOT FOUND THEN
    UPDATE public.payment_webhook_events
       SET processed_at=now(), result='rejected', error_code='payment_not_found'
     WHERE id = v_evt.id;
    RETURN jsonb_build_object(
      'processed', true,
      'applied', false,
      'duplicate', false,
      'error_code', 'payment_not_found'
    );
  END IF;

  SELECT * INTO v_ord FROM public.orders WHERE id = v_pay.order_id FOR UPDATE;

  -- Validações estruturadas (curto-circuito na primeira divergência)
  IF p_amount IS NOT NULL AND ROUND(p_amount, 2) <> ROUND(v_pay.amount, 2) THEN
    v_reject_code := 'payment_amount_mismatch';
    v_reject_msg  := 'Valor divergente do provedor';
  ELSIF p_expected_reference_id IS NOT NULL
        AND v_pay.reference_id IS NOT NULL
        AND p_expected_reference_id <> v_pay.reference_id THEN
    v_reject_code := 'payment_reference_mismatch';
    v_reject_msg  := 'Referência divergente do pagamento';
  ELSIF p_expected_currency IS NOT NULL
        AND upper(p_expected_currency) <> upper(COALESCE(v_pay.currency, 'BRL')) THEN
    v_reject_code := 'payment_currency_mismatch';
    v_reject_msg  := 'Moeda divergente do pagamento';
  ELSIF p_expected_restaurant_id IS NOT NULL
        AND p_expected_restaurant_id <> v_pay.restaurant_id THEN
    v_reject_code := 'payment_restaurant_mismatch';
    v_reject_msg  := 'Restaurante divergente do pagamento';
  ELSIF v_ord.status = 'canceled' THEN
    v_reject_code := 'order_canceled';
    v_reject_msg  := 'Pedido cancelado — pagamento não aplicado';
  END IF;

  IF v_reject_code IS NOT NULL THEN
    UPDATE public.order_payments
       SET failure_code = v_reject_code,
           failure_message_sanitized = v_reject_msg,
           last_webhook_at = CASE WHEN p_source='webhook' THEN now() ELSE last_webhook_at END,
           provider_status = COALESCE(p_provider_status_raw, provider_status)
     WHERE id = v_pay.id;
    UPDATE public.payment_webhook_events
       SET processed_at=now(), result='rejected', error_code=v_reject_code,
           order_payment_id = v_pay.id, restaurant_id = v_pay.restaurant_id
     WHERE id = v_evt.id;
    RETURN jsonb_build_object(
      'processed', true,
      'applied', false,
      'duplicate', false,
      'error_code', v_reject_code,
      'payment_id', v_pay.id,
      'order_id', v_pay.order_id
    );
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

  IF p_new_status = 'paid' AND v_prev <> 'paid' THEN
    UPDATE public.orders
       SET payment_status = 'paid', paid_at = COALESCE(p_paid_at, now())
     WHERE id = v_ord.id;
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
    'processed', true,
    'applied', true,
    'duplicate', false,
    'payment_id', v_pay.id,
    'order_id', v_pay.order_id,
    'previous_status', v_prev,
    'new_status', p_new_status,
    'source', p_source
  );
END $function$;

REVOKE ALL ON FUNCTION public.payment_apply_provider_event(text,text,text,text,financial_payment_status,text,numeric,timestamp with time zone,text,text,text,text,text,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.payment_apply_provider_event(text,text,text,text,financial_payment_status,text,numeric,timestamp with time zone,text,text,text,text,text,uuid) TO service_role;
