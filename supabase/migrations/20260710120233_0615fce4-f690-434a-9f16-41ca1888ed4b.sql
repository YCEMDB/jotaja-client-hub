
-- Turno 4 hardening
CREATE OR REPLACE FUNCTION private.active_support_level(_user_id uuid, _restaurant_id uuid)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
  SELECT access_level FROM public.support_sessions
   WHERE admin_id = _user_id AND restaurant_id = _restaurant_id
     AND ended_at IS NULL AND expires_at > now()
   ORDER BY started_at DESC LIMIT 1
$$;

CREATE INDEX IF NOT EXISTS idx_support_sessions_active
  ON public.support_sessions (admin_id, restaurant_id) WHERE ended_at IS NULL;

CREATE OR REPLACE FUNCTION private.has_restaurant_read_access(_user_id uuid, _restaurant_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (SELECT 1 FROM public.restaurants WHERE id = _restaurant_id AND owner_id = _user_id)
      OR EXISTS (SELECT 1 FROM public.user_roles  WHERE user_id = _user_id AND restaurant_id = _restaurant_id)
      OR private.is_super_admin(_user_id);
$$;

CREATE OR REPLACE FUNCTION private.has_restaurant_write_access(_user_id uuid, _restaurant_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (SELECT 1 FROM public.restaurants WHERE id = _restaurant_id AND owner_id = _user_id)
      OR EXISTS (
        SELECT 1 FROM public.user_roles
         WHERE user_id = _user_id AND restaurant_id = _restaurant_id
           AND role IN ('owner'::app_role,'manager'::app_role,'employee'::app_role)
      )
      OR (
        private.is_super_admin(_user_id)
        AND private.active_support_level(_user_id, _restaurant_id) IN ('operational','administrative')
      );
$$;

CREATE OR REPLACE FUNCTION private.has_restaurant_admin_access(_user_id uuid, _restaurant_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (SELECT 1 FROM public.restaurants WHERE id = _restaurant_id AND owner_id = _user_id)
      OR (
        private.is_super_admin(_user_id)
        AND private.active_support_level(_user_id, _restaurant_id) = 'administrative'
      );
$$;

CREATE OR REPLACE FUNCTION private.has_restaurant_access(_user_id uuid, _restaurant_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$ SELECT private.has_restaurant_read_access(_user_id, _restaurant_id) $$;

CREATE OR REPLACE FUNCTION private.current_support_session_id(_restaurant_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
  SELECT id FROM public.support_sessions
   WHERE admin_id = auth.uid() AND restaurant_id = _restaurant_id
     AND ended_at IS NULL AND expires_at > now()
   ORDER BY started_at DESC LIMIT 1
$$;

-- Rewrite ALL policies into SELECT (read) + write-cmds (write)
DROP POLICY IF EXISTS cash_movements_team_all ON public.cash_movements;
CREATE POLICY cash_movements_read  ON public.cash_movements FOR SELECT USING (private.has_restaurant_read_access(auth.uid(), restaurant_id));
CREATE POLICY cash_movements_write ON public.cash_movements FOR ALL
  USING (private.has_restaurant_write_access(auth.uid(), restaurant_id))
  WITH CHECK (private.has_restaurant_write_access(auth.uid(), restaurant_id));

DROP POLICY IF EXISTS cash_sessions_team_all ON public.cash_sessions;
CREATE POLICY cash_sessions_read  ON public.cash_sessions FOR SELECT USING (private.has_restaurant_read_access(auth.uid(), restaurant_id));
CREATE POLICY cash_sessions_write ON public.cash_sessions FOR ALL
  USING (private.has_restaurant_write_access(auth.uid(), restaurant_id))
  WITH CHECK (private.has_restaurant_write_access(auth.uid(), restaurant_id));

DROP POLICY IF EXISTS categories_team_manage ON public.categories;
CREATE POLICY categories_read  ON public.categories FOR SELECT USING (private.has_restaurant_read_access(auth.uid(), restaurant_id));
CREATE POLICY categories_write ON public.categories FOR ALL
  USING (private.has_restaurant_write_access(auth.uid(), restaurant_id))
  WITH CHECK (private.has_restaurant_write_access(auth.uid(), restaurant_id));

DROP POLICY IF EXISTS coupons_team_manage ON public.coupons;
CREATE POLICY coupons_read  ON public.coupons FOR SELECT USING (private.has_restaurant_read_access(auth.uid(), restaurant_id));
CREATE POLICY coupons_write ON public.coupons FOR ALL
  USING (private.has_restaurant_write_access(auth.uid(), restaurant_id))
  WITH CHECK (private.has_restaurant_write_access(auth.uid(), restaurant_id));

DROP POLICY IF EXISTS customers_team_update ON public.customers;
CREATE POLICY customers_team_update ON public.customers FOR UPDATE
  USING (private.has_restaurant_write_access(auth.uid(), restaurant_id))
  WITH CHECK (private.has_restaurant_write_access(auth.uid(), restaurant_id));

DROP POLICY IF EXISTS delivery_areas_team_manage ON public.delivery_areas;
CREATE POLICY delivery_areas_read  ON public.delivery_areas FOR SELECT USING (private.has_restaurant_read_access(auth.uid(), restaurant_id));
CREATE POLICY delivery_areas_write ON public.delivery_areas FOR ALL
  USING (private.has_restaurant_write_access(auth.uid(), restaurant_id))
  WITH CHECK (private.has_restaurant_write_access(auth.uid(), restaurant_id));

DROP POLICY IF EXISTS drivers_team_manage ON public.delivery_drivers;
CREATE POLICY drivers_team_manage ON public.delivery_drivers FOR ALL
  USING (private.has_restaurant_write_access(auth.uid(), restaurant_id))
  WITH CHECK (private.has_restaurant_write_access(auth.uid(), restaurant_id));

DROP POLICY IF EXISTS finance_categories_team_all ON public.finance_categories;
CREATE POLICY finance_categories_read  ON public.finance_categories FOR SELECT USING (private.has_restaurant_read_access(auth.uid(), restaurant_id));
CREATE POLICY finance_categories_write ON public.finance_categories FOR ALL
  USING (private.has_restaurant_write_access(auth.uid(), restaurant_id))
  WITH CHECK (private.has_restaurant_write_access(auth.uid(), restaurant_id));

DROP POLICY IF EXISTS finance_cost_centers_team_all ON public.finance_cost_centers;
CREATE POLICY finance_cost_centers_read  ON public.finance_cost_centers FOR SELECT USING (private.has_restaurant_read_access(auth.uid(), restaurant_id));
CREATE POLICY finance_cost_centers_write ON public.finance_cost_centers FOR ALL
  USING (private.has_restaurant_write_access(auth.uid(), restaurant_id))
  WITH CHECK (private.has_restaurant_write_access(auth.uid(), restaurant_id));

DROP POLICY IF EXISTS finance_entries_team_all ON public.finance_entries;
CREATE POLICY finance_entries_read  ON public.finance_entries FOR SELECT USING (private.has_restaurant_read_access(auth.uid(), restaurant_id));
CREATE POLICY finance_entries_write ON public.finance_entries FOR ALL
  USING (private.has_restaurant_write_access(auth.uid(), restaurant_id))
  WITH CHECK (private.has_restaurant_write_access(auth.uid(), restaurant_id));

DROP POLICY IF EXISTS reconciliations_write ON public.finance_reconciliations;
CREATE POLICY reconciliations_write ON public.finance_reconciliations FOR ALL
  USING (private.has_restaurant_write_access(auth.uid(), restaurant_id))
  WITH CHECK (private.has_restaurant_write_access(auth.uid(), restaurant_id));

DROP POLICY IF EXISTS orders_team_insert ON public.orders;
DROP POLICY IF EXISTS orders_team_update ON public.orders;
DROP POLICY IF EXISTS orders_team_delete ON public.orders;
CREATE POLICY orders_team_insert ON public.orders FOR INSERT WITH CHECK (private.has_restaurant_write_access(auth.uid(), restaurant_id));
CREATE POLICY orders_team_update ON public.orders FOR UPDATE
  USING (private.has_restaurant_write_access(auth.uid(), restaurant_id))
  WITH CHECK (private.has_restaurant_write_access(auth.uid(), restaurant_id));
CREATE POLICY orders_team_delete ON public.orders FOR DELETE USING (private.has_restaurant_write_access(auth.uid(), restaurant_id));

DROP POLICY IF EXISTS order_items_team_insert ON public.order_items;
CREATE POLICY order_items_team_insert ON public.order_items FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND private.has_restaurant_write_access(auth.uid(), o.restaurant_id)));

DROP POLICY IF EXISTS option_groups_team_manage ON public.product_option_groups;
CREATE POLICY option_groups_write ON public.product_option_groups FOR ALL
  USING (EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND private.has_restaurant_write_access(auth.uid(), p.restaurant_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND private.has_restaurant_write_access(auth.uid(), p.restaurant_id)));

DROP POLICY IF EXISTS option_items_team_manage ON public.product_option_items;
CREATE POLICY option_items_write ON public.product_option_items FOR ALL
  USING (EXISTS (SELECT 1 FROM public.product_option_groups g JOIN public.products p ON p.id = g.product_id
                  WHERE g.id = group_id AND private.has_restaurant_write_access(auth.uid(), p.restaurant_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.product_option_groups g JOIN public.products p ON p.id = g.product_id
                       WHERE g.id = group_id AND private.has_restaurant_write_access(auth.uid(), p.restaurant_id)));

DROP POLICY IF EXISTS products_team_manage ON public.products;
CREATE POLICY products_read  ON public.products FOR SELECT USING (private.has_restaurant_read_access(auth.uid(), restaurant_id));
CREATE POLICY products_write ON public.products FOR ALL
  USING (private.has_restaurant_write_access(auth.uid(), restaurant_id))
  WITH CHECK (private.has_restaurant_write_access(auth.uid(), restaurant_id));

-- Lock record_audit
REVOKE ALL ON FUNCTION private.record_audit(text,text,uuid,text,text,jsonb,jsonb,text,jsonb,uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.record_audit(text,text,uuid,text,text,jsonb,jsonb,text,jsonb,uuid) FROM anon;
REVOKE ALL ON FUNCTION private.record_audit(text,text,uuid,text,text,jsonb,jsonb,text,jsonb,uuid) FROM authenticated;

-- Owners no longer read raw audit_logs
DROP POLICY IF EXISTS audit_logs_owner_read_own ON public.audit_logs;

CREATE OR REPLACE FUNCTION public.list_owner_audit(
  p_from timestamptz DEFAULT NULL, p_to timestamptz DEFAULT NULL,
  p_limit integer DEFAULT 100, p_offset integer DEFAULT 0
) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE v_uid uuid := auth.uid(); v_rows jsonb; v_total int;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'unauthorized' USING ERRCODE='42501'; END IF;
  WITH scope AS (
    SELECT a.* FROM public.audit_logs a
    JOIN public.restaurants r ON r.id = a.restaurant_id
    WHERE r.owner_id = v_uid
      AND (p_from IS NULL OR a.created_at >= p_from)
      AND (p_to   IS NULL OR a.created_at <  p_to)
      AND a.category NOT IN ('security')
  ),
  cnt AS (SELECT count(*)::int AS t FROM scope),
  page AS (
    SELECT id, action, category,
           CASE WHEN actor_type='system' THEN 'Sistema'
                WHEN actor_id = v_uid THEN 'Você'
                ELSE 'Equipe' END AS actor_label,
           entity_type, entity_id,
           NULLIF(reason,'') AS reason,
           created_at
      FROM scope ORDER BY created_at DESC LIMIT p_limit OFFSET p_offset
  )
  SELECT (SELECT t FROM cnt), COALESCE(jsonb_agg(to_jsonb(page)), '[]'::jsonb)
    INTO v_total, v_rows FROM page;
  RETURN jsonb_build_object('total', COALESCE(v_total,0), 'rows', v_rows);
END $$;

REVOKE ALL ON FUNCTION public.list_owner_audit(timestamptz,timestamptz,integer,integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_owner_audit(timestamptz,timestamptz,integer,integer) TO authenticated;

-- start_support_session: mark expired sessions distinctly
CREATE OR REPLACE FUNCTION public.start_support_session(
  p_restaurant_id uuid, p_reason text,
  p_access_level text DEFAULT 'view_only', p_minutes integer DEFAULT 60
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE v_id uuid; v_actor uuid := auth.uid(); v_expires timestamptz;
BEGIN
  IF v_actor IS NULL THEN RAISE EXCEPTION 'unauthorized' USING ERRCODE='42501'; END IF;
  IF NOT private.has_role(v_actor, 'super_admin'::app_role) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE='42501';
  END IF;
  IF p_access_level NOT IN ('view_only','operational','administrative') THEN
    RAISE EXCEPTION 'invalid access_level' USING ERRCODE='22023';
  END IF;
  IF p_reason IS NULL OR char_length(trim(p_reason)) < 5 THEN
    RAISE EXCEPTION 'reason required (min 5 chars)' USING ERRCODE='22023';
  END IF;
  IF p_minutes IS NULL OR p_minutes < 5 OR p_minutes > 240 THEN
    RAISE EXCEPTION 'invalid duration' USING ERRCODE='22023';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.restaurants WHERE id = p_restaurant_id) THEN
    RAISE EXCEPTION 'restaurant not found' USING ERRCODE='P0002';
  END IF;

  UPDATE public.support_sessions
     SET ended_at = LEAST(expires_at, now()),
         ended_by = v_actor,
         end_reason = 'expired'
   WHERE admin_id = v_actor AND ended_at IS NULL AND expires_at <= now();

  UPDATE public.support_sessions
     SET ended_at = now(), ended_by = v_actor, end_reason = 'new_session'
   WHERE admin_id = v_actor AND ended_at IS NULL;

  v_expires := now() + make_interval(mins => p_minutes);
  INSERT INTO public.support_sessions (admin_id, restaurant_id, reason, access_level, expires_at)
    VALUES (v_actor, p_restaurant_id, trim(p_reason), p_access_level, v_expires)
    RETURNING id INTO v_id;

  PERFORM private.record_audit(
    'support_session_started','support', p_restaurant_id,
    'support_session', v_id::text, NULL,
    jsonb_build_object('access_level',p_access_level,'expires_at',v_expires,'minutes',p_minutes),
    trim(p_reason), NULL, v_id
  );
  RETURN jsonb_build_object('id',v_id,'expires_at',v_expires,'access_level',p_access_level);
END $$;

-- Auto-audit finance_entry_cancel with support session
CREATE OR REPLACE FUNCTION public.finance_entry_cancel(p_id uuid, p_reason text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE v_row public.finance_entries; v_ss uuid;
BEGIN
  SELECT * INTO v_row FROM public.finance_entries WHERE id = p_id;
  IF v_row.id IS NULL THEN RAISE EXCEPTION 'not found' USING ERRCODE='P0002'; END IF;
  IF NOT private.has_restaurant_write_access(auth.uid(), v_row.restaurant_id) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE='42501';
  END IF;
  UPDATE public.finance_entries
     SET status = 'canceled', canceled_at = now(), canceled_by = auth.uid(), cancel_reason = p_reason
   WHERE id = p_id;

  v_ss := private.current_support_session_id(v_row.restaurant_id);
  PERFORM private.record_audit(
    'finance_entry_canceled','billing', v_row.restaurant_id,
    'finance_entry', p_id::text,
    to_jsonb(v_row), jsonb_build_object('status','canceled'), p_reason, NULL, v_ss
  );
END $$;
