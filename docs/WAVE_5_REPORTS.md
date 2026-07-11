# Onda 5 — Relatórios (fechamento)

## Ciclo de vida canônico dos pedidos

Enum real (`public.order_status`):

```
pending → confirmed → preparing → ready → out_for_delivery → delivered
                                        ↘ delivered (dispensa out_for_delivery quando aplicável)
qualquer estado não-terminal → cancelled
```

Valores atualmente presentes em `orders.status` no banco: `pending`, `delivered`, `cancelled`. Nenhum estado legado (`completed`, `awaiting_pickup`, `delivering`) existe — foram descartados.

Máquina de transição (`private.is_valid_order_transition`) confirma:

- `pending → confirmed | cancelled`
- `confirmed → preparing | cancelled`
- `preparing → ready | cancelled`
- `ready → out_for_delivery | delivered | cancelled`
- `out_for_delivery → delivered | cancelled`
- Terminais: `delivered`, `cancelled`.

Estratégia para pedidos legados: como não existem status fora do enum, não há migração de dados a fazer. Se um dia surgir estado legado, o relatório o exibirá em `by_status` sem contá-lo como receita (a receita só considera `delivered`).

## Métricas financeiras

- **Receita concluída** = soma de `total` dos pedidos com `status = 'delivered'`.
- **Valor em aberto** = soma de `total` dos pedidos em operação (`confirmed`, `preparing`, `ready`, `out_for_delivery`). Não é receita.
- **Pedidos válidos operacionais** = contagem de pedidos com `status NOT IN ('cancelled','pending')`. Usado apenas para leitura operacional, nunca como divisor do ticket.
- **Ticket médio (concluídos)** = receita concluída ÷ pedidos concluídos (`delivered`).
- **Descontos / taxa de entrega / clientes únicos / itens vendidos** — todos calculados somente sobre pedidos concluídos.

## Forma de pagamento vs pagamento confirmado

- `by_payment_method` = forma escolhida pelo cliente no pedido (coluna `orders.payment`). Não implica pagamento confirmado. A receita associada só considera pedidos concluídos.
- `by_payment_status` = valor da coluna `orders.payment_status` (`pending | paid | failed | refunded | expired`). Este sim reflete pagamento confirmado quando `paid`.
- Rótulos na interface: “Forma de pagamento informada” e “Status financeiro”.

## Timezone

Todas as RPCs de relatório derivam o timezone exclusivamente do cadastro do restaurante:

```
restaurants.timezone → fallback: America/Sao_Paulo
```

O parâmetro `p_tz` foi mantido apenas por compatibilidade de assinatura e é **ignorado** pelo servidor. O cliente não consegue alterar o fuso do relatório.

## Segurança das RPCs

Todas as funções de relatório são `SECURITY DEFINER` com `search_path = pg_catalog, public, private, pg_temp` (helpers privados usam `pg_catalog, private, public, pg_temp`). Permissões:

| Função | PUBLIC | anon | authenticated | service_role |
|---|---|---|---|---|
| `public.report_overview` | ❌ | ❌ | ✅ | ✅ |
| `public.report_orders_breakdown` | ❌ | ❌ | ✅ | ✅ |
| `public.report_products` | ❌ | ❌ | ✅ | ✅ |
| `public.report_customers` | ❌ | ❌ | ✅ | ✅ |
| `public.report_cash` | ❌ | ❌ | ✅ | ✅ |
| `public.report_stock` | ❌ | ❌ | ✅ | ✅ |
| `private.report_resolve_range` | ❌ | ❌ | — (schema privado) | — |
| `private.authorize_tenant_report` | ❌ | ❌ | — (schema privado) | — |

Autorização por tenant é feita por `private.authorize_tenant_report`, que valida acesso nativo ou sessão de suporte ativa antes de qualquer leitura.

## Classificação dos testes

- **STRUCTURAL / SQL VALIDATION PASS**: 20 cenários — executados por inspeção estrutural do banco (grants, search_path, filtros de status, buckets de timezone). Não substituem testes E2E funcionais de interface.
- **JWT E2E: DEFERRED** — test credentials unavailable in current sandbox.
