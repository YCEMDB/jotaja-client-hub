
REVOKE ALL ON FUNCTION public.seed_default_automation_rules(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.process_inbound_automation(UUID, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_conversations_dashboard(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_order_communication_timeline(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_customer_conversation_timeline(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.seed_default_automation_rules(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.process_inbound_automation(UUID, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_conversations_dashboard(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_order_communication_timeline(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_customer_conversation_timeline(UUID) TO authenticated, service_role;
