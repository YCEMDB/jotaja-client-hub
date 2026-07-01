# KDS — Kitchen Display System

Rota: `/admin/kds` — tela dark, tempo real, tela cheia.

## Colunas
Baseadas na state machine oficial:
| Coluna | Status | Próximo |
|---|---|---|
| NOVOS | `pending` | confirmed |
| CONFIRMADOS | `confirmed` | preparing |
| EM PREPARO | `preparing` | ready |
| PRONTOS | `ready` | out_for_delivery |
| SAIU P/ ENTREGA | `out_for_delivery` | (delivered via painel) |

## Cronômetro / SLA
Config em `operations_settings`:
- Verde: até `sla_green_minutes`
- Amarelo: `sla_yellow_minutes`+
- Vermelho: `sla_red_minutes`+
- Vermelho piscando: `sla_red_minutes + 10`+

## Filtros
- Estação (from `kitchen_stations`)
- Tipo (delivery/pickup/dine_in)
- Pagamento
- Busca: pedido/cliente/telefone

## Sons
- Novo pedido → `playOrderBeep()`
- Toggle instantâneo no header (não persiste; persistente via config em Operações).

## Realtime
- Canal único por restaurante: `kds:{restaurantId}`.
- Escuta `orders` (INSERT/UPDATE) e `order_status_history` (INSERT).
- Recarrega via `get_kds_orders` RPC (SECURITY DEFINER, checa owner/team).

## Ações
| Botão | Efeito |
|---|---|
| Avançar | `update_order_status` para próximo estado da coluna |
| Reimprimir | `enqueue_print_job(order_id, 'reprint')` |
| ✕ | `update_order_status` → `cancelled` (com reason) |

**Zero UPDATE direto.** Toda transição via RPC oficial.

## Performance
- RPC única traz pedidos + itens (evita N+1).
- Filtros em memória (dataset típico < 200 cards ativos).
- Realtime evita polling.
- Tick de 15s apenas para forçar rerender dos cronômetros.

## Multi-aba
- Cada aba abre seu próprio canal; Supabase Realtime é multiplexado.
- Alterações refletem em todas as abas (mesmo restaurante).
