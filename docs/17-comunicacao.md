# Comunicação Omnichannel — Sprint 4.1

## Visão geral
Plataforma unificada para envio de mensagens transacionais (WhatsApp, SMS, e-mail).
Baseada em Adapter Pattern, fila persistente com retry/DLQ e feature gate por plano.

## Componentes
- **DB**: `communication_providers`, `communication_settings`, `communication_secrets`,
  `communication_templates`, `communication_event_bindings`, `communication_queue`,
  `communication_logs`.
- **Server functions** (`src/lib/communication/*.functions.ts`):
  - `listCommunicationSettings`, `upsertCommunicationSetting`,
    `deleteCommunicationSetting`, `testCommunicationConnection`
  - `listCommunicationTemplates`, `upsertCommunicationTemplate`,
    `deleteCommunicationTemplate`, `previewCommunicationTemplate`
  - `processCommunicationQueue` (worker com circuit breaker)
- **Rotas**:
  - `/api/public/hooks/communication-worker` — trigger do worker (pg_cron / externo).
  - `/api/public/hooks/communication/$provider/$settingsId` — webhook (HMAC).
- **UI Admin**: `/admin/comunicacao` (3 abas: Canais, Templates, Fila).

## Segurança
- Tokens/API keys em `communication_secrets` — nunca expostos ao cliente.
- Feature gate: `communication_channels_max` (Starter=0, Pro≥1, Business≥3).
- RLS por `restaurant_id` + `is_team_owner`.
- Webhook exige HMAC + `webhook_secret` do canal.
- Rate limit + circuit breaker no worker.

## Feature gates por plano
| Recurso | Starter | Pro | Business |
|---|---|---|---|
| Automações transacionais | ❌ | ✅ | ✅ |
| Nº canais | 0 | 1 | 3+ |
| Campanhas marketing | ❌ | ❌ | ✅ |

## Eventos disparados
`order_pending`, `order_confirmed`, `order_preparing`, `order_out_for_delivery`,
`order_ready`, `order_delivered`, `order_cancelled`, `payment_approved`,
`payment_rejected`, `payment_refunded`.
