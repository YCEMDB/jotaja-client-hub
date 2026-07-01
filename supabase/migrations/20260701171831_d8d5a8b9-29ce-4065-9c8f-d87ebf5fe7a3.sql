-- Sprint 3 — Centro de Operações

-- =========================================================================
-- 1) ESTAÇÕES
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.kitchen_stations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#ff6b35',
  "position" INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (restaurant_id, name)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kitchen_stations TO authenticated;
GRANT ALL ON public.kitchen_stations TO service_role;
ALTER TABLE public.kitchen_stations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "kitchen_stations_team_all" ON public.kitchen_stations
  FOR ALL TO authenticated
  USING (
    public.is_team_owner(auth.uid(), restaurant_id)
    OR EXISTS (SELECT 1 FROM public.user_roles ur
               WHERE ur.user_id = auth.uid() AND ur.restaurant_id = kitchen_stations.restaurant_id
                 AND ur.role IN ('employee','manager'))
  )
  WITH CHECK (public.is_team_owner(auth.uid(), restaurant_id));

CREATE TRIGGER trg_kitchen_stations_touch BEFORE UPDATE ON public.kitchen_stations
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX IF NOT EXISTS ix_kitchen_stations_rest ON public.kitchen_stations (restaurant_id, "position");

-- station em categorias e produtos (opcional; produto herda de categoria se null)
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS station_id UUID
  REFERENCES public.kitchen_stations(id) ON DELETE SET NULL;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS station_id UUID
  REFERENCES public.kitchen_stations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS ix_products_station ON public.products (station_id) WHERE station_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS ix_categories_station ON public.categories (station_id) WHERE station_id IS NOT NULL;

-- =========================================================================
-- 2) FILA DE IMPRESSÃO
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.print_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  station_id UUID REFERENCES public.kitchen_stations(id) ON DELETE SET NULL,
  event TEXT NOT NULL CHECK (event IN ('confirmed','preparing','ready','manual','reprint')),
  driver TEXT NOT NULL DEFAULT 'escpos'
    CHECK (driver IN ('escpos','webusb','network','cloud','browser')),
  status TEXT NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued','printing','printed','failed','cancelled')),
  attempts INT NOT NULL DEFAULT 0,
  last_error TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  requested_by UUID,
  printed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.print_jobs TO authenticated;
GRANT ALL ON public.print_jobs TO service_role;
ALTER TABLE public.print_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "print_jobs_team" ON public.print_jobs
  FOR ALL TO authenticated
  USING (
    public.is_team_owner(auth.uid(), restaurant_id)
    OR EXISTS (SELECT 1 FROM public.user_roles ur
               WHERE ur.user_id = auth.uid() AND ur.restaurant_id = print_jobs.restaurant_id
                 AND ur.role IN ('employee','manager'))
  )
  WITH CHECK (
    public.is_team_owner(auth.uid(), restaurant_id)
    OR EXISTS (SELECT 1 FROM public.user_roles ur
               WHERE ur.user_id = auth.uid() AND ur.restaurant_id = print_jobs.restaurant_id
                 AND ur.role IN ('employee','manager'))
  );

