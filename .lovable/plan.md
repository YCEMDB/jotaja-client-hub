## Numeração de pedidos por restaurante

Hoje os pedidos usam uma sequência global (`orders_order_number_seq`), por isso o pedido #1 do restaurante X faz o do restaurante Y virar #2. Cada loja precisa ter sua própria contagem começando em #1.

### Mudanças no banco (migration)

1. **Nova coluna de contador por loja** em `restaurants`:
   - `order_number_seq INTEGER NOT NULL DEFAULT 0` — guarda o último número emitido para aquele restaurante.

2. **Trigger `BEFORE INSERT` em `orders`** (`set_order_number_per_restaurant`):
   - Faz `UPDATE restaurants SET order_number_seq = order_number_seq + 1 WHERE id = NEW.restaurant_id RETURNING order_number_seq` (com lock de linha, garante atomicidade e evita duplicatas em concorrência).
   - Atribui o valor retornado a `NEW.order_number`.
   - Roda *antes* da trigger de limite de plano já existente.

3. **Remover dependência da sequência global**:
   - Trocar o default de `orders.order_number` para `0` (ou remover) — a trigger passa a ser a fonte da verdade.
   - Manter `orders_order_number_seq` por compatibilidade, mas sem uso.

4. **Backfill dos pedidos existentes** (apenas dados do mostruário/demo, ainda poucos):
   - Para cada `restaurant_id`, renumerar `order_number` por `created_at ASC` começando em 1.
   - Atualizar `restaurants.order_number_seq` com o maior número de cada loja.

### Sem mudanças no frontend

A coluna `order_number` continua sendo lida do mesmo jeito em PDV, painel admin, página de tracking e e-mails. Nenhum componente React precisa ser tocado.

### Resultado

- Restaurante X: #1, #2, #3…
- Restaurante Y: #1, #2, #3… (independente)
- Atômico e seguro sob concorrência (lock de linha via `UPDATE … RETURNING`).
- Backfill deixa o demo "Sabor da Casa" com numeração limpa.

Posso aplicar?
