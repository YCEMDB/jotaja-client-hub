# RPCs — Comandex

Toda operação de escrita crítica é exposta via RPCs `SECURITY DEFINER` com
`search_path` fixo e autorização centralizada em
`private.authorize_tenant_action(restaurant_id, min_support_level)`.

Chamada padrão do cliente: `supabase.rpc('nome', { p_xxx: valor })`.

## Convenções

- Prefixo `p_` em todos os parâmetros.
- Validações começam pela autorização antes de qualquer retorno informativo.
- Erros com `ERRCODE` semântico (`42501` forbidden, `check_violation`,
  `no_data_found`, `unique_violation`, `22023` invalid input, `40001`
  serialization / corrida).
- Retorno JSONB para respostas ricas; `TABLE(...)` para listagens.
- Todas as RPCs de tenant chamam `private.authorize_tenant_action(...)` e
  seguem a matriz de níveis de suporte (`view_only` / `operational` /
  `administrative`).

---

## Consolidado — Pedidos e Caixa (Ondas 2.a.1 e 2.a.2)

| # | Nome                        | Módulo   | Parâmetros                                              | Mutável | Permissões nativas         | Nível mínimo suporte | Motivo obrigatório         | Auditoria                                        | Entidade afetada     | Concorrência                                | Idempotência                 | Chamadores                                             | Situação |
|---|-----------------------------|----------|---------------------------------------------------------|---------|----------------------------|----------------------|----------------------------|--------------------------------------------------|----------------------|---------------------------------------------|------------------------------|--------------------------------------------------------|----------|
| 1 | `update_order_status`       | Pedidos  | `p_order_id`, `p_new_status`, `p_source`, `p_reason`    | Sim     | owner / manager / employee | operational          | Só ao cancelar via suporte | `order.status_change` (quando suporte)           | `orders`             | `SELECT ... FOR UPDATE`                     | No-op se status já é o alvo  | Painel, KDS, Mesas, Delivery, POS                       | Ativa    |
| 2 | `assign_driver`             | Pedidos  | `p_order_id`, `p_driver_id`                              | Sim     | owner (nativo)             | operational          | Não                        | `order.driver_assigned` (quando suporte)         | `orders`             | Update com validação de tenant do driver     | Substitui driver anterior     | Delivery                                                | Ativa    |
| 3 | `unassign_driver`           | Pedidos  | `p_order_id`, `p_reason`                                 | Sim     | owner (nativo)             | operational          | Sim, em suporte             | `order.driver_unassigned` (quando suporte)       | `orders`             | Update simples                              | No-op silencioso sem driver   | Delivery                                                | Ativa    |
| 4 | `cash_session_open`         | Caixa    | `p_restaurant_id`, `p_opening_amount`, `p_reason`        | Sim     | owner / manager / employee | administrative       | Sim, em suporte             | `cash_session.open` (quando suporte)             | `cash_sessions`      | Índice único parcial + captura de `23505`    | Rejeita se já há caixa aberto | `admin.caixa.tsx`                                       | Ativa    |
| 5 | `cash_session_close`        | Caixa    | `p_session_id`, `p_closing_amount`, `p_notes`, `p_reason`| Sim     | owner / manager / employee | administrative       | Sim, em suporte             | `cash_session.close` (quando suporte)            | `cash_sessions`      | `FOR UPDATE` + guard `status='open'` + `40001`| Não reabre caixa fechado      | `admin.caixa.tsx`                                       | Ativa    |
| 6 | `cash_session_add_movement` | Caixa    | `p_session_id`, `p_type`, `p_amount`, `p_description`, `p_reason` | Sim | owner / manager / employee | administrative       | Sim, em suporte             | `cash_movement.create` (quando suporte)          | `cash_movements`     | `FOR UPDATE` na sessão                       | Não; cada chamada cria linha | `admin.caixa.tsx`                                       | Ativa    |
| 7 | `finance_entry_pay`         | Financeiro | `p_entry_id`, `p_amount`, `p_payment_method`, `p_cash_session_id`, `p_notes` | Sim | owner / manager / employee | — (bloqueada em suporte pela UI) | Não hoje                    | Sem auditoria de suporte                          | `finance_entries`    | `FOR UPDATE`                                | Verifica saldo restante       | `PayEntryDialog.tsx`                                    | Ativa (pendente cobertura de suporte) |
| 8 | `finance_entry_cancel`      | Financeiro | `p_entry_id`                                             | Sim     | owner / manager / employee | — (bloqueada em suporte pela UI) | Não hoje                    | Sem auditoria de suporte                          | `finance_entries`    | `FOR UPDATE`                                | Idempotente para lançamentos já cancelados | `admin.financeiro.tsx`                     | Ativa (pendente cobertura de suporte) |

### Helpers privados

