---
name: Payment Provider Framework Architecture
description: Universal architecture design for Mesivo Payment Providers
type: design
---

# Arquitetura Payment Provider Framework — Mesivo V4

Esta arquitetura define a infraestrutura universal para meios de pagamento da Mesivo, projetada para ser desacoplada e suportar múltiplos provedores (Mercado Pago, PagBank, Stripe, etc.) sem remodelagem estrutural.

## 1. Fluxo de Autorização Universal (OAuth 2.0)

```mermaid
sequenceDiagram
    participant User as Usuário (Admin)
    participant Front as Frontend (React UI)
    participant Back as Backend (Provider Layer)
    participant Provider as External Provider (MP, PagBank, etc.)
    participant DB as Banco (Supabase + Vault)

    User->>Front: Seleciona Provider e Conecta
    Front->>Back: providerConnectInit(provider_name)
    Back->>DB: Gera state universal + expiração
    Back-->>Front: Retorna URL de autorização do Provedor
    Front->>Provider: Redireciona para o Provedor
    Provider->>User: Pede autorização
    User->>Provider: Autoriza
    Provider->>Back: GET /api/public/oauth/callback?code=...&state=...
    Back->>Back: Resolver identifica Provider via State
    Back->>DB: Valida state (anti-CSRF)
    Back->>Provider: Troca code por access_token + refresh_token
    Provider-->>Back: Retorna tokens + metadados
    Back->>DB: Criptografa e salva no Vault (payment_accounts)
    Back-->>User: Redireciona para o Painel (Sucesso)
```

## 2. Camadas do Framework

A arquitetura segue uma divisão rigorosa de responsabilidades:

1. **Restaurant Layer:** Entidade dona das configurações.
2. **Payment Provider Layer:** Interface comum (`PaymentProviderInterface`).
3. **OAuth Layer:** Handlers específicos para troca e renovação de tokens.
4. **Token Layer:** Armazenamento seguro e genérico no Vault.
5. **Webhook Layer:** Receptor universal com roteamento para Handlers específicos.
6. **Payment Services:** Lógica de negócio (Pix, Cartão) que consome os Providers.
7. **Orders & Financeiro:** Consumidores finais do resultado da transação.

## 3. Interface Comum do Provider

Cada provedor deve implementar obrigatoriamente:
- `startAuthorization()`: Gera URL de auth.
- `exchangeCode()`: Troca código por tokens.
- `refreshToken()`: Renova tokens expirados.
- `disconnect()` / `revoke()`: Encerra a conexão.
- `validateWebhook()`: Valida assinaturas de eventos.
- `processWebhook()`: Converte payload proprietário para o formato Mesivo.
- `getAccount()`: Retorna metadados da conta conectada.
- `getCapabilities()`: Informa quais métodos são suportados (Pix, Crédito, etc).

## 4. Fluxo de Pagamento Universal

```mermaid
sequenceDiagram
    participant Customer as Cliente
    participant Checkout as Mesivo Checkout
    participant Service as Payment Service (Mesivo)
    participant Provider as Provider Handler (MP, etc.)
    participant DB as Banco (payment_accounts)

    Customer->>Checkout: Escolhe Método de Pagamento
    Checkout->>Service: processPayment(order_id)
    Service->>DB: Busca conta ativa (provider_account)
    Service->>Provider: createTransaction(amount, metadata)
    Provider-->>Service: Retorna Link/QR Code/Status
    Service->>DB: Registra order_payments (Status Mesivo)
    Service-->>Checkout: Exibe resultado ao Cliente
```

## 5. Estratégia de Webhooks (Resolver)

- **Endpoint Único:** `/api/public/webhooks/payments`
- **Roteamento:** O corpo ou headers da requisição identificam o provedor.
- **Handler:** O `WebhookResolver` despacha para o `ProviderHandler` correspondente.
- **Normalização:** O Handler traduz o status externo (ex: `approved`) para o status interno da Mesivo (ex: `paid`).

## 6. Segurança e Vault

- **Nomes Genéricos:** Nenhuma coluna no banco deve referenciar provedores específicos.
- **Campos:** `provider_access_token`, `provider_refresh_token`, `provider_token_expires_at`.
- **Encryption:** AES-256-GCM com chaves gerenciadas pelo Vault.
- **Isolamento:** Multi-tenant garantido por `restaurant_id` em todas as tabelas de contas.

## 7. Escalabilidade (Futuro)

Para adicionar um novo provedor (ex: Stripe):
1. Criar pasta `src/lib/payments/providers/stripe/`.
2. Implementar a interface comum.
3. Adicionar o provedor no ENUM `payment_provider`.
4. Ativar Feature Flag `payments.providers.stripe`.
5. **Resultado:** Nenhuma alteração no core do sistema é necessária.
