-- 1) app_settings: restringe leitura pública a chaves whitelisted
DROP POLICY IF EXISTS settings_public_select ON public.app_settings;
CREATE POLICY settings_public_select ON public.app_settings
  FOR SELECT
  USING (key IN ('public_url', 'support_whatsapp', 'support_email', 'support_hours'));

-- 2) product_option_groups: exige restaurante ativo
DROP POLICY IF EXISTS option_groups_public_select ON public.product_option_groups;
CREATE POLICY option_groups_public_select ON public.product_option_groups
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.products p
      JOIN public.restaurants r ON r.id = p.restaurant_id
      WHERE p.id = product_option_groups.product_id
        AND p.is_available = true
        AND r.is_active = true
    )
  );

-- 3) product_option_items: exige restaurante ativo (via group -> product -> restaurant)
DROP POLICY IF EXISTS option_items_public_select ON public.product_option_items;
CREATE POLICY option_items_public_select ON public.product_option_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.product_option_groups g
      JOIN public.products p ON p.id = g.product_id
      JOIN public.restaurants r ON r.id = p.restaurant_id
      WHERE g.id = product_option_items.group_id
        AND p.is_available = true
        AND r.is_active = true
    )
  );

-- 4) restaurant_secrets: apenas owner do restaurante ou super_admin
-- Helper security-definer para checar owner (evita recursão em RLS)
CREATE OR REPLACE FUNCTION private.is_restaurant_owner(_user_id uuid, _restaurant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = _user_id
      AND ur.restaurant_id = _restaurant_id
      AND ur.role = 'owner'::app_role
  );
$$;

REVOKE ALL ON FUNCTION private.is_restaurant_owner(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.is_restaurant_owner(uuid, uuid) TO authenticated, service_role;

DROP POLICY IF EXISTS restaurant_secrets_team_all ON public.restaurant_secrets;

CREATE POLICY restaurant_secrets_owner_select ON public.restaurant_secrets
  FOR SELECT
  TO authenticated
  USING (
    private.is_super_admin(auth.uid())
    OR private.is_restaurant_owner(auth.uid(), restaurant_id)
  );

CREATE POLICY restaurant_secrets_owner_write ON public.restaurant_secrets
  FOR ALL
  TO authenticated
  USING (
    private.is_super_admin(auth.uid())
    OR private.is_restaurant_owner(auth.uid(), restaurant_id)
  )
  WITH CHECK (
    private.is_super_admin(auth.uid())
    OR private.is_restaurant_owner(auth.uid(), restaurant_id)
  );