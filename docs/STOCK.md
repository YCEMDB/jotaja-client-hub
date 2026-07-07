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

## Fase C — Ficha Técnica & Baixa Automática

### Ficha técnica
- Nova aba **Ficha Técnica** em `/admin/estoque`, protegida por `FeatureGate` `stock_recipes` (Business).
- `RecipeDialog` edita a ficha de um produto: seleciona ingredientes, quantidade por unidade produzida, mostra custo total e margem ao vivo. Salva via `set_product_recipe(product_id, items[])` (mesma RPC da Fase A).
- Listagem consome `list_products_recipe_status(restaurant_id)`: `product_id`, `product_name`, `price`, `promo_price`, `has_recipe`, `item_count`, `total_cost`, `margin_value`, `margin_percent`. Custo é `Σ quantity × avg_cost`. Margem sobre `COALESCE(promo_price, price)`.
- `get_product_recipe(product_id)` retorna itens da ficha com custo já calculado por linha.

### Baixa automática
- Trigger `orders_auto_stock_debit` em `orders AFTER INSERT OR UPDATE OF status`.
- Só age quando o plano do restaurante tem `stock_recipes = true` (Business).
- Quando `NEW.status = restaurants.stock_auto_debit_status` (default `preparing`) e o status mudou, chama `_apply_stock_sale(order_id, false)` → insere um `stock_movements.movement_type='sale'` por ingrediente e desconta `current_qty`.
- Quando `NEW.status = 'cancelled'` e `stock_reverse_on_cancel = true`, chama `_apply_stock_sale(order_id, true)` → insere `reversal` e recompõe `current_qty`.
- Guard-rails de idempotência:
  - Nunca insere `sale` se já existe `sale` para esse `order_id` (protege oscilação de status).
  - Só insere `reversal` se existe `sale` prévio e nenhum `reversal` prévio.
- Custo unitário do movimento vem do `avg_cost` atual do ingrediente; `total_cost = quantity × avg_cost`.
- Estoque pode ficar negativo — não bloqueamos a venda, apenas emitimos `NOTICE stock_negative`.
- Zero UPDATE direto: toda mutação de `current_qty` passa por `register_stock_movement` (Fase A) ou `_apply_stock_sale` (Fase C).
- Nenhum novo status de pedido; nenhuma alteração na state machine; a trigger apenas observa.

### RPCs adicionadas (Fase C)
- `public.get_product_recipe(uuid) → jsonb` — team_owner.
- `public.list_products_recipe_status(uuid) → jsonb` — team_owner.
- `public._apply_stock_sale(uuid, boolean)` — interno, sem GRANT público.

### Testes executados
1. `set_product_recipe` cria linhas → OK.
2. Baixa quando pedido atinge status configurado → OK (movimento `sale`, `qty_before/after` corretos).
3. Segunda chamada não duplica → OK (dedup).
4. Cancelamento gera `reversal` e reverte `current_qty` → OK.
5. Segundo cancelamento não duplica → OK.
6. Produto sem ficha → nenhum movimento criado (loop vazio).
7. Feature Gate: Pro/Starter — trigger sai cedo, aba mostra card de upgrade.

## Fase D — Relatórios, Alertas e Inventário

Nova barra de abas em `/admin/estoque`: **Relatórios**, **Compras**, **Inventário**, além das anteriores.

### Relatórios (aba "Relatórios")
Filtro `De`/`Até` (padrão últimos 30 dias). Três sub-abas:

1. **Consumo** — RPC `get_stock_consumption_report(restaurant_id, from, to)`.
   Colunas: entradas, vendas, saídas, perdas, ajustes, custo de saída. Exporta CSV.
2. **Perdas** — RPC `get_stock_losses_report`. Retorna `{ total_value, total_events, by_ingredient[], events[] }`. Exporta CSV.
3. **Lucratividade** (Business) — RPC `get_products_profitability_report`. Ranking por margem total, considerando `product_recipes` e `stock_ingredients.avg_cost`. Exporta CSV.

### Compras (aba "Compras", Business)
- RPC `get_purchase_suggestions(restaurant_id)` retorna grupos por fornecedor com itens abaixo do mínimo.
- Sugestão de quantidade = `GREATEST(min_qty − current_qty, 0) × 1.2`.
- Custo estimado por linha = sugerido × `avg_cost`.
- CSV por fornecedor pronto para colar em pedido/WhatsApp.

### Inventário (aba "Inventário")
- Lista de ingredientes ativos com sistema + custo médio + valor.
- `InventoryDialog` chama `apply_inventory_adjustment(ingredient_id, physical_qty, reason?)`.
- Diferença vira uma movimentação `adjust` via `register_stock_movement`; `current_qty` passa a ser o valor contado. Zero UPDATE direto.

### Alerta automático de estoque baixo
- Trigger `stock_ingredients_low_alert` em `stock_ingredients AFTER INSERT OR UPDATE OF current_qty, min_qty, is_active`.
- Dispara apenas na transição: linha ativa, `min_qty > 0`, `current_qty <= min_qty` e (INSERT ou linha estava acima do mínimo/inativa).
- Enfileira em `communication_queue`:
  - `channel='email'`, `template_code='stock_low_alert'`, `event_name='stock.low'`.
  - `settings_id` = configuração `email` ativa do restaurante (se houver).
  - `variables`: ingrediente, quantidade atual, mínimo, unidade, restaurante.
  - `idempotency_key = 'stock-low-<ingredient_id>-YYYY-MM-DD'` → no máximo 1 alerta por dia por ingrediente.
- Falhas no alerta nunca bloqueiam a atualização de estoque (`RAISE NOTICE`).

### Feature Gates
- Starter: sem estoque.
- Pro: estoque básico + relatórios (consumo, perdas) + inventário + exportação.
- Business: adiciona ficha técnica, lucratividade, sugestão de compra e alertas com margem.
