# Módulo Mesas & Comandas

Sprint 6 — módulo completo de salão. Reutiliza toda a arquitetura existente
(pedidos, KDS, caixa, comunicação, CRM, timeline). Zero pedidos paralelos,
zero segunda state machine.

## Modelo

```text
restaurant_tables         mesa física (número, QR, capacidade, área, position_x/y,
                          width, height, rotation, shape — usados pelo editor visual)
   ↓ 1..N
table_sessions            "abriu a mesa" — período aberto (status: open/closing/closed/cancelled/blocked)
   ↓ 1..N
table_commands            subdivisão da sessão (comanda 1, João, Casal)
   ↓ 1..N
orders                    pedido oficial já existente — ganha 3 colunas opcionais:
                          table_session_id, table_command_id, table_number

table_session_events      linha do tempo / auditoria da sessão
table_split_payments      pagamentos particionados no fechamento
```

Uma mesa só pode ter **uma** sessão em `open`/`closing` por vez
(índice único parcial `table_sessions_one_open_per_table`).

## Status da sessão

| status      | significado                                              |
|-------------|----------------------------------------------------------|
| `open`      | Mesa em uso, aceitando pedidos.                          |
| `closing`   | Cliente pediu conta, ainda pode receber ajuste.          |
| `closed`    | Fechada, alimentou o caixa, comunicação disparada.       |
| `cancelled` | Sessão desfeita (não gerou consumo).                     |
| `blocked`   | Mesa bloqueada (manutenção, reserva bloqueante).         |

## Feature Gate

`app_plans.features.tables_max`:

| Plano    | Mesas    |
|----------|----------|
| starter  | 0        |
| pro      | 30       |
| business | ∞ (null) |

Enforcement em `trigger enforce_tables_max` no INSERT de `restaurant_tables`.
**Nunca** validado apenas no frontend.

## RPCs

Todas `SECURITY DEFINER`, `search_path=public`, autenticadas via
`is_team_owner` / `_tables_can_manage` (owner + manager + employee).

### Cadastro (só owner)

- `create_table(restaurant_id, number, name?, area?, capacity, notes?)`
- `update_table(table_id, patch jsonb)`
- `delete_table(table_id)` — bloqueia se houver sessão aberta.
- `regen_table_qr(table_id)` → novo `qr_token`.

### Sessão

- `open_table_session(table_id, party_size?, customer_name?, notes?)`
- `close_table_session(session_id, splits jsonb, force boolean=false)`
  - `splits`: `[{ method: 'cash'|'pix'|'credit'|'debit'|'other', amount, payer_label? }]`
  - Retorna `{ total, paid, balance, forced }`.
  - **Só permite fechar** se todos pedidos estão `delivered`/`cancelled`.
    `force=true` requer papel de dono.
  - Alimenta caixa aberto (`cash_movements.kind='sale'`) automaticamente.
  - Dispara `enqueue_communication('table_closed', ...)`.
- `cancel_table_session(session_id, reason?)`
- `block_table(table_id, reason?)` / `unblock_table(table_id)`

### Comandas

- `open_command(session_id, label, holder_name?)`
- `close_command(command_id)`
- `merge_commands(source_command_id, target_command_id)` — **Sprint 6.3 Fase C**.
  Une duas comandas da mesma sessão; move pedidos, fecha a origem (mantém dados)
  e registra evento `command_merged`.

### Movimentação

- `attach_order_to_session(order_id, session_id, command_id?)`
  → vincula pedido existente à mesa (usado pelo PDV e checkout público).
- `transfer_orders(order_ids[], target_session_id, target_command_id?)`
- `merge_sessions(source_session_id, target_session_id)`

### Layout (editor visual) — **Sprint 6.3 Fase D**

- `update_table_layout(restaurant_id, updates jsonb)` — batch de posição,
  tamanho (`width`/`height`), `rotation`, `shape` (`rect|circle`) e `area`.
  Aplica só linhas do restaurante e retorna o total atualizado.

### Leitura

- `get_table_map(restaurant_id)` → JSON com mesas + status agregado + total aberto.
- `get_session_detail(session_id)` → sessão + mesa + comandas + pedidos + splits + eventos + totais.
- `get_public_table_by_qr(token)` → **anon-executável**, retorna só dados públicos
  (nome do restaurante, número da mesa, sessão aberta se houver).

## Integração com o restante do sistema

| Sistema        | Como é reutilizado                                                        |
|----------------|---------------------------------------------------------------------------|
| **KDS**        | Lê `orders` normalmente; mostra `table_number` no card.                   |
| **Caixa**      | `close_table_session` insere em `cash_movements` no caixa aberto.         |
| **Timeline**   | `order_status_history` (pedido) + `table_session_events` (sessão).        |
| **Comunicação**| Evento `table_closed` via `enqueue_communication`.                        |
| **CRM**        | `orders.customer_id` inalterado; `sync_customer_stats` continua rodando.  |
| **Feature Gates** | `tables_max` em `app_plans.features`, enforced em trigger.             |
| **Realtime**   | Publicação ativada em `restaurant_tables`, `table_sessions`, `table_commands`, `table_session_events`. |

## RLS

- Leitura/escrita: owner + manager + employee do restaurante.
- `restaurant_tables` tem `GRANT SELECT` para `anon` só como defesa em profundidade
  (o QR público é lido via `get_public_table_by_qr`, `SECURITY DEFINER`).
- `table_session_events` e `table_split_payments`: leitura da equipe, insert
  controlado pelos RPCs / triggers.

## Fora de escopo (v1)

- Reservas com data/hora.
- Impressão de QR em lote com layout personalizado.
- Split "por item" arrastando na UI (só split por valor/percentual/pessoa em v1).
- KDS com visualização "por mesa" (KDS atual já mostra `table_number`).
