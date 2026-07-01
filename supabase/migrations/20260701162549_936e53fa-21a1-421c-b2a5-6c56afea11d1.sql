
-- =========================================================
-- Sprint 2.2.e — Order State Machine
-- =========================================================

-- 1) History table
CREATE TABLE IF NOT EXISTS public.order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  from_status public.order_status,
  to_status public.order_status NOT NULL,
  changed_by UUID REFERENCES auth.users(id),
  source TEXT NOT NULL DEFAULT 'system',
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.order_status_history TO authenticated;
GRANT ALL ON public.order_status_history TO service_role;

ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "team can read order history" ON public.order_status_history;
CREATE POLICY "team can read order history" ON public.order_status_history
  FOR SELECT TO authenticated
  USING (
    public.is_team_owner(auth.uid(), restaurant_id)
    OR EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.restaurant_id = order_status_history.restaurant_id
        AND ur.role IN ('employee','manager')
    )
  );

CREATE INDEX IF NOT EXISTS idx_osh_order ON public.order_status_history(order_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_osh_restaurant ON public.order_status_history(restaurant_id, created_at DESC);

-- 2) Transition validator
CREATE OR REPLACE FUNCTION private.is_valid_order_transition(
  p_from public.order_status,
  p_to public.order_status,
  p_type public.order_type DEFAULT NULL
) RETURNS boolean
LANGUAGE sql IMMUTABLE
AS $$
  SELECT CASE
    WHEN p_from = p_to THEN false
    WHEN p_from IS NULL AND p_to = 'pending' THEN true
    WHEN p_from = 'pending'          AND p_to IN ('confirmed','cancelled') THEN true
    WHEN p_from = 'confirmed'        AND p_to IN ('preparing','cancelled') THEN true
    WHEN p_from = 'preparing'        AND p_to IN ('ready','cancelled') THEN true
    WHEN p_from = 'ready'            AND p_to IN ('out_for_delivery','delivered','cancelled') THEN true
    WHEN p_from = 'out_for_delivery' AND p_to IN ('delivered','cancelled') THEN true
    -- terminal: delivered, cancelled → nothing
    ELSE false
  END;
$$;

-- 3) Guard trigger: no direct status change outside the RPC
--    RPC sets a session flag `app.status_change_ok = 'on'` before UPDATE.
CREATE OR REPLACE FUNCTION public.enforce_order_status_transition()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public','pg_temp'
AS $$
DECLARE v_ok TEXT;
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    v_ok := current_setting('app.status_change_ok', true);
    IF v_ok IS DISTINCT FROM 'on' THEN
      RAISE EXCEPTION 'status_change_forbidden: use update_order_status()'
        USING ERRCODE = '42501';
    END IF;
    IF NOT private.is_valid_order_transition(OLD.status, NEW.status, OLD.type) THEN
      RAISE EXCEPTION 'invalid_transition: % → %', OLD.status, NEW.status
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_order_status ON public.orders;
CREATE TRIGGER trg_enforce_order_status
  BEFORE UPDATE OF status ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.enforce_order_status_transition();

-- 4) Official RPC
CREATE OR REPLACE FUNCTION public.update_order_status(
  p_order_id UUID,
  p_new_status public.order_status,
  p_source TEXT DEFAULT 'panel',
  p_reason TEXT DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public','pg_temp'
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_order public.orders%ROWTYPE;
  v_allowed BOOLEAN := false;
BEGIN
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'order_not_found' USING ERRCODE = 'no_data_found';
  END IF;

  -- Permission: owner/super_admin OR team member (employee/manager)
  IF public.is_team_owner(v_uid, v_order.restaurant_id) THEN
    v_allowed := true;
  ELSIF EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = v_uid
      AND ur.restaurant_id = v_order.restaurant_id
      AND ur.role IN ('employee','manager')
  ) THEN
    v_allowed := true;
  END IF;

  IF NOT v_allowed THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  IF v_order.status = p_new_status THEN
    RETURN jsonb_build_object('id', v_order.id, 'status', v_order.status, 'noop', true);
  END IF;

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
    v_uid, COALESCE(NULLIF(btrim(p_source),''),'panel'), NULLIF(btrim(p_reason),'')
  );

  RETURN jsonb_build_object(
    'id', p_order_id,
    'from', v_order.status,
    'to', p_new_status,
    'changed_at', now()
  );
END;
$$;

REVOKE ALL ON FUNCTION public.update_order_status(UUID, public.order_status, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_order_status(UUID, public.order_status, TEXT, TEXT) TO authenticated, service_role;

-- 5) Seed initial history for new orders (INSERT)
CREATE OR REPLACE FUNCTION public.seed_order_status_history()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public','pg_temp'
AS $$
BEGIN
  INSERT INTO public.order_status_history(
    order_id, restaurant_id, from_status, to_status, changed_by, source, reason
  ) VALUES (
    NEW.id, NEW.restaurant_id, NULL, NEW.status, auth.uid(),
    COALESCE(NEW.source,'system'), 'order_created'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_seed_order_status_history ON public.orders;
CREATE TRIGGER trg_seed_order_status_history
  AFTER INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.seed_order_status_history();

-- 6) Backfill history for existing orders that have none
INSERT INTO public.order_status_history (order_id, restaurant_id, from_status, to_status, source, reason, created_at)
SELECT o.id, o.restaurant_id, NULL, o.status, 'backfill', 'sprint_2_2_e', o.created_at
FROM public.orders o
LEFT JOIN public.order_status_history h ON h.order_id = o.id
WHERE h.id IS NULL;
