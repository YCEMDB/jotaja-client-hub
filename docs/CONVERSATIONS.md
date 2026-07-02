# Conversas Bidirecionais — Sprint 4.2

Plataforma de mensagens **bidirecional** sobre a infraestrutura da Sprint 4.1.
Sem chatbot, sem IA — foco em conversa humana + auditoria + timeline.

## Reaproveitamento

Não há segundo canal, segunda fila ou segundo adapter. Tudo reusa:

- `communication_settings` — canal ativo (Evolution API).
- `communication_secrets` — token server-only.
- `communication_queue` — envio outbound (RPC `send_manual_conversation_message` insere aqui).
- `communication_logs` — auditoria append-only.
- Adapter Pattern (`src/lib/communication/registry.ts`) — providers implementam agora `parseInbound()`.

## Tabelas

### `conversations`
Uma linha por (`restaurant_id`, `channel`, `peer_address`).
Campos-chave: `unread_count`, `last_message_at`, `last_message_preview`,
`last_direction`, `status` (`open`/`archived`), `customer_id`, `order_id`.

### `conversation_messages`
Histórico completo. `direction` ∈ `inbound|outbound|system`,
`source` ∈ `manual|automated|webhook|system`. Guarda `payload_raw` e
`payload_normalized` para permitir IA futura sem migrar dados.

### `quick_replies`
Respostas prontas por restaurante (título, corpo, atalho opcional).

## Fluxos

### Inbound (recebimento)
1. Evolution API → `POST /api/public/hooks/communication/:provider/:settingsId`
2. Rota verifica HMAC do `webhook_secret`.
3. `provider.parseInbound()` normaliza payload.
4. Para cada mensagem:
   - `find_or_create_conversation` (SECURITY DEFINER) casa telefone com cliente.
   - Insere em `conversation_messages` (direction=`inbound`, source=`webhook`).
   - Tenta correlacionar com pedido ativo do telefone (`orders.customer_phone`).
   - Trigger `trg_conv_msg_touch` atualiza resumo e incrementa `unread_count`.
   - `pg_notify('conversation_messages', …)`.

### Outbound (envio manual)
1. UI chama `sendManualMessage` (server fn autenticada).
2. `send_manual_conversation_message` (SECURITY DEFINER) valida permissão,
   enfileira em `communication_queue` e cria `conversation_messages` com
   `status='pending'`.
3. Worker (Sprint 4.1) processa a fila e chama `provider.sendMessage`.
4. Trigger `trg_sync_conv_msg_from_queue` reflete `sent`/`failed`/`delivered`
   de volta na mensagem.

### Timeline
- Cliente/pedido consultam `conversation_messages` filtrando por
  `restaurant_id`+`customer_id` ou `order_id`.
- Realtime via Supabase channels em `conversation_messages`.

## Segurança

- **RLS**: leitura restrita a owner/manager/employee do restaurante.
  Escritas em `conversation_messages` só via RPC/service_role.
- **HMAC**: webhook rejeita 401 se assinatura falhar.
- **Sanitização**: `renderTemplate` neutraliza `{{ }}` do payload do cliente.
- **Rate limit**: reusa `rate_limit_events` (a ser aplicado em Sprint 4.3).
- **Auditoria**: `communication_logs` grava todo inbound/outbound.
- **Dedup**: inbound checa `provider_message_id` antes de inserir.

## Feature Gates

- `communication_channels_max > 0` (Pro+) libera `/admin/comunicacao`.
- Starter não acessa.
- Automações e campanhas ficam para Sprint 4.3+ (Business).

## Adapter Contract (extensão 4.2)

```ts
interface CommunicationProvider {
  sendMessage(...): Promise<SendResult>;
  testConnection(...): Promise<HealthCheckResult>;
  parseWebhook?(...): Promise<InboundStatusUpdate[]>;   // Sprint 4.1
  parseInbound?(...): Promise<InboundMessage[]>;        // Sprint 4.2
}
```

Um novo provider (Twilio, 360dialog, Meta Cloud, Telegram) só precisa
implementar essas 4 funções — nada mais.

## Pendências (Sprint 4.3 sugerida)

- Automações por regra (palavras-chave: "cancelar", "status", "pix"…).
- Timeline embutida em `pedido.$orderId.tsx` e `admin.clientes.tsx`.
- Dashboard: conversas abertas, tempo médio de resposta, não respondidas.
- Encaminhamento entre operadores + atribuição.
- Suporte a mídia (imagem/áudio) na UI.

---

## Sprint 4.3 — Mídia

`conversation_messages` agora tem: `media_type` (`text|image|audio|document|video|sticker|location`), `media_url`, `media_mime`, `caption`. `payload_raw`/`payload_normalized` continuam armazenando o payload bruto do provider.

Renderização:
- image → `<img>` inline
- audio → `<audio controls>` inline
- video → `<video controls>` inline
- document → link para download

Sem processamento avançado (sem transcrição, sem OCR).
