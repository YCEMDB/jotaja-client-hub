-- Sprint 2.2.g — Limpeza da base
-- Remove duplicata da função upsert_public_customer (versão 4 args, obsoleta).
-- A versão canônica é upsert_public_customer(uuid, text, text, text, text) com p_source.
DROP FUNCTION IF EXISTS public.upsert_public_customer(uuid, text, text, text);

-- Marca a coluna legada restaurants.is_open como depreciada (regra oficial vive em open_mode + opening_hours + timezone + is_restaurant_open_now).
COMMENT ON COLUMN public.restaurants.is_open IS 'DEPRECATED: manter apenas por compatibilidade. Fonte oficial: open_mode + opening_hours + timezone + public.is_restaurant_open_now(). Removida na Sprint 3.';

-- Marca a coluna legada restaurants.plan (trial/essential/professional) como depreciada.
-- A fonte oficial de plano é plan_id (referencia public.app_plans).
COMMENT ON COLUMN public.restaurants.plan IS 'DEPRECATED: legado do painel super-admin. Fonte oficial: plan_id (FK app_plans). Migração completa planejada para Sprint 3.';