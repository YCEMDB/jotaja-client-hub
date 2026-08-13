-- REVERT: GRANT EXECUTE ON FUNCTION ... TO authenticated;
REVOKE EXECUTE ON FUNCTION public._apply_stock_sale(uuid, boolean) FROM authenticated, anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public._log_order_event(uuid, text, jsonb) FROM authenticated, anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public._tables_can_manage(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public._tables_max_for(uuid) FROM anon, PUBLIC;