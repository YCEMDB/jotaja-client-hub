# Comandas

Uma **comanda** é uma subdivisão de uma sessão de mesa aberta. Serve para:

- Dividir consumo de um grupo (Comanda 1 / Comanda 2 / Casal).
- Atribuir pedidos ao nome de cada pessoa (João, Maria, Convidado).
- Isolar consumo do cliente que vai embora antes.

## Modelo

```text
table_sessions (1) ────< (N) table_commands
                              ↓ 0..N
                              orders  (via orders.table_command_id)
```

- Uma sessão pode ter **N comandas**.
- Cada pedido pertence a **uma** comanda (opcional) e a **uma** sessão (obrigatório
  quando é pedido de salão).
- Ao fechar a sessão, todas as comandas abertas são fechadas automaticamente.

## Fluxo

1. Garçom abre a mesa → `open_table_session`.
2. Grupo pede pra dividir a conta → garçom cria comandas: `open_command(session_id, 'João')`.
3. Cada pedido lançado no PDV escolhe a comanda destino (ou "sessão inteira").
4. Cliente João pede a conta antes → `close_command(command_id)` +
   `close_table_session` só pra ele **(v2)**. Em **v1**, split de conta acontece
   no fechamento único da sessão (ver abaixo).

## Split de conta (fechamento)

`close_table_session(session_id, splits, force?)`:

```json
{
  "splits": [
    { "method": "pix",     "amount": 45.00, "payer_label": "João" },
    { "method": "credit",  "amount": 60.00, "payer_label": "Maria" },
    { "method": "cash",    "amount": 20.00, "payer_label": "Convidado" }
  ]
}
```

Regras:

- Soma dos `amount` **pode** divergir do total (registra saldo pendente/troco no retorno).
- Cada split vira uma linha em `table_split_payments`.
- Total pago (`SUM(amount)`) alimenta o **caixa aberto** como movimento `sale`.
- Se não houver caixa aberto, o fechamento acontece mesmo assim — o valor fica
  visível na sessão mas não entra em `cash_movements`.
- `force=true` (apenas dono) permite fechar mesmo com pedidos ainda em preparo.

## Transferência

`transfer_orders(order_ids[], target_session_id, target_command_id?)`:

- Move pedidos entre sessões / comandas.
- Origem e destino precisam estar no mesmo restaurante.
- Sessão destino precisa estar `open`.
- Registra evento `transferred` na sessão destino.

Use para:

- Cliente muda de mesa → cria sessão nova, transfere os pedidos, cancela a antiga.
- Cliente pediu na comanda errada → transfere só aquele item.
- Fusão de contas: use `merge_sessions` (fecha origem, aponta `merged_into_session_id`).

## Merge de sessões

`merge_sessions(source_session_id, target_session_id)`:

- Move todos os pedidos e comandas da origem pra destino.
- Fecha a sessão origem com `status='closed'` e `merged_into_session_id` apontando pro destino.
- Registra evento `merged` na destino.

## Split por item (v2)

Fora do escopo da v1. A UI só oferecerá split por **valor/percentual/pessoa**
em cima do total da sessão.

## Auditoria

Todo evento (`opened`, `command_opened`, `order_added`, `transferred`, `merged`,
`closed`, `cancelled`, `blocked`, `forced_close`) grava linha em
`table_session_events` com `actor_user_id` e `payload jsonb`. A timeline da
sessão consome essa tabela; a timeline de cada pedido continua vindo de
`order_status_history`.

## Editor visual (Sprint 6.3 Fase D)

Rota `/admin/mesas/editor` (feature `tables_max`). Arraste para posicionar,
use a alça inferior direita para redimensionar, o slider do inspetor para
rotacionar (-180°..180°) e alterne entre `rect` / `circle`. Snap de 10px.

Salvar aciona `update_table_layout(restaurant_id, updates jsonb[])` — batch,
`SECURITY DEFINER`, validado por `is_team_owner`. Retorna o número de mesas
atualizadas. Realtime propaga mudanças para outras abas via canal
`tables-editor-{restaurant_id}` (`postgres_changes` em `restaurant_tables`).

## Débito técnico registrado

- **Split e transferência item-a-item** (arrastar item entre comandas / dividir
  quantidades): fora do escopo da v1. Split atual cobre valor / percentual /
  pessoas / conjunto de itens; transferência atual cobre pedido inteiro e
  comanda inteira.
