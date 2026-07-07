-- ============================================================================
-- Sprint 6 · Módulo Mesas & Comandas · Migração 1 (schema)
-- Reutiliza pedidos/state machine/timeline/comunicação/caixa existentes.
-- ============================================================================

-- ------------------------------------------------------------------
-- ENUMs
-- ------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.table_session_status AS ENUM
    ('open','closing','closed','cancelled','blocked');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ------------------------------------------------------------------
-- 1. restaurant_tables
-- ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.restaurant_tables (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id  uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  number         int  NOT NULL,
  name           text,
  area           text,
  capacity       int  NOT NULL DEFAULT 2 CHECK (capacity BETWEEN 1 AND 40),
  notes          text,
  qr_token       text NOT NULL DEFAULT encode(gen_random_bytes(18),'hex'),
  is_active      boolean NOT NULL DEFAULT true,
  position_x     int,
  position_y     int,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (restaurant_id, number),
  UNIQUE (qr_token)
);
CREATE INDEX IF NOT EXISTS restaurant_tables_rid_idx ON public.restaurant_tables(restaurant_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.restaurant_tables TO authenticated;
GRANT SELECT ON public.restaurant_tables TO anon; -- QR público lê via RPC security definer; policy anon é apenas defensiva/off
GRANT ALL    ON public.restaurant_tables TO service_role;

ALTER TABLE public.restaurant_tables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tables owner/team read"
  ON public.restaurant_tables FOR SELECT TO authenticated
  USING (
    public.is_team_owner(auth.uid(), restaurant_id)
    OR EXISTS (SELECT 1 FROM public.user_roles ur
               WHERE ur.user_id=auth.uid()
                 AND ur.restaurant_id=restaurant_tables.restaurant_id
                 AND ur.role IN ('employee','manager'))
  );

CREATE POLICY "tables owner write"
  ON public.restaurant_tables FOR ALL TO authenticated
  USING (public.is_team_owner(auth.uid(), restaurant_id))
  WITH CHECK (public.is_team_owner(auth.uid(), restaurant_id));

CREATE TRIGGER restaurant_tables_touch
  BEFORE UPDATE ON public.restaurant_tables
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ------------------------------------------------------------------
-- 2. table_sessions
-- ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.table_sessions (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id          uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  table_id               uuid NOT NULL REFERENCES public.restaurant_tables(id) ON DELETE RESTRICT,
  status                 public.table_session_status NOT NULL DEFAULT 'open',
  opened_by              uuid REFERENCES auth.users(id),
  opened_at              timestamptz NOT NULL DEFAULT now(),
  closed_at              timestamptz,
  closed_by              uuid REFERENCES auth.users(id),
  customer_name          text,
  party_size             int CHECK (party_size IS NULL OR party_size BETWEEN 1 AND 40),
  notes                  text,
  merged_into_session_id uuid REFERENCES public.table_sessions(id) ON DELETE SET NULL,
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS table_sessions_rid_idx ON public.table_sessions(restaurant_id);
CREATE INDEX IF NOT EXISTS table_sessions_table_idx ON public.table_sessions(table_id);
-- Só uma sessão aberta por mesa
CREATE UNIQUE INDEX IF NOT EXISTS table_sessions_one_open_per_table
  ON public.table_sessions(table_id)
  WHERE status IN ('open','closing');

GRANT SELECT, INSERT, UPDATE, DELETE ON public.table_sessions TO authenticated;
GRANT ALL ON public.table_sessions TO service_role;

ALTER TABLE public.table_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "session owner/team read"
  ON public.table_sessions FOR SELECT TO authenticated
  USING (
    public.is_team_owner(auth.uid(), restaurant_id)
    OR EXISTS (SELECT 1 FROM public.user_roles ur
               WHERE ur.user_id=auth.uid()
                 AND ur.restaurant_id=table_sessions.restaurant_id
                 AND ur.role IN ('employee','manager'))
  );

CREATE POLICY "session team write"
  ON public.table_sessions FOR ALL TO authenticated
  USING (
    public.is_team_owner(auth.uid(), restaurant_id)
    OR EXISTS (SELECT 1 FROM public.user_roles ur
               WHERE ur.user_id=auth.uid()
                 AND ur.restaurant_id=table_sessions.restaurant_id
                 AND ur.role IN ('employee','manager'))
  )
  WITH CHECK (
    public.is_team_owner(auth.uid(), restaurant_id)
    OR EXISTS (SELECT 1 FROM public.user_roles ur
               WHERE ur.user_id=auth.uid()
                 AND ur.restaurant_id=table_sessions.restaurant_id
                 AND ur.role IN ('employee','manager'))
  );

CREATE TRIGGER table_sessions_touch
  BEFORE UPDATE ON public.table_sessions
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ------------------------------------------------------------------
-- 3. table_commands  (subdivisão dentro da sessão)
-- ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.table_commands (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    uuid NOT NULL REFERENCES public.table_sessions(id) ON DELETE CASCADE,
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  label         text NOT NULL,
  holder_name   text,
  closed_at     timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS table_commands_session_idx ON public.table_commands(session_id);
CREATE INDEX IF NOT EXISTS table_commands_rid_idx ON public.table_commands(restaurant_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.table_commands TO authenticated;
GRANT ALL ON public.table_commands TO service_role;

ALTER TABLE public.table_commands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "commands team access"
  ON public.table_commands FOR ALL TO authenticated
  USING (
    public.is_team_owner(auth.uid(), restaurant_id)
    OR EXISTS (SELECT 1 FROM public.user_roles ur
               WHERE ur.user_id=auth.uid()
                 AND ur.restaurant_id=table_commands.restaurant_id
                 AND ur.role IN ('employee','manager'))
  )
  WITH CHECK (
    public.is_team_owner(auth.uid(), restaurant_id)
    OR EXISTS (SELECT 1 FROM public.user_roles ur
               WHERE ur.user_id=auth.uid()
                 AND ur.restaurant_id=table_commands.restaurant_id
                 AND ur.role IN ('employee','manager'))
  );

-- ------------------------------------------------------------------
-- 4. table_session_events (auditoria/timeline da sessão)
-- ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.table_session_events (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id     uuid NOT NULL REFERENCES public.table_sessions(id) ON DELETE CASCADE,
  restaurant_id  uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  kind           text NOT NULL CHECK (kind IN (
                   'opened','order_added','order_removed','transferred',
                   'merged','split','closed','cancelled','blocked','unblocked',
                   'command_opened','command_closed','forced_close')),
  actor_user_id  uuid REFERENCES auth.users(id),
  payload        jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS table_session_events_session_idx
  ON public.table_session_events(session_id, created_at);
CREATE INDEX IF NOT EXISTS table_session_events_rid_idx
  ON public.table_session_events(restaurant_id);

GRANT SELECT, INSERT ON public.table_session_events TO authenticated;
GRANT ALL ON public.table_session_events TO service_role;

ALTER TABLE public.table_session_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "session events team read"
  ON public.table_session_events FOR SELECT TO authenticated
  USING (
    public.is_team_owner(auth.uid(), restaurant_id)
    OR EXISTS (SELECT 1 FROM public.user_roles ur
               WHERE ur.user_id=auth.uid()
                 AND ur.restaurant_id=table_session_events.restaurant_id
                 AND ur.role IN ('employee','manager'))
  );

-- inserts só via RPC security definer / triggers, mas mantemos policy defensiva:
CREATE POLICY "session events team insert"
  ON public.table_session_events FOR INSERT TO authenticated
  WITH CHECK (
    public.is_team_owner(auth.uid(), restaurant_id)
    OR EXISTS (SELECT 1 FROM public.user_roles ur
               WHERE ur.user_id=auth.uid()
                 AND ur.restaurant_id=table_session_events.restaurant_id
                 AND ur.role IN ('employee','manager'))
  );

-- ------------------------------------------------------------------
-- 5. table_split_payments (registra fechamento particionado)
-- ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.table_split_payments (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    uuid NOT NULL REFERENCES public.table_sessions(id) ON DELETE CASCADE,
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  method        text NOT NULL CHECK (method IN ('cash','pix','credit','debit','other')),
  amount        numeric(10,2) NOT NULL CHECK (amount >= 0),
  payer_label   text,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS table_split_payments_session_idx
  ON public.table_split_payments(session_id);

GRANT SELECT, INSERT ON public.table_split_payments TO authenticated;
GRANT ALL ON public.table_split_payments TO service_role;

ALTER TABLE public.table_split_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "split payments team read"
  ON public.table_split_payments FOR SELECT TO authenticated
  USING (
    public.is_team_owner(auth.uid(), restaurant_id)
    OR EXISTS (SELECT 1 FROM public.user_roles ur
               WHERE ur.user_id=auth.uid()
                 AND ur.restaurant_id=table_split_payments.restaurant_id
                 AND ur.role IN ('employee','manager'))
  );

CREATE POLICY "split payments team insert"
  ON public.table_split_payments FOR INSERT TO authenticated
  WITH CHECK (
    public.is_team_owner(auth.uid(), restaurant_id)
    OR EXISTS (SELECT 1 FROM public.user_roles ur
               WHERE ur.user_id=auth.uid()
                 AND ur.restaurant_id=table_split_payments.restaurant_id
                 AND ur.role IN ('employee','manager'))
  );

-- ------------------------------------------------------------------
-- 6. Extensão de orders (aditiva, sem breaking)
-- ------------------------------------------------------------------
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS table_session_id uuid REFERENCES public.table_sessions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS table_command_id uuid REFERENCES public.table_commands(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS table_number     int;

CREATE INDEX IF NOT EXISTS orders_table_session_idx
  ON public.orders(restaurant_id, table_session_id)
  WHERE table_session_id IS NOT NULL;

-- ------------------------------------------------------------------
-- 7. Feature gate: tables_max nos planos (starter=0, pro=30, business=null)
-- ------------------------------------------------------------------
UPDATE public.app_plans
   SET features = features || jsonb_build_object('tables_max', 0)
 WHERE id = 'starter' AND NOT (features ? 'tables_max');

UPDATE public.app_plans
   SET features = features || jsonb_build_object('tables_max', 30)
 WHERE id = 'pro' AND NOT (features ? 'tables_max');

UPDATE public.app_plans
   SET features = features || jsonb_build_object('tables_max', null)
 WHERE id = 'business' AND NOT (features ? 'tables_max');

-- ------------------------------------------------------------------
-- 8. Realtime
-- ------------------------------------------------------------------
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.restaurant_tables;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.table_sessions;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.table_commands;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.table_session_events;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
