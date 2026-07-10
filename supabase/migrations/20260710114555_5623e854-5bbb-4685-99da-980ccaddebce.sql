
-- ============================================================
-- Fix get_dashboard_summary: use private schema and super_admin role
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_dashboard_summary(
  p_restaurant_id uuid,
  p_from timestamptz,
  p_to timestamptz,
  p_prev_from timestamptz,
  p_prev_to timestamptz
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE
  v_tz text;
  v_result jsonb;
  v_current jsonb;
  v_previous jsonb;
  v_daily jsonb;
  v_by_channel jsonb;
  v_by_payment jsonb;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'unauthorized' USING ERRCODE = '42501';
  END IF;
  IF NOT private.has_restaurant_access(auth.uid(), p_restaurant_id) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  SELECT COALESCE(NULLIF(timezone, ''), 'America/Sao_Paulo') INTO v_tz
  FROM public.restaurants WHERE id = p_restaurant_id;
  IF v_tz IS NULL THEN v_tz := 'America/Sao_Paulo'; END IF;

  WITH cur AS (
    SELECT * FROM public.orders
    WHERE restaurant_id = p_restaurant_id
      AND created_at >= p_from AND created_at < p_to
  ),
  cur_valid AS (SELECT * FROM cur WHERE status NOT IN ('cancelled','pending'))
  SELECT jsonb_build_object(
    'revenue', COALESCE((SELECT SUM(total) FROM cur_valid), 0),
    'orders_count', (SELECT COUNT(*) FROM cur_valid),
    'avg_ticket', CASE WHEN (SELECT COUNT(*) FROM cur_valid) > 0
                       THEN COALESCE((SELECT SUM(total) FROM cur_valid),0) / (SELECT COUNT(*) FROM cur_valid)
                       ELSE 0 END,
    'total_orders', (SELECT COUNT(*) FROM cur),
    'cancelled_count', (SELECT COUNT(*) FROM cur WHERE status = 'cancelled'),
    'cancellation_rate', CASE WHEN (SELECT COUNT(*) FROM cur) > 0
                              THEN (SELECT COUNT(*) FROM cur WHERE status='cancelled')::numeric / (SELECT COUNT(*) FROM cur)
                              ELSE 0 END
  ) INTO v_current;

  WITH prv AS (
    SELECT * FROM public.orders
    WHERE restaurant_id = p_restaurant_id
      AND created_at >= p_prev_from AND created_at < p_prev_to
  ),
  prv_valid AS (SELECT * FROM prv WHERE status NOT IN ('cancelled','pending'))
  SELECT jsonb_build_object(
    'revenue', COALESCE((SELECT SUM(total) FROM prv_valid), 0),
    'orders_count', (SELECT COUNT(*) FROM prv_valid),
    'avg_ticket', CASE WHEN (SELECT COUNT(*) FROM prv_valid) > 0
                       THEN COALESCE((SELECT SUM(total) FROM prv_valid),0) / (SELECT COUNT(*) FROM prv_valid)
                       ELSE 0 END,
    'total_orders', (SELECT COUNT(*) FROM prv),
    'cancelled_count', (SELECT COUNT(*) FROM prv WHERE status='cancelled'),
    'cancellation_rate', CASE WHEN (SELECT COUNT(*) FROM prv) > 0
                              THEN (SELECT COUNT(*) FROM prv WHERE status='cancelled')::numeric / (SELECT COUNT(*) FROM prv)
                              ELSE 0 END
  ) INTO v_previous;

  SELECT COALESCE(jsonb_agg(row_to_json(s) ORDER BY (row_to_json(s)->>'day')), '[]'::jsonb) INTO v_daily
  FROM (
    SELECT
      to_char((created_at AT TIME ZONE v_tz)::date, 'YYYY-MM-DD') AS day,
      COUNT(*) FILTER (WHERE status NOT IN ('cancelled','pending')) AS orders,
      COALESCE(SUM(total) FILTER (WHERE status NOT IN ('cancelled','pending')), 0) AS revenue
    FROM public.orders
    WHERE restaurant_id = p_restaurant_id
      AND created_at >= p_from AND created_at < p_to
    GROUP BY 1
  ) s;

  SELECT COALESCE(jsonb_agg(jsonb_build_object('name', type, 'value', c, 'revenue', r)), '[]'::jsonb) INTO v_by_channel
  FROM (
    SELECT type, COUNT(*) AS c, COALESCE(SUM(total),0) AS r
    FROM public.orders
    WHERE restaurant_id = p_restaurant_id
      AND created_at >= p_from AND created_at < p_to
      AND status NOT IN ('cancelled','pending')
    GROUP BY type
  ) t;

  SELECT COALESCE(jsonb_agg(jsonb_build_object('name', payment, 'value', c, 'revenue', r)), '[]'::jsonb) INTO v_by_payment
  FROM (
    SELECT payment, COUNT(*) AS c, COALESCE(SUM(total),0) AS r
    FROM public.orders
    WHERE restaurant_id = p_restaurant_id
      AND created_at >= p_from AND created_at < p_to
      AND status NOT IN ('cancelled','pending')
    GROUP BY payment
  ) p;

  v_result := jsonb_build_object(
    'timezone', v_tz,
    'from', p_from,
    'to', p_to,
    'prev_from', p_prev_from,
    'prev_to', p_prev_to,
    'current', v_current,
    'previous', v_previous,
    'daily', v_daily,
    'by_channel', v_by_channel,
    'by_payment', v_by_payment,
    'generated_at', now()
  );
  RETURN v_result;
END $$;

REVOKE ALL ON FUNCTION public.get_dashboard_summary(uuid, timestamptz, timestamptz, timestamptz, timestamptz) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_dashboard_summary(uuid, timestamptz, timestamptz, timestamptz, timestamptz) TO authenticated;

-- ============================================================
-- SUPPORT SESSIONS (Assisted Access)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.support_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  reason text NOT NULL CHECK (char_length(reason) >= 5),
  access_level text NOT NULL DEFAULT 'view_only' CHECK (access_level IN ('view_only','operational','administrative')),
  started_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  ended_at timestamptz,
  ended_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  end_reason text CHECK (end_reason IN ('manual','expired','revoked','new_session')),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.support_sessions TO authenticated;
GRANT ALL ON public.support_sessions TO service_role;
ALTER TABLE public.support_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "support_sessions_admin_read_own" ON public.support_sessions
  FOR SELECT TO authenticated
  USING (admin_id = auth.uid() OR private.has_role(auth.uid(), 'super_admin'::app_role));

-- Partial unique index: only one active session per admin
CREATE UNIQUE INDEX IF NOT EXISTS support_sessions_one_active_per_admin
  ON public.support_sessions (admin_id) WHERE ended_at IS NULL;

CREATE INDEX IF NOT EXISTS support_sessions_active_by_restaurant
  ON public.support_sessions (restaurant_id) WHERE ended_at IS NULL;

-- ============================================================
-- AUDIT LOGS (Immutable via RLS - no INSERT/UPDATE/DELETE grants to users)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  actor_id uuid,
  actor_type text NOT NULL DEFAULT 'user' CHECK (actor_type IN ('user','system')),
  actor_role text,
  restaurant_id uuid REFERENCES public.restaurants(id) ON DELETE SET NULL,
  entity_type text,
  entity_id text,
  old_value jsonb,
  new_value jsonb,
  reason text,
  metadata jsonb,
  support_session_id uuid REFERENCES public.support_sessions(id) ON DELETE SET NULL,
  ip inet,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- SELECT only; NO insert/update/delete grants to app roles
GRANT SELECT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_logs_super_read_all" ON public.audit_logs
  FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "audit_logs_owner_read_own" ON public.audit_logs
  FOR SELECT TO authenticated
  USING (
    restaurant_id IS NOT NULL
    AND EXISTS (SELECT 1 FROM public.restaurants r WHERE r.id = restaurant_id AND r.owner_id = auth.uid())
  );

CREATE INDEX IF NOT EXISTS audit_logs_created_at_desc ON public.audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS audit_logs_restaurant_created ON public.audit_logs (restaurant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS audit_logs_actor_created ON public.audit_logs (actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS audit_logs_action_created ON public.audit_logs (action, created_at DESC);

-- ============================================================
-- Internal audit helper (SECURITY DEFINER)
-- ============================================================
CREATE OR REPLACE FUNCTION private.record_audit(
  p_action text,
  p_category text DEFAULT 'general',
  p_restaurant_id uuid DEFAULT NULL,
  p_entity_type text DEFAULT NULL,
  p_entity_id text DEFAULT NULL,
  p_old jsonb DEFAULT NULL,
  p_new jsonb DEFAULT NULL,
  p_reason text DEFAULT NULL,
  p_metadata jsonb DEFAULT NULL,
  p_support_session_id uuid DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, private, pg_temp
AS $$
DECLARE
  v_id uuid;
  v_role text;
  v_actor uuid;
BEGIN
  v_actor := auth.uid();
  SELECT role::text INTO v_role FROM public.user_roles
   WHERE user_id = v_actor
   ORDER BY (role='super_admin') DESC, (role='owner') DESC
   LIMIT 1;
  INSERT INTO public.audit_logs
    (action, category, actor_id, actor_type, actor_role, restaurant_id,
     entity_type, entity_id, old_value, new_value, reason, metadata, support_session_id)
  VALUES
    (p_action, p_category, v_actor, CASE WHEN v_actor IS NULL THEN 'system' ELSE 'user' END,
     v_role, p_restaurant_id, p_entity_type, p_entity_id, p_old, p_new, p_reason, p_metadata, p_support_session_id)
  RETURNING id INTO v_id;
  RETURN v_id;
END $$;

REVOKE ALL ON FUNCTION private.record_audit(text, text, uuid, text, text, jsonb, jsonb, text, jsonb, uuid) FROM PUBLIC;

-- ============================================================
-- Update has_restaurant_access to honor active support sessions
-- ============================================================
CREATE OR REPLACE FUNCTION private.has_restaurant_access(_user_id uuid, _restaurant_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, private, pg_temp
AS $$
  SELECT private.is_super_admin(_user_id)
    OR EXISTS (SELECT 1 FROM public.restaurants WHERE id = _restaurant_id AND owner_id = _user_id)
    OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND restaurant_id = _restaurant_id)
    OR EXISTS (
      SELECT 1 FROM public.support_sessions s
       WHERE s.admin_id = _user_id
         AND s.restaurant_id = _restaurant_id
         AND s.ended_at IS NULL
         AND s.expires_at > now()
    );
$$;

-- ============================================================
-- RPC: start_support_session
-- ============================================================
CREATE OR REPLACE FUNCTION public.start_support_session(
  p_restaurant_id uuid,
  p_reason text,
  p_access_level text DEFAULT 'view_only',
  p_minutes int DEFAULT 60
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, private, pg_temp
AS $$
DECLARE
  v_id uuid;
  v_actor uuid := auth.uid();
  v_expires timestamptz;
BEGIN
  IF v_actor IS NULL THEN RAISE EXCEPTION 'unauthorized' USING ERRCODE='42501'; END IF;
  IF NOT private.has_role(v_actor, 'super_admin'::app_role) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE='42501';
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

  -- End any previous active session for this admin
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
  RETURN jsonb_build_object('id',v_id,'expires_at',v_expires);
END $$;

REVOKE ALL ON FUNCTION public.start_support_session(uuid, text, text, int) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.start_support_session(uuid, text, text, int) TO authenticated;

-- ============================================================
-- RPC: end_support_session (self)
-- ============================================================
CREATE OR REPLACE FUNCTION public.end_support_session(p_session_id uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, private, pg_temp
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_row public.support_sessions;
BEGIN
  IF v_actor IS NULL THEN RAISE EXCEPTION 'unauthorized' USING ERRCODE='42501'; END IF;

  IF p_session_id IS NULL THEN
    SELECT * INTO v_row FROM public.support_sessions
      WHERE admin_id = v_actor AND ended_at IS NULL LIMIT 1;
  ELSE
    SELECT * INTO v_row FROM public.support_sessions WHERE id = p_session_id;
  END IF;

  IF v_row.id IS NULL THEN RETURN jsonb_build_object('ok',false,'reason','no_active_session'); END IF;

  -- Only own session, or super_admin can revoke another
  IF v_row.admin_id <> v_actor AND NOT private.has_role(v_actor,'super_admin'::app_role) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE='42501';
  END IF;

  IF v_row.ended_at IS NOT NULL THEN
    RETURN jsonb_build_object('ok',true,'already_ended',true);
  END IF;

  UPDATE public.support_sessions
    SET ended_at = now(), ended_by = v_actor,
        end_reason = CASE WHEN v_row.admin_id = v_actor THEN 'manual' ELSE 'revoked' END
    WHERE id = v_row.id;

  PERFORM private.record_audit(
    'support_session_ended','support', v_row.restaurant_id,
    'support_session', v_row.id::text,
    jsonb_build_object('started_at',v_row.started_at),
    jsonb_build_object('ended_at',now()),
    NULL, NULL, v_row.id
  );
  RETURN jsonb_build_object('ok',true,'id',v_row.id);
END $$;

REVOKE ALL ON FUNCTION public.end_support_session(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.end_support_session(uuid) TO authenticated;

-- ============================================================
-- RPC: get_active_support_session (for banner)
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_active_support_session()
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, private, pg_temp
AS $$
DECLARE
  v jsonb;
BEGIN
  IF auth.uid() IS NULL THEN RETURN NULL; END IF;
  SELECT jsonb_build_object(
    'id', s.id, 'restaurant_id', s.restaurant_id,
    'restaurant_name', r.name, 'reason', s.reason,
    'access_level', s.access_level, 'started_at', s.started_at,
    'expires_at', s.expires_at
  ) INTO v
  FROM public.support_sessions s
  JOIN public.restaurants r ON r.id = s.restaurant_id
  WHERE s.admin_id = auth.uid() AND s.ended_at IS NULL AND s.expires_at > now()
  LIMIT 1;
  RETURN v;
END $$;

REVOKE ALL ON FUNCTION public.get_active_support_session() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_active_support_session() TO authenticated;

-- ============================================================
-- RPC: extend_trial (with concurrency via row lock)
-- ============================================================
CREATE OR REPLACE FUNCTION public.extend_trial(
  p_restaurant_id uuid,
  p_days int,
  p_reason text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, private, pg_temp
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_old timestamptz;
  v_new timestamptz;
  v_max_days constant int := 90;
BEGIN
  IF v_actor IS NULL THEN RAISE EXCEPTION 'unauthorized' USING ERRCODE='42501'; END IF;
  IF NOT private.has_role(v_actor,'super_admin'::app_role) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE='42501';
  END IF;
  IF p_days IS NULL OR p_days <= 0 THEN
    RAISE EXCEPTION 'days must be positive' USING ERRCODE='22023';
  END IF;
  IF p_days > v_max_days THEN
    RAISE EXCEPTION 'exceeds max %', v_max_days USING ERRCODE='22023';
  END IF;
  IF p_reason IS NULL OR char_length(trim(p_reason)) < 3 THEN
    RAISE EXCEPTION 'reason required' USING ERRCODE='22023';
  END IF;

  -- Row lock prevents lost updates from concurrent extensions
  SELECT trial_ends_at INTO v_old FROM public.restaurants
    WHERE id = p_restaurant_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'restaurant not found' USING ERRCODE='P0002'; END IF;

  -- Base: greater of (existing trial end) or now — never shrink
  v_new := GREATEST(COALESCE(v_old, now()), now()) + make_interval(days => p_days);

  UPDATE public.restaurants SET trial_ends_at = v_new
    WHERE id = p_restaurant_id;

  PERFORM private.record_audit(
    'trial_extended','billing', p_restaurant_id,
    'restaurant', p_restaurant_id::text,
    jsonb_build_object('trial_ends_at', v_old),
    jsonb_build_object('trial_ends_at', v_new, 'added_days', p_days),
    trim(p_reason), NULL, NULL
  );
  RETURN jsonb_build_object('ok',true,'old', v_old,'new', v_new);
END $$;

REVOKE ALL ON FUNCTION public.extend_trial(uuid, int, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.extend_trial(uuid, int, text) TO authenticated;

-- ============================================================
-- RPC: list_audit_logs (paginated with filters)
-- ============================================================
CREATE OR REPLACE FUNCTION public.list_audit_logs(
  p_from timestamptz DEFAULT NULL,
  p_to   timestamptz DEFAULT NULL,
  p_restaurant_id uuid DEFAULT NULL,
  p_actor_id uuid DEFAULT NULL,
  p_action text DEFAULT NULL,
  p_category text DEFAULT NULL,
  p_search text DEFAULT NULL,
  p_limit int DEFAULT 50,
  p_offset int DEFAULT 0
) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, private, pg_temp
AS $$
DECLARE
  v_total bigint;
  v_rows jsonb;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'unauthorized' USING ERRCODE='42501'; END IF;
  IF NOT private.has_role(auth.uid(),'super_admin'::app_role) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE='42501';
  END IF;
  IF p_limit IS NULL OR p_limit < 1 OR p_limit > 200 THEN p_limit := 50; END IF;
  IF p_offset IS NULL OR p_offset < 0 THEN p_offset := 0; END IF;

  SELECT COUNT(*) INTO v_total FROM public.audit_logs l
   WHERE (p_from IS NULL OR l.created_at >= p_from)
     AND (p_to   IS NULL OR l.created_at <  p_to)
     AND (p_restaurant_id IS NULL OR l.restaurant_id = p_restaurant_id)
     AND (p_actor_id IS NULL OR l.actor_id = p_actor_id)
     AND (p_action IS NULL OR l.action = p_action)
     AND (p_category IS NULL OR l.category = p_category)
     AND (p_search IS NULL OR l.action ILIKE '%'||p_search||'%' OR l.reason ILIKE '%'||p_search||'%');

  SELECT COALESCE(jsonb_agg(x ORDER BY (x->>'created_at') DESC), '[]'::jsonb) INTO v_rows
  FROM (
    SELECT to_jsonb(l) ||
           jsonb_build_object(
             'actor_email', (SELECT email FROM public.profiles WHERE id = l.actor_id),
             'restaurant_name', (SELECT name FROM public.restaurants WHERE id = l.restaurant_id)
           ) AS x
    FROM public.audit_logs l
    WHERE (p_from IS NULL OR l.created_at >= p_from)
      AND (p_to   IS NULL OR l.created_at <  p_to)
      AND (p_restaurant_id IS NULL OR l.restaurant_id = p_restaurant_id)
      AND (p_actor_id IS NULL OR l.actor_id = p_actor_id)
      AND (p_action IS NULL OR l.action = p_action)
      AND (p_category IS NULL OR l.category = p_category)
      AND (p_search IS NULL OR l.action ILIKE '%'||p_search||'%' OR l.reason ILIKE '%'||p_search||'%')
    ORDER BY l.created_at DESC
    LIMIT p_limit OFFSET p_offset
  ) sub;

  RETURN jsonb_build_object('total', v_total, 'rows', v_rows, 'limit', p_limit, 'offset', p_offset);
END $$;

REVOKE ALL ON FUNCTION public.list_audit_logs(timestamptz, timestamptz, uuid, uuid, text, text, text, int, int) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_audit_logs(timestamptz, timestamptz, uuid, uuid, text, text, text, int, int) TO authenticated;

NOTIFY pgrst, 'reload schema';
