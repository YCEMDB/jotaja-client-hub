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

## UI (Fase B)
Rota `/admin/financeiro` (gate `finance_basic`, Pro+):
- **Visão geral**: KPIs do `get_finance_dashboard` + lista de próximos vencimentos.
- **Contas a pagar** e **Contas a receber**: tabela com filtros (busca, status, período no header), criar/editar (`EntryDialog`), registrar pagamento/recebimento (`PayEntryDialog`) e cancelar. `PayEntryDialog` detecta caixa aberto e lança automaticamente `cash_movements` quando o método é dinheiro.
- **Categorias**: CRUD com separação `payable`/`receivable` e ativar/desativar.
- **Centros de custo** (gate `finance_advanced`, Business): CRUD com ativar/desativar. Pro vê upgrade card.
- Realtime em `finance_entries` mantém a interface sincronizada.

## Fase C — Fluxo de caixa + DRE

### RPCs
- `get_finance_cashflow(restaurant_id, from?, to?)` — série diária de entradas/saídas consolidando `finance_entries` pagos e `cash_movements`. Evita dupla contagem: paga em dinheiro + sessão de caixa já vira `cash_movements`, então essas linhas de `finance_entries` são ignoradas na soma consolidada. Retorna `series[]`, `totals` (`total_inflow`, `total_outflow`, `net`, `final_balance`) e `cash_operational` (vendas, reforços, sangrias, despesas do caixa).
- `get_finance_dre(restaurant_id, from?, to?, cost_center_id?)` — DRE simplificada: `revenue.total`, `expense.total`, agrupamento `by_category` e `by_cost_center`, `operating_profit` e `margin` (%). Filtro opcional por centro de custo.

### UI (aba Fluxo de caixa)
- KPIs: entradas, saídas, resultado líquido, saldo final acumulado (com Δ vs período anterior).
- Gráfico de barras receitas × despesas por dia.
- Área de saldo acumulado.
- KPIs do caixa operacional (vendas / reforços / sangrias / despesas).
- Comparativo com o período anterior (mesmo tamanho de janela).

### UI (aba DRE — gate `finance_dre`, Business)
- Filtro por centro de custo (quando `finance_advanced` liberado).
- KPIs: receitas, despesas, lucro operacional, margem %.
- Barras receitas × despesas × lucro.
- Pizzas de receitas e despesas por categoria.
- Tabela receitas / despesas / resultado por centro de custo.

### Regras de não-duplicação
- `cash_movements` continua sendo fonte operacional do caixa.
- `finance_entries` continua sendo fonte gerencial.
- Vendas de pedidos só aparecem no fluxo via `cash_movements(sale)`.
- Pagamentos em dinheiro vinculados a caixa (`finance_entry_pay` com sessão) geram `cash_movements` — a linha correspondente em `finance_entries` é filtrada da soma consolidada para não contar duas vezes.

## Próximas fases
- **D**: conciliação PIX/cartão + relatórios + exportação CSV.


