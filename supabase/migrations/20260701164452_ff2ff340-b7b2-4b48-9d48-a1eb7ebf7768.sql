
-- RPC: histórico com nome/email do autor
CREATE OR REPLACE FUNCTION public.get_order_history(p_order_id uuid)
RETURNS TABLE(
  id uuid,
  from_status public.order_status,
  to_status public.order_status,
  source text,
  reason text,
  changed_by uuid,
  actor_name text,
  actor_email text,
  created_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_rid uuid;
  v_uid uuid := auth.uid();
BEGIN
  SELECT restaurant_id INTO v_rid FROM public.orders WHERE id = p_order_id;
  IF v_rid IS NULL THEN
    RAISE EXCEPTION 'order_not_found' USING ERRCODE = 'no_data_found';
  END IF;
  IF NOT (
    public.is_team_owner(v_uid, v_rid)
    OR EXISTS (
      SELECT 1 FROM public.user_roles ur
       WHERE ur.user_id = v_uid
         AND ur.restaurant_id = v_rid
         AND ur.role IN ('employee','manager')
    )
  ) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
    SELECT h.id, h.from_status, h.to_status, h.source, h.reason,
           h.changed_by,
           COALESCE(p.full_name, '') AS actor_name,
           COALESCE(u.email::text, '') AS actor_email,
           h.created_at
      FROM public.order_status_history h
      LEFT JOIN auth.users u ON u.id = h.changed_by
      LEFT JOIN public.profiles p ON p.id = h.changed_by
     WHERE h.order_id = p_order_id
     ORDER BY h.created_at ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_order_history(uuid) TO authenticated;

-- Trigger AFTER INSERT em order_status_history → pg_notify
CREATE OR REPLACE FUNCTION public.trg_order_status_history_notify()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  payload jsonb;
BEGIN
  payload := jsonb_build_object(
    'order_id',      NEW.order_id,
    'restaurant_id', NEW.restaurant_id,
    'old_status',    NEW.from_status,
    'new_status',    NEW.to_status,
    'source',        NEW.source,
    'changed_by',    NEW.changed_by,
    'reason',        NEW.reason,
    'created_at',    NEW.created_at
  );
  PERFORM pg_notify('order_status_changes', payload::text);
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Nunca deve derrubar o INSERT
  RAISE WARNING 'order_status_history_notify falhou: %', SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_order_status_history_notify ON public.order_status_history;
CREATE TRIGGER trg_order_status_history_notify
  AFTER INSERT ON public.order_status_history
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_order_status_history_notify();
