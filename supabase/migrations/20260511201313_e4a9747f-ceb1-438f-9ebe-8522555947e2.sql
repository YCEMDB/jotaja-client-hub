
-- 1. PRIVATE SCHEMA
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO anon, authenticated, service_role;

-- 2. Helpers in private
CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;

CREATE OR REPLACE FUNCTION private.is_super_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'super_admin') $$;

CREATE OR REPLACE FUNCTION private.has_restaurant_access(_user_id uuid, _restaurant_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT private.is_super_admin(_user_id)
    OR EXISTS (SELECT 1 FROM public.restaurants WHERE id = _restaurant_id AND owner_id = _user_id)
    OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND restaurant_id = _restaurant_id);
$$;

CREATE OR REPLACE FUNCTION private.deactivate_expired_restaurants()
RETURNS void LANGUAGE sql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  UPDATE public.restaurants SET is_active = false
  WHERE is_active = true
    AND ((plan = 'trial' AND trial_ends_at IS NOT NULL AND trial_ends_at < now())
      OR (plan <> 'trial' AND subscription_ends_at IS NOT NULL AND subscription_ends_at < now()));
$$;

REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.is_super_admin(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.has_restaurant_access(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.deactivate_expired_restaurants() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.is_super_admin(uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.has_restaurant_access(uuid, uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.deactivate_expired_restaurants() TO service_role;

-- 3. Recreate every RLS policy that referenced public.* helpers
DROP POLICY IF EXISTS categories_team_manage ON public.categories;
CREATE POLICY categories_team_manage ON public.categories FOR ALL TO authenticated
  USING (private.has_restaurant_access(auth.uid(), restaurant_id))
  WITH CHECK (private.has_restaurant_access(auth.uid(), restaurant_id));

DROP POLICY IF EXISTS coupons_team_manage ON public.coupons;
CREATE POLICY coupons_team_manage ON public.coupons FOR ALL TO authenticated
  USING (private.has_restaurant_access(auth.uid(), restaurant_id))
  WITH CHECK (private.has_restaurant_access(auth.uid(), restaurant_id));

DROP POLICY IF EXISTS customers_team_select ON public.customers;
CREATE POLICY customers_team_select ON public.customers FOR SELECT TO authenticated
  USING (private.has_restaurant_access(auth.uid(), restaurant_id));
DROP POLICY IF EXISTS customers_team_update ON public.customers;
CREATE POLICY customers_team_update ON public.customers FOR UPDATE TO authenticated
  USING (private.has_restaurant_access(auth.uid(), restaurant_id))
  WITH CHECK (private.has_restaurant_access(auth.uid(), restaurant_id));

DROP POLICY IF EXISTS delivery_areas_team_manage ON public.delivery_areas;
CREATE POLICY delivery_areas_team_manage ON public.delivery_areas FOR ALL TO authenticated
  USING (private.has_restaurant_access(auth.uid(), restaurant_id))
  WITH CHECK (private.has_restaurant_access(auth.uid(), restaurant_id));

DROP POLICY IF EXISTS drivers_team_manage ON public.delivery_drivers;
CREATE POLICY drivers_team_manage ON public.delivery_drivers FOR ALL TO authenticated
  USING (private.has_restaurant_access(auth.uid(), restaurant_id))
  WITH CHECK (private.has_restaurant_access(auth.uid(), restaurant_id));
DROP POLICY IF EXISTS drivers_team_select ON public.delivery_drivers;
CREATE POLICY drivers_team_select ON public.delivery_drivers FOR SELECT TO authenticated
  USING (private.has_restaurant_access(auth.uid(), restaurant_id));

DROP POLICY IF EXISTS order_items_team_select ON public.order_items;
CREATE POLICY order_items_team_select ON public.order_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.orders o
    WHERE o.id = order_items.order_id AND private.has_restaurant_access(auth.uid(), o.restaurant_id)));

DROP POLICY IF EXISTS orders_team_select ON public.orders;
CREATE POLICY orders_team_select ON public.orders FOR SELECT TO authenticated
  USING (private.has_restaurant_access(auth.uid(), restaurant_id));
DROP POLICY IF EXISTS orders_team_update ON public.orders;
CREATE POLICY orders_team_update ON public.orders FOR UPDATE TO authenticated
  USING (private.has_restaurant_access(auth.uid(), restaurant_id))
  WITH CHECK (private.has_restaurant_access(auth.uid(), restaurant_id));
DROP POLICY IF EXISTS orders_team_delete ON public.orders;
CREATE POLICY orders_team_delete ON public.orders FOR DELETE TO authenticated
  USING (private.has_restaurant_access(auth.uid(), restaurant_id));

DROP POLICY IF EXISTS option_groups_team_manage ON public.product_option_groups;
CREATE POLICY option_groups_team_manage ON public.product_option_groups FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.products p
    WHERE p.id = product_option_groups.product_id AND private.has_restaurant_access(auth.uid(), p.restaurant_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.products p
    WHERE p.id = product_option_groups.product_id AND private.has_restaurant_access(auth.uid(), p.restaurant_id)));

DROP POLICY IF EXISTS option_items_team_manage ON public.product_option_items;
CREATE POLICY option_items_team_manage ON public.product_option_items FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.product_option_groups g
    JOIN public.products p ON p.id = g.product_id
    WHERE g.id = product_option_items.group_id AND private.has_restaurant_access(auth.uid(), p.restaurant_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.product_option_groups g
    JOIN public.products p ON p.id = g.product_id
    WHERE g.id = product_option_items.group_id AND private.has_restaurant_access(auth.uid(), p.restaurant_id)));

