# RPCs — Comandex

Toda lógica crítica é exposta via RPCs `SECURITY DEFINER` com `search_path` fixo.
Chamada padrão: `supabase.rpc('nome', { p_xxx: valor })`.

## Convenções

- Prefixo `p_` em todos os parâmetros.
- Validações no início do `plpgsql`.
- Erros com `ERRCODE` semântico (`42501` forbidden, `check_violation`, `no_data_found`, `unique_violation`).
- Retorno JSONB para respostas ricas; TABLE(...) para listagens.

---

## 🌐 Públicas (anon + authenticated)

### `get_public_restaurant(p_slug text) → jsonb`
Retorna dados públicos do restaurante + `is_open_now` + `mp_online_ready`.
**Erros:** retorna `NULL` se inexistente.
**Chamada:** `src/routes/$slug.tsx` (loader do cardápio).

### `get_public_categories(p_slug text) → SETOF (id, name, position, is_active)`
Categorias ativas ordenadas.

### `get_public_products(p_slug text) → SETOF (...)`
Produtos disponíveis ordenados por `position`.

### `get_public_order(p_id uuid) → jsonb`
Pedido + itens + dados do restaurante para tela de acompanhamento.

### `validate_public_coupon(p_restaurant_id, p_code, p_subtotal, p_customer_id, p_phone) → jsonb`
Valida cupom antes do checkout (dry-run).
**Retornos:** `{ok:true, coupon:{...}}` ou `{ok:false, error:'invalid'|'expired'|'exhausted'|'min_order'|'customer_limit'|'first_purchase_only'|...}`.
**Chamada:** carrinho do cardápio antes de finalizar.

### `create_public_order(...) → jsonb`
**RPC mais crítica do sistema.** Atômica.
Valida:
- Restaurante ativo (`private.restaurant_is_active`)
- Aberto agora (`is_restaurant_open_now`)
- Nome (1–120) e telefone (6–20 dígitos)
- Carrinho não vazio
- Cupom (todas as regras) sob `FOR UPDATE`
- Cliente não bloqueado

Executa:
- Upsert em `customers` por `(restaurant_id, phone)`
- INSERT em `orders` (triggers: numeração, limite de plano, histórico)
- INSERT em `order_items`
- Incrementa `coupons.uses_count` + log em `coupon_uses`

**Retorno:** `{id, order_number, customer_id, discount, total}`
**Erros:** `restaurant_not_found`, `restaurant_closed`, `invalid_customer`, `empty_cart`, `coupon_*`, `plan_limit_reached`.

### `is_restaurant_open_now(p_restaurant_id) → boolean`
Considera `open_mode`, `timezone` e `opening_hours` (por dia, com suporte a overnight).

---

## 🔐 Autenticadas (owner + super_admin)

### `update_order_status(p_order_id, p_new_status, p_source, p_reason) → jsonb`
**Único caminho** para alterar `orders.status`. Trigger bloqueia UPDATE direto.
- Verifica permissão: `is_team_owner` OU `user_roles IN (employee, manager)`.
- Valida transição em `private.is_valid_order_transition(from, to, type)`.
- Insere em `order_status_history`.

### `get_order_history(p_order_id) → SETOF (...)`
Timeline completa do pedido com nome/email do responsável.

### `is_team_owner(_uid, _restaurant_id) → boolean`
Helper (também exposto). Retorna true para owner ou super_admin.
**Bloqueio de spoofing:** rejeita se `_uid != auth.uid()` e caller não é super_admin.

---

## 👥 Gestão de Equipe (owner + super_admin)

### `create_team_invite(p_restaurant_id, p_email, p_role) → jsonb`
Cria convite (token 24 bytes hex, expira em 7 dias).
Valida: email válido, role ∈ {employee, manager}, não é dono, não é membro, sem duplicata pendente, respeita `plan.features.max_users`.
**Erros:** `is_owner`, `already_member`, `duplicate_invite`, `plan_limit_reached`.

### `resend_team_invite(p_invite_id) → jsonb`
Gera novo token + estende 7 dias.

### `cancel_team_invite(p_invite_id) → void`

### `accept_team_invite(p_token) → jsonb`
**Convidado autenticado** aceita. Valida email match. Insere em `user_roles`.
**Erros:** `unauthorized`, `invite_invalid_or_expired`, `email_mismatch`.

### `list_team_members(p_restaurant_id) → SETOF (...)`
Owner + employees + managers com email + nome.

### `remove_team_member(p_restaurant_id, p_user_id) → void`

### `cleanup_expired_invites() → int`
Manutenção; remove convites expirados > 1 dia.

---

## 👤 Clientes (público)

### `upsert_public_customer(p_restaurant_id, p_name, p_phone, p_email, p_source) → uuid`
Auxiliar. Prefira `create_public_order` que já faz upsert.

---

## 📧 Fila de Emails (interno)

- `enqueue_email(queue, payload) → bigint`
- `read_email_batch(queue, size, vt) → SETOF`
- `delete_email(queue, msg_id) → boolean`
- `move_to_dlq(source, dlq, msg_id, payload) → bigint`
- `email_queue_wake()` (trigger) / `email_queue_dispatch()` (cron)

