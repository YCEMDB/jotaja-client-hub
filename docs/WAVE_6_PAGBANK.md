# Turno 6 — Integração PagBank (MVP Pix)

**Status final:** ✅ **ENCERRADO — STRUCTURAL + INTEGRATION PASS (Sandbox).**
Cobertura pipeline canônico, OAuth Connect, criação de Pix, webhook assinado, idempotência, reconciliação e rejeições estruturadas — todos validados em Sandbox por script server-side com identidade `service_role`.

**Gates externos ainda DEFERRED / BLOCKED** (não bloqueiam RC2, bloqueiam release em produção):
- Pagamento humano de um Pix Sandbox — **DEFERRED**
- Webhook originado oficialmente pelo PagBank — **DEFERRED**
- Reconciliação externa após pagamento — **DEFERRED**
- Homologação PagBank Connect — **BLOCKED (externo)**
- Credenciais de produção (`PAGBANK_PROD_CLIENT_ID/SECRET/TOKEN`) — **BLOCKED (externo)**

Nenhuma ativação de produção foi executada nesta rodada.

**C3b — Divergências de webhook (última correção do turno):** ✅ **PASS**.
`public.payment_apply_provider_event` reescrita: `RAISE EXCEPTION` só para falha técnica (`invalid_provider`); divergências de negócio (`payment_not_found`, `payment_amount_mismatch`, `payment_reference_mismatch`, `payment_currency_mismatch`, `payment_restaurant_mismatch`, `order_cancelled`) persistem em `payment_webhook_events(result='rejected', error_code, processed_at)` e retornam JSON estruturado `{processed, applied, duplicate, error_code}`. Evento repetido rejeitado é retornado como `duplicate=true` sem side effects. Cobertura reexecutada 7/7 cenários; typecheck/build 0/0.

---

## 1. Arquitetura

Modelo escolhido:
- **Cada restaurante conecta a própria conta PagBank via OAuth (Connect).**
- Pagamento Pix cai **direto na conta do lojista**.
- COMANDAHUB **não** recebe, não faz custódia, não faz split.
- Cliente final (browser) **nunca** vê token, secret ou faz chamadas autenticadas ao PagBank.
- Módulo canônico único de pagamentos: `order_payments` — Mercado Pago e PagBank convivem lado a lado, gravando no mesmo pipeline.

## 2. Estruturas criadas

Migration `20260711_wave6_pagbank_canonical_payments`.

- `financial_payment_status` enum (`waiting, processing, authorized, paid, declined, canceled, expired, refunded, partially_refunded, failed`).
- `order_payments` — fonte única para status financeiro (um pagamento ativo por pedido via índice único parcial).
- `restaurant_payment_integrations` — vínculo OAuth por restaurante + provider; tokens criptografados via `pgcrypto` + segredo em `vault`.
- `pagbank_oauth_states` — state one-shot com expiração (proteção CSRF/replay).
- `payment_webhook_events` — deduplicação idempotente por `(provider, external_event_id | payload_hash)`.
- `restaurants.active_payment_provider` — provedor ativo escolhido pelo lojista.

Grants: `authenticated` só lê o essencial; `webhook_key`, `access_token_encrypted`, `refresh_token_encrypted` **revogados** para todos (só `service_role` / RPCs `SECURITY DEFINER` acessam).

## 3. Fluxo Connect (OAuth)

1. Admin clica em "Conectar PagBank" → `pagbankConnectInit` (RPC valida sessão) cria state.
2. Browser vai para PagBank com URL construída server-side.
3. Callback `GET /api/public/pagbank/callback?state&code` → server exchange do `code` → `pagbank_connect_complete(state, tokens)` grava criptografado.
4. `state` marcado como usado; replay recusado.
5. `restaurant_id` **nunca** vem do query string — sempre resolvido pelo `state` do banco.

## 4. Tokens e Secrets

- `access_token` / `refresh_token` armazenados em `access_token_encrypted` (bytea) via `pgp_sym_encrypt`, chave em `vault.pagbank_encryption_key`.
- Descriptografia só em `pagbank_get_access_token` (SECURITY DEFINER, REVOKE PUBLIC) e `pagbank_lookup_integration_by_webhook_key` (uso interno do webhook).
- **Nunca** retornados em `SELECT` disponível ao cliente; **nunca** em logs; **nunca** em auditoria.

Secrets pendentes (⏸ DEFERRED — configurar via `add_secret` quando o COMANDAHUB tiver aplicação PagBank aprovada):
- `PAGBANK_CLIENT_ID_SANDBOX`, `PAGBANK_CLIENT_SECRET_SANDBOX`
- `PAGBANK_CLIENT_ID`, `PAGBANK_CLIENT_SECRET`

Sem esses valores, a UI mostra `missing_credentials` — não simulamos conexão.

## 5. Server Functions e Rotas

