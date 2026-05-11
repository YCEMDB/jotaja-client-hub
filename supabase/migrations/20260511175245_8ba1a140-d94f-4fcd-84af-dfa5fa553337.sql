
DO $$ BEGIN
  CREATE TYPE public.lead_status AS ENUM ('new','contacted','approved','rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.signup_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  restaurant_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  status public.lead_status NOT NULL DEFAULT 'new',
  notes text,
  restaurant_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.signup_leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS leads_public_insert ON public.signup_leads;
CREATE POLICY leads_public_insert ON public.signup_leads
  FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS leads_admin_select ON public.signup_leads;
CREATE POLICY leads_admin_select ON public.signup_leads
  FOR SELECT TO public USING (public.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS leads_admin_update ON public.signup_leads;
CREATE POLICY leads_admin_update ON public.signup_leads
  FOR UPDATE TO public USING (public.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS leads_admin_delete ON public.signup_leads;
CREATE POLICY leads_admin_delete ON public.signup_leads
  FOR DELETE TO public USING (public.is_super_admin(auth.uid()));

DROP TRIGGER IF EXISTS trg_signup_leads_updated_at ON public.signup_leads;
CREATE TRIGGER trg_signup_leads_updated_at
  BEFORE UPDATE ON public.signup_leads
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX IF NOT EXISTS idx_signup_leads_status_created ON public.signup_leads (status, created_at DESC);
