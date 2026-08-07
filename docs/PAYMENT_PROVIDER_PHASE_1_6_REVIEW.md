---
name: Payment Provider Framework Phase 1.6 Review
description: Consolidation of universal architecture and readiness assessment
type: design
---

# Fase 1.6 — Payment Provider Framework Review

Este documento consolida a arquitetura universal do **Payment Provider Framework (PPF)** da Mesivo antes de qualquer alteração na infraestrutura. O objetivo é garantir que o sistema seja totalmente desacoplado de provedores específicos como Mercado Pago.

## 1. Arquitetura Mesivo Core vs Providers

A estrutura segue uma hierarquia de baixo acoplamento:

**Mesivo Core** (Pedidos, Caixa, Financeiro)
    ↓
**Payment Provider Framework** (Interface Universal, Roteamento, Vault)
    ↓
**Provider Adapter** (Implementação específica: Mercado Pago, Stripe, etc.)
    ↓
**Provider Externo** (API do Gateway)

## 2. Contrato / Interface Universal

Todo `ProviderAdapter` deve implementar a interface `IMesivoPaymentProvider`:

- `getAuthorizationUrl(restaurantId, state)`: Inicia fluxo OAuth.
- `handleOAuthCallback(code, state)`: Troca código por tokens e salva via Vault.
- `refreshTokens(accountId)`: Renova tokens expirados.
- `createPixPayment(orderId, amount, payerData)`: Cria cobrança Pix.
- `getPaymentStatus(providerTransactionId)`: Consulta status atual.
- `cancelPayment(providerTransactionId)`: Cancela transação.
- `validateWebhook(payload, headers)`: Valida autenticidade da notificação.
- `parseWebhook(payload)`: Traduz evento externo para `MesivoPaymentEvent`.

## 3. Modelo de Dados Definitivo (Tabelas)

### `public.restaurant_payment_accounts`
A única fonte de verdade para conexões ativas.
- `id`: uuid (PK)
- `restaurant_id`: uuid (FK)
- `provider`: `payment_provider` (ENUM: 'mercadopago', 'pagbank', 'stripe', etc.)
- `provider_account_id`: text (ID da conta no provedor - ex: MP User ID)
- `provider_status`: text (active, disconnected, expired, error)
- `provider_environment`: text (sandbox, production)
- `provider_metadata`: jsonb (Email, Nome da Loja no Provedor)
- `is_active`: boolean (Se é o provedor atual para novos pagamentos)

### `public.restaurant_payment_secrets` (Vault)
Acesso restrito via `SECURITY DEFINER` RPC.
- `account_id`: uuid (FK restaurant_payment_accounts)
- `provider_access_token_encrypted`: bytea
- `provider_refresh_token_encrypted`: bytea
- `provider_token_expires_at`: timestamptz

## 4. Estratégias de Abstração e Segurança

### OAuth e Identificação
- **provider_account_id**: Usado para rotear webhooks para o restaurante correto sem precisar decifrar tokens.
- **OAuth Abstraction**: O framework gerencia o `state` universal para evitar CSRF em qualquer provedor.
- **Vault Storage**: Armazenamento criptografado (AES-256) com chaves gerenciadas pelo banco, nunca expostas ao frontend.

### Webhook Abstraction
- **Endpoint Único**: `/api/public/payments/webhook`
- **Roteamento**: O `WebhookResolver` identifica o provider pelo cabeçalho (ex: `User-Agent` ou `X-Signature`) ou payload e despacha para o adapter correto.

### Idempotência e Erros
- **Idempotência**: Baseada na chave `(provider, event_id)` na tabela `payment_webhook_events`.
- **Tratamento de Erros**: Erros de provider são capturados no `provider_error_log` para depuração sem comprometer segredos.

## 5. Matriz de Impacto e Isolamento

| Módulo | Depende de MP? | Mudança Necessária |
| :--- | :--- | :--- |
| **Pedidos (Orders)** | Não | Nenhuma (Interage com PPF) |
| **Financeiro (Cash)** | No | Nenhuma (Consome status normalizado) |
| **Checkout UI** | Não | Atualizar para chamar endpoint universal do PPF |
| **Admin Settings** | Não | Usar interface dinâmica de conexões |

## 6. Adição de Novos Providers

Para adicionar o **Stripe** no futuro:
1. Adicionar `'stripe'` ao ENUM `payment_provider`.
2. Criar `StripeAdapter.ts` implementando a interface universal.
3. Registrar o adapter no `ProviderFactory`.
4. **Nenhum código core (Pedidos, Caixa) é alterado.**

## 7. Objetivos da Fase 2 (Futuras Migrations)

**Lista EXATA de objetos a criar:**
1. TYPE `public.payment_provider` (ENUM).
2. TABLE `public.restaurant_payment_accounts`.
3. TABLE `public.restaurant_payment_secrets`.
4. TABLE `public.payment_oauth_states`.
5. TABLE `public.payment_webhook_events`.
6. RPC `public.save_payment_tokens` (Security Definer).
7. RPC `public.get_payment_token` (Security Definer).

**Lista EXATA de objetos existentes que NÃO serão modificados:**
- `public.restaurants`
- `public.orders`
- `public.order_payments`
- `public.cash_movements`
- Todas as tabelas de cardápio e estoque.

---
**Riscos Identificados:**
- Expiração de tokens durante períodos de inatividade do sistema.
- Mudanças nas APIs de terceiros que quebrem o Adapter (isolado do core).

**ROLLBACK:**
- Manter suporte ao `mercadopago_token` nas tabelas antigas durante a migração (dual-write se necessário), seguido de depreciação.

**STATUS:** FASE 1.6 CONCLUÍDA. NENHUMA ALTERAÇÃO DE CÓDIGO REALIZADA. AGUARDANDO APROVAÇÃO.
