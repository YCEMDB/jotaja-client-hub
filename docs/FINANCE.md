# Financeiro (Sprint 9)

Camada gerencial sobre caixa/pedidos. Não substitui `cash_sessions`/`cash_movements`.

## Feature gates
- **Starter**: sem financeiro.
- **Pro** (`finance_basic`): contas a pagar/receber, categorias, fluxo de caixa, fechamento.
- **Business** (`finance_advanced`, `finance_dre`, `finance_reconcile`): centros de custo, DRE, conciliação PIX/cartão, relatórios avançados.

## Tabelas (Fase A)
- `finance_categories` — categorias de receita/despesa por restaurante (`direction`: payable/receivable).
- `finance_cost_centers` — centros de custo (Business).
- `finance_entries` — contas a pagar/receber. Status: `pending | partial | paid | overdue | cancelled` (mantido por trigger).

Todas RLS via `private.has_restaurant_access`.

## RPCs
- `finance_entry_pay(entry_id, amount, method?, cash_session_id?, notes?)` — soma `amount_paid`; se `cash_session_id` + método `cash`, cria `cash_movements` (`supply` para receivable, `withdrawal` para payable). Nunca duplica movimentações operacionais de venda.
- `finance_entry_cancel(entry_id)` — cancela lançamento preservando histórico.
- `get_finance_dashboard(restaurant_id, from?, to?)` — KPIs: em aberto, vencidos, pagos/recebidos no período, vencimentos do dia.

## Integração com Caixa
O caixa continua sendo a fonte operacional de vendas. O financeiro só grava em `cash_movements` quando o usuário registra manualmente um pagamento em dinheiro vinculado a uma sessão aberta. Vendas de pedidos continuam via `cash_movements_unique_order_sale` (não duplicadas).

## Próximas fases
- **B**: UI de contas a pagar/receber + categorias.
- **C**: fluxo de caixa consolidado + DRE.
- **D**: conciliação PIX/cartão + relatórios + exportação CSV.
