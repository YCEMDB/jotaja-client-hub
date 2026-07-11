
-- ============================================================================
-- Onda 2.b — Bloco final: RPCs administrativas de grupos e itens de adicionais
-- ============================================================================

-- Leitura pública (o cardápio precisa listar adicionais). Escrita continua
-- bloqueada — não concedemos INSERT/UPDATE/DELETE a anon/authenticated.
GRANT SELECT ON public.product_option_groups TO anon, authenticated;
GRANT SELECT ON public.product_option_items  TO anon, authenticated;
GRANT ALL    ON public.product_option_groups TO service_role;
GRANT ALL    ON public.product_option_items  TO service_role;

-- ============================================================================
-- Helper interno: verifica limites de grupo x itens utilizáveis
-- ============================================================================
CREATE OR REPLACE FUNCTION private._menu_option_group_feasible(
  p_group_id uuid, p_min int, p_max int, p_required boolean
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE v_usable int;
BEGIN
  IF p_min < 0 OR p_max < 0 THEN
    RAISE EXCEPTION 'invalid_selection_limits' USING ERRCODE='22023';
  END IF;
  IF p_max < p_min THEN
    RAISE EXCEPTION 'invalid_selection_limits' USING ERRCODE='22023';
  END IF;
  IF p_required AND p_min < 1 THEN
    RAISE EXCEPTION 'invalid_selection_limits' USING ERRCODE='22023';
  END IF;
  SELECT count(*) INTO v_usable
    FROM public.product_option_items
   WHERE group_id = p_group_id
     AND archived_at IS NULL
     AND is_available = true;
  -- Se exige um mínimo, precisa haver ao menos essa quantidade de itens utilizáveis.
  IF p_min > 0 AND v_usable < p_min THEN
    RAISE EXCEPTION 'required_group_without_items' USING ERRCODE='22023';
  END IF;
END $$;

REVOKE ALL ON FUNCTION private._menu_option_group_feasible(uuid,int,int,boolean) FROM PUBLIC;

-- ============================================================================
-- GRUPOS
-- ============================================================================

-- create_option_group ---------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_option_group(
  p_product_id uuid,
  p_name text,
  p_min_select int DEFAULT 0,
  p_max_select int DEFAULT 1,
  p_is_required boolean DEFAULT false,
  p_position int DEFAULT 0,
  p_reason text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE v_rest uuid; v_prod record; v_auth record; v_reason text; v_id uuid; v_name text;
BEGIN
  IF p_name IS NULL OR length(btrim(p_name)) = 0 THEN
    RAISE EXCEPTION 'invalid_name' USING ERRCODE='22023';
  END IF;
  IF p_position IS NULL OR p_position < 0 THEN
    RAISE EXCEPTION 'invalid_position' USING ERRCODE='22023';
  END IF;

  SELECT * INTO v_prod FROM public.products WHERE id = p_product_id;
  IF v_prod.id IS NULL THEN RAISE EXCEPTION 'not_found' USING ERRCODE='02000'; END IF;
  IF v_prod.archived_at IS NOT NULL THEN RAISE EXCEPTION 'product_archived' USING ERRCODE='22023'; END IF;
  v_rest := v_prod.restaurant_id;

  SELECT * INTO v_auth FROM private.authorize_tenant_action(v_rest, 'operational');
  v_reason := private.validate_reason(p_reason, NOT v_auth.is_native);

  -- Validação de limites (grupo recém-criado sem itens; se required, é infactível).
  IF p_min_select < 0 OR p_max_select < 0 OR p_max_select < p_min_select THEN
    RAISE EXCEPTION 'invalid_selection_limits' USING ERRCODE='22023';
  END IF;
  IF p_is_required AND p_min_select < 1 THEN
    RAISE EXCEPTION 'invalid_selection_limits' USING ERRCODE='22023';
  END IF;

  v_name := btrim(p_name);
  INSERT INTO public.product_option_groups(product_id, name, min_select, max_select, is_required, position)
       VALUES (p_product_id, v_name, p_min_select, p_max_select, p_is_required, p_position)
    RETURNING id INTO v_id;

  IF NOT v_auth.is_native THEN
    PERFORM private.record_audit('option_group.create','menu',v_rest,'option_group',v_id::text,
      NULL,
      jsonb_build_object('product_id',p_product_id,'name',v_name,'min',p_min_select,'max',p_max_select,'required',p_is_required,'position',p_position),
      v_reason, NULL, v_auth.support_session_id);
  END IF;
  RETURN v_id;
END $$;

-- update_option_group_name ----------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_option_group_name(
  p_id uuid, p_name text, p_reason text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE v_rest uuid; v_before record; v_auth record; v_reason text; v_name text;
BEGIN
  IF p_name IS NULL OR length(btrim(p_name)) = 0 THEN
    RAISE EXCEPTION 'invalid_name' USING ERRCODE='22023';
  END IF;
  SELECT g.*, p.restaurant_id AS r_id, p.archived_at AS p_arch
    INTO v_before
    FROM public.product_option_groups g JOIN public.products p ON p.id = g.product_id
   WHERE g.id = p_id;
  IF v_before.id IS NULL THEN RAISE EXCEPTION 'not_found' USING ERRCODE='02000'; END IF;
  IF v_before.p_arch IS NOT NULL THEN RAISE EXCEPTION 'product_archived' USING ERRCODE='22023'; END IF;
  IF v_before.archived_at IS NOT NULL THEN RAISE EXCEPTION 'option_group_archived' USING ERRCODE='22023'; END IF;
  v_rest := v_before.r_id;

  SELECT * INTO v_auth FROM private.authorize_tenant_action(v_rest, 'operational');
  v_reason := private.validate_reason(p_reason, NOT v_auth.is_native);

  v_name := btrim(p_name);
  IF v_before.name IS NOT DISTINCT FROM v_name THEN RETURN; END IF;

  PERFORM 1 FROM public.product_option_groups WHERE id = p_id FOR UPDATE;
  UPDATE public.product_option_groups SET name = v_name WHERE id = p_id;

  IF NOT v_auth.is_native THEN
    PERFORM private.record_audit('option_group.rename','menu',v_rest,'option_group',p_id::text,
      jsonb_build_object('name',v_before.name),
      jsonb_build_object('name',v_name),
      v_reason, NULL, v_auth.support_session_id);
  END IF;
END $$;

-- update_option_group_position ------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_option_group_position(
  p_id uuid, p_position int, p_reason text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE v_rest uuid; v_before record; v_auth record; v_reason text;
BEGIN
  IF p_position IS NULL OR p_position < 0 THEN
    RAISE EXCEPTION 'invalid_position' USING ERRCODE='22023';
  END IF;
  SELECT g.*, p.restaurant_id AS r_id, p.archived_at AS p_arch
    INTO v_before
    FROM public.product_option_groups g JOIN public.products p ON p.id = g.product_id
   WHERE g.id = p_id;
  IF v_before.id IS NULL THEN RAISE EXCEPTION 'not_found' USING ERRCODE='02000'; END IF;
  IF v_before.p_arch IS NOT NULL THEN RAISE EXCEPTION 'product_archived' USING ERRCODE='22023'; END IF;
  IF v_before.archived_at IS NOT NULL THEN RAISE EXCEPTION 'option_group_archived' USING ERRCODE='22023'; END IF;
  v_rest := v_before.r_id;

  SELECT * INTO v_auth FROM private.authorize_tenant_action(v_rest, 'operational');
  v_reason := private.validate_reason(p_reason, NOT v_auth.is_native);

  IF v_before.position IS NOT DISTINCT FROM p_position THEN RETURN; END IF;

  PERFORM 1 FROM public.product_option_groups WHERE id = p_id FOR UPDATE;
  UPDATE public.product_option_groups SET position = p_position WHERE id = p_id;

  IF NOT v_auth.is_native THEN
    PERFORM private.record_audit('option_group.position','menu',v_rest,'option_group',p_id::text,
      jsonb_build_object('position',v_before.position),
      jsonb_build_object('position',p_position),
      v_reason, NULL, v_auth.support_session_id);
  END IF;
END $$;

-- update_option_group_limits --------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_option_group_limits(
  p_id uuid, p_min_select int, p_max_select int, p_is_required boolean,
  p_reason text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE v_rest uuid; v_before record; v_auth record; v_reason text;
BEGIN
  SELECT g.*, p.restaurant_id AS r_id, p.archived_at AS p_arch
    INTO v_before
    FROM public.product_option_groups g JOIN public.products p ON p.id = g.product_id
   WHERE g.id = p_id;
  IF v_before.id IS NULL THEN RAISE EXCEPTION 'not_found' USING ERRCODE='02000'; END IF;
  IF v_before.p_arch IS NOT NULL THEN RAISE EXCEPTION 'product_archived' USING ERRCODE='22023'; END IF;
  IF v_before.archived_at IS NOT NULL THEN RAISE EXCEPTION 'option_group_archived' USING ERRCODE='22023'; END IF;
  v_rest := v_before.r_id;

  SELECT * INTO v_auth FROM private.authorize_tenant_action(v_rest, 'operational');
  v_reason := private.validate_reason(p_reason, NOT v_auth.is_native);

  IF v_before.min_select IS NOT DISTINCT FROM p_min_select
     AND v_before.max_select IS NOT DISTINCT FROM p_max_select
     AND v_before.is_required IS NOT DISTINCT FROM p_is_required THEN
    RETURN;
  END IF;

  PERFORM 1 FROM public.product_option_groups WHERE id = p_id FOR UPDATE;
  PERFORM private._menu_option_group_feasible(p_id, p_min_select, p_max_select, p_is_required);

  UPDATE public.product_option_groups
     SET min_select = p_min_select, max_select = p_max_select, is_required = p_is_required
   WHERE id = p_id;

  IF NOT v_auth.is_native THEN
    PERFORM private.record_audit('option_group.limits','menu',v_rest,'option_group',p_id::text,
      jsonb_build_object('min',v_before.min_select,'max',v_before.max_select,'required',v_before.is_required),
      jsonb_build_object('min',p_min_select,'max',p_max_select,'required',p_is_required),
      v_reason, NULL, v_auth.support_session_id);
  END IF;
END $$;

-- archive_option_group --------------------------------------------------------
CREATE OR REPLACE FUNCTION public.archive_option_group(
  p_id uuid, p_reason text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE v_rest uuid; v_before record; v_auth record; v_reason text;
BEGIN
  SELECT g.*, p.restaurant_id AS r_id
    INTO v_before
    FROM public.product_option_groups g JOIN public.products p ON p.id = g.product_id
   WHERE g.id = p_id;
  IF v_before.id IS NULL THEN RAISE EXCEPTION 'not_found' USING ERRCODE='02000'; END IF;
  v_rest := v_before.r_id;

  SELECT * INTO v_auth FROM private.authorize_tenant_action(v_rest, 'administrative');
  v_reason := private.validate_reason(p_reason, true);

  PERFORM 1 FROM public.product_option_groups WHERE id = p_id FOR UPDATE;
  IF v_before.archived_at IS NOT NULL THEN RETURN; END IF;

  UPDATE public.product_option_groups SET archived_at = now() WHERE id = p_id;

  IF NOT v_auth.is_native THEN
    PERFORM private.record_audit('option_group.archive','menu',v_rest,'option_group',p_id::text,
      jsonb_build_object('archived',false),
      jsonb_build_object('archived',true),
      v_reason, NULL, v_auth.support_session_id);
  END IF;
END $$;

-- restore_option_group --------------------------------------------------------
CREATE OR REPLACE FUNCTION public.restore_option_group(
  p_id uuid, p_reason text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE v_rest uuid; v_before record; v_auth record; v_reason text;
BEGIN
  SELECT g.*, p.restaurant_id AS r_id, p.archived_at AS p_arch
    INTO v_before
    FROM public.product_option_groups g JOIN public.products p ON p.id = g.product_id
   WHERE g.id = p_id;
  IF v_before.id IS NULL THEN RAISE EXCEPTION 'not_found' USING ERRCODE='02000'; END IF;
  IF v_before.p_arch IS NOT NULL THEN RAISE EXCEPTION 'product_archived' USING ERRCODE='22023'; END IF;
  v_rest := v_before.r_id;

  SELECT * INTO v_auth FROM private.authorize_tenant_action(v_rest, 'administrative');
  v_reason := private.validate_reason(p_reason, true);

  PERFORM 1 FROM public.product_option_groups WHERE id = p_id FOR UPDATE;
  IF v_before.archived_at IS NULL THEN RETURN; END IF;

  UPDATE public.product_option_groups SET archived_at = NULL WHERE id = p_id;

  IF NOT v_auth.is_native THEN
    PERFORM private.record_audit('option_group.restore','menu',v_rest,'option_group',p_id::text,
      jsonb_build_object('archived',true),
      jsonb_build_object('archived',false),
      v_reason, NULL, v_auth.support_session_id);
  END IF;
END $$;

-- ============================================================================
-- ITENS
-- ============================================================================

-- create_option_item ----------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_option_item(
  p_group_id uuid,
  p_name text,
  p_extra_price numeric DEFAULT 0,
  p_position int DEFAULT 0,
  p_is_available boolean DEFAULT true,
  p_reason text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE v_rest uuid; v_grp record; v_required_level text;
        v_auth record; v_reason text; v_id uuid; v_name text; v_price numeric;
BEGIN
  IF p_name IS NULL OR length(btrim(p_name)) = 0 THEN
    RAISE EXCEPTION 'invalid_name' USING ERRCODE='22023';
  END IF;
  IF p_position IS NULL OR p_position < 0 THEN
    RAISE EXCEPTION 'invalid_position' USING ERRCODE='22023';
  END IF;
  IF p_extra_price IS NULL OR p_extra_price < 0 OR p_extra_price > 100000 THEN
    RAISE EXCEPTION 'invalid_extra_price' USING ERRCODE='22023';
  END IF;
  v_price := round(p_extra_price::numeric, 2);

  SELECT g.*, p.restaurant_id AS r_id, p.archived_at AS p_arch
    INTO v_grp
    FROM public.product_option_groups g JOIN public.products p ON p.id = g.product_id
   WHERE g.id = p_group_id;
  IF v_grp.id IS NULL THEN RAISE EXCEPTION 'invalid_option_group' USING ERRCODE='22023'; END IF;
  IF v_grp.p_arch IS NOT NULL THEN RAISE EXCEPTION 'product_archived' USING ERRCODE='22023'; END IF;
  IF v_grp.archived_at IS NOT NULL THEN RAISE EXCEPTION 'option_group_archived' USING ERRCODE='22023'; END IF;
  v_rest := v_grp.r_id;

  -- Preço > 0 exige nível administrativo.
  v_required_level := CASE WHEN v_price > 0 THEN 'administrative' ELSE 'operational' END;
  SELECT * INTO v_auth FROM private.authorize_tenant_action(v_rest, v_required_level);
  v_reason := private.validate_reason(p_reason, NOT v_auth.is_native);

  v_name := btrim(p_name);
  INSERT INTO public.product_option_items(group_id, name, extra_price, position, is_available)
       VALUES (p_group_id, v_name, v_price, p_position, COALESCE(p_is_available, true))
    RETURNING id INTO v_id;

  IF NOT v_auth.is_native THEN
    PERFORM private.record_audit('option_item.create','menu',v_rest,'option_item',v_id::text,
      NULL,
      jsonb_build_object('group_id',p_group_id,'name',v_name,'extra_price',v_price,'position',p_position,'available',COALESCE(p_is_available,true)),
      v_reason, NULL, v_auth.support_session_id);
  END IF;
  RETURN v_id;
END $$;

-- update_option_item_name -----------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_option_item_name(
  p_id uuid, p_name text, p_reason text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE v_rest uuid; v_before record; v_auth record; v_reason text; v_name text;
BEGIN
  IF p_name IS NULL OR length(btrim(p_name)) = 0 THEN
    RAISE EXCEPTION 'invalid_name' USING ERRCODE='22023';
  END IF;
  SELECT i.*, p.restaurant_id AS r_id, p.archived_at AS p_arch, g.archived_at AS g_arch
    INTO v_before
    FROM public.product_option_items i
    JOIN public.product_option_groups g ON g.id = i.group_id
    JOIN public.products p ON p.id = g.product_id
   WHERE i.id = p_id;
  IF v_before.id IS NULL THEN RAISE EXCEPTION 'not_found' USING ERRCODE='02000'; END IF;
  IF v_before.p_arch IS NOT NULL THEN RAISE EXCEPTION 'product_archived' USING ERRCODE='22023'; END IF;
  IF v_before.g_arch IS NOT NULL THEN RAISE EXCEPTION 'option_group_archived' USING ERRCODE='22023'; END IF;
  IF v_before.archived_at IS NOT NULL THEN RAISE EXCEPTION 'option_item_archived' USING ERRCODE='22023'; END IF;
  v_rest := v_before.r_id;

  SELECT * INTO v_auth FROM private.authorize_tenant_action(v_rest, 'operational');
  v_reason := private.validate_reason(p_reason, NOT v_auth.is_native);

  v_name := btrim(p_name);
  IF v_before.name IS NOT DISTINCT FROM v_name THEN RETURN; END IF;

  PERFORM 1 FROM public.product_option_items WHERE id = p_id FOR UPDATE;
  UPDATE public.product_option_items SET name = v_name WHERE id = p_id;

  IF NOT v_auth.is_native THEN
    PERFORM private.record_audit('option_item.rename','menu',v_rest,'option_item',p_id::text,
      jsonb_build_object('name',v_before.name),
      jsonb_build_object('name',v_name),
      v_reason, NULL, v_auth.support_session_id);
  END IF;
END $$;

-- update_option_item_position -------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_option_item_position(
  p_id uuid, p_position int, p_reason text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE v_rest uuid; v_before record; v_auth record; v_reason text;
BEGIN
  IF p_position IS NULL OR p_position < 0 THEN
    RAISE EXCEPTION 'invalid_position' USING ERRCODE='22023';
  END IF;
  SELECT i.*, p.restaurant_id AS r_id, p.archived_at AS p_arch, g.archived_at AS g_arch
    INTO v_before
    FROM public.product_option_items i
    JOIN public.product_option_groups g ON g.id = i.group_id
    JOIN public.products p ON p.id = g.product_id
   WHERE i.id = p_id;
  IF v_before.id IS NULL THEN RAISE EXCEPTION 'not_found' USING ERRCODE='02000'; END IF;
  IF v_before.p_arch IS NOT NULL THEN RAISE EXCEPTION 'product_archived' USING ERRCODE='22023'; END IF;
  IF v_before.g_arch IS NOT NULL THEN RAISE EXCEPTION 'option_group_archived' USING ERRCODE='22023'; END IF;
  IF v_before.archived_at IS NOT NULL THEN RAISE EXCEPTION 'option_item_archived' USING ERRCODE='22023'; END IF;
  v_rest := v_before.r_id;

  SELECT * INTO v_auth FROM private.authorize_tenant_action(v_rest, 'operational');
  v_reason := private.validate_reason(p_reason, NOT v_auth.is_native);

  IF v_before.position IS NOT DISTINCT FROM p_position THEN RETURN; END IF;

  PERFORM 1 FROM public.product_option_items WHERE id = p_id FOR UPDATE;
  UPDATE public.product_option_items SET position = p_position WHERE id = p_id;

  IF NOT v_auth.is_native THEN
    PERFORM private.record_audit('option_item.position','menu',v_rest,'option_item',p_id::text,
      jsonb_build_object('position',v_before.position),
      jsonb_build_object('position',p_position),
      v_reason, NULL, v_auth.support_session_id);
  END IF;
END $$;

-- set_option_item_availability ------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_option_item_availability(
  p_id uuid, p_is_available boolean, p_reason text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE v_rest uuid; v_before record; v_auth record; v_reason text;
BEGIN
  IF p_is_available IS NULL THEN RAISE EXCEPTION 'invalid_availability' USING ERRCODE='22023'; END IF;
  SELECT i.*, p.restaurant_id AS r_id, p.archived_at AS p_arch, g.archived_at AS g_arch
    INTO v_before
    FROM public.product_option_items i
    JOIN public.product_option_groups g ON g.id = i.group_id
    JOIN public.products p ON p.id = g.product_id
   WHERE i.id = p_id;
  IF v_before.id IS NULL THEN RAISE EXCEPTION 'not_found' USING ERRCODE='02000'; END IF;
  IF v_before.p_arch IS NOT NULL THEN RAISE EXCEPTION 'product_archived' USING ERRCODE='22023'; END IF;
  IF v_before.g_arch IS NOT NULL THEN RAISE EXCEPTION 'option_group_archived' USING ERRCODE='22023'; END IF;
  IF v_before.archived_at IS NOT NULL THEN RAISE EXCEPTION 'option_item_archived' USING ERRCODE='22023'; END IF;
  v_rest := v_before.r_id;

  SELECT * INTO v_auth FROM private.authorize_tenant_action(v_rest, 'operational');
  v_reason := private.validate_reason(p_reason, NOT v_auth.is_native);

  IF v_before.is_available IS NOT DISTINCT FROM p_is_available THEN
    RETURN jsonb_build_object('noop', true);
  END IF;

  PERFORM 1 FROM public.product_option_items WHERE id = p_id FOR UPDATE;
  UPDATE public.product_option_items SET is_available = p_is_available WHERE id = p_id;

  IF NOT v_auth.is_native THEN
    PERFORM private.record_audit('option_item.availability','menu',v_rest,'option_item',p_id::text,
      jsonb_build_object('available',v_before.is_available),
      jsonb_build_object('available',p_is_available),
      v_reason, NULL, v_auth.support_session_id);
  END IF;
  RETURN jsonb_build_object('noop', false);
END $$;

-- set_option_item_price -------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_option_item_price(
  p_id uuid,
  p_extra_price numeric,
  p_expected_current_price numeric,
  p_expected_provided boolean DEFAULT true,
  p_reason text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE v_rest uuid; v_before record; v_auth record; v_reason text;
        v_price numeric; v_before_price numeric; v_expected numeric;
BEGIN
  IF p_extra_price IS NULL OR p_extra_price < 0 OR p_extra_price > 100000 THEN
    RAISE EXCEPTION 'invalid_extra_price' USING ERRCODE='22023';
  END IF;
  v_price := round(p_extra_price::numeric, 2);

  SELECT i.*, p.restaurant_id AS r_id, p.archived_at AS p_arch, g.archived_at AS g_arch
    INTO v_before
    FROM public.product_option_items i
    JOIN public.product_option_groups g ON g.id = i.group_id
    JOIN public.products p ON p.id = g.product_id
   WHERE i.id = p_id;
  IF v_before.id IS NULL THEN RAISE EXCEPTION 'not_found' USING ERRCODE='02000'; END IF;
  IF v_before.p_arch IS NOT NULL THEN RAISE EXCEPTION 'product_archived' USING ERRCODE='22023'; END IF;
  IF v_before.g_arch IS NOT NULL THEN RAISE EXCEPTION 'option_group_archived' USING ERRCODE='22023'; END IF;
  IF v_before.archived_at IS NOT NULL THEN RAISE EXCEPTION 'option_item_archived' USING ERRCODE='22023'; END IF;
  v_rest := v_before.r_id;

  SELECT * INTO v_auth FROM private.authorize_tenant_action(v_rest, 'administrative');
  v_reason := private.validate_reason(p_reason, NOT v_auth.is_native);

  IF NOT p_expected_provided THEN
    RAISE EXCEPTION 'expected_values_required' USING ERRCODE='22023';
  END IF;
  v_before_price := round(v_before.extra_price::numeric, 2);
  v_expected := CASE WHEN p_expected_current_price IS NULL THEN NULL ELSE round(p_expected_current_price::numeric,2) END;
  IF v_expected IS DISTINCT FROM v_before_price THEN
    RAISE EXCEPTION 'option_price_changed_by_another_user' USING ERRCODE='40001';
  END IF;

  IF v_before_price IS NOT DISTINCT FROM v_price THEN
    RETURN jsonb_build_object('noop', true);
  END IF;

  PERFORM 1 FROM public.product_option_items WHERE id = p_id FOR UPDATE;
  UPDATE public.product_option_items SET extra_price = v_price WHERE id = p_id;

  IF NOT v_auth.is_native THEN
    PERFORM private.record_audit('option_item.price','menu',v_rest,'option_item',p_id::text,
      jsonb_build_object('extra_price',v_before_price),
      jsonb_build_object('extra_price',v_price),
      v_reason, NULL, v_auth.support_session_id);
  END IF;
  RETURN jsonb_build_object('noop', false);
END $$;

-- archive_option_item ---------------------------------------------------------
CREATE OR REPLACE FUNCTION public.archive_option_item(
  p_id uuid, p_reason text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE v_rest uuid; v_before record; v_auth record; v_reason text;
BEGIN
  SELECT i.*, p.restaurant_id AS r_id
    INTO v_before
    FROM public.product_option_items i
    JOIN public.product_option_groups g ON g.id = i.group_id
    JOIN public.products p ON p.id = g.product_id
   WHERE i.id = p_id;
  IF v_before.id IS NULL THEN RAISE EXCEPTION 'not_found' USING ERRCODE='02000'; END IF;
  v_rest := v_before.r_id;

  SELECT * INTO v_auth FROM private.authorize_tenant_action(v_rest, 'administrative');
  v_reason := private.validate_reason(p_reason, true);

  PERFORM 1 FROM public.product_option_items WHERE id = p_id FOR UPDATE;
  IF v_before.archived_at IS NOT NULL THEN RETURN; END IF;

  -- Ao arquivar item, também desativa (facilita revalidação de grupo obrigatório).
  UPDATE public.product_option_items SET archived_at = now(), is_available = false WHERE id = p_id;

  IF NOT v_auth.is_native THEN
    PERFORM private.record_audit('option_item.archive','menu',v_rest,'option_item',p_id::text,
      jsonb_build_object('archived',false,'available',v_before.is_available),
      jsonb_build_object('archived',true,'available',false),
      v_reason, NULL, v_auth.support_session_id);
  END IF;
END $$;

-- restore_option_item ---------------------------------------------------------
-- Restaura como is_available = false (ativação explícita, conforme spec).
CREATE OR REPLACE FUNCTION public.restore_option_item(
  p_id uuid, p_reason text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE v_rest uuid; v_before record; v_auth record; v_reason text;
BEGIN
  SELECT i.*, p.restaurant_id AS r_id, p.archived_at AS p_arch, g.archived_at AS g_arch
    INTO v_before
    FROM public.product_option_items i
    JOIN public.product_option_groups g ON g.id = i.group_id
    JOIN public.products p ON p.id = g.product_id
   WHERE i.id = p_id;
  IF v_before.id IS NULL THEN RAISE EXCEPTION 'not_found' USING ERRCODE='02000'; END IF;
  IF v_before.p_arch IS NOT NULL THEN RAISE EXCEPTION 'product_archived' USING ERRCODE='22023'; END IF;
  IF v_before.g_arch IS NOT NULL THEN RAISE EXCEPTION 'option_group_archived' USING ERRCODE='22023'; END IF;
  v_rest := v_before.r_id;

  SELECT * INTO v_auth FROM private.authorize_tenant_action(v_rest, 'administrative');
  v_reason := private.validate_reason(p_reason, true);

  PERFORM 1 FROM public.product_option_items WHERE id = p_id FOR UPDATE;
  IF v_before.archived_at IS NULL THEN RETURN; END IF;

  UPDATE public.product_option_items SET archived_at = NULL, is_available = false WHERE id = p_id;

  IF NOT v_auth.is_native THEN
    PERFORM private.record_audit('option_item.restore','menu',v_rest,'option_item',p_id::text,
      jsonb_build_object('archived',true),
      jsonb_build_object('archived',false,'available',false),
      v_reason, NULL, v_auth.support_session_id);
  END IF;
END $$;

-- ============================================================================
-- Grants nas RPCs
-- ============================================================================
DO $$
DECLARE v_fn text;
BEGIN
  FOREACH v_fn IN ARRAY ARRAY[
    'public.create_option_group(uuid,text,int,int,boolean,int,text)',
    'public.update_option_group_name(uuid,text,text)',
    'public.update_option_group_position(uuid,int,text)',
    'public.update_option_group_limits(uuid,int,int,boolean,text)',
    'public.archive_option_group(uuid,text)',
    'public.restore_option_group(uuid,text)',
    'public.create_option_item(uuid,text,numeric,int,boolean,text)',
    'public.update_option_item_name(uuid,text,text)',
    'public.update_option_item_position(uuid,int,text)',
    'public.set_option_item_availability(uuid,boolean,text)',
    'public.set_option_item_price(uuid,numeric,numeric,boolean,text)',
    'public.archive_option_item(uuid,text)',
    'public.restore_option_item(uuid,text)'
  ] LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon', v_fn);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated, service_role', v_fn);
  END LOOP;
END $$;
