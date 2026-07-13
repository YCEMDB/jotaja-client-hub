CREATE OR REPLACE FUNCTION private.has_restaurant_access(_user_id uuid, _restaurant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT private.has_tenant_native_read_access(_user_id, _restaurant_id)
      OR private.has_active_support_access(_user_id, _restaurant_id);
$function$;