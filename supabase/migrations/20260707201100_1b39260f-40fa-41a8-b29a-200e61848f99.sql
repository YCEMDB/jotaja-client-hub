
-- ============================================================
-- SPRINT 7 — FASE A: Delivery Foundation
-- ============================================================

-- 1) Extend app_role enum with 'driver'
DO $$ BEGIN
  ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'driver';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2) Driver status enum
DO $$ BEGIN
  CREATE TYPE public.driver_status AS ENUM ('offline','available','busy');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3) Extend delivery_drivers
ALTER TABLE public.delivery_drivers
  ADD COLUMN IF NOT EXISTS status public.driver_status NOT NULL DEFAULT 'offline',
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS fee_per_delivery numeric(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS commission_percent numeric(5,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS current_latitude numeric(10,7),
  ADD COLUMN IF NOT EXISTS current_longitude numeric(10,7),
  ADD COLUMN IF NOT EXISTS last_location_at timestamptz,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_delivery_drivers_user ON public.delivery_drivers(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_delivery_drivers_restaurant_status ON public.delivery_drivers(restaurant_id, status);

-- 4) Extend orders with dispatch timestamps + commission snapshot
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS driver_assigned_at timestamptz,
  ADD COLUMN IF NOT EXISTS driver_accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS driver_picked_up_at timestamptz,
  ADD COLUMN IF NOT EXISTS driver_delivered_at timestamptz,
  ADD COLUMN IF NOT EXISTS driver_rejected_at timestamptz,
  ADD COLUMN IF NOT EXISTS driver_reject_reason text,
  ADD COLUMN IF NOT EXISTS driver_commission_amount numeric(10,2);

CREATE INDEX IF NOT EXISTS idx_orders_driver_status ON public.orders(driver_id, status) WHERE driver_id IS NOT NULL;

-- 5) driver_locations table (GPS history)
CREATE TABLE IF NOT EXISTS public.driver_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid NOT NULL REFERENCES public.delivery_drivers(id) ON DELETE CASCADE,
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  latitude numeric(10,7) NOT NULL,
  longitude numeric(10,7) NOT NULL,
  accuracy numeric(8,2),
  speed numeric(8,2),
  heading numeric(6,2),
  recorded_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_driver_locations_driver_time ON public.driver_locations(driver_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_driver_locations_order ON public.driver_locations(order_id) WHERE order_id IS NOT NULL;

GRANT SELECT, INSERT ON public.driver_locations TO authenticated;
GRANT ALL ON public.driver_locations TO service_role;

ALTER TABLE public.driver_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "team_owner_view_driver_locations"
  ON public.driver_locations FOR SELECT TO authenticated
  USING (public.is_team_owner(auth.uid(), restaurant_id));

CREATE POLICY "driver_view_own_locations"
  ON public.driver_locations FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.delivery_drivers d
                 WHERE d.id = driver_locations.driver_id AND d.user_id = auth.uid()));

-- Inserts happen via SECURITY DEFINER RPC only; no direct INSERT policy.

-- 6) Update app_plans features: add max_drivers per tier
UPDATE public.app_plans SET features = features || jsonb_build_object('max_drivers', 0, 'drivers', false) WHERE id = 'starter';
UPDATE public.app_plans SET features = features || jsonb_build_object('max_drivers', 5, 'drivers', true)  WHERE id = 'pro';
UPDATE public.app_plans SET features = features || jsonb_build_object('max_drivers', NULL, 'drivers', true) WHERE id = 'business';

-- ============================================================
-- HELPER: is_restaurant_driver (auth.uid maps to a driver of a restaurant)
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_restaurant_driver(_uid uuid, _restaurant_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.delivery_drivers
    WHERE restaurant_id = _restaurant_id
      AND user_id = _uid
      AND is_active = true
  );
$$;

