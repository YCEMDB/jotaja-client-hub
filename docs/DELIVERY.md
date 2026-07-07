# Delivery Profissional (Sprint 7)

Módulo completo de delivery reutilizando 100% da arquitetura existente
(orders, order_status_history, delivery_drivers, communication_queue,
KDS, Caixa, CRM, Feature Gates).

## Fluxo de estados

Toda transição de status de pedido segue a **State Machine central**
(`public.update_order_status`). O módulo de delivery **nunca** faz `UPDATE`
direto em `orders.status`. As colunas específicas de despacho
(`driver_assigned_at`, `driver_accepted_at`, `driver_picked_up_at`,
`driver_delivered_at`, `driver_reject_reason`, `driver_commission_amount`)
são registradas via RPCs `SECURITY DEFINER` e a transição de status é
delegada à state machine:

```
pending → confirmed → preparing → ready
                                    │  driver_pickup_order
                                    ▼
                             out_for_delivery
                                    │  driver_complete_delivery
                                    ▼
                                delivered
```

## Papéis e permissões

| Papel        | Permissões                                                                 |
|--------------|-----------------------------------------------------------------------------|
| `owner`      | Cadastrar motoboys, despachar, trocar, cancelar despacho, ver relatórios.  |
| `driver`     | Ver seus pedidos, aceitar/recusar, retirar, entregar, enviar GPS.          |
| Cliente      | Nenhum acesso a dados de delivery além dos status do próprio pedido.       |

RLS em `delivery_drivers`, `driver_locations` e `orders` garante o isolamento.

## RPCs do módulo

### Cadastro (Fase A)
- `create_driver(restaurant_id, name, phone, email, vehicle, plate, fee, commission_percent)`
- `update_driver(driver_id, ...)`
- `link_driver_user(driver_id, user_id)` — vincula um usuário de `auth.users` ao motoboy e concede role `driver`.
- `set_driver_status(driver_id, status)` — `offline | available | busy`.
- `check_driver_limit(restaurant_id)` — enforce `max_drivers` do plano.

### Despacho (Fase A/B)
- `assign_driver(order_id, driver_id)` — dono atribui/troca motoboy.
- `unassign_driver(order_id, reason?)` — cancela despacho.
- `driver_accept_order(order_id)` — motoboy aceita.
- `driver_reject_order(order_id, reason?)` — motoboy recusa.
- `driver_pickup_order(order_id)` — motoboy retira; **transiciona para `out_for_delivery`** via state machine e congela a comissão.
- `driver_complete_delivery(order_id)` — **transiciona para `delivered`** via state machine.

### GPS
- `update_driver_location(lat, lng, accuracy?, speed?, heading?, order_id?)` — chamado a cada 30 s pelo app do motoboy quando `busy`.

### Consultas
- `get_delivery_dashboard(restaurant_id)` — KPIs de topo.
- `get_driver_assigned_orders()` — usada pelo app `/motoboy`.
- `get_delivery_financial_summary(restaurant_id, from, to, driver_id?)` — financeiro por período/motoboy.
- `get_delivery_metrics(restaurant_id, from, to)` — SLA (accept/pickup/rota/total), taxa aceitação/recusa, produtividade por motoboy.
- `get_driver_last_locations(restaurant_id)` — última posição de cada motoboy ativo (mapa).

## Realtime

Canais assinados:
- Painel `/admin/entregas` → `orders`, `delivery_drivers`, `driver_locations` (filtrados por restaurante).
- App `/motoboy` → canal por motoboy filtrando `orders.driver_id`.

## Financeiro

- `orders.delivery_fee` — cobrado do cliente (já parte do total).
- `orders.driver_commission_amount` — congelado em `driver_pickup_order`
  como `fee_per_delivery + delivery_fee * commission_percent / 100`.
- **Não gera movimentação em `cash_movements`.** O pagamento aos motoboys
  é liquidado fora do caixa dos pedidos (o caixa continua registrando
  a receita da venda normalmente). O relatório `get_delivery_financial_summary`
  serve como base para o fechamento semanal/mensal com o motoboy.

## Comunicação (WhatsApp)

Reutiliza o trigger existente `trg_comm_on_order_status`, que enfileira
em `communication_queue` sempre que `order_status_history` recebe um novo
status. Os eventos disparados automaticamente para clientes de delivery são:

- `order_confirmed`
- `order_preparing`
- `order_ready`
- `order_out_for_delivery` ← disparado por `driver_pickup_order`
- `order_delivered` ← disparado por `driver_complete_delivery`
- `order_cancelled`

Basta ter binding ativo em `communication_event_bindings` para o evento.
**Não foi criado nenhum novo sistema de envio.**

## Feature Gates

`app_plans.features.max_drivers` (e `features.drivers: boolean`):

| Plano     | max_drivers |
|-----------|-------------|
| Starter   | 0 (bloqueado) |
| Pro       | 5           |
| Business  | ilimitado   |

Aplicado em `check_driver_limit()` e no `<FeatureGate feature="drivers">`
da rota `/admin/entregas` e `/admin/entregadores`.

## Timeline

Cada operação relevante grava evento em `order_status_history` com
`source = 'delivery'` e `reason` = `driver_assigned | driver_unassigned |
driver_accepted | driver_rejected | driver_picked_up | driver_delivered`
+ `metadata` com `driver_id`, `previous_driver_id`, `commission`, etc.

## Rotas

- `/admin/entregadores` — cadastro CRUD de motoboys.
- `/admin/entregas` — painel operacional (Kanban / Lista / Mapa / Relatórios).
- `/motoboy` — PWA do motoboy (login por email, aceite, GPS, histórico, ganhos).

## Pendências reais

- Mapa interativo real (aguardando definição entre Google Maps × Mapbox).
- Notificação push nativa para o app do motoboy (opcional; realtime já cobre 90 %).
- Exportação CSV/XLSX do relatório financeiro (dados já disponíveis via RPC).
- `manifest.webmanifest` do `/motoboy` para install nativo.
- Roteirização multi-drop.
