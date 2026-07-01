# Sprint 2.3 — Hardening Comercial + Produção

**Status:** ✅ Concluída
**Objetivo:** eliminar riscos técnicos/comerciais antes da Sprint 3 (KDS).

## Entregas

### 🛡️ Rate Limit ad-hoc
- Tabela `public.rate_limit_events` (bucket, endpoint, ip, restaurant_id, timestamp).
- RPC `rate_limit_check(bucket, endpoint, max, window, restaurant_id, ip)` — retorna `false` se excedeu.
- Aplicado em `create_public_order`: **5 pedidos por telefone/restaurante em 60s**.
- Purge automático > 24h (oportunístico).
- Erro padronizado: código `rate_limit`.
- **Nota:** primitiva ad-hoc SQL (backend não tem primitiva canônica). Endpoints `/api/public/*` HTTP-side devem chamar `rate_limit_check` via RPC no header handler quando implementados na Sprint 3.

### 💳 Mercado Pago — Idempotência + DLQ
- Tabela `public.mp_webhook_events`:
  - `event_id UNIQUE` (idempotência garantida por constraint).
  - Estados: `received | processing | processed | failed | dlq`.
  - `attempts`, `last_error`, `next_retry_at` para backoff exponencial.
- Índice em `(status, next_retry_at) WHERE status IN ('received','failed')` para worker de retry.
- Consumidor (rota `/api/public/mp-webhook`): fica pronto na Sprint 3 usando esta tabela.

### 🔒 Feature Gates no Backend
Novos triggers (`BEFORE INSERT`):
- `enforce_plan_product_limit` — `max_products` por plano.
- `enforce_plan_category_limit` — `max_categories` por plano.
- `enforce_plan_coupon_limit` — `advanced_coupons` (feature booleana) + `max_coupons`.

Trigger de pedidos (`enforce_plan_order_limit`) já existia.

**Defaults populados** em `app_plans.features`:
| Feature | starter | pro | business |
|---|---|---|---|
| max_products | 30 | 200 | ∞ |
| max_categories | 10 | 30 | ∞ |
| max_coupons | 3 | 20 | ∞ |
| advanced_coupons | ❌ | ✅ | ✅ |

**Impossível burlar via API** — enforço é no INSERT direto na tabela.

### ✅ CHECK Constraints
- `restaurants.opening_hours` — deve ser objeto JSONB válido.
- `restaurants.open_mode` — apenas `auto`/`force_open`/`force_closed`.
- `orders.subtotal/delivery_fee/discount/total` — todos ≥ 0.
- `orders.delivery_address` — objeto JSONB.
- `products.price/promo_price` — ≥ 0.
- `customers.phone` — só dígitos, 6–20 chars.
- `coupons.value/min_order` — ≥ 0.

### ⚡ Índices
- `order_status_history(order_id, created_at)` — timeline sem full scan.
- `orders(restaurant_id, status)` — dashboard KDS.
- `coupons(restaurant_id, upper(code))` — lookup case-insensitive.

### 📢 Padronização de Erros
- Backend: todas as RPCs retornam **códigos estáveis** (ex.: `restaurant_closed`, `coupon_expired`, `rate_limit`, `plan_limit_products`).
- Removida mistura PT-BR de mensagens em `create_public_order`.
- Frontend: novo módulo `src/lib/error-messages.ts` com `translateError(err)` — traduz códigos → PT-BR.

### 🔀 useAuth Split
Novo módulo `src/hooks/useAuthDerived.ts` expõe hooks focados sem quebrar `useAuth`:
- `useCurrentUser()` — sessão/loading.
- `useCurrentRestaurant()` — restaurante ativo + switcher.
- `usePermissions()` — roles + helper `can(role)`.
- `useCurrentPlan()` — plano + trial info.

Componentes existentes continuam usando `useAuth`. Novos devem preferir os derivados.

## Auditoria Final

| Área | Status |
|---|---|
| RLS | ✅ 100% coverage, sem regressão |
| Policies | ✅ Auditadas |
| RPCs | ✅ Todas com `search_path` fixo |
| Triggers | ✅ 12 triggers, documentados |
| Feature Gates | ✅ Backend + frontend |
| Índices | ✅ 3 novos para queries críticas |
| Constraints | ✅ 7 novas |
| TypeScript | ✅ Sem novos `any` |
| Linter | ⚠️ 48 warnings pré-existentes (SECURITY DEFINER callable por anon — intencional para RPCs públicas) |

## Segredos (Objetivo 4)
- `restaurant_secrets.mp_access_token` — ✅ já isolado.
- `mp_public_key` continua em `restaurants` — **por design** (é chave publishable, expõe no cardápio).
- `vault.decrypted_secrets` — apenas `email_queue_service_role_key`.
- Env do Worker — sem exposição a client.

## Regressões
- **Zero.** Nenhum contrato público quebrado.
- Assinatura de `create_public_order` inalterada.
- Todas as RPCs mantêm nomes/params/retornos.

## Pendências (para Sprint 3+)
- Consumer worker do `mp_webhook_events` (retry job via pg_cron).
- Rate limit HTTP-side em `/api/public/*` (quando os endpoints existirem).
- Adotar `translateError()` nos toasts existentes gradualmente (não urgente).
- Migração completa dos componentes para hooks derivados (não urgente).

## Arquivos Alterados
- `supabase/migrations/*sprint-2-3*` — 1 migration consolidada
- `src/lib/error-messages.ts` — novo
- `src/hooks/useAuthDerived.ts` — novo
- `docs/CHANGELOG.md` — atualizado

## Critério de Saída
✅ Nenhuma regressão · ✅ Typecheck limpo · ✅ Arquitetura preservada · ✅ Pronto para Sprint 3.