DROP POLICY IF EXISTS products_team_manage ON public.products;
CREATE POLICY products_team_manage ON public.products FOR ALL TO authenticated
  USING (private.has_restaurant_access(auth.uid(), restaurant_id))
  WITH CHECK (private.has_restaurant_access(auth.uid(), restaurant_id));

DROP POLICY IF EXISTS profiles_select_own ON public.profiles;
CREATE POLICY profiles_select_own ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id OR private.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS restaurants_public_select ON public.restaurants;
CREATE POLICY restaurants_public_select ON public.restaurants FOR SELECT
  USING (is_active = true OR owner_id = auth.uid() OR private.is_super_admin(auth.uid()));
DROP POLICY IF EXISTS restaurants_update_own ON public.restaurants;
CREATE POLICY restaurants_update_own ON public.restaurants FOR UPDATE TO authenticated
  USING (owner_id = auth.uid() OR private.is_super_admin(auth.uid()))
  WITH CHECK (owner_id = auth.uid() OR private.is_super_admin(auth.uid()));
DROP POLICY IF EXISTS restaurants_delete_own ON public.restaurants;
CREATE POLICY restaurants_delete_own ON public.restaurants FOR DELETE TO authenticated
  USING (owner_id = auth.uid() OR private.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS payments_admin_all ON public.restaurant_payments;
CREATE POLICY payments_admin_all ON public.restaurant_payments FOR ALL TO authenticated
  USING (private.is_super_admin(auth.uid()))
  WITH CHECK (private.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS leads_admin_select ON public.signup_leads;
CREATE POLICY leads_admin_select ON public.signup_leads FOR SELECT TO authenticated
  USING (private.is_super_admin(auth.uid()));
DROP POLICY IF EXISTS leads_admin_update ON public.signup_leads;
CREATE POLICY leads_admin_update ON public.signup_leads FOR UPDATE TO authenticated
  USING (private.is_super_admin(auth.uid()))
  WITH CHECK (private.is_super_admin(auth.uid()));
DROP POLICY IF EXISTS leads_admin_delete ON public.signup_leads;
CREATE POLICY leads_admin_delete ON public.signup_leads FOR DELETE TO authenticated
  USING (private.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS user_roles_admin_all ON public.user_roles;
CREATE POLICY user_roles_admin_all ON public.user_roles FOR ALL TO authenticated
  USING (private.is_super_admin(auth.uid()))
  WITH CHECK (private.is_super_admin(auth.uid()));
DROP POLICY IF EXISTS user_roles_select_own ON public.user_roles;
CREATE POLICY user_roles_select_own ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR private.is_super_admin(auth.uid()));

-- 4. Storage policies for product-images
DROP POLICY IF EXISTS product_images_public_read ON storage.objects;
DROP POLICY IF EXISTS product_images_team_insert ON storage.objects;
DROP POLICY IF EXISTS product_images_team_update ON storage.objects;
DROP POLICY IF EXISTS product_images_team_delete ON storage.objects;

CREATE POLICY product_images_team_select ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'product-images'
    AND private.has_restaurant_access(auth.uid(), ((storage.foldername(name))[1])::uuid));
CREATE POLICY product_images_team_insert ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'product-images'
    AND private.has_restaurant_access(auth.uid(), ((storage.foldername(name))[1])::uuid));
