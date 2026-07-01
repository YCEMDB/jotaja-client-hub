
-- Sprint 2.2.a: Owner como fonte única de verdade
-- 1) private.is_restaurant_owner passa a ler restaurants.owner_id (fonte oficial)
CREATE OR REPLACE FUNCTION private.is_restaurant_owner(_user_id uuid, _restaurant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.restaurants
    WHERE id = _restaurant_id AND owner_id = _user_id
  );
$$;

-- 2) Trigger para manter user_roles espelhando restaurants.owner_id
--    (compatibilidade — user_roles vira apenas espelho de leitura para membros/manager/employee)
CREATE OR REPLACE FUNCTION public.sync_owner_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.owner_id IS NOT NULL THEN
      INSERT INTO public.user_roles(user_id, role, restaurant_id)
      VALUES (NEW.owner_id, 'owner', NEW.id)
      ON CONFLICT (user_id, role, restaurant_id) DO NOTHING;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.owner_id IS DISTINCT FROM OLD.owner_id THEN
      IF OLD.owner_id IS NOT NULL THEN
        DELETE FROM public.user_roles
         WHERE user_id = OLD.owner_id
           AND role = 'owner'
           AND restaurant_id = OLD.id;
      END IF;
      IF NEW.owner_id IS NOT NULL THEN
        INSERT INTO public.user_roles(user_id, role, restaurant_id)
        VALUES (NEW.owner_id, 'owner', NEW.id)
        ON CONFLICT (user_id, role, restaurant_id) DO NOTHING;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_owner_role ON public.restaurants;
CREATE TRIGGER trg_sync_owner_role
AFTER INSERT OR UPDATE OF owner_id ON public.restaurants
FOR EACH ROW EXECUTE FUNCTION public.sync_owner_role();

-- 3) Backfill — reconciliar user_roles com a fonte oficial
--    Remove linhas de owner divergentes (user_roles diz X, restaurants.owner_id diz Y)
DELETE FROM public.user_roles ur
 USING public.restaurants r
 WHERE ur.role = 'owner'
   AND ur.restaurant_id = r.id
   AND ur.user_id IS DISTINCT FROM r.owner_id;

--    Insere linha de owner faltante
INSERT INTO public.user_roles(user_id, role, restaurant_id)
SELECT r.owner_id, 'owner', r.id
  FROM public.restaurants r
 WHERE r.owner_id IS NOT NULL
   AND NOT EXISTS (
     SELECT 1 FROM public.user_roles ur
      WHERE ur.role = 'owner'
        AND ur.restaurant_id = r.id
        AND ur.user_id = r.owner_id
   )
ON CONFLICT (user_id, role, restaurant_id) DO NOTHING;
