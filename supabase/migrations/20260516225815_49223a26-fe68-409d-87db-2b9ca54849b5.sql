
-- ============================================
-- 1) Restaurants — novos campos
-- ============================================
ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS plan_id text REFERENCES public.app_plans(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS monthly_order_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS month_reset_at timestamptz NOT NULL DEFAULT date_trunc('month', now()) + interval '1 month',
  ADD COLUMN IF NOT EXISTS pickup_time_minutes integer DEFAULT 20,
  ADD COLUMN IF NOT EXISTS pickup_instructions text,
  ADD COLUMN IF NOT EXISTS auto_print_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS auto_print_copies integer NOT NULL DEFAULT 1;

-- ============================================
-- 2) Orders — origem
-- ============================================
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'web'
    CHECK (source IN ('web','manual','whatsapp'));

-- ============================================
-- 3) Catálogo global de bairros
-- ============================================
CREATE TABLE IF NOT EXISTS public.delivery_neighborhoods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city text NOT NULL,
  state text NOT NULL DEFAULT 'ES',
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (state, city, name)
);

ALTER TABLE public.delivery_neighborhoods ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS dn_public_select ON public.delivery_neighborhoods;
CREATE POLICY dn_public_select ON public.delivery_neighborhoods
  FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS dn_admin_write ON public.delivery_neighborhoods;
CREATE POLICY dn_admin_write ON public.delivery_neighborhoods
  FOR ALL TO authenticated
  USING (private.is_super_admin(auth.uid()))
  WITH CHECK (private.is_super_admin(auth.uid()));

CREATE INDEX IF NOT EXISTS idx_dn_city ON public.delivery_neighborhoods(state, city, name);

-- ============================================
-- 4) Seed dos 3 planos
-- ============================================
INSERT INTO public.app_plans (id, name, price_monthly, position, is_active, features) VALUES
('starter', 'Starter', 97, 1, true, '{
  "max_orders_per_month": 300,
  "max_users": 1,
  "max_locations": 1,
  "coupons": false,
  "delivery_zones": true,
  "drivers": false,
  "auto_print": false,
  "online_payment": false,
  "advanced_reports": false,
  "manual_pdv": false,
  "multi_location": false,
  "api_access": false,
  "priority_support": false
}'::jsonb),
('pro', 'Pro', 197, 2, true, '{
  "max_orders_per_month": 1500,
  "max_users": 5,
  "max_locations": 1,
  "coupons": true,
  "delivery_zones": true,
  "drivers": true,
  "auto_print": true,
  "online_payment": true,
  "advanced_reports": true,
  "manual_pdv": true,
  "multi_location": false,
  "api_access": false,
  "priority_support": true
}'::jsonb),
('business', 'Business', 397, 3, true, '{
  "max_orders_per_month": null,
  "max_users": null,
  "max_locations": 5,
  "coupons": true,
  "delivery_zones": true,
  "drivers": true,
  "auto_print": true,
  "online_payment": true,
  "advanced_reports": true,
  "manual_pdv": true,
  "multi_location": true,
  "api_access": true,
  "priority_support": true
}'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  price_monthly = EXCLUDED.price_monthly,
  position = EXCLUDED.position,
  is_active = EXCLUDED.is_active,
  features = EXCLUDED.features,
  updated_at = now();

-- Default plan_id for restaurants without one
UPDATE public.restaurants SET plan_id = 'starter' WHERE plan_id IS NULL;

