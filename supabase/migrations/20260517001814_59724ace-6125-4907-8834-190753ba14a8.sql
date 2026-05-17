-- Revoga EXECUTE público das funções trigger SECURITY DEFINER.
-- Triggers continuam funcionando (executados pelo dono da tabela),
-- mas anon/authenticated não podem mais chamar as funções diretamente via RPC.

REVOKE EXECUTE ON FUNCTION public.set_order_number_per_restaurant() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_plan_order_limit() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;