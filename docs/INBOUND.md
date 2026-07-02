# Inbound WhatsApp — Especificação

## Endpoint

```
POST /api/public/hooks/communication/:provider/:settingsId
```

- `:provider` — código do provider (`evolution`).
- `:settingsId` — id de `communication_settings` do restaurante.

## Autenticação

- Header aceito: `X-Hub-Signature-256`, `X-Signature`, `X-Webhook-Signature`
  (`sha256=` opcional).
- Verificação HMAC SHA-256 do **raw body** com o `webhook_secret` do settings.
- `timingSafeEqual` para evitar timing attacks.
- Sem secret configurado ⇒ webhook aceita (para setup); recomendado configurar.

## Processamento

Cada request pode conter dois tipos de payload:

### Status updates (outbound tracking)
`provider.parseWebhook()` retorna `InboundStatusUpdate[]`.
Atualiza `communication_queue.status` por `provider_message_id`.
Trigger `trg_sync_conv_msg_from_queue` propaga para `conversation_messages`.

### Mensagens recebidas
`provider.parseInbound()` retorna `InboundMessage[]` com:
- `provider_message_id` (opcional, usado para dedup)
- `from` — telefone normalizado (somente dígitos)
- `from_name` — nome do WhatsApp (`pushName` no Evolution)
- `body` — texto (`conversation`, `extendedTextMessage.text`, captions, etc.)
- `timestamp` — ISO
- `raw` — payload original
- `normalized` — metadados extras

Para cada mensagem:
1. Dedup via `provider_message_id`.
2. `find_or_create_conversation(restaurant_id, channel, peer, provider, settings_id, peer_name)` — cria conversa e casa com cliente por telefone.
3. Correlaciona pedido ativo (`orders.customer_phone` + status ∈ `{pending, confirmed, preparing, ready, out_for_delivery}`).
4. Insere em `conversation_messages` (`direction=inbound`, `source=webhook`).
5. Trigger atualiza `unread_count` e envia `pg_notify('conversation_messages')`.
6. Log em `communication_logs`.

## Response

```json
{ "ok": true, "status_updates": 0, "inbound_messages": 1 }
```

## Erros

- `404` — settings não encontrado ou provider ≠ configurado.
- `401` — assinatura HMAC inválida.
- `400` — provider desconhecido.

## Filtros de payload

- `key.fromMe = true` → ignorado (é a própria loja enviando; já rastreado via outbound).
- Mensagem sem texto legível → ignorada (mídia sem caption).

## Ordem de operações

Sempre nesta ordem, dentro do mesmo request:
1. Verifica HMAC.
2. Processa status updates.
3. Processa inbound.
4. Retorna 200 com contadores.

## Extensibilidade

Novos providers implementam `parseInbound(headers, rawBody): Promise<InboundMessage[]>`.
Registrar em `src/lib/communication/registry.ts`. Zero mudança nesta rota.
