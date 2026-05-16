
-- app_plans
CREATE TABLE public.app_plans (
  id text PRIMARY KEY,
  name text NOT NULL,
  price_monthly numeric NOT NULL DEFAULT 0,
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  position integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.app_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY app_plans_public_select ON public.app_plans
  FOR SELECT TO public USING (true);

CREATE POLICY app_plans_admin_write ON public.app_plans
  FOR ALL TO authenticated
  USING (private.is_super_admin(auth.uid()))
  WITH CHECK (private.is_super_admin(auth.uid()));

CREATE TRIGGER trg_app_plans_touch BEFORE UPDATE ON public.app_plans
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

INSERT INTO public.app_plans (id, name, price_monthly, features, position) VALUES
  ('trial', 'Trial', 0, '["14 dias grátis","Sem cartão","Acesso completo"]'::jsonb, 0),
  ('essential', 'Essential', 99, '["Cardápio digital","Pedidos online","WhatsApp integrado","Pix instantâneo","Relatórios básicos"]'::jsonb, 1),
  ('professional', 'Professional', 199, '["Tudo do Essential","Cupons & promoções","Múltiplas lojas","Entregadores","Relatórios avançados","Suporte prioritário"]'::jsonb, 2);

-- global_announcements
CREATE TABLE public.global_announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message text NOT NULL,
  variant text NOT NULL DEFAULT 'info',
  is_active boolean NOT NULL DEFAULT true,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.global_announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY ann_auth_select ON public.global_announcements
  FOR SELECT TO authenticated USING (true);

CREATE POLICY ann_admin_write ON public.global_announcements
  FOR ALL TO authenticated
  USING (private.is_super_admin(auth.uid()))
  WITH CHECK (private.is_super_admin(auth.uid()));

-- app_settings
CREATE TABLE public.app_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY settings_public_select ON public.app_settings
  FOR SELECT TO public USING (true);

CREATE POLICY settings_admin_write ON public.app_settings
  FOR ALL TO authenticated
  USING (private.is_super_admin(auth.uid()))
  WITH CHECK (private.is_super_admin(auth.uid()));

CREATE TRIGGER trg_app_settings_touch BEFORE UPDATE ON public.app_settings
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

INSERT INTO public.app_settings (key, value) VALUES
  ('support_whatsapp', '"5527992877008"'::jsonb),
  ('support_email', '"contato@comandahub.online"'::jsonb),
  ('public_url', '"https://comandahub.online"'::jsonb);
