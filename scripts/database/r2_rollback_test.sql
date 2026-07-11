-- =============================================================================
-- R2 — Rollback ao vivo de public.cash_session_open quando record_audit falha.
-- =============================================================================
-- ATENÇÃO: este arquivo NÃO é uma migration permanente. NÃO deve ser aplicado
-- via supabase/migrations/. Este projeto não possui staging separado; execute
-- uma única vez como script administrativo self-contained na base única do
-- projeto, em janela de menor movimento, com um usuário com privilégios DDL
-- sobre public.audit_logs. Todo o conteúdo roda em uma transação atômica que
-- cria, testa e remove suas próprias fixtures. Nenhuma linha permanece após
-- o commit. NÃO modifica public.user_roles em nenhum momento.
--
-- Pré-requisitos observacionais (o script aborta se não encontrar):
--   • pelo menos um usuário com role global 'super_admin' SEM qualquer
--     support_session com ended_at IS NULL (mesmo expirada);
--   • pelo menos um outro usuário em auth.users, distinto do ator, NÃO
--     super_admin e que JÁ possua o papel 'owner' em public.user_roles antes
--     do teste — reaproveitado como dono do restaurante temporário. Nenhum
--     papel é criado, alterado ou removido por este script.
--
-- Marcador único do teste (usado para isolar trigger, fixtures e auditoria):
--   app.r2_marker = <uuid>
-- =============================================================================

BEGIN;

DO $r2$
DECLARE
  v_marker            uuid := gen_random_uuid();
  v_super_uid         uuid;
  v_owner_uid         uuid;
  v_temp_rest         uuid;
  v_support_sid       uuid;

  v_open_before       bigint;
  v_audit_before      bigint;
  v_open_after_neg    bigint;
  v_audit_after_neg   bigint;
  v_open_after_pos    bigint;
  v_audit_after_pos   bigint;

  v_neg_result        jsonb;
  v_pos_result        jsonb;
  v_pos_session_id    uuid;

  v_neg_sqlstate      text;
  v_neg_msg           text;

  v_sess_row          public.cash_sessions%ROWTYPE;
  v_audit_row         public.audit_logs%ROWTYPE;

  -- Snapshots de user_roles do dono reaproveitado (invariante: preservação).
  v_roles_count_before bigint;
  v_roles_count_after  bigint;
  v_roles_json_before  jsonb;
  v_roles_json_after   jsonb;