-- ============================================
-- 5) Seed bairros Vitória + Vila Velha
-- ============================================
INSERT INTO public.delivery_neighborhoods (state, city, name) VALUES
-- Vitória
('ES','Vitória','Centro'),('ES','Vitória','Praia do Canto'),('ES','Vitória','Jardim Camburi'),
('ES','Vitória','Jardim da Penha'),('ES','Vitória','Maruípe'),('ES','Vitória','Goiabeiras'),
('ES','Vitória','Mata da Praia'),('ES','Vitória','Bento Ferreira'),('ES','Vitória','Praia do Suá'),
('ES','Vitória','Barro Vermelho'),('ES','Vitória','Santa Lúcia'),('ES','Vitória','Enseada do Suá'),
('ES','Vitória','Ilha do Boi'),('ES','Vitória','Ilha do Frade'),('ES','Vitória','Santa Helena'),
('ES','Vitória','Vila Rubim'),('ES','Vitória','Forte São João'),('ES','Vitória','Parque Moscoso'),
('ES','Vitória','Santa Clara'),('ES','Vitória','Santo Antônio'),('ES','Vitória','Caratoíra'),
('ES','Vitória','Inhanguetá'),('ES','Vitória','Estrelinha'),('ES','Vitória','Universitário'),
('ES','Vitória','Joana D''Arc'),('ES','Vitória','Bonfim'),('ES','Vitória','Jucutuquara'),
('ES','Vitória','Fonte Grande'),('ES','Vitória','Ariovaldo Favalessa'),('ES','Vitória','Romão'),
('ES','Vitória','Do Quadro'),('ES','Vitória','Do Cabral'),('ES','Vitória','Grande Vitória'),
('ES','Vitória','São Cristóvão'),('ES','Vitória','São Pedro'),('ES','Vitória','Resistência'),
('ES','Vitória','Conquista'),('ES','Vitória','Nova Palestina'),('ES','Vitória','São José'),
('ES','Vitória','Redenção'),('ES','Vitória','Santo André'),('ES','Vitória','Santos Reis'),
('ES','Vitória','Penha'),('ES','Vitória','Itararé'),('ES','Vitória','Jaburu'),
('ES','Vitória','Solon Borges'),('ES','Vitória','Boa Vista'),('ES','Vitória','Andorinhas'),
('ES','Vitória','Mário Cypreste'),('ES','Vitória','Tabuazeiro'),('ES','Vitória','Gurigica'),
('ES','Vitória','República'),('ES','Vitória','Consolação'),('ES','Vitória','Antônio Honório'),
('ES','Vitória','Pontal de Camburi'),('ES','Vitória','Aeroporto'),('ES','Vitória','Maria Ortiz'),
('ES','Vitória','Segurança do Lar'),('ES','Vitória','Ilha de Santa Maria'),('ES','Vitória','Horto'),
('ES','Vitória','Piedade'),('ES','Vitória','Cidade Alta'),('ES','Vitória','Comdusa'),
-- Vila Velha
('ES','Vila Velha','Centro'),('ES','Vila Velha','Praia da Costa'),('ES','Vila Velha','Itapuã'),
('ES','Vila Velha','Coqueiral de Itaparica'),('ES','Vila Velha','Itaparica'),('ES','Vila Velha','Praia de Itaparica'),
('ES','Vila Velha','Praia das Gaivotas'),('ES','Vila Velha','Praia das Castanheiras'),('ES','Vila Velha','Glória'),
('ES','Vila Velha','Ibes'),('ES','Vila Velha','Aribiri'),('ES','Vila Velha','Jardim Asteca'),
('ES','Vila Velha','Cobilândia'),('ES','Vila Velha','Industrial'),('ES','Vila Velha','Boa Vista I'),
('ES','Vila Velha','Boa Vista II'),('ES','Vila Velha','Pôr do Sol'),('ES','Vila Velha','Santos Dumont'),
('ES','Vila Velha','Santa Mônica'),('ES','Vila Velha','Santa Inês'),('ES','Vila Velha','Soteco'),
('ES','Vila Velha','São Torquato'),('ES','Vila Velha','Jardim Marilândia'),('ES','Vila Velha','Vista Mar'),
('ES','Vila Velha','Divino Espírito Santo'),('ES','Vila Velha','Garoto'),('ES','Vila Velha','Olaria'),
('ES','Vila Velha','Argolas'),('ES','Vila Velha','Paul'),('ES','Vila Velha','Cocal'),
('ES','Vila Velha','Ilha dos Aires'),('ES','Vila Velha','Ilha das Flores'),('ES','Vila Velha','Riviera da Barra'),
('ES','Vila Velha','Barra do Jucu'),('ES','Vila Velha','Interlagos'),('ES','Vila Velha','Santa Paula I'),
('ES','Vila Velha','Santa Paula II'),('ES','Vila Velha','Ulisses Guimarães'),('ES','Vila Velha','Terra Vermelha'),
('ES','Vila Velha','Morada do Sol'),('ES','Vila Velha','Morada da Barra'),('ES','Vila Velha','Jaburuna'),
('ES','Vila Velha','Nova Itaparica'),('ES','Vila Velha','Vale Encantado'),('ES','Vila Velha','Vinhático'),
('ES','Vila Velha','Ponta da Fruta'),('ES','Vila Velha','Xuri'),('ES','Vila Velha','Cidade da Barra'),
('ES','Vila Velha','Sagrada Família'),('ES','Vila Velha','Brisamar'),('ES','Vila Velha','Nossa Senhora da Penha'),
('ES','Vila Velha','Jabaeté'),('ES','Vila Velha','Residencial Coqueiral'),('ES','Vila Velha','Residencial Laranjeiras'),
('ES','Vila Velha','Primeiro de Maio'),('ES','Vila Velha','Alvorada'),('ES','Vila Velha','Jardim do Vale'),
('ES','Vila Velha','Planalto'),('ES','Vila Velha','Bandeirantes'),('ES','Vila Velha','Coqueiral'),
('ES','Vila Velha','Vila Garrido'),('ES','Vila Velha','Dom João Batista')
ON CONFLICT (state, city, name) DO NOTHING;