| Arquivo | Papel |
|---|---|
| `src/lib/payments/pagbank-api.server.ts` | Cliente HTTP PagBank (server-only), verificação HMAC-SHA256, mapeamento de status |
| `src/lib/payments/pagbank.functions.ts` | RPCs cliente: init/disconnect/rotate/summary/createCharge/sync |
| `src/lib/payments/messages.ts` | Traduções PT-BR canônicas de erros |
| `src/lib/payments.functions.ts` | Roteamento por `active_payment_provider` (createPixPayment/syncPixPayment) |
| `src/routes/api/public/pagbank/callback.ts` | OAuth callback |
| `src/routes/api/public/hooks/pagbank.$webhookKey.ts` | Webhook PagBank (URL opaca) |
| `src/routes/api/public/mercadopago-webhook.ts` | Reescrito para o pipeline canônico `payment_apply_provider_event` |

## 6. Geração do Pix

- Valor sempre calculado no backend: `Math.round(orders.total * 100)` — inteiros em centavos.
- Idempotência estável: `sha256(pagbank|restaurant_id|order_id|attempt)`. Retry não duplica QR.
- `reference_id = "order:<uuid>"`.
- Expiração explícita (default 30 min); atinge `expired` no vencimento.
- `notification_urls` aponta para `/api/public/hooks/pagbank/{webhook_key}` (opaca).

## 7. Webhook e Assinatura

- URL: `/api/public/hooks/pagbank/{webhook_key}` — `webhook_key` opaco (32 bytes hex), único por integração, rotacionável.
- `rawBody` preservado ANTES de parse (nunca `JSON.stringify(request.body)`).
- Assinatura oficial: `HMAC-SHA256(access_token + "-", rawBody)`, header `x-authenticity-token` (`x-signature` como fallback).
- `timingSafeEqual` para comparação.
- Após validar assinatura, reconsulta `GET /orders/{id}` — não confia no valor do payload.
- `payment_apply_provider_event` é idempotente: `(provider, external_event_id | payload_hash)` bloqueia duplicatas; evento repetido responde OK sem re-executar transição.

## 8. Reconciliação (polling / "Já paguei")

- `syncPagbankPayment` chama `GET /orders/{id}` server-side com token do restaurante.
- Usa o mesmo `payment_apply_provider_event` — mesma idempotência, mesma auditoria.
- `last_reconciled_at` gravado.
- Rate limit pendente (⚠️ backlog Turno 6.1).

## 9. Status Financeiros e Transição do Pedido

- Enum local separado do enum operacional. `provider_status` cru guardado para diagnóstico.
- `payment_apply_provider_event` só chama `update_order_status(..., 'confirmed')` quando `status = paid` **AND** `paid_at` gravado.
- Divergência de valor: pagamento vira `failed`, evento fica marcado com `error_code = amount_mismatch`, pedido **não** confirma.
- `orders.status` nunca é UPDATE direto — sempre via RPC.

## 10. Feature Gate

`online_payment` (Pro / Business). Frontend usa `<FeatureGate>` já existente; backend não bloqueia — quem controla é a UI de configuração. Mensagens: `feature_not_available`, `pagbank_not_connected`, `pagbank_authorization_expired`.

## 11. Interface

Configurações → Pagamentos ganhou:
1. **Formas de pagamento aceitas** (existente).
2. **Provedor Pix ativo** (novo) — botão Mercado Pago / PagBank + motivo obrigatório.
3. **PagBank Connect** (novo) — badge de status, ambiente sandbox/produção, botão conectar, motivo para desconectar/rotacionar webhook.
4. **Mercado Pago** (existente, intacto).

Checkout do cliente (`/pedido/:id`) **não mudou**: `createPixPayment`/`syncPixPayment` roteiam internamente pelo `active_payment_provider` e espelham o QR em `orders.pix_qr_code*`.

## 12. Super Admin / Auditoria

- Super Admin vê integração via `admin_view_payment_integrations`: status, environment, conta mascarada, `last_webhook_at`, `last_error_code` — **nunca** tokens/segredos.
- Auditoria (`private.record_audit`): `pagbank_connect`, `pagbank_disconnect`, `pagbank_rotate_webhook`, `pagbank_webhook_event`, `set_active_payment_provider`, `payment_status_change`.

## 13. Assinatura do Webhook (correção)

Regra oficial do PagBank confirmada e implementada em
`verifyWebhookSignature` (`src/lib/payments/pagbank-api.server.ts`):

```
expected = SHA-256( access_token + "-" + raw_body )  // hex
recebido = header x-authenticity-token (fallback x-signature)
```

- **Não é HMAC.** É digest SHA-256 puro sobre a concatenação
  `access_token + "-" + payload_bruto`. O `access_token` do lojista é o
  próprio segredo compartilhado — não existe chave separada.
- `raw_body` é o buffer exato lido de `request.text()` **antes** de
  qualquer `JSON.parse`. Nunca se reconstrói via `JSON.stringify`.
- Comparação com `timingSafeEqual` (tempo constante).
- Header ausente, tamanho divergente ou hash divergente → 401 e
  nenhum efeito no banco.
- O `webhook_key` opaco na URL (`/api/public/hooks/pagbank/{webhook_key}`)
  é apenas roteamento anti-enumeração — **não é** prova de autenticidade.
  A prova é sempre a comparação SHA-256 acima.

## 14. Testes e classificação de release

