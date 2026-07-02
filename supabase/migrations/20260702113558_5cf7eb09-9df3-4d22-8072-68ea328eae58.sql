-- Fix regression: grant EXECUTE on is_team_owner so RLS policies (and direct client calls)
-- that invoke it under the authenticated role stop failing with "permission denied for function is_team_owner".
GRANT EXECUTE ON FUNCTION public.is_team_owner(uuid, uuid) TO authenticated, anon, service_role;