CREATE POLICY product_images_team_update ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'product-images'
    AND private.has_restaurant_access(auth.uid(), ((storage.foldername(name))[1])::uuid))
  WITH CHECK (bucket_id = 'product-images'
    AND private.has_restaurant_access(auth.uid(), ((storage.foldername(name))[1])::uuid));
CREATE POLICY product_images_team_delete ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'product-images'
    AND private.has_restaurant_access(auth.uid(), ((storage.foldername(name))[1])::uuid));

-- 5. Drop legacy public.* helpers
DROP FUNCTION IF EXISTS public.has_restaurant_access(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.is_super_admin(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role) CASCADE;
DROP FUNCTION IF EXISTS public.deactivate_expired_restaurants() CASCADE;

-- 6. Fix touch_updated_at + lock handle_new_user execute
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- 7. Tighten public INSERT policies
DROP POLICY IF EXISTS customers_public_insert ON public.customers;
CREATE POLICY customers_public_insert ON public.customers FOR INSERT TO anon, authenticated
  WITH CHECK (
    restaurant_id IS NOT NULL
    AND length(btrim(name)) BETWEEN 1 AND 120
    AND length(btrim(phone)) BETWEEN 6 AND 40
    AND EXISTS (SELECT 1 FROM public.restaurants r WHERE r.id = restaurant_id AND r.is_active = true)
  );
DROP POLICY IF EXISTS orders_public_insert ON public.orders;
CREATE POLICY orders_public_insert ON public.orders FOR INSERT TO anon, authenticated
  WITH CHECK (
    restaurant_id IS NOT NULL
    AND total >= 0
    AND length(btrim(customer_name)) BETWEEN 1 AND 120
    AND length(btrim(customer_phone)) BETWEEN 6 AND 40
    AND EXISTS (SELECT 1 FROM public.restaurants r WHERE r.id = restaurant_id AND r.is_active = true)
  );
DROP POLICY IF EXISTS order_items_public_insert ON public.order_items;
CREATE POLICY order_items_public_insert ON public.order_items FOR INSERT TO anon, authenticated
  WITH CHECK (
    order_id IS NOT NULL
    AND quantity > 0
    AND unit_price >= 0
    AND subtotal >= 0
    AND EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id)
  );
DROP POLICY IF EXISTS leads_public_insert ON public.signup_leads;
CREATE POLICY leads_public_insert ON public.signup_leads FOR INSERT TO anon, authenticated
  WITH CHECK (
    length(btrim(name)) BETWEEN 1 AND 120
    AND length(btrim(restaurant_name)) BETWEEN 1 AND 120
    AND length(btrim(email)) BETWEEN 5 AND 255
    AND length(btrim(phone)) BETWEEN 6 AND 40
  );
