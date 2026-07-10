
-- ONDA 1.1

CREATE OR REPLACE FUNCTION private.has_tenant_native_read_access(_user_id uuid, _restaurant_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT EXISTS (SELECT 1 FROM public.restaurants WHERE id = _restaurant_id AND owner_id = _user_id)
      OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND restaurant_id = _restaurant_id);
$$;

CREATE OR REPLACE FUNCTION private.has_tenant_native_write_access(_user_id uuid, _restaurant_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT EXISTS (SELECT 1 FROM public.restaurants WHERE id = _restaurant_id AND owner_id = _user_id)
      OR EXISTS (
        SELECT 1 FROM public.user_roles
         WHERE user_id = _user_id AND restaurant_id = _restaurant_id
           AND role IN ('owner'::app_role,'manager'::app_role,'employee'::app_role)
      );
$$;

CREATE OR REPLACE FUNCTION private.has_active_support_access(_user_id uuid, _restaurant_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT private.is_super_admin(_user_id)
     AND private.active_support_level(_user_id, _restaurant_id) IS NOT NULL;
$$;

CREATE OR REPLACE FUNCTION private.has_support_operational_access(_user_id uuid, _restaurant_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT private.is_super_admin(_user_id)
     AND private.active_support_level(_user_id, _restaurant_id) IN ('operational','administrative');
$$;

CREATE OR REPLACE FUNCTION private.has_support_administrative_access(_user_id uuid, _restaurant_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT private.is_super_admin(_user_id)
     AND private.active_support_level(_user_id, _restaurant_id) = 'administrative';
$$;

CREATE OR REPLACE FUNCTION private.has_restaurant_read_access(_user_id uuid, _restaurant_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT private.has_tenant_native_read_access(_user_id, _restaurant_id)
      OR private.has_active_support_access(_user_id, _restaurant_id);
$$;

CREATE OR REPLACE FUNCTION private.has_restaurant_write_access(_user_id uuid, _restaurant_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT private.has_tenant_native_write_access(_user_id, _restaurant_id);
$$;

CREATE OR REPLACE FUNCTION private.has_restaurant_access(_user_id uuid, _restaurant_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT private.has_tenant_native_read_access(_user_id, _restaurant_id);
$$;

CREATE OR REPLACE FUNCTION private.has_restaurant_admin_access(_user_id uuid, _restaurant_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT EXISTS (SELECT 1 FROM public.restaurants WHERE id = _restaurant_id AND owner_id = _user_id)
      OR private.has_support_administrative_access(_user_id, _restaurant_id);
$$;

DROP POLICY IF EXISTS restaurants_update_own ON public.restaurants;
CREATE POLICY restaurants_update_own ON public.restaurants FOR UPDATE
  USING (owner_id = auth.uid() OR private.has_support_administrative_access(auth.uid(), id))
  WITH CHECK (owner_id = auth.uid() OR private.has_support_administrative_access(auth.uid(), id));

DROP POLICY IF EXISTS restaurants_delete_own ON public.restaurants;
CREATE POLICY restaurants_delete_own ON public.restaurants FOR DELETE
  USING (owner_id = auth.uid() OR private.has_support_administrative_access(auth.uid(), id));

DO $$
DECLARE
  t text;
  pol text;
  tables text[] := ARRAY[
    'restaurant_tables','table_sessions','table_session_events','table_split_payments','table_commands',
    'stock_ingredients','stock_movements','stock_suppliers','stock_units','product_recipes',
    'driver_locations','coupon_uses','order_status_history','print_jobs',
    'kitchen_stations','operations_settings','communication_logs','communication_queue',
    'communication_settings','communication_templates',
    'communication_event_bindings','conversation_automation_rules','conversation_automation_fires',
    'conversation_messages','conversations','quick_replies','restaurant_payments','mp_webhook_events',
    'audit_logs','support_sessions','finance_reconciliations','customers','delivery_drivers','orders'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    pol := t || '_support_read';
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol, t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT USING (private.has_active_support_access(auth.uid(), restaurant_id))', pol, t);
  END LOOP;

  -- order_items joins via orders
  EXECUTE 'DROP POLICY IF EXISTS order_items_support_read ON public.order_items';
  EXECUTE 'CREATE POLICY order_items_support_read ON public.order_items FOR SELECT USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_items.order_id AND private.has_active_support_access(auth.uid(), o.restaurant_id)))';
END $$;

-- RPC finance_entry_cancel: aceita nativa OU sessão operacional/administrativa e audita
CREATE OR REPLACE FUNCTION public.finance_entry_cancel(p_id uuid, p_reason text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE v_row public.finance_entries; v_ss uuid; v_uid uuid := auth.uid();
BEGIN
  SELECT * INTO v_row FROM public.finance_entries WHERE id = p_id;
  IF v_row.id IS NULL THEN RAISE EXCEPTION 'not found' USING ERRCODE='P0002'; END IF;
  IF NOT (
    private.has_tenant_native_write_access(v_uid, v_row.restaurant_id)
    OR private.has_support_operational_access(v_uid, v_row.restaurant_id)
  ) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE='42501';
  END IF;
  UPDATE public.finance_entries
     SET status='canceled', canceled_at=now(), canceled_by=v_uid, cancel_reason=p_reason
   WHERE id = p_id;
  v_ss := private.current_support_session_id(v_row.restaurant_id);
  PERFORM private.record_audit(
    'finance_entry_canceled','billing', v_row.restaurant_id,
    'finance_entry', p_id::text,
    to_jsonb(v_row), jsonb_build_object('status','canceled'), p_reason, NULL, v_ss
  );
END $$;

COMMENT ON FUNCTION private.has_restaurant_write_access(uuid,uuid) IS
  'Somente escrita nativa (owner/equipe). Sessoes de suporte nao escrevem via policy - devem usar RPCs auditaveis.';
COMMENT ON FUNCTION private.has_restaurant_read_access(uuid,uuid) IS
  'Leitura nativa OU sessao de suporte ativa em qualquer nivel (inclusive view_only).';
COMMENT ON FUNCTION private.has_restaurant_access(uuid,uuid) IS
  'Legado: somente acesso nativo. Nao concede acesso a super_admin - use RPCs ou policies _support_read.';
COMMENT ON FUNCTION private.has_support_operational_access(uuid,uuid) IS
  'Autoriza acoes operacionais dentro de RPCs SECURITY DEFINER durante suporte.';
COMMENT ON FUNCTION private.has_support_administrative_access(uuid,uuid) IS
  'Autoriza acoes administrativas dentro de RPCs SECURITY DEFINER durante suporte.';