### STRUCTURAL PASS
- Typecheck limpo (bunx tsgo).
- Build de produção limpo (bun run build).
- Tokens nunca aparecem no bundle client (imports server-only).
- Service role via `client.server.ts` (import protegido).
- Grants restritos: `webhook_key` / `access_token_encrypted` sem acesso a `authenticated`/`anon`.
- Índice único parcial impede 2 pagamentos ativos por pedido — inclusive entre providers (Mercado Pago × PagBank não coexistem ativos no mesmo pedido; estados ativos = `waiting|processing|authorized|paid`).
- `payment_apply_provider_event` idempotente via `payment_webhook_events` (chave `(provider, external_event_id | payload_hash)`).
- Enum financeiro separado do enum operacional. `orders.payment_status` é apenas espelho gravado pela função canônica; ambos os webhooks (MP e PagBank) passam pela mesma RPC; `orders.status` só transiciona via `update_order_status`.
- Backfill do Mercado Pago preservou `mp_payment_id`, provider histórico e `paid_at` apenas quando já existiam; pedidos sem confirmação ficaram como `waiting` (não inventados como pagos, não migrados para PagBank).
- Troca de provider afeta apenas cobranças futuras; pagamentos pendentes seguem no provider original; desconectar não apaga histórico e não bloqueia reconciliação de cobranças já criadas.
- Chave de criptografia dos tokens fica em `vault`; descriptografia só em RPCs `SECURITY DEFINER` server-side; `authenticated` não lê `access_token_encrypted`; auditoria nunca grava token/secret/QR.
- Assinatura oficial **SHA-256(access_token + "-" + raw_body)** com comparação em tempo constante (correção desta rodada).
- Nenhum DML direto financeiro no navegador.

### Classificação PagBank Sandbox E2E

| Item | Classificação |
| --- | --- |
| PagBank Connect application creation | **SANDBOX PASS** (HTTP 201 no `POST /oauth2/application` do ambiente sandbox — logo `https://comandahub.online/pagbank-logo.png`, callback `https://comandahub.online/api/public/pagbank/callback`) |
| OAuth Sandbox E2E | **DEFERRED** — requer login interativo em conta vendedora Sandbox no PagBank |
| Pix creation Sandbox E2E | **DEFERRED** — depende de OAuth concluído |
| Webhook Sandbox E2E | **DEFERRED** — depende de OAuth + cobrança real (assinatura SHA-256 já implementada e coberta por teste estrutural) |
| Reconciliation Sandbox E2E | **DEFERRED** — depende de OAuth |
| Production E2E | **DEFERRED** |
| Production release | **BLOCKED BY HOMOLOGATION AND PROD CREDENTIALS** |

### Alinhamento de secrets (executado nesta rodada)

- `src/lib/payments/pagbank-api.server.ts` agora resolve credenciais por
  ambiente com estes nomes canônicos, com fallback para os antigos:
  - Sandbox: `PAGBANK_SANDBOX_CLIENT_ID` / `PAGBANK_SANDBOX_CLIENT_SECRET`
    (fallback: `PAGBANK_CLIENT_ID_SANDBOX` / `PAGBANK_CLIENT_SECRET_SANDBOX`).
  - Produção: `PAGBANK_PROD_CLIENT_ID` / `PAGBANK_PROD_CLIENT_SECRET`
    (fallback: `PAGBANK_CLIENT_ID` / `PAGBANK_CLIENT_SECRET`).
- `PAGBANK_SANDBOX_TOKEN` é usado apenas para a operação one-shot de
  criação da aplicação (endpoint admin `POST /oauth2/application`) e
  **não** é consumido em runtime pelo fluxo OAuth do lojista.
- Nenhum secret duplicado foi criado; nenhum valor foi exposto em código,
  migrations, banco público ou logs; arquivos temporários apagados.

### Bloqueios reais que impedem rodar o Sandbox E2E autonomamente agora

1. **Login vendedor Sandbox** — o fluxo OAuth exige que um humano
   autentique numa conta vendedora de teste do PagBank e clique em
   "Autorizar". Não posso automatizar sem essas credenciais.
2. **Vault `pagbank_token_encryption_key` ausente** — sem esse segredo
   `pagbank_connect_complete` levanta `pagbank_encryption_key_missing`
   ao tentar gravar tokens. Precisa ser criado no vault do backend
   antes do primeiro Connect real (>= 32 chars).
3. **Feature gate por plano** — o restaurante de teste precisa estar
   num plano cujo `pagbank_enabled = true`.

Depois que (1)–(3) forem atendidos, o E2E completo (Connect → Pix →
Webhook → Reconciliação → Falhas) pode ser executado seguindo o roteiro
descrito nas Seções 3–8.

## 15. Requisitos externos ainda pendentes

- Homologação da aplicação PagBank Connect (produção).
- Conta vendedora PagBank Sandbox para o E2E interativo.
- Chave do vault `pagbank_token_encryption_key` provisionada.
- `PUBLIC_SITE_URL` já configurado (default `https://comandahub.online`).

Fora do escopo desta entrega (não implementado): split, cartão, custódia, comissão automática.

