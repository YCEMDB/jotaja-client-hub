# Banco de Dados — Comandex

Postgres 15 (Supabase). Todas as tabelas em `public.*` possuem RLS habilitado e GRANTs explícitos.

## Índice de Tabelas

| Tabela | Finalidade | Crítica |
|---|---|---|
| `app_plans` | Definição dos planos (starter/pro/business) e limites em `features` JSONB | ✅ |
| `app_settings` | Configurações globais da plataforma | ✅ |
| `profiles` | Perfil do usuário (espelho de `auth.users`) | ✅ |
| `user_roles` | Papéis por usuário/restaurante | ✅✅ |
| `restaurants` | Fonte única do restaurante (owner, plano, horários, config) | ✅✅ |
| `restaurant_secrets` | Tokens sensíveis (MP access token) — isolado por segurança | ✅✅ |
| `restaurant_invites` | Convites pendentes de equipe (token + expiração) | ✅ |
| `restaurant_payments` | Pagamentos da assinatura da plataforma | ✅ |
| `categories` | Categorias do cardápio | ✅ |
| `products` | Produtos do cardápio | ✅ |
| `product_option_groups` | Grupos de opções (ex.: tamanho) | ✅ |
| `product_option_items` | Itens dentro de grupos | ✅ |
| `orders` | Pedidos (fonte única) | ✅✅ |
| `order_items` | Itens do pedido (snapshot) | ✅✅ |
| `order_status_history` | Histórico imutável de transições | ✅ |
| `customers` | CRM: cliente único por `(restaurant_id, phone)` | ✅ |
| `coupons` | Cupons avançados (percentual/fixo/frete grátis) | ✅ |
| `coupon_uses` | Log de uso de cupons por cliente | ✅ |
| `delivery_areas` | Áreas de entrega geográficas | ✅ |
| `delivery_neighborhoods` | Bairros e taxas | ✅ |
| `delivery_drivers` | Cadastro de entregadores | 🚧 |
| `cash_sessions` | Aberturas/fechamentos de caixa | ✅ |
| `cash_movements` | Movimentações do caixa | ✅ |
| `global_announcements` | Comunicados da plataforma | ✅ |
| `signup_leads` | Leads de landing pages | ✅ |
| `email_send_log` | Log de emails enviados | ✅ |
| `email_send_state` | Estado do retry/backoff | ✅ |
| `email_unsubscribe_tokens` | Tokens de descadastro | ✅ |
| `suppressed_emails` | Bounces/reclamações | ✅ |

## Tabelas Críticas — Detalhamento

### `restaurants` (49 colunas)
**Fonte única** para tudo relativo a um restaurante.
- Identidade: `id`, `slug` (único), `name`, `owner_id`
- Plano: `plan_id` (FK `app_plans`), `monthly_order_count`, `month_reset_at`
- Estado: `is_active`, `open_mode` (`auto`/`force_open`/`force_closed`), `timezone`, `opening_hours` JSONB
- Config visual: `logo_url`, `cover_url`, `primary_color`, `accent_color`
- Config operacional: `accepts_delivery`, `accepts_pickup`, `accepts_dine_in`, `min_order_value`, `pickup_time_minutes`, `pickup_instructions`
- Pagamento: `accept_pix_online`, `accept_cash_on_delivery`, `accept_card_on_delivery`, `mp_public_key`
- Contato: `whatsapp`
- Numeração: `order_number_seq` (sequência por restaurante)

**Deprecado (removido em Sprint 2.2.g):** `is_open` (usar `open_mode`), `plan` (usar `plan_id`).

### `orders` (29 colunas)
- FK: `restaurant_id`, `customer_id`
- Snapshot: `customer_name`, `customer_phone`, `delivery_address` (JSONB)
- Financeiro: `subtotal`, `delivery_fee`, `discount`, `total`
- Status: `status` (enum `order_status`), `payment_status`, `type` (enum `order_type`), `payment` (enum `payment_method`)
- Cupom: `coupon_code`
- Pagamento online: `pix_qr_code`, `pix_qr_code_base64`, `pix_expires_at`, `mp_preference_id`
- `order_number` (INT, único por restaurante via trigger `set_order_number_per_restaurant`)
- `source` ('web', 'panel', ...)

