## O que vai ser criado

Um sistema de caixa por loja, acessível em **/admin/caixa**, com:

1. **Abertura de caixa** — informar valor inicial (troco), fica como sessão "aberta".
2. **Movimentações manuais** durante o turno:
   - **Sangria** (retirada de dinheiro)
   - **Reforço** (entrada de troco)
   - **Despesa** (saída para gastos)
   - Cada uma com motivo/descrição.
3. **Vendas em dinheiro entradas automaticamente** — pedidos da loja pagos em "Dinheiro" (PDV ou delivery) criados/atualizados enquanto a sessão estiver aberta entram como entrada automática.
4. **Fechamento de caixa** — operador digita o valor contado em espécie. Sistema mostra:
   - Valor inicial
   - + Entradas em dinheiro (vendas + reforços)
   - – Saídas (sangrias + despesas)
   - = **Valor esperado**
   - Valor contado pelo operador
   - **Diferença** (sobra/falta)
   - Campo de observações.
5. **Relatório / Histórico** — lista de sessões fechadas com data, operador, totais, diferença e botão para ver detalhes (todas as movimentações + pedidos vinculados).

## Mudanças no banco

Duas tabelas novas:

- **`cash_sessions`** — `restaurant_id`, `opened_by`, `opened_at`, `opening_amount`, `closed_by`, `closed_at`, `closing_amount`, `expected_amount`, `difference`, `status` (`open`/`closed`), `notes`.
- **`cash_movements`** — `session_id`, `restaurant_id`, `type` (`sale`/`reinforcement`/`withdrawal`/`expense`), `amount`, `description`, `order_id` (opcional, para vendas), `created_by`, `created_at`.

Restrições:
- Apenas **uma sessão aberta por loja por vez** (índice único parcial em `status='open'`).
- RLS: time da loja (já existe `private.has_restaurant_access`) faz CRUD; super-admin vê tudo.
- Trigger que vincula pedidos pagos em dinheiro à sessão aberta automaticamente (quando `payment='cash'` e `status` muda para confirmado/entregue), inserindo um `cash_movement` tipo `sale`.

## Mudanças no app

- Nova rota **`src/routes/_authenticated/admin.caixa.tsx`** com três modos:
  - Sem sessão aberta → tela de **Abertura**.
  - Sessão aberta → painel com resumo em tempo real (entradas, saídas, esperado), botões de Sangria/Reforço/Despesa e botão **Fechar caixa**.
  - Aba **Histórico** com sessões fechadas e detalhamento.
- Item "Caixa" no menu lateral do admin (entre PDV e Pedidos).
- Exportar CSV do histórico (reuso de `src/lib/export-csv.ts`).

## Detalhes técnicos

- Atualização em realtime via canal `cash-session-{id}` em `cash_movements` para mostrar vendas em dinheiro aparecendo no caixa sem refresh.
- Valores em `numeric(10,2)` como o resto do schema.
- Diferença salva em `cash_sessions` para o relatório.
- Sem dependências novas.

Posso aplicar?