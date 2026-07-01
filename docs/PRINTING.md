# Impressão — Comandex

## Arquitetura

Backend expõe a **fila de impressão** (`print_jobs`). Drivers ficam no cliente/agente.

```
Trigger auto_enqueue_print_on_status  →  INSERT print_jobs (status=queued)
       ↑                                       ↓
update_order_status()                    Realtime (usePrintQueue)
                                               ↓
                                         Consumer (driver do restaurante)
                                               ↓
                                         UPDATE status=printed | failed
```

## Tabela `print_jobs`

| Coluna | Descrição |
|---|---|
| `event` | `confirmed` \| `preparing` \| `ready` \| `manual` \| `reprint` |
| `driver` | `escpos` \| `webusb` \| `network` \| `cloud` \| `browser` |
| `status` | `queued` \| `printing` \| `printed` \| `failed` \| `cancelled` |
| `attempts`, `last_error`, `printed_at` | Retry / observabilidade |

Índice único parcial impede duplicatas de `(order_id, event)` enquanto queued/printing (exceto `reprint`/`manual`).

## RPC `enqueue_print_job(order_id, event, station_id?, driver?)`
- Verifica permissão (owner/team).
- Usa `default_driver` de `operations_settings` se `driver` omitido.
- Retorna `{id, driver}` ou `{id: null}` em dedupe.

## Trigger `auto_enqueue_print_on_status`
Roda AFTER INSERT em `order_status_history`. Lê `operations_settings` do restaurante e enfileira job conforme flags `auto_print_on_confirmed/preparing/ready`. Falha silenciosa (WARNING) — nunca quebra a transição.

## Driver `browser` (Sprint 3 — ✅ implementado)
Hook `usePrintQueueConsumer(restaurantId)`:
- Backlog inicial (últimos 20 queued).
- Realtime INSERT → processa imediatamente.
- Usa `printReceipt()` existente (window.print de iframe).
- Marca `printing → printed | failed`.

## Drivers futuros (🚧 arquitetura pronta)

| Driver | Descrição | Sprint |
|---|---|---|
| `escpos` | Agente local Node/Electron via WebSocket, ESC/POS binário | 4 |
| `webusb` | Impressora USB direta pelo navegador Chromium | 4 |
| `network` | POST TCP para IP:9100 (agente local) | 5 |
| `cloud` | Google Cloud Print / PrintNode / equivalente | 5 |

**Nenhum consumer** processa drivers ≠ `browser` — o job fica em `queued`. Agente local futuro filtra por `driver` e processa.

## Configuração

`operations_settings` por restaurante:
- `auto_print_on_confirmed | preparing | ready` — quando disparar
- `default_driver` — qual usado quando não especificado
- `printer_name` — texto livre (semântica definida pelo driver)

UI: `/admin/operacoes`.

## Estações e roteamento

`kitchen_stations` por restaurante. `products.station_id` (via `categories.station_id` como default sugerido — 🚧 herança automática pendente). RPC `get_kds_orders` filtra itens por estação.

Roteamento por estação em `enqueue_print_job` já suportado (`p_station_id`) — agente local pode imprimir apenas itens da sua estação.