### `order_status_history`
Imutável (INSERT-only). Registra toda transição via `update_order_status` RPC.
Colunas: `from_status`, `to_status`, `changed_by`, `source`, `reason`, `created_at`.

### `user_roles`
Enum `app_role`: `super_admin`, `owner`, `manager`, `employee`.
Único por `(user_id, role, restaurant_id)`.
**Nunca** armazenar roles em `profiles`.

### `customers`
Identificador único: `(restaurant_id, phone)` — telefone só dígitos.
Estatísticas atualizadas por trigger `sync_customer_stats`:
`total_orders`, `total_spent`, `first_order_at`, `last_order_at`.
Campos CRM: `email`, `birthday`, `notes`, `tags[]`, `source`, `is_blocked`, opt-ins.

### `restaurant_secrets`
Isolado de `restaurants` para minimizar exposição via RLS.
Contém: `mp_access_token` (Mercado Pago).
Acesso somente via helper `private.is_restaurant_owner()`.

## Enums

| Enum | Valores |
|---|---|
| `app_role` | `super_admin`, `owner`, `manager`, `employee` |
| `order_status` | `pending`, `confirmed`, `preparing`, `ready`, `out_for_delivery`, `delivered`, `cancelled` |
| `order_type` | `delivery`, `pickup`, `dine_in` |
| `payment_method` | `pix`, `cash`, `credit`, `debit`, `meal_voucher` |

## Triggers

| Trigger | Tabela | Quando | Função |
|---|---|---|---|
| `handle_new_user` | `auth.users` | AFTER INSERT | Cria `profiles` |
| `sync_owner_role` | `restaurants` | AFTER INSERT/UPDATE | Sincroniza `user_roles` do owner |
| `set_order_number_per_restaurant` | `orders` | BEFORE INSERT | Numeração sequencial por restaurante |
| `enforce_plan_order_limit` | `orders` | BEFORE INSERT | Bloqueia se atingiu limite mensal |
| `seed_order_status_history` | `orders` | AFTER INSERT | Cria primeira entrada do histórico |
| `enforce_order_status_transition` | `orders` | BEFORE UPDATE | Bloqueia UPDATE direto em `status` (força RPC) |
| `sync_customer_stats` | `order_items`/`orders` | AFTER INSERT/UPDATE/DELETE | Recalcula estatísticas do cliente |
| `register_cash_sale_on_order` | `orders` | AFTER UPDATE | Cria movimento em caixa aberto |
| `trg_order_status_history_notify` | `order_status_history` | AFTER INSERT | `pg_notify('order_status_changes', ...)` |
| `touch_updated_at` | Várias | BEFORE UPDATE | Atualiza `updated_at` |
| `email_queue_wake` | `pgmq.q_*` | AFTER INSERT | Agenda dispatch de emails |

## Índices Notáveis

- `orders(restaurant_id, created_at DESC)` — listagem admin
- `orders(restaurant_id, status)` — KDS (planejado)
- `orders(customer_id)` — histórico cliente
- `customers(restaurant_id, phone)` UNIQUE — dedupe checkout
- `coupons(restaurant_id, upper(code))` — lookup
- `user_roles(user_id, role, restaurant_id)` UNIQUE
- `restaurant_invites(restaurant_id, lower(email))` WHERE `accepted_at IS NULL` — convite pendente único

## Schemas

- `public` — API exposta
- `private` — helpers internos (não acessível via PostgREST). Ex.: `is_restaurant_owner`, `is_valid_order_transition`, `restaurant_is_active`
- `pgmq` — filas
- `cron` — scheduler
- `vault` — segredos do Postgres (uso restrito ao email queue)