- `private.authorize_tenant_action(restaurant_id, min_level)` — retorna
  `{ actor_id, is_native, support_level, support_session_id }`. Rejeita com
  `forbidden` (42501) quando o ator nativo não pertence ao tenant e o super
  admin não tem sessão de suporte ativa; rejeita com `support_access_denied`
  quando a sessão de suporte não atinge o nível pedido.
- `private.record_audit(...)` — insere em `audit_logs`. Falha aborta a
  transação (garante rollback conjunto com a mutação).
- `private.validate_money(amount, allow_zero)` — normaliza para 2 casas,
  rejeita `NULL`, `NaN`, negativos, zero (quando não permitido) e valores
  acima de R$ 1.000.000,00.

### Fórmula de saldo esperado (Caixa)

```
esperado = round(
  opening_amount
  + Σ movimentos.type = 'sale'
  + Σ movimentos.type = 'reinforcement'
  − Σ movimentos.type = 'withdrawal'
  − Σ movimentos.type = 'expense'
, 2)

diferença = round(closing_amount − esperado, 2)
```

Regras vigentes:

- Vendas são somadas apenas quando o trigger operacional de pedido gerou
  `cash_movements.type = 'sale'` na sessão aberta.
- Movimentos de sessões anteriores nunca entram (filtro por `session_id`).
- Pedidos cancelados **após** a inserção da movimentação de venda não
  revertem o movimento (divergência conhecida — ver Pendências).
- Pagamentos em dinheiro do Financeiro que criam movimentação são somados
  pela `payEntry` como `reinforcement` (ainda via `finance_entry_pay`).

## Autenticação e níveis de suporte

| Nível             | Leitura direta | Escrita direta (RLS) | Escrita via RPC operacional | Escrita via RPC administrativa |
|-------------------|:--------------:|:--------------------:|:---------------------------:|:------------------------------:|
| `view_only`       | Sim            | Não                  | Não                         | Não                            |
| `operational`     | Sim            | Não                  | Sim (com motivo)            | Não                            |
| `administrative`  | Sim            | Não                  | Sim (com motivo)            | Sim (com motivo)               |

Nativos (owner/manager/employee/driver) não passam pelo gate de suporte.

## Operações ainda com DML direto

- `finance_entries` (criação, edição, cancelamento) — via `upsertEntry` /
  `finance_entry_cancel`. Suporte bloqueado na UI.
- `restaurant_tables`, `products`, `categories`, `customers` — RLS nativa;
  suporte assistido só tem SELECT.
- `restaurants` (edição de dados administrativos), `app_plans`,
  `restaurant_payments`, `global_announcements`, `delivery_neighborhoods`
  globais, `signup_leads` — ainda dependem de RPCs administrativas
  dedicadas (Onda 2.c pendente).

## Operações bloqueadas durante suporte

- Todas as operações de escrita em `finance_entries` (bloqueadas na UI).
- Escrita em `restaurants.metadata` e planos (bloqueadas por RLS).
- Cancelamento de movimento de caixa, reabertura e ajuste manual de saldo
  (não existem no schema).

## Pendências / roadmap

- **Cancelamento de venda depois do movimento de caixa** — hoje não
  reverte automaticamente `cash_movements.type = 'sale'`. Ajustar no
  Turno 5.
- **RPC financeira sensível a suporte** — `finance_entry_pay` /
  `finance_entry_cancel` precisam de gate `authorize_tenant_action` com
  motivo obrigatório e auditoria (planejado para Onda 2.b).
- **RPCs administrativas para `/super`** — permanecem bloqueadas desde a
  Onda 2.a.0 (planos, avisos, leads, pagamentos manuais, edição de
  restaurante, bairros globais).
- **Cancelar movimento / reabrir caixa / ajustar saldo** — dependem de
  novo campo `cash_movements.cancelled_at` e `cash_sessions.reopened_at`.

## Chamadores atualizados

- `src/routes/_authenticated/admin.caixa.tsx` — usa exclusivamente as RPCs
  `cash_session_open`, `cash_session_close`, `cash_session_add_movement`.
  Detecta contexto de suporte via `useSupportContext`, oculta / desabilita
  botões de escrita para `view_only` e `operational`, exige motivo em
  `administrative`.
- `src/components/finance/EntryDialog.tsx` e
  `src/components/finance/PayEntryDialog.tsx` — desabilitam salvamento
  quando `support.active === true`, com aviso ao usuário.

## Bloqueios de release

### Onda 2.a
- Bateria E2E com JWT real ainda pendente de execução automatizada — roteiro
  publicado em `docs/E2E_CAIXA_PEDIDOS.md`.
- Migration da 2.a.2 e ajustes finais só podem ir a produção após a bateria
  E2E acima.

### Release geral
- Telas do `/super` sem RPCs administrativas (planos, avisos, configurações
  globais, leads, alterações de restaurante, pagamentos manuais, bairros
  globais) — bloqueio herdado da Onda 2.a.0.
