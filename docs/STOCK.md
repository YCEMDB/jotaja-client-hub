# Estoque Inteligente — Comandex

Módulo de controle de estoque integrado a produtos, pedidos, KDS e caixa.

## Escopo (Fase B — Interface)

Rota: `/admin/estoque` (gate `stock`, plano Pro/Business).

Abas:
- **Dashboard** — valor em estoque, ativos, abaixo do mínimo, movimentações do dia, perdas 30d.
- **Ingredientes** — CRUD, busca, filtro (todos/ativos/inativos/estoque baixo), ordenação (nome/quantidade/custo/valor), badge de estoque baixo, inativação (soft-delete).
- **Fornecedores** — CRUD completo (nome, contato, telefone, e-mail, observações, ativo).
- **Unidades** — CRUD (nome + símbolo).
- **Movimentações** — timeline (entrada, saída, perda, ajuste) com filtros e histórico.
- **Alertas** — lista de ingredientes abaixo do mínimo com botão "Registrar Entrada".

## RPCs consumidas (Fase A)

- `get_stock_overview(p_restaurant_id)` — KPIs do dashboard.
- `upsert_stock_unit`, `upsert_stock_supplier`.
- `create_stock_ingredient`, `update_stock_ingredient`.
- `register_stock_movement(ingredient_id, type, quantity, unit_cost?, supplier_id?, reason?)` — única porta para movimentar estoque. Aceita `entry | exit | loss | adjust`. Vendas (`sale`) e estornos (`reversal`) só via trigger interno.
- `check_ingredient_limit` — enforce automático por plano (Pro=100, Business=∞).

Nunca há `UPDATE` direto em `stock_ingredients.current_qty`.

## Realtime

Canal `stock-{restaurant_id}` assina `stock_ingredients` e `stock_movements`. Dashboard, listagens e alertas se atualizam sem refresh manual.

## Feature Gates

- **Starter** — bloqueado (tela de upgrade).
- **Pro** — até 100 ingredientes ativos, sem ficha técnica.
- **Business** — ilimitado + ficha técnica (Fase C).

## Design System

Somente componentes de `@/components/ds`:
`AdminPageLayout`, `DashboardGrid`, `Section` + `SectionHeader/Content`,
`StatCard`, `LoadingState`, `ErrorState`, `FilterBar`, `SearchBar`, `EmptyState`.
Nenhuma cor hex inline.

## Fora do escopo desta fase

- Ficha técnica por produto (Fase C).
- Baixa automática ao vender (Fase C).
- Custo por produto / margem de lucro (Fase C).
- Relatórios avançados e exportação (Fase D).
