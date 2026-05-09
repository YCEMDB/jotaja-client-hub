
-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('super_admin', 'owner', 'employee');
CREATE TYPE public.order_status AS ENUM ('pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled');
CREATE TYPE public.order_type AS ENUM ('delivery', 'pickup', 'dine_in');
CREATE TYPE public.payment_method AS ENUM ('cash', 'pix', 'credit_card', 'debit_card', 'online');
CREATE TYPE public.coupon_type AS ENUM ('percentage', 'fixed', 'free_shipping');
CREATE TYPE public.restaurant_plan AS ENUM ('trial', 'essential', 'professional');

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  cpf TEXT,
  position TEXT,
  restaurant_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============ USER ROLES ============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  restaurant_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role, restaurant_id)
);

-- ============ RESTAURANTS ============
CREATE TABLE public.restaurants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  cover_url TEXT,
  primary_color TEXT DEFAULT '#0A1628',
  accent_color TEXT DEFAULT '#FFC627',
  phone TEXT,
  whatsapp TEXT,
  email TEXT,
  cnpj TEXT,
  address_street TEXT,
  address_number TEXT,
  address_complement TEXT,
  address_neighborhood TEXT,
  address_city TEXT,
  address_state TEXT,
  address_zip TEXT,
  opening_hours JSONB DEFAULT '{}'::jsonb,
  min_order_value NUMERIC(10,2) DEFAULT 0,
  accepts_pickup BOOLEAN DEFAULT true,
  accepts_delivery BOOLEAN DEFAULT true,
  accepts_dine_in BOOLEAN DEFAULT false,
  plan public.restaurant_plan DEFAULT 'trial',
  is_active BOOLEAN DEFAULT true,
  is_open BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- FK after restaurants exists
ALTER TABLE public.profiles ADD CONSTRAINT profiles_restaurant_fk FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id) ON DELETE SET NULL;
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_restaurant_fk FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id) ON DELETE CASCADE;

-- ============ CATEGORIES ============
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  position INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============ PRODUCTS ============
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL,
  promo_price NUMERIC(10,2),
  image_url TEXT,
  is_available BOOLEAN DEFAULT true,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============ PRODUCT OPTIONS ============
CREATE TABLE public.product_option_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  min_select INTEGER DEFAULT 0,
  max_select INTEGER DEFAULT 1,
  is_required BOOLEAN DEFAULT false,
  position INTEGER DEFAULT 0
);

CREATE TABLE public.product_option_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.product_option_groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  extra_price NUMERIC(10,2) DEFAULT 0,
  is_available BOOLEAN DEFAULT true,
  position INTEGER DEFAULT 0
);

-- ============ DELIVERY ============
CREATE TABLE public.delivery_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  neighborhood TEXT NOT NULL,
  city TEXT,
  fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  min_order NUMERIC(10,2) DEFAULT 0,
  estimated_minutes INTEGER DEFAULT 30,
  is_active BOOLEAN DEFAULT true
);

CREATE TABLE public.delivery_drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  phone TEXT,
  vehicle TEXT,
  license_plate TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============ CUSTOMERS ============
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  addresses JSONB DEFAULT '[]'::jsonb,
  total_orders INTEGER DEFAULT 0,
  total_spent NUMERIC(10,2) DEFAULT 0,
  last_order_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(restaurant_id, phone)
);

-- ============ ORDERS ============
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  driver_id UUID REFERENCES public.delivery_drivers(id) ON DELETE SET NULL,
  order_number SERIAL,
  status public.order_status NOT NULL DEFAULT 'pending',
  type public.order_type NOT NULL DEFAULT 'delivery',
  payment public.payment_method NOT NULL DEFAULT 'cash',
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  delivery_address JSONB,
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  delivery_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount NUMERIC(10,2) NOT NULL DEFAULT 0,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  change_for NUMERIC(10,2),
  notes TEXT,
  coupon_code TEXT,
  estimated_minutes INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(10,2) NOT NULL,
  options JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  subtotal NUMERIC(10,2) NOT NULL
);

-- ============ COUPONS ============
CREATE TABLE public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  type public.coupon_type NOT NULL DEFAULT 'percentage',
  value NUMERIC(10,2) NOT NULL DEFAULT 0,
  min_order NUMERIC(10,2) DEFAULT 0,
  max_uses INTEGER,
  uses_count INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(restaurant_id, code)
);

-- ============ INDEXES ============
CREATE INDEX idx_products_restaurant ON public.products(restaurant_id);
CREATE INDEX idx_products_category ON public.products(category_id);
CREATE INDEX idx_categories_restaurant ON public.categories(restaurant_id);
CREATE INDEX idx_orders_restaurant ON public.orders(restaurant_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_order_items_order ON public.order_items(order_id);
CREATE INDEX idx_customers_restaurant ON public.customers(restaurant_id);
CREATE INDEX idx_user_roles_user ON public.user_roles(user_id);

-- ============ SECURITY DEFINER FUNCTIONS ============
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'super_admin')
$$;

CREATE OR REPLACE FUNCTION public.has_restaurant_access(_user_id UUID, _restaurant_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    public.is_super_admin(_user_id)
    OR EXISTS (SELECT 1 FROM public.restaurants WHERE id = _restaurant_id AND owner_id = _user_id)
    OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND restaurant_id = _restaurant_id);
$$;

