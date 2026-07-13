CREATE OR REPLACE FUNCTION public.mark_order_paid_manual(p_order_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public','private','pg_temp'
AS $$
DECLARE
  v_rest uuid; v_prev text; v_ctx RECORD;
BEGIN
  SELECT restaurant_id, payment_status::text INTO v_rest, v_prev
    FROM public.orders WHERE id = p_order_id;
  IF v_rest IS NULL THEN RAISE EXCEPTION 'order_not_found'; END IF;

  SELECT * INTO v_ctx
    FROM private.authorize_tenant_action(v_rest, 'operational');

  -- No-op silencioso: já pago
  IF v_prev = 'paid' THEN RETURN; END IF;

  UPDATE public.orders
    SET payment_status = 'paid', paid_at = now(), updated_at = now()
    WHERE id = p_order_id;

  PERFORM public._log_order_event(
    p_order_id, 'payment_marked_paid',
    jsonb_build_object('previous_payment_status', v_prev, 'method', 'manual')
  );

  IF NOT v_ctx.is_native THEN
    PERFORM private.record_audit(
      'order.payment_marked_paid','orders', v_rest,'order', p_order_id::text,
      jsonb_build_object('payment_status', v_prev),
      jsonb_build_object('payment_status', 'paid'),
      NULL,
      jsonb_build_object('support_level', v_ctx.support_level),
      v_ctx.support_session_id
    );
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.mark_order_paid_manual(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.mark_order_paid_manual(uuid) TO authenticated;
GRANT  EXECUTE ON FUNCTION public.mark_order_paid_manual(uuid) TO service_role;