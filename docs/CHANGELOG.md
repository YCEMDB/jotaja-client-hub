# Changelog — Comandex

Registro cronológico de entregas.

## Sprint 0 — Fundação
- Rebranding completo `ComandaHub → Comandex` (66 arquivos).
- Favicon profissional "C" monograma em todos os formatos.
- Consolidação de planos em `app_plans` (starter/pro/business).
- Correção de HTML inválido em landing pages.
- Limpeza de copy de marketing conflitante.
- Padronização visual: gradiente Sunset Blaze, `shadow-brutal`, Archivo Black + Hind.

## Sprint 1.1 — G2 Multiusuário
- Novo role `manager` no enum `app_role`.
- Tabela `restaurant_invites` (token, expiração 7 dias, role).
- RPCs: `create_team_invite`, `resend_team_invite`, `cancel_team_invite`, `accept_team_invite`, `list_team_members`, `remove_team_member`.
- Enforço de `max_users` por plano na RPC.
- UI `/admin/team`.

## Sprint 1.2 — G12 Horário Automático
- `restaurants.timezone` (default `America/Sao_Paulo`).
- `restaurants.open_mode`: `auto` | `force_open` | `force_closed`.
- `opening_hours` JSONB por dia (`open`, `close`, `closed`), suporte overnight.
- RPC `is_restaurant_open_now`.
- Bloqueio DB-level de pedidos fora do horário via `create_public_order`.
- UI editor de horários em `/admin/settings`.

## Sprint 1.3 — G13 Cupons Avançados
- Colunas em `coupons`: `starts_at`, `expires_at`, `max_uses`, `max_uses_per_customer`, `min_order`, `first_purchase_only`.
- Tabela `coupon_uses` (log por cliente/pedido).
- RPC `validate_public_coupon` (dry-run pré-checkout).
- Validação atômica dentro de `create_public_order` sob `FOR UPDATE`.
- Feature `advanced_coupons` restrita a `pro`/`business`.

## Sprint 2.1 — Segurança e Performance
- `is_team_owner` hardened contra spoofing (`_uid ≠ auth.uid()` rejeitado).
- Índices em `orders(restaurant_id, created_at DESC)`, `orders(customer_id)`.
- Índice único parcial em `restaurant_invites` para pendentes.
- Auditoria de policies — remoção de `USING (true)` residuais.

## Sprint 2.2.a — Owner como Fonte Única
- Removida duplicação de owner em tabelas auxiliares.
- Trigger `sync_owner_role` mantém `user_roles` alinhado com `restaurants.owner_id`.

## Sprint 2.2.b — Horários Unificados
- Deprecada coluna `is_open` (removida).
- Todos os caminhos de leitura passam por `is_restaurant_open_now`.

## Sprint 2.2.c — Clientes e Cupons
- Trigger `sync_customer_stats` (INSERT/UPDATE/DELETE em `orders`).
- `customers.is_blocked` + enforço em `create_public_order`.
- `coupon_uses.customer_id` obrigatório para limites por cliente.

## Sprint 2.2.d — Convites Robustos
- Token 24 bytes hex.
- Cleanup automático de expirados (`cleanup_expired_invites`).
- Validação de email match + roles restritos.
- Índice único parcial impede duplicatas pendentes.

## Sprint 2.2.e — Máquina de Estados de Pedidos
- Helper `private.is_valid_order_transition(from, to, type)`.
- Trigger `enforce_order_status_transition` bloqueia UPDATE direto.
- RPC `update_order_status` como único caminho.
- Tabela `order_status_history` (imutável).

## Sprint 2.2.f — Timeline + Eventos Internos
- Trigger `trg_order_status_history_notify` publica `pg_notify('order_status_changes', ...)`.
- RPC `get_order_history` com nome/email do responsável.
- UI: timeline profissional no dialog de detalhes do pedido.

## Sprint 2.2.g — Auditoria Final e Limpeza
- Removidas colunas deprecadas: `restaurants.is_open`, `restaurants.plan`.
- Removida RPC duplicada `upsert_public_customer` (mantida como auxiliar admin apenas).
- Verificação de fontes únicas de verdade em todos os domínios.

## Sprint Certificação — Pré-Sprint 3
- Auditoria completa: fluxos, regressões, consistência, performance, segurança.
- Zero regressões detectadas.
- 100% RLS coverage confirmado.
- Documentação técnica oficial criada (`/docs`) — este pacote.

---

## Próximas Entregas
Ver [ROADMAP.md](./ROADMAP.md).