-- ============================================================
-- HELPER: check plan max_drivers
-- ============================================================
CREATE OR REPLACE FUNCTION public.check_driver_limit(_restaurant_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_max int;
  v_current int;
  v_plan_id text;
BEGIN
  SELECT plan_id INTO v_plan_id FROM public.restaurants WHERE id = _restaurant_id;
  SELECT (features->>'max_drivers')::int INTO v_max FROM public.app_plans WHERE id = v_plan_id;
  IF v_max IS NULL THEN RETURN; END IF; -- unlimited
  SELECT COUNT(*) INTO v_current FROM public.delivery_drivers WHERE restaurant_id = _restaurant_id AND is_active = true;
  IF v_current >= v_max THEN
    RAISE EXCEPTION 'plan_limit_reached: max_drivers=%', v_max USING ERRCODE = 'check_violation';
  END IF;
END $$;

-- ============================================================
-- RPC: create_driver
-- ============================================================
CREATE OR REPLACE FUNCTION public.create_driver(
  p_restaurant_id uuid,
  p_name text,
  p_phone text DEFAULT NULL,
  p_email text DEFAULT NULL,
  p_vehicle text DEFAULT NULL,
  p_license_plate text DEFAULT NULL,
  p_fee_per_delivery numeric DEFAULT 0,
  p_commission_percent numeric DEFAULT 0
)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id uuid;
BEGIN
  IF NOT public.is_team_owner(auth.uid(), p_restaurant_id) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = 'insufficient_privilege';
  END IF;
  PERFORM public.check_driver_limit(p_restaurant_id);
  INSERT INTO public.delivery_drivers(
    restaurant_id, name, phone, email, vehicle, license_plate,
    fee_per_delivery, commission_percent, is_active, status
  ) VALUES (
    p_restaurant_id, p_name, p_phone, p_email, p_vehicle, p_license_plate,
    COALESCE(p_fee_per_delivery,0), COALESCE(p_commission_percent,0), true, 'offline'
  ) RETURNING id INTO v_id;
  RETURN v_id;
END $$;

-- ============================================================
-- RPC: update_driver
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_driver(
  p_driver_id uuid,
  p_name text DEFAULT NULL,
  p_phone text DEFAULT NULL,
  p_email text DEFAULT NULL,
  p_vehicle text DEFAULT NULL,
  p_license_plate text DEFAULT NULL,
  p_fee_per_delivery numeric DEFAULT NULL,
  p_commission_percent numeric DEFAULT NULL,
  p_is_active boolean DEFAULT NULL
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_rest uuid;
BEGIN
  SELECT restaurant_id INTO v_rest FROM public.delivery_drivers WHERE id = p_driver_id;
  IF v_rest IS NULL THEN RAISE EXCEPTION 'driver_not_found'; END IF;
  IF NOT public.is_team_owner(auth.uid(), v_rest) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = 'insufficient_privilege';
  END IF;
  UPDATE public.delivery_drivers SET
    name = COALESCE(p_name, name),
    phone = COALESCE(p_phone, phone),
    email = COALESCE(p_email, email),
    vehicle = COALESCE(p_vehicle, vehicle),
    license_plate = COALESCE(p_license_plate, license_plate),
    fee_per_delivery = COALESCE(p_fee_per_delivery, fee_per_delivery),
    commission_percent = COALESCE(p_commission_percent, commission_percent),
    is_active = COALESCE(p_is_active, is_active),
    updated_at = now()
  WHERE id = p_driver_id;
END $$;

-- ============================================================
-- RPC: link_driver_user (owner ties a driver record to an auth.user by email)
-- ============================================================
CREATE OR REPLACE FUNCTION public.link_driver_user(p_driver_id uuid, p_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_rest uuid;
BEGIN
  SELECT restaurant_id INTO v_rest FROM public.delivery_drivers WHERE id = p_driver_id;
  IF v_rest IS NULL THEN RAISE EXCEPTION 'driver_not_found'; END IF;
  IF NOT public.is_team_owner(auth.uid(), v_rest) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = 'insufficient_privilege';
  END IF;
  UPDATE public.delivery_drivers SET user_id = p_user_id, updated_at = now() WHERE id = p_driver_id;
  INSERT INTO public.user_roles(user_id, restaurant_id, role)
    VALUES (p_user_id, v_rest, 'driver')
    ON CONFLICT DO NOTHING;
END $$;

-- ============================================================
-- RPC: set_driver_status (owner OR driver himself)
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_driver_status(p_driver_id uuid, p_status public.driver_status)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_rest uuid; v_user uuid;
BEGIN
  SELECT restaurant_id, user_id INTO v_rest, v_user FROM public.delivery_drivers WHERE id = p_driver_id;
  IF v_rest IS NULL THEN RAISE EXCEPTION 'driver_not_found'; END IF;
  IF NOT (public.is_team_owner(auth.uid(), v_rest) OR v_user = auth.uid()) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = 'insufficient_privilege';
  END IF;
  UPDATE public.delivery_drivers SET status = p_status, updated_at = now() WHERE id = p_driver_id;
END $$;

-- ============================================================
-- Timeline helper
-- ============================================================
CREATE OR REPLACE FUNCTION public._log_order_event(
  p_order_id uuid, p_event text, p_meta jsonb DEFAULT '{}'::jsonb
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_rest uuid; v_status order_status;
BEGIN
  SELECT restaurant_id, status INTO v_rest, v_status FROM public.orders WHERE id = p_order_id;
  IF v_rest IS NULL THEN RETURN; END IF;
  INSERT INTO public.order_status_history(order_id, restaurant_id, status, source, reason, changed_by, metadata)
    VALUES (p_order_id, v_rest, v_status, 'delivery', p_event, auth.uid(), p_meta);
END $$;

-- ============================================================
-- RPC: assign_driver (owner atribui / troca motorista)
-- ============================================================
CREATE OR REPLACE FUNCTION public.assign_driver(p_order_id uuid, p_driver_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_rest uuid; v_driver_rest uuid; v_prev uuid;
BEGIN
  SELECT restaurant_id, driver_id INTO v_rest, v_prev FROM public.orders WHERE id = p_order_id;
  IF v_rest IS NULL THEN RAISE EXCEPTION 'order_not_found'; END IF;
  IF NOT public.is_team_owner(auth.uid(), v_rest) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = 'insufficient_privilege';
  END IF;
  SELECT restaurant_id INTO v_driver_rest FROM public.delivery_drivers WHERE id = p_driver_id AND is_active = true;
  IF v_driver_rest IS NULL OR v_driver_rest <> v_rest THEN
    RAISE EXCEPTION 'driver_not_in_restaurant';
  END IF;
  UPDATE public.orders
    SET driver_id = p_driver_id,
        driver_assigned_at = now(),
        driver_accepted_at = NULL,
        driver_rejected_at = NULL,
        driver_reject_reason = NULL,
        updated_at = now()
    WHERE id = p_order_id;
  PERFORM public._log_order_event(p_order_id, 'driver_assigned', jsonb_build_object('driver_id', p_driver_id, 'previous_driver_id', v_prev));
END $$;

-- ============================================================
-- RPC: unassign_driver
-- ============================================================
CREATE OR REPLACE FUNCTION public.unassign_driver(p_order_id uuid, p_reason text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_rest uuid; v_prev uuid;
BEGIN
  SELECT restaurant_id, driver_id INTO v_rest, v_prev FROM public.orders WHERE id = p_order_id;
  IF v_rest IS NULL THEN RAISE EXCEPTION 'order_not_found'; END IF;
  IF NOT public.is_team_owner(auth.uid(), v_rest) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = 'insufficient_privilege';
  END IF;
  UPDATE public.orders
    SET driver_id = NULL,
        driver_assigned_at = NULL,
        driver_accepted_at = NULL,
        driver_picked_up_at = NULL,
        updated_at = now()
    WHERE id = p_order_id;
  PERFORM public._log_order_event(p_order_id, 'driver_unassigned', jsonb_build_object('previous_driver_id', v_prev, 'reason', p_reason));
END $$;

-- ============================================================
-- RPC: driver_accept_order
-- ============================================================
CREATE OR REPLACE FUNCTION public.driver_accept_order(p_order_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_driver uuid; v_rest uuid;
BEGIN
  SELECT o.driver_id, o.restaurant_id INTO v_driver, v_rest FROM public.orders o WHERE o.id = p_order_id;
  IF v_driver IS NULL THEN RAISE EXCEPTION 'not_assigned'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.delivery_drivers WHERE id = v_driver AND user_id = auth.uid()) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = 'insufficient_privilege';
  END IF;
  UPDATE public.orders SET driver_accepted_at = now(), updated_at = now() WHERE id = p_order_id;
  UPDATE public.delivery_drivers SET status = 'busy', updated_at = now() WHERE id = v_driver;
  PERFORM public._log_order_event(p_order_id, 'driver_accepted', jsonb_build_object('driver_id', v_driver));
END $$;

-- ============================================================
-- RPC: driver_reject_order
-- ============================================================
CREATE OR REPLACE FUNCTION public.driver_reject_order(p_order_id uuid, p_reason text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_driver uuid;
BEGIN
  SELECT driver_id INTO v_driver FROM public.orders WHERE id = p_order_id;
  IF v_driver IS NULL THEN RAISE EXCEPTION 'not_assigned'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.delivery_drivers WHERE id = v_driver AND user_id = auth.uid()) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = 'insufficient_privilege';
  END IF;
  UPDATE public.orders
    SET driver_id = NULL,
        driver_rejected_at = now(),
        driver_reject_reason = p_reason,
        driver_assigned_at = NULL,
        updated_at = now()
    WHERE id = p_order_id;
  PERFORM public._log_order_event(p_order_id, 'driver_rejected', jsonb_build_object('driver_id', v_driver, 'reason', p_reason));
END $$;

-- ============================================================
-- RPC: driver_pickup_order → transiciona para out_for_delivery
-- ============================================================
CREATE OR REPLACE FUNCTION public.driver_pickup_order(p_order_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_driver uuid; v_status order_status; v_fee numeric; v_pct numeric; v_delivery_fee numeric; v_commission numeric;
BEGIN
  SELECT o.driver_id, o.status, o.delivery_fee INTO v_driver, v_status, v_delivery_fee
    FROM public.orders o WHERE o.id = p_order_id;
  IF v_driver IS NULL THEN RAISE EXCEPTION 'not_assigned'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.delivery_drivers WHERE id = v_driver AND user_id = auth.uid()) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = 'insufficient_privilege';
  END IF;
  IF v_status NOT IN ('ready','preparing') THEN
    RAISE EXCEPTION 'invalid_status: %', v_status;
  END IF;
  SELECT fee_per_delivery, commission_percent INTO v_fee, v_pct FROM public.delivery_drivers WHERE id = v_driver;
  v_commission := COALESCE(v_fee,0) + (COALESCE(v_delivery_fee,0) * COALESCE(v_pct,0) / 100);
  UPDATE public.orders
    SET driver_picked_up_at = now(),
        driver_commission_amount = v_commission,
        updated_at = now()
    WHERE id = p_order_id;
  PERFORM public._log_order_event(p_order_id, 'driver_picked_up', jsonb_build_object('driver_id', v_driver, 'commission', v_commission));
  PERFORM public.update_order_status(p_order_id, 'out_for_delivery'::order_status, 'delivery', 'Motoboy retirou o pedido');
END $$;

-- ============================================================
-- RPC: driver_complete_delivery → transiciona para delivered
-- ============================================================
CREATE OR REPLACE FUNCTION public.driver_complete_delivery(p_order_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_driver uuid;
BEGIN
  SELECT driver_id INTO v_driver FROM public.orders WHERE id = p_order_id;
  IF v_driver IS NULL THEN RAISE EXCEPTION 'not_assigned'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.delivery_drivers WHERE id = v_driver AND user_id = auth.uid()) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = 'insufficient_privilege';
  END IF;
  UPDATE public.orders SET driver_delivered_at = now(), updated_at = now() WHERE id = p_order_id;
  UPDATE public.delivery_drivers SET status = 'available', updated_at = now() WHERE id = v_driver;
  PERFORM public._log_order_event(p_order_id, 'driver_delivered', jsonb_build_object('driver_id', v_driver));
  PERFORM public.update_order_status(p_order_id, 'delivered'::order_status, 'delivery', 'Entrega finalizada pelo motoboy');
END $$;

-- ============================================================
-- RPC: update_driver_location (called every 30s while in route)
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_driver_location(
  p_latitude numeric,
  p_longitude numeric,
  p_accuracy numeric DEFAULT NULL,
  p_speed numeric DEFAULT NULL,
  p_heading numeric DEFAULT NULL,
  p_order_id uuid DEFAULT NULL
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_driver uuid; v_rest uuid;
BEGIN
  SELECT id, restaurant_id INTO v_driver, v_rest FROM public.delivery_drivers WHERE user_id = auth.uid() AND is_active = true LIMIT 1;
  IF v_driver IS NULL THEN RAISE EXCEPTION 'not_a_driver'; END IF;
  UPDATE public.delivery_drivers
    SET current_latitude = p_latitude,
        current_longitude = p_longitude,
        last_location_at = now(),
        updated_at = now()
    WHERE id = v_driver;
  INSERT INTO public.driver_locations(driver_id, restaurant_id, order_id, latitude, longitude, accuracy, speed, heading)
    VALUES (v_driver, v_rest, p_order_id, p_latitude, p_longitude, p_accuracy, p_speed, p_heading);
END $$;

-- ============================================================
-- RPC: get_driver_assigned_orders (para o app do motoboy)
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_driver_assigned_orders()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_driver uuid; v_rest uuid; v_result jsonb;
BEGIN
  SELECT id, restaurant_id INTO v_driver, v_rest FROM public.delivery_drivers WHERE user_id = auth.uid() AND is_active = true LIMIT 1;
  IF v_driver IS NULL THEN RETURN jsonb_build_object('driver', NULL, 'orders', '[]'::jsonb); END IF;

  SELECT jsonb_build_object(
    'driver', to_jsonb(d),
    'restaurant', jsonb_build_object('id', r.id, 'name', r.name, 'address', r.address, 'phone', r.phone),
    'orders', COALESCE((
      SELECT jsonb_agg(to_jsonb(o) ORDER BY o.driver_assigned_at DESC NULLS LAST)
      FROM public.orders o
      WHERE o.driver_id = v_driver
        AND o.status IN ('confirmed','preparing','ready','out_for_delivery')
    ), '[]'::jsonb),
    'history', COALESCE((
      SELECT jsonb_agg(to_jsonb(o) ORDER BY o.driver_delivered_at DESC NULLS LAST)
      FROM (
        SELECT * FROM public.orders
        WHERE driver_id = v_driver AND status = 'delivered'
        ORDER BY driver_delivered_at DESC NULLS LAST
        LIMIT 20
      ) o
    ), '[]'::jsonb)
  )
  INTO v_result
  FROM public.delivery_drivers d
  JOIN public.restaurants r ON r.id = d.restaurant_id
  WHERE d.id = v_driver;
  RETURN v_result;
END $$;

-- ============================================================
-- RPC: get_delivery_dashboard (admin panel)
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_delivery_dashboard(p_restaurant_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_result jsonb;
BEGIN
  IF NOT public.is_team_owner(auth.uid(), p_restaurant_id) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = 'insufficient_privilege';
  END IF;

  SELECT jsonb_build_object(
    'drivers_total',    (SELECT COUNT(*) FROM public.delivery_drivers WHERE restaurant_id = p_restaurant_id AND is_active = true),
    'drivers_online',   (SELECT COUNT(*) FROM public.delivery_drivers WHERE restaurant_id = p_restaurant_id AND is_active = true AND status IN ('available','busy')),
    'drivers_available',(SELECT COUNT(*) FROM public.delivery_drivers WHERE restaurant_id = p_restaurant_id AND is_active = true AND status = 'available'),
    'drivers_busy',     (SELECT COUNT(*) FROM public.delivery_drivers WHERE restaurant_id = p_restaurant_id AND is_active = true AND status = 'busy'),
    'awaiting_driver',  (SELECT COUNT(*) FROM public.orders WHERE restaurant_id = p_restaurant_id AND type = 'delivery' AND driver_id IS NULL AND status IN ('confirmed','preparing','ready')),
    'in_route',         (SELECT COUNT(*) FROM public.orders WHERE restaurant_id = p_restaurant_id AND status = 'out_for_delivery'),
    'delivered_today',  (SELECT COUNT(*) FROM public.orders WHERE restaurant_id = p_restaurant_id AND status = 'delivered' AND driver_delivered_at >= date_trunc('day', now())),
    'avg_pickup_min',   (SELECT ROUND(AVG(EXTRACT(EPOCH FROM (driver_picked_up_at - driver_assigned_at))/60)::numeric, 1)
                          FROM public.orders WHERE restaurant_id = p_restaurant_id AND driver_picked_up_at IS NOT NULL AND driver_assigned_at IS NOT NULL AND driver_delivered_at >= date_trunc('day', now())),
    'avg_delivery_min', (SELECT ROUND(AVG(EXTRACT(EPOCH FROM (driver_delivered_at - driver_picked_up_at))/60)::numeric, 1)
                          FROM public.orders WHERE restaurant_id = p_restaurant_id AND driver_delivered_at IS NOT NULL AND driver_picked_up_at IS NOT NULL AND driver_delivered_at >= date_trunc('day', now()))
  ) INTO v_result;
  RETURN v_result;
END $$;

-- ============================================================
-- GRANTs on RPCs
-- ============================================================
REVOKE ALL ON FUNCTION public.create_driver(uuid,text,text,text,text,text,numeric,numeric) FROM public;
REVOKE ALL ON FUNCTION public.update_driver(uuid,text,text,text,text,text,numeric,numeric,boolean) FROM public;
REVOKE ALL ON FUNCTION public.link_driver_user(uuid,uuid) FROM public;
REVOKE ALL ON FUNCTION public.set_driver_status(uuid,driver_status) FROM public;
REVOKE ALL ON FUNCTION public.assign_driver(uuid,uuid) FROM public;
REVOKE ALL ON FUNCTION public.unassign_driver(uuid,text) FROM public;
REVOKE ALL ON FUNCTION public.driver_accept_order(uuid) FROM public;
REVOKE ALL ON FUNCTION public.driver_reject_order(uuid,text) FROM public;
REVOKE ALL ON FUNCTION public.driver_pickup_order(uuid) FROM public;
REVOKE ALL ON FUNCTION public.driver_complete_delivery(uuid) FROM public;
REVOKE ALL ON FUNCTION public.update_driver_location(numeric,numeric,numeric,numeric,numeric,uuid) FROM public;
REVOKE ALL ON FUNCTION public.get_driver_assigned_orders() FROM public;
REVOKE ALL ON FUNCTION public.get_delivery_dashboard(uuid) FROM public;
REVOKE ALL ON FUNCTION public.check_driver_limit(uuid) FROM public;
REVOKE ALL ON FUNCTION public.is_restaurant_driver(uuid,uuid) FROM public;
REVOKE ALL ON FUNCTION public._log_order_event(uuid,text,jsonb) FROM public;

GRANT EXECUTE ON FUNCTION public.create_driver(uuid,text,text,text,text,text,numeric,numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_driver(uuid,text,text,text,text,text,numeric,numeric,boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.link_driver_user(uuid,uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_driver_status(uuid,driver_status) TO authenticated;
GRANT EXECUTE ON FUNCTION public.assign_driver(uuid,uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.unassign_driver(uuid,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.driver_accept_order(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.driver_reject_order(uuid,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.driver_pickup_order(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.driver_complete_delivery(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_driver_location(numeric,numeric,numeric,numeric,numeric,uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_driver_assigned_orders() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_delivery_dashboard(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_restaurant_driver(uuid,uuid) TO authenticated;

-- REALTIME
ALTER PUBLICATION supabase_realtime ADD TABLE public.delivery_drivers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.driver_locations;
