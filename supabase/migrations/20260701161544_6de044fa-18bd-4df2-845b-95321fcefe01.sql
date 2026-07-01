
-- Sprint 2.2.d: Convites robustos

-- 1. create_team_invite: bloqueia duplicado, owner e membro existente
CREATE OR REPLACE FUNCTION public.create_team_invite(
  p_restaurant_id uuid, p_email text, p_role public.app_role DEFAULT 'employee'::public.app_role
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp' AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_email TEXT := lower(btrim(coalesce(p_email,'')));
  v_plan TEXT;
  v_max INTEGER;
  v_used INTEGER;
  v_token TEXT;
  v_id UUID;
  v_target_user UUID;
  v_owner UUID;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'unauthorized' USING ERRCODE='42501'; END IF;
  IF NOT public.is_team_owner(v_uid, p_restaurant_id) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE='42501';
  END IF;
  IF v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN
    RAISE EXCEPTION 'invalid_email: E-mail inválido.' USING ERRCODE='check_violation';
  END IF;
  IF p_role NOT IN ('employee','manager') THEN
    RAISE EXCEPTION 'invalid_role' USING ERRCODE='check_violation';
  END IF;

  -- Owner do restaurante?
  SELECT r.owner_id INTO v_owner FROM public.restaurants r WHERE r.id = p_restaurant_id;
  IF v_owner IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM auth.users u WHERE u.id = v_owner AND lower(u.email) = v_email) THEN
      RAISE EXCEPTION 'is_owner: Este e-mail já é o dono do restaurante.' USING ERRCODE='check_violation';
    END IF;
  END IF;

  -- Já é membro?
  SELECT u.id INTO v_target_user FROM auth.users u WHERE lower(u.email) = v_email LIMIT 1;
  IF v_target_user IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.user_roles ur
     WHERE ur.user_id = v_target_user AND ur.restaurant_id = p_restaurant_id
       AND ur.role IN ('employee','manager','owner')
  ) THEN
    RAISE EXCEPTION 'already_member: Este usuário já faz parte da equipe.' USING ERRCODE='check_violation';
  END IF;

  -- Convite pendente já existe?
  IF EXISTS (
    SELECT 1 FROM public.restaurant_invites
     WHERE restaurant_id = p_restaurant_id AND lower(email) = v_email
       AND accepted_at IS NULL AND expires_at > now()
  ) THEN
    RAISE EXCEPTION 'duplicate_invite: Já existe um convite pendente para este e-mail.' USING ERRCODE='unique_violation';
  END IF;

  -- Limpa expirados desse e-mail para liberar o índice único
  DELETE FROM public.restaurant_invites
   WHERE restaurant_id = p_restaurant_id AND lower(email) = v_email
     AND accepted_at IS NULL AND expires_at <= now();

  -- Limite do plano
  SELECT r.plan_id INTO v_plan FROM public.restaurants r WHERE r.id = p_restaurant_id;
  SELECT COALESCE((features->>'max_users')::int, NULL) INTO v_max
    FROM public.app_plans WHERE id = COALESCE(v_plan,'starter');
  IF v_max IS NOT NULL THEN
    SELECT 1
      + (SELECT count(*) FROM public.user_roles ur
         WHERE ur.restaurant_id = p_restaurant_id AND ur.role IN ('employee','manager'))
      + (SELECT count(*) FROM public.restaurant_invites i
         WHERE i.restaurant_id = p_restaurant_id AND i.accepted_at IS NULL AND i.expires_at > now())
      INTO v_used;
    IF v_used >= v_max THEN
      RAISE EXCEPTION 'plan_limit_reached: seu plano permite % usuários. Faça upgrade.', v_max
        USING ERRCODE='check_violation';
    END IF;
  END IF;

  INSERT INTO public.restaurant_invites(restaurant_id, email, role, invited_by)
  VALUES (p_restaurant_id, v_email, p_role, v_uid)
  RETURNING id, token INTO v_id, v_token;

  RETURN jsonb_build_object('id', v_id, 'token', v_token, 'email', v_email, 'role', p_role);
END $$;

-- 2. resend_team_invite: regenera token e estende expiração
CREATE OR REPLACE FUNCTION public.resend_team_invite(p_invite_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp' AS $$
DECLARE
  v_rid UUID;
  v_token TEXT;
  v_email TEXT;
  v_expires TIMESTAMPTZ;
BEGIN
  SELECT restaurant_id INTO v_rid FROM public.restaurant_invites WHERE id = p_invite_id;
  IF v_rid IS NULL THEN RAISE EXCEPTION 'not_found' USING ERRCODE='no_data_found'; END IF;
  IF NOT public.is_team_owner(auth.uid(), v_rid) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE='42501';
  END IF;
  UPDATE public.restaurant_invites
     SET token = encode(gen_random_bytes(24),'hex'),
         expires_at = now() + interval '7 days'
   WHERE id = p_invite_id AND accepted_at IS NULL
  RETURNING token, email, expires_at INTO v_token, v_email, v_expires;
  IF v_token IS NULL THEN
    RAISE EXCEPTION 'already_accepted_or_missing' USING ERRCODE='check_violation';
  END IF;
  RETURN jsonb_build_object('id', p_invite_id, 'token', v_token, 'email', v_email, 'expires_at', v_expires);
END $$;

-- 3. cleanup_expired_invites: pode ser chamada por cron
CREATE OR REPLACE FUNCTION public.cleanup_expired_invites()
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp' AS $$
DECLARE v_n integer;
BEGIN
  WITH d AS (
    DELETE FROM public.restaurant_invites
     WHERE accepted_at IS NULL AND expires_at <= now() - interval '1 day'
     RETURNING 1
  ) SELECT count(*) INTO v_n FROM d;
  RETURN v_n;
END $$;

-- Permissões
REVOKE ALL ON FUNCTION public.create_team_invite(uuid, text, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_team_invite(uuid, text, public.app_role) TO authenticated;
REVOKE ALL ON FUNCTION public.resend_team_invite(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.resend_team_invite(uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.cleanup_expired_invites() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_invites() TO service_role;

-- 4. Agendamento diário de limpeza
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname='pg_cron') THEN
    PERFORM cron.unschedule('cleanup-expired-invites') FROM cron.job WHERE jobname='cleanup-expired-invites';
    PERFORM cron.schedule('cleanup-expired-invites','0 3 * * *', $c$ SELECT public.cleanup_expired_invites(); $c$);
  END IF;
END $$;