BEGIN
  -- ---------------------------------------------------------------------------
  -- 0. Guardas de ambiente: locks curtos para não travar a base em uso.
  -- ---------------------------------------------------------------------------
  PERFORM set_config('lock_timeout',       '2s',  true);
  PERFORM set_config('statement_timeout',  '30s', true);
  PERFORM set_config('idle_in_transaction_session_timeout', '30s', true);
  PERFORM set_config('app.r2_marker', v_marker::text, true);

  -- Lock advisory transacional para evitar duas execuções concorrentes do R2.
  PERFORM pg_advisory_xact_lock(hashtext('r2_rollback_test'));

  -- ---------------------------------------------------------------------------
  -- 1. Seleção do Super Admin: NENHUMA support_session com ended_at IS NULL,
  --    inclusive expiradas (o índice único considera apenas ended_at IS NULL).
  --    Não encerra nada automaticamente.
  -- ---------------------------------------------------------------------------
  SELECT ur.user_id
    INTO v_super_uid
    FROM public.user_roles ur
   WHERE ur.role = 'super_admin'::public.app_role
     AND NOT EXISTS (
       SELECT 1
         FROM public.support_sessions ss
        WHERE ss.admin_id = ur.user_id
          AND ss.ended_at IS NULL
     )
   ORDER BY ur.user_id
   LIMIT 1;

  IF v_super_uid IS NULL THEN
    RAISE EXCEPTION 'R2 ABORT: nenhum super_admin livre (sem support_session com ended_at IS NULL) encontrado';
  END IF;

  -- ---------------------------------------------------------------------------
  -- 2. Dono reaproveitado: usuário auth.users, distinto do ator, NÃO banido,
  --    NÃO super_admin, e que JÁ possua o papel 'owner' antes do teste.
  --    Nenhum papel é criado/alterado/removido por este script.
  -- ---------------------------------------------------------------------------
  SELECT u.id
    INTO v_owner_uid
    FROM auth.users u
   WHERE u.id <> v_super_uid
     AND u.deleted_at IS NULL
     AND (u.banned_until IS NULL OR u.banned_until < now())
     AND EXISTS (
       SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = u.id
          AND ur.role    = 'owner'::public.app_role
     )
     AND NOT EXISTS (
       SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = u.id
          AND ur.role    = 'super_admin'::public.app_role
     )
   ORDER BY u.created_at NULLS LAST
   LIMIT 1;

  IF v_owner_uid IS NULL THEN
    RAISE EXCEPTION 'R2 abortado: nenhum owner elegível disponível';
  END IF;

  -- Snapshot dos papéis do dono ANTES de qualquer fixture.
  SELECT COUNT(*),
         COALESCE(jsonb_agg(to_jsonb(ur.*) ORDER BY ur.role::text, ur.id::text), '[]'::jsonb)
    INTO v_roles_count_before, v_roles_json_before
    FROM public.user_roles ur
   WHERE ur.user_id = v_owner_uid;

  -- ---------------------------------------------------------------------------
  -- 3. Fixtures temporárias (restaurante + sessão de suporte administrativa).
  --    O dono reaproveitado JÁ tem papel 'owner' global; o trigger
  --    sync_owner_role, se existir, encontrará o papel presente e não deverá
  --    inserir novo — mas o teste NÃO depende disso: o cleanup NÃO toca em
  --    user_roles e o assert final compara o snapshot exato.
  -- ---------------------------------------------------------------------------
  INSERT INTO public.restaurants (owner_id, slug, name)
  VALUES (
    v_owner_uid,
    'r2-test-' || replace(v_marker::text, '-', ''),
    '__R2 TEST__ ' || v_marker::text
  )
  RETURNING id INTO v_temp_rest;

  INSERT INTO public.support_sessions
    (admin_id, restaurant_id, reason, access_level, expires_at)
  VALUES (
    v_super_uid, v_temp_rest,
    'R2 rollback test ' || v_marker::text,
    'administrative',
    now() + interval '10 minutes'
  )
  RETURNING id INTO v_support_sid;

  -- ---------------------------------------------------------------------------
  -- 4. Simula identidade do Super Admin no request via JWT claims locais,
  --    para que auth.uid() dentro das RPCs retorne v_super_uid.
  -- ---------------------------------------------------------------------------
  PERFORM set_config(
    'request.jwt.claims',
    jsonb_build_object('sub', v_super_uid::text, 'role', 'authenticated')::text,
    true
  );
  PERFORM set_config('request.jwt.claim.sub',  v_super_uid::text, true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated',    true);

  -- ---------------------------------------------------------------------------
  -- 5. Contagens ANTES.
  -- ---------------------------------------------------------------------------
  SELECT COUNT(*) INTO v_open_before
    FROM public.cash_sessions WHERE restaurant_id = v_temp_rest;
  SELECT COUNT(*) INTO v_audit_before
    FROM public.audit_logs   WHERE restaurant_id = v_temp_rest;

  IF v_open_before <> 0 OR v_audit_before <> 0 THEN
    RAISE EXCEPTION 'R2 ABORT: fixtures não vieram limpas (open=%, audit=%)',
      v_open_before, v_audit_before;
  END IF;

  -- ---------------------------------------------------------------------------
  -- 6. Cria função + trigger de FALHA INDUZIDA, restrito ao marker + rest_id.
  --    Só reage a inserts DESTE teste — jamais interfere em outros restaurantes.
  -- ---------------------------------------------------------------------------
  CREATE OR REPLACE FUNCTION pg_temp.__r2_fail_audit()
  RETURNS trigger LANGUAGE plpgsql AS $fn$
  BEGIN
    IF NEW.restaurant_id IN (
         SELECT id FROM public.restaurants
          WHERE name = '__R2 TEST__ ' || current_setting('app.r2_marker', true)
       )
    THEN
      RAISE EXCEPTION 'R2 induced failure for marker=%',
        current_setting('app.r2_marker', true)
        USING ERRCODE = 'R2TST';
    END IF;
    RETURN NEW;
  END;
  $fn$;

  CREATE TRIGGER __r2_fail_audit
    BEFORE INSERT ON public.audit_logs
    FOR EACH ROW EXECUTE FUNCTION pg_temp.__r2_fail_audit();

  -- Verifica que o trigger está ligado à tabela certa.
  IF NOT EXISTS (
    SELECT 1
      FROM pg_trigger
     WHERE tgname   = '__r2_fail_audit'
       AND tgrelid  = 'public.audit_logs'::regclass
       AND NOT tgisinternal
  ) THEN
    RAISE EXCEPTION 'R2 ABORT: trigger __r2_fail_audit não vinculado a public.audit_logs';
  END IF;

  -- ---------------------------------------------------------------------------
  -- 7. PROVA NEGATIVA: cash_session_open DEVE falhar com R2TST e reverter
  --    completamente (nenhuma sessão, nenhum audit gravado).
  -- ---------------------------------------------------------------------------
  BEGIN
    v_neg_result := public.cash_session_open(
      p_restaurant_id  => v_temp_rest,
      p_opening_amount => 100.00,
      p_notes          => 'R2 negative ' || v_marker::text,
      p_reason         => 'R2 rollback test negative'
    );
    RAISE EXCEPTION 'R2 FAIL: cash_session_open completou sem erro (esperado SQLSTATE R2TST)';
  EXCEPTION
    WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS
        v_neg_sqlstate = RETURNED_SQLSTATE,
        v_neg_msg      = MESSAGE_TEXT;

      IF v_neg_sqlstate <> 'R2TST' THEN
        RAISE EXCEPTION 'R2 FAIL: SQLSTATE inesperado % (msg=%)', v_neg_sqlstate, v_neg_msg;
      END IF;

      IF v_neg_msg NOT LIKE ('%marker=' || v_marker::text || '%') THEN
        RAISE EXCEPTION 'R2 FAIL: mensagem sem marker esperado (msg=%)', v_neg_msg;
      END IF;
  END;

  SELECT COUNT(*) INTO v_open_after_neg
    FROM public.cash_sessions WHERE restaurant_id = v_temp_rest;
  SELECT COUNT(*) INTO v_audit_after_neg
    FROM public.audit_logs   WHERE restaurant_id = v_temp_rest;

  IF v_open_after_neg <> v_open_before THEN
    RAISE EXCEPTION 'R2 FAIL: cash_sessions divergiu no rollback (before=%, after=%)',
      v_open_before, v_open_after_neg;
  END IF;
  IF v_audit_after_neg <> v_audit_before THEN
    RAISE EXCEPTION 'R2 FAIL: audit_logs divergiu no rollback (before=%, after=%)',
      v_audit_before, v_audit_after_neg;
  END IF;

  -- ---------------------------------------------------------------------------
  -- 8. Remove o trigger + função para liberar o caminho feliz.
  -- ---------------------------------------------------------------------------
  DROP TRIGGER __r2_fail_audit ON public.audit_logs;
  DROP FUNCTION pg_temp.__r2_fail_audit();

  IF EXISTS (
    SELECT 1 FROM pg_trigger
     WHERE tgname='__r2_fail_audit'
       AND tgrelid='public.audit_logs'::regclass
       AND NOT tgisinternal
  ) THEN
    RAISE EXCEPTION 'R2 ABORT: trigger não foi removido';
  END IF;

  -- ---------------------------------------------------------------------------
  -- 9. PROVA POSITIVA: mesma RPC agora deve criar sessão + audit atômicos.
  -- ---------------------------------------------------------------------------
  v_pos_result := public.cash_session_open(
    p_restaurant_id  => v_temp_rest,
    p_opening_amount => 100.00,
    p_notes          => 'R2 positive ' || v_marker::text,
    p_reason         => 'R2 rollback test positive'
  );

  v_pos_session_id := (v_pos_result ->> 'id')::uuid;
  IF v_pos_session_id IS NULL THEN
    RAISE EXCEPTION 'R2 FAIL: cash_session_open não retornou id (result=%)', v_pos_result;
  END IF;

  SELECT COUNT(*) INTO v_open_after_pos
    FROM public.cash_sessions WHERE restaurant_id = v_temp_rest;
  SELECT COUNT(*) INTO v_audit_after_pos
    FROM public.audit_logs   WHERE restaurant_id = v_temp_rest;

  IF v_open_after_pos <> v_open_before + 1 THEN
    RAISE EXCEPTION 'R2 FAIL: cash_sessions esperado %+1, obtido %', v_open_before, v_open_after_pos;
  END IF;
  IF v_audit_after_pos <> v_audit_before + 1 THEN
    RAISE EXCEPTION 'R2 FAIL: audit_logs esperado %+1, obtido %', v_audit_before, v_audit_after_pos;
  END IF;

  -- Sessão criada deve casar com restaurante, estar aberta, ser do ator e ter
  -- opening_amount igual ao informado. Valida apenas campos garantidos pelo
  -- schema atual; 'origin' NÃO é requisito e não é validado aqui.
  SELECT * INTO v_sess_row
    FROM public.cash_sessions
   WHERE id = v_pos_session_id;

  IF NOT FOUND
     OR v_sess_row.restaurant_id  <> v_temp_rest
     OR v_sess_row.status         <> 'open'
     OR v_sess_row.opened_by      <> v_super_uid
     OR v_sess_row.opening_amount <> 100.00
  THEN
    RAISE EXCEPTION 'R2 FAIL: cash_session inconsistente (%)', to_jsonb(v_sess_row);
  END IF;

  -- Auditoria positiva filtrada pela ação e sessão de suporte corretas.
  SELECT * INTO v_audit_row
    FROM public.audit_logs
   WHERE restaurant_id       = v_temp_rest
     AND action              = 'cash_session.open'
     AND support_session_id  = v_support_sid
     AND (entity_id IS NULL OR entity_id = v_pos_session_id::text);

  IF NOT FOUND THEN
    RAISE EXCEPTION 'R2 FAIL: audit_log positivo não encontrado (action=cash_session.open, support=%)', v_support_sid;
  END IF;
  IF v_audit_row.actor_id IS DISTINCT FROM v_super_uid THEN
    RAISE EXCEPTION 'R2 FAIL: audit_log com actor_id inesperado (%)', v_audit_row.actor_id;
  END IF;

  -- ---------------------------------------------------------------------------
  -- 10. CLEANUP total das fixtures deste teste. Tudo por marker/rest_id.
  --     Ordem respeita FKs. NÃO tocamos em public.user_roles.
  -- ---------------------------------------------------------------------------
  DELETE FROM public.cash_movements
    WHERE session_id IN (SELECT id FROM public.cash_sessions WHERE restaurant_id = v_temp_rest);
  DELETE FROM public.cash_sessions    WHERE restaurant_id = v_temp_rest;
  DELETE FROM public.audit_logs       WHERE restaurant_id = v_temp_rest;
  DELETE FROM public.support_sessions WHERE id = v_support_sid;
  DELETE FROM public.restaurants      WHERE id = v_temp_rest;

  -- ---------------------------------------------------------------------------
  -- 11. Asserts finais: nada do teste deve permanecer, e user_roles do dono
  --     reaproveitado deve estar EXATAMENTE como antes.
  -- ---------------------------------------------------------------------------
  IF EXISTS (SELECT 1 FROM public.cash_sessions   WHERE restaurant_id = v_temp_rest) THEN
    RAISE EXCEPTION 'R2 FAIL: cash_sessions remanescente'; END IF;
  IF EXISTS (SELECT 1 FROM public.cash_movements  WHERE session_id IN
             (SELECT id FROM public.cash_sessions WHERE restaurant_id = v_temp_rest)) THEN
    RAISE EXCEPTION 'R2 FAIL: cash_movements remanescente'; END IF;
  IF EXISTS (SELECT 1 FROM public.audit_logs      WHERE restaurant_id = v_temp_rest) THEN
    RAISE EXCEPTION 'R2 FAIL: audit_logs remanescente'; END IF;
  IF EXISTS (SELECT 1 FROM public.support_sessions WHERE id = v_support_sid) THEN
    RAISE EXCEPTION 'R2 FAIL: support_session remanescente'; END IF;
  IF EXISTS (SELECT 1 FROM public.restaurants     WHERE id = v_temp_rest) THEN
    RAISE EXCEPTION 'R2 FAIL: restaurant remanescente'; END IF;
  IF EXISTS (
    SELECT 1 FROM pg_trigger
     WHERE tgname='__r2_fail_audit'
       AND tgrelid='public.audit_logs'::regclass
       AND NOT tgisinternal
  ) THEN
    RAISE EXCEPTION 'R2 FAIL: trigger remanescente'; END IF;
  IF EXISTS (
    SELECT 1 FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
     WHERE p.proname = '__r2_fail_audit'
       AND n.nspname LIKE 'pg_temp%'
  ) THEN
    RAISE EXCEPTION 'R2 FAIL: função temporária remanescente'; END IF;

  -- Preservação estrita de user_roles do dono reaproveitado.
  SELECT COUNT(*),
         COALESCE(jsonb_agg(to_jsonb(ur.*) ORDER BY ur.role::text, ur.id::text), '[]'::jsonb)
    INTO v_roles_count_after, v_roles_json_after
    FROM public.user_roles ur
   WHERE ur.user_id = v_owner_uid;

  IF v_roles_count_after <> v_roles_count_before THEN
    RAISE EXCEPTION 'R2 FAIL: user_roles do owner alterou em quantidade (antes=%, depois=%)',
      v_roles_count_before, v_roles_count_after;
  END IF;
  IF v_roles_json_after IS DISTINCT FROM v_roles_json_before THEN
    RAISE EXCEPTION 'R2 FAIL: user_roles do owner alterou em conteúdo (antes=%, depois=%)',
      v_roles_json_before, v_roles_json_after;
  END IF;

  RAISE NOTICE 'R2 RESULT: PASS (marker=%, super=%, owner=%, rest=%, support=%, session=%, roles_preserved=%)',
    v_marker, v_super_uid, v_owner_uid, v_temp_rest, v_support_sid, v_pos_session_id, v_roles_count_after;
END
$r2$;

COMMIT;
