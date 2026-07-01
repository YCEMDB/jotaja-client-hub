
-- =========================================================
-- G2 MULTIUSUÁRIO: convites, roles por restaurante e limites
-- =========================================================

-- 1. Adiciona role 'manager' ao enum (sem quebrar existentes)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'app_role' AND e.enumlabel = 'manager'
  ) THEN
    ALTER TYPE public.app_role ADD VALUE 'manager';
  END IF;
END $$;

-- 2. Tabela de convites pendentes
CREATE TABLE IF NOT EXISTS public.restaurant_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role public.app_role NOT NULL DEFAULT 'employee',
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_restaurant_invites_email ON public.restaurant_invites(lower(email));
CREATE INDEX IF NOT EXISTS idx_restaurant_invites_restaurant ON public.restaurant_invites(restaurant_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_invite_pending
  ON public.restaurant_invites(restaurant_id, lower(email))
  WHERE accepted_at IS NULL;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.restaurant_invites TO authenticated;
GRANT ALL ON public.restaurant_invites TO service_role;

ALTER TABLE public.restaurant_invites ENABLE ROW LEVEL SECURITY;

-- Helper (usa private.is_restaurant_owner já existente se disponível; fallback simples)
CREATE OR REPLACE FUNCTION public.is_team_owner(_uid UUID, _restaurant_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.restaurants
    WHERE id = _restaurant_id AND owner_id = _uid
  ) OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _uid AND role = 'super_admin'
  );
$$;

-- RLS: só owner/super_admin vê convites do próprio restaurante
CREATE POLICY "owners_manage_invites" ON public.restaurant_invites
  FOR ALL TO authenticated
  USING (public.is_team_owner(auth.uid(), restaurant_id))
  WITH CHECK (public.is_team_owner(auth.uid(), restaurant_id));

-- 3. RPC: convidar membro (checa limite do plano)
CREATE OR REPLACE FUNCTION public.create_team_invite(
  p_restaurant_id UUID,
  p_email TEXT,
  p_role public.app_role DEFAULT 'employee'
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_email TEXT := lower(btrim(coalesce(p_email,'')));
  v_plan TEXT;
  v_max INTEGER;
  v_used INTEGER;
  v_token TEXT;
  v_id UUID;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'unauthorized' USING ERRCODE = '42501';
  END IF;
  IF NOT public.is_team_owner(v_uid, p_restaurant_id) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  IF v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN
    RAISE EXCEPTION 'invalid_email' USING ERRCODE = 'check_violation';
  END IF;
  IF p_role NOT IN ('employee','manager') THEN
    RAISE EXCEPTION 'invalid_role' USING ERRCODE = 'check_violation';
  END IF;

  -- Limite de usuários do plano
  SELECT r.plan_id INTO v_plan FROM public.restaurants r WHERE r.id = p_restaurant_id;
  SELECT COALESCE((features->>'max_users')::int, NULL)
    INTO v_max FROM public.app_plans WHERE id = COALESCE(v_plan, 'starter');

  IF v_max IS NOT NULL THEN
    -- Owner + membros ativos + convites pendentes
    SELECT
      1
      + (SELECT count(*) FROM public.user_roles ur
         WHERE ur.restaurant_id = p_restaurant_id AND ur.role IN ('employee','manager'))
      + (SELECT count(*) FROM public.restaurant_invites i
         WHERE i.restaurant_id = p_restaurant_id AND i.accepted_at IS NULL AND i.expires_at > now())
      INTO v_used;

    IF v_used >= v_max THEN
      RAISE EXCEPTION 'plan_limit_reached: seu plano permite % usuários. Faça upgrade.', v_max
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  INSERT INTO public.restaurant_invites(restaurant_id, email, role, invited_by)
  VALUES (p_restaurant_id, v_email, p_role, v_uid)
  ON CONFLICT (restaurant_id, lower(email)) WHERE accepted_at IS NULL
    DO UPDATE SET role = EXCLUDED.role,
                  invited_by = EXCLUDED.invited_by,
                  expires_at = now() + interval '7 days',
                  token = encode(gen_random_bytes(24), 'hex')
  RETURNING id, token INTO v_id, v_token;

  RETURN jsonb_build_object('id', v_id, 'token', v_token, 'email', v_email, 'role', p_role);
END;
$$;

-- 4. RPC: aceitar convite (usuário logado)
CREATE OR REPLACE FUNCTION public.accept_team_invite(p_token TEXT)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_email TEXT;
  v_invite public.restaurant_invites%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'unauthorized' USING ERRCODE = '42501';
  END IF;
  SELECT lower(email) INTO v_email FROM auth.users WHERE id = v_uid;

  SELECT * INTO v_invite FROM public.restaurant_invites
   WHERE token = p_token AND accepted_at IS NULL AND expires_at > now()
   LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'invite_invalid_or_expired' USING ERRCODE = 'no_data_found';
  END IF;
  IF lower(v_invite.email) <> v_email THEN
    RAISE EXCEPTION 'email_mismatch: convite emitido para outro email' USING ERRCODE = 'check_violation';
  END IF;

  INSERT INTO public.user_roles(user_id, restaurant_id, role)
  VALUES (v_uid, v_invite.restaurant_id, v_invite.role)
  ON CONFLICT DO NOTHING;

  UPDATE public.restaurant_invites SET accepted_at = now() WHERE id = v_invite.id;

  RETURN jsonb_build_object('restaurant_id', v_invite.restaurant_id, 'role', v_invite.role);
END;
$$;

-- 5. RPC: listar membros da equipe
CREATE OR REPLACE FUNCTION public.list_team_members(p_restaurant_id UUID)
RETURNS TABLE(user_id UUID, email TEXT, full_name TEXT, role public.app_role, is_owner BOOLEAN, created_at TIMESTAMPTZ)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  IF NOT public.is_team_owner(auth.uid(), p_restaurant_id) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
    SELECT r.owner_id, u.email::text, p.full_name, 'owner'::public.app_role, true, r.created_at
    FROM public.restaurants r
    LEFT JOIN auth.users u ON u.id = r.owner_id
    LEFT JOIN public.profiles p ON p.id = r.owner_id
    WHERE r.id = p_restaurant_id
    UNION ALL
    SELECT ur.user_id, u.email::text, p.full_name, ur.role, false, ur.created_at
    FROM public.user_roles ur
    LEFT JOIN auth.users u ON u.id = ur.user_id
    LEFT JOIN public.profiles p ON p.id = ur.user_id
    WHERE ur.restaurant_id = p_restaurant_id AND ur.role IN ('employee','manager');
END;
$$;

-- 6. RPC: remover membro
CREATE OR REPLACE FUNCTION public.remove_team_member(p_restaurant_id UUID, p_user_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  IF NOT public.is_team_owner(auth.uid(), p_restaurant_id) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  DELETE FROM public.user_roles
    WHERE restaurant_id = p_restaurant_id
      AND user_id = p_user_id
      AND role IN ('employee','manager');
END;
$$;

-- 7. RPC: cancelar convite pendente
CREATE OR REPLACE FUNCTION public.cancel_team_invite(p_invite_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_rid UUID;
BEGIN
  SELECT restaurant_id INTO v_rid FROM public.restaurant_invites WHERE id = p_invite_id;
  IF v_rid IS NULL THEN RETURN; END IF;
  IF NOT public.is_team_owner(auth.uid(), v_rid) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  DELETE FROM public.restaurant_invites WHERE id = p_invite_id AND accepted_at IS NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_team_invite(UUID, TEXT, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_team_invite(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_team_members(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.remove_team_member(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_team_invite(UUID) TO authenticated;