Consumidos por rota `/api/public/email/queue/process` autorizada por bearer do vault.

---

## 🍽️ Mesas & Comandas (Sprint 6)

### `get_table_map(p_restaurant_id) → jsonb`
Mapa de mesas com sessão ativa, totais em aberto, contagem de pedidos, layout
(`position_x/y`, `width`, `height`, `rotation`, `shape`) e `ui_status`
(`free|open|closing|blocked|inactive`). Somente team_owner.

### `create_table / update_table / delete_table / regen_table_qr`
CRUD e regeneração de QR. Só team_owner.

### `update_table_layout(p_restaurant_id, p_updates jsonb) → int` **(Sprint 6.3 Fase D)**
Batch de layout do editor visual. `p_updates` é array
`[{ id, position_x, position_y, width, height, rotation, shape, area }]`.
Só aplica linhas do restaurante informado; erro `forbidden` se não for team_owner.
Retorna quantidade de mesas efetivamente atualizadas.

### `open_table_session / close_table_session`
Abre/fecha sessão. `close_table_session` aceita splits (`amount`, `percent`,
`people`, `items`) e exige justificativa quando total pago ≠ total pedidos.

### `open_command / close_command`
Comandas dentro da sessão. Fechamento é lógico (`closed_at`).

### `merge_commands(p_source_id, p_target_id) → void` **(Sprint 6.3 Fase C)**
Une duas comandas da mesma sessão. Move todos os pedidos da origem para o
destino, fecha a origem (mantendo os dados) e registra `command_merged` na
timeline. Erro se sessões diferentes ou destino já fechado.

### `merge_sessions(p_source_id, p_target_id) → void`
Une duas sessões. Move pedidos e comandas, fecha a origem como merged,
grava evento `merged`.

### `transfer_orders(p_order_ids uuid[], p_target_session_id, p_target_command_id?) → void`
Transferência em lote de pedidos entre sessões/comandas. Evento `transferred`.

### `attach_order_to_session(p_order_id, p_session_id, p_command_id?) → void`
Vincula um pedido criado fora do fluxo QR a uma sessão/comanda.

### `get_session_detail(p_session_id) → jsonb`
Retorna sessão, mesa, comandas, pedidos com itens, splits e eventos —
uma única chamada usada pelo `SessionDetailDialog`.

### `get_public_table_by_qr / get_public_table_session / create_public_table_command / create_public_table_order`
Rotas anônimas para a página `/mesa/:token`. Validação de preços feita no
servidor contra `products`.

---

## 🛵 Delivery Profissional (Sprint 7)

Ver `DELIVERY.md` para o fluxo completo.

### Cadastro & vínculo
- `create_driver / update_driver / link_driver_user / set_driver_status`
- `check_driver_limit(p_restaurant_id)` — enforce `max_drivers` do plano.

### Despacho e operação
- `assign_driver(p_order_id, p_driver_id)` / `unassign_driver(p_order_id, p_reason?)`
- `driver_accept_order(p_order_id)` / `driver_reject_order(p_order_id, p_reason?)`
- `driver_pickup_order(p_order_id)` → transiciona pedido para `out_for_delivery` via `update_order_status` e congela a comissão.
- `driver_complete_delivery(p_order_id)` → transiciona para `delivered`.
- `update_driver_location(lat, lng, ...)` — GPS a cada 30 s pelo app do motoboy.

### Consultas (Fase D)
- `get_delivery_dashboard(p_restaurant_id) → jsonb` — KPIs operacionais.
- `get_driver_assigned_orders() → jsonb` — usada por `/motoboy`.
- `get_delivery_financial_summary(p_restaurant_id, p_from, p_to, p_driver_id?) → jsonb` — totais e ranking por motoboy no período.
- `get_delivery_metrics(p_restaurant_id, p_from, p_to) → jsonb` — SLA (aceite / retirada / rota / total), taxa de aceitação e produtividade.
- `get_driver_last_locations(p_restaurant_id) → jsonb` — última posição por motoboy ativo (mapa).

---





## Chamadas do Frontend (mapa rápido)

| RPC | Componente/Rota |
|---|---|
| `get_public_restaurant` | `src/routes/$slug.tsx` loader |
| `get_public_categories/products` | `src/routes/$slug.tsx` loader |
| `validate_public_coupon` | Carrinho (`Cart.tsx`) |
| `create_public_order` | Checkout (`Checkout.tsx`) |
| `get_public_order` | `src/routes/pedido.$id.tsx` |
| `update_order_status` | `src/routes/admin/orders.tsx` (dialog) |
| `get_order_history` | Timeline no dialog do pedido |
| `create_team_invite` | `src/routes/admin/team.tsx` |
| `accept_team_invite` | `src/routes/invite.$token.tsx` |
| `list_team_members` | `src/routes/admin/team.tsx` |
| `is_restaurant_open_now` | Badge no cardápio + checkout |