-- ============ AUTO PROFILE ON SIGNUP ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, phone)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    NEW.raw_user_meta_data->>'phone'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ UPDATED_AT TRIGGERS ============
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_restaurants_updated BEFORE UPDATE ON public.restaurants FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_products_updated BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_orders_updated BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ ENABLE RLS ============
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_option_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_option_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- ============ RLS POLICIES ============

-- PROFILES: user sees own; super_admin sees all
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id OR public.is_super_admin(auth.uid()));
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_insert_self" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- USER_ROLES: user sees own; super_admin manages all
CREATE POLICY "user_roles_select_own" ON public.user_roles FOR SELECT USING (auth.uid() = user_id OR public.is_super_admin(auth.uid()));
CREATE POLICY "user_roles_admin_all" ON public.user_roles FOR ALL USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));

-- RESTAURANTS: public can view active; owner manages own; super_admin manages all
CREATE POLICY "restaurants_public_select" ON public.restaurants FOR SELECT USING (is_active = true OR owner_id = auth.uid() OR public.is_super_admin(auth.uid()));
CREATE POLICY "restaurants_insert_own" ON public.restaurants FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "restaurants_update_own" ON public.restaurants FOR UPDATE USING (owner_id = auth.uid() OR public.is_super_admin(auth.uid()));
CREATE POLICY "restaurants_delete_own" ON public.restaurants FOR DELETE USING (owner_id = auth.uid() OR public.is_super_admin(auth.uid()));

-- CATEGORIES: public read active; restaurant team manages
CREATE POLICY "categories_public_select" ON public.categories FOR SELECT USING (true);
CREATE POLICY "categories_team_manage" ON public.categories FOR ALL USING (public.has_restaurant_access(auth.uid(), restaurant_id)) WITH CHECK (public.has_restaurant_access(auth.uid(), restaurant_id));

-- PRODUCTS: public read; team manages
CREATE POLICY "products_public_select" ON public.products FOR SELECT USING (true);
CREATE POLICY "products_team_manage" ON public.products FOR ALL USING (public.has_restaurant_access(auth.uid(), restaurant_id)) WITH CHECK (public.has_restaurant_access(auth.uid(), restaurant_id));

-- PRODUCT OPTIONS: public read; team manages via product
CREATE POLICY "option_groups_public_select" ON public.product_option_groups FOR SELECT USING (true);
CREATE POLICY "option_groups_team_manage" ON public.product_option_groups FOR ALL
  USING (EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND public.has_restaurant_access(auth.uid(), p.restaurant_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND public.has_restaurant_access(auth.uid(), p.restaurant_id)));

CREATE POLICY "option_items_public_select" ON public.product_option_items FOR SELECT USING (true);
CREATE POLICY "option_items_team_manage" ON public.product_option_items FOR ALL
  USING (EXISTS (SELECT 1 FROM public.product_option_groups g JOIN public.products p ON p.id = g.product_id WHERE g.id = group_id AND public.has_restaurant_access(auth.uid(), p.restaurant_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.product_option_groups g JOIN public.products p ON p.id = g.product_id WHERE g.id = group_id AND public.has_restaurant_access(auth.uid(), p.restaurant_id)));

-- DELIVERY AREAS: public read; team manages
CREATE POLICY "delivery_areas_public_select" ON public.delivery_areas FOR SELECT USING (true);
CREATE POLICY "delivery_areas_team_manage" ON public.delivery_areas FOR ALL USING (public.has_restaurant_access(auth.uid(), restaurant_id)) WITH CHECK (public.has_restaurant_access(auth.uid(), restaurant_id));

-- DRIVERS: team only
CREATE POLICY "drivers_team_select" ON public.delivery_drivers FOR SELECT USING (public.has_restaurant_access(auth.uid(), restaurant_id));
CREATE POLICY "drivers_team_manage" ON public.delivery_drivers FOR ALL USING (public.has_restaurant_access(auth.uid(), restaurant_id)) WITH CHECK (public.has_restaurant_access(auth.uid(), restaurant_id));

-- CUSTOMERS: team only
CREATE POLICY "customers_team_select" ON public.customers FOR SELECT USING (public.has_restaurant_access(auth.uid(), restaurant_id));
CREATE POLICY "customers_public_insert" ON public.customers FOR INSERT WITH CHECK (true);
CREATE POLICY "customers_team_update" ON public.customers FOR UPDATE USING (public.has_restaurant_access(auth.uid(), restaurant_id));

-- ORDERS: team views/manages; anyone can create (public ordering)
CREATE POLICY "orders_team_select" ON public.orders FOR SELECT USING (public.has_restaurant_access(auth.uid(), restaurant_id));
CREATE POLICY "orders_public_insert" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "orders_team_update" ON public.orders FOR UPDATE USING (public.has_restaurant_access(auth.uid(), restaurant_id));
CREATE POLICY "orders_team_delete" ON public.orders FOR DELETE USING (public.has_restaurant_access(auth.uid(), restaurant_id));

-- ORDER ITEMS: follow order
CREATE POLICY "order_items_team_select" ON public.order_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND public.has_restaurant_access(auth.uid(), o.restaurant_id)));
CREATE POLICY "order_items_public_insert" ON public.order_items FOR INSERT WITH CHECK (true);

-- COUPONS: public read active; team manages
CREATE POLICY "coupons_public_select" ON public.coupons FOR SELECT USING (is_active = true);
CREATE POLICY "coupons_team_manage" ON public.coupons FOR ALL USING (public.has_restaurant_access(auth.uid(), restaurant_id)) WITH CHECK (public.has_restaurant_access(auth.uid(), restaurant_id));

-- ============ REALTIME ============
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_items;