CREATE TRIGGER trg_print_jobs_touch BEFORE UPDATE ON public.print_jobs
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX IF NOT EXISTS ix_print_jobs_rest_status ON public.print_jobs (restaurant_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS ix_print_jobs_order ON public.print_jobs (order_id);

-- dedupe: mesmo pedido + evento não repete queued/printing
CREATE UNIQUE INDEX IF NOT EXISTS uq_print_jobs_order_event_active
  ON public.print_jobs (order_id, event)
  WHERE status IN ('queued','printing') AND order_id IS NOT NULL AND event <> 'reprint' AND event <> 'manual';

-- =========================================================================
-- 3) CONFIGURAÇÕES DE OPERAÇÃO
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.operations_settings (
  restaurant_id UUID PRIMARY KEY REFERENCES public.restaurants(id) ON DELETE CASCADE,
  sound_enabled BOOLEAN NOT NULL DEFAULT true,
  sla_green_minutes INT NOT NULL DEFAULT 10 CHECK (sla_green_minutes > 0),
  sla_yellow_minutes INT NOT NULL DEFAULT 20 CHECK (sla_yellow_minutes > 0),
  sla_red_minutes INT NOT NULL DEFAULT 30 CHECK (sla_red_minutes > 0),
  auto_print_on_confirmed BOOLEAN NOT NULL DEFAULT false,
  auto_print_on_preparing BOOLEAN NOT NULL DEFAULT true,
  auto_print_on_ready BOOLEAN NOT NULL DEFAULT false,
  default_driver TEXT NOT NULL DEFAULT 'browser'
    CHECK (default_driver IN ('escpos','webusb','network','cloud','browser')),
  printer_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.operations_settings TO authenticated;
GRANT ALL ON public.operations_settings TO service_role;
ALTER TABLE public.operations_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "operations_settings_team_read" ON public.operations_settings
  FOR SELECT TO authenticated USING (
    public.is_team_owner(auth.uid(), restaurant_id)
    OR EXISTS (SELECT 1 FROM public.user_roles ur
               WHERE ur.user_id = auth.uid() AND ur.restaurant_id = operations_settings.restaurant_id
                 AND ur.role IN ('employee','manager'))
  );
CREATE POLICY "operations_settings_owner_write" ON public.operations_settings
  FOR ALL TO authenticated
  USING (public.is_team_owner(auth.uid(), restaurant_id))
  WITH CHECK (public.is_team_owner(auth.uid(), restaurant_id));

CREATE TRIGGER trg_operations_settings_touch BEFORE UPDATE ON public.operations_settings
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- =========================================================================
-- 4) RPC — get_kds_orders
-- =========================================================================
CREATE OR REPLACE FUNCTION public.get_kds_orders(
  p_restaurant_id UUID,
  p_station_id UUID DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_uid UUID := auth.uid(); v_result jsonb;
BEGIN
  IF NOT (
    public.is_team_owner(v_uid, p_restaurant_id)
    OR EXISTS (SELECT 1 FROM public.user_roles ur
               WHERE ur.user_id = v_uid AND ur.restaurant_id = p_restaurant_id
                 AND ur.role IN ('employee','manager'))
  ) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  SELECT COALESCE(jsonb_agg(row_to_jsonb(o) - 'ord_created' ORDER BY o.created_at ASC), '[]'::jsonb)
  INTO v_result
  FROM (
    SELECT
      o.id, o.order_number, o.status::text, o.type::text, o.payment::text,
      o.payment_status, o.customer_name, o.customer_phone,
      o.subtotal, o.delivery_fee, o.discount, o.total, o.notes,
      o.delivery_address, o.estimated_minutes, o.created_at,
      COALESCE((
        SELECT jsonb_agg(jsonb_build_object(
          'id', i.id, 'product_name', i.product_name,
          'quantity', i.quantity, 'notes', i.notes,
          'station_id', p.station_id
        ) ORDER BY i.id)
        FROM public.order_items i
        LEFT JOIN public.products p ON p.id = i.product_id
        WHERE i.order_id = o.id
          AND (p_station_id IS NULL OR p.station_id = p_station_id)
      ), '[]'::jsonb) AS items
    FROM public.orders o
    WHERE o.restaurant_id = p_restaurant_id
      AND o.status IN ('pending','confirmed','preparing','ready','out_for_delivery')
      AND (
        p_station_id IS NULL
        OR EXISTS (
          SELECT 1 FROM public.order_items i2
          JOIN public.products p2 ON p2.id = i2.product_id
          WHERE i2.order_id = o.id AND p2.station_id = p_station_id
        )
      )
    ORDER BY o.created_at ASC
  ) o;

  RETURN v_result;
END $$;

GRANT EXECUTE ON FUNCTION public.get_kds_orders(UUID, UUID) TO authenticated;

-- =========================================================================
-- 5) RPC — enqueue_print_job
-- =========================================================================
CREATE OR REPLACE FUNCTION public.enqueue_print_job(
  p_order_id UUID,
  p_event TEXT DEFAULT 'manual',
  p_station_id UUID DEFAULT NULL,
  p_driver TEXT DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_rid UUID; v_driver TEXT; v_job_id UUID;
BEGIN
  SELECT restaurant_id INTO v_rid FROM public.orders WHERE id = p_order_id;
  IF v_rid IS NULL THEN RAISE EXCEPTION 'not_found' USING ERRCODE='no_data_found'; END IF;
  IF NOT (
    public.is_team_owner(v_uid, v_rid)
    OR EXISTS (SELECT 1 FROM public.user_roles ur
               WHERE ur.user_id = v_uid AND ur.restaurant_id = v_rid
                 AND ur.role IN ('employee','manager'))
  ) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  SELECT COALESCE(p_driver, default_driver, 'browser') INTO v_driver
    FROM public.operations_settings WHERE restaurant_id = v_rid;
  v_driver := COALESCE(v_driver, 'browser');

  INSERT INTO public.print_jobs(restaurant_id, order_id, station_id, event, driver, requested_by)
  VALUES (v_rid, p_order_id, p_station_id, p_event, v_driver, v_uid)
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_job_id;

  RETURN jsonb_build_object('id', v_job_id, 'driver', v_driver);
END $$;

GRANT EXECUTE ON FUNCTION public.enqueue_print_job(UUID, TEXT, UUID, TEXT) TO authenticated;

-- =========================================================================
-- 6) REALTIME publication
-- =========================================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables
                 WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='orders') THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.orders';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables
                 WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='order_status_history') THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.order_status_history';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables
                 WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='print_jobs') THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.print_jobs';
  END IF;
END $$;

ALTER TABLE public.orders REPLICA IDENTITY FULL;
ALTER TABLE public.order_status_history REPLICA IDENTITY FULL;
ALTER TABLE public.print_jobs REPLICA IDENTITY FULL;

-- =========================================================================
-- 7) TRIGGER de auto-impressão em transições de status
-- =========================================================================
CREATE OR REPLACE FUNCTION public.auto_enqueue_print_on_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_cfg public.operations_settings%ROWTYPE;
  v_should BOOLEAN := false;
  v_event TEXT;
BEGIN
  SELECT * INTO v_cfg FROM public.operations_settings WHERE restaurant_id = NEW.restaurant_id;
  IF NOT FOUND THEN RETURN NEW; END IF;

  IF NEW.to_status::text = 'confirmed' AND v_cfg.auto_print_on_confirmed THEN
    v_should := true; v_event := 'confirmed';
  ELSIF NEW.to_status::text = 'preparing' AND v_cfg.auto_print_on_preparing THEN
    v_should := true; v_event := 'preparing';
  ELSIF NEW.to_status::text = 'ready' AND v_cfg.auto_print_on_ready THEN
    v_should := true; v_event := 'ready';
  END IF;

  IF v_should THEN
    INSERT INTO public.print_jobs(restaurant_id, order_id, event, driver, requested_by)
    VALUES (NEW.restaurant_id, NEW.order_id, v_event, COALESCE(v_cfg.default_driver,'browser'), NEW.changed_by)
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'auto_enqueue_print falhou: %', SQLERRM;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_auto_print_on_status ON public.order_status_history;
CREATE TRIGGER trg_auto_print_on_status AFTER INSERT ON public.order_status_history
  FOR EACH ROW EXECUTE FUNCTION public.auto_enqueue_print_on_status();