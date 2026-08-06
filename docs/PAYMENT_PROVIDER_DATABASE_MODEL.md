---
name: Payment Provider Framework Database Model
description: Generic database schema and security model for Mesivo Payment Providers
type: feature
---

# Modelagem de Banco de Dados Universal — Payment Provider (Mesivo V4)

Este modelo substitui implementações específicas por uma estrutura genérica e extensível, capaz de suportar qualquer gateway de pagamento.

## 1. Estrutura de Tabelas Genéricas

### `public.restaurant_payment_accounts`
Armazena o estado da conexão e metadados públicos de qualquer provedor.
- `id`: uuid (PK, default gen_random_uuid())
- `restaurant_id`: uuid (FK restaurants, ON DELETE CASCADE)
- `provider`: `payment_provider` (ENUM: 'mercadopago', 'pagbank', 'stripe', 'asaas', 'stone', etc.)
- `provider_account_id`: text (ID único do usuário/conta no provedor)
- `provider_user_id`: text (Identificador secundário, se necessário)
- `provider_status`: text (active, disconnected, expired, error)
- `provider_environment`: text (sandbox, production)
- `provider_capabilities`: jsonb (Ex: {"pix": true, "credit_card": false})
- `provider_metadata`: jsonb (Email, Nome da Loja no Provedor, etc.)
- `provider_last_sync`: timestamptz
- `provider_error_log`: text
- `is_active`: boolean (Se esta é a conta principal para o provedor)
- `created_at / updated_at`: timestamptz

### `public.restaurant_payment_secrets` (Vault Protected)
Armazena tokens sensíveis via RPC Security Definer.
- `account_id`: uuid (PK, FK restaurant_payment_accounts)
- `provider_access_token_encrypted`: bytea (AES-256 via pgcrypto)
- `provider_refresh_token_encrypted`: bytea (AES-256 via pgcrypto)
- `provider_token_expires_at`: timestamptz
- `provider_scopes`: text[]
- `updated_at`: timestamptz

### `public.payment_oauth_states`
Controle universal de CSRF para fluxos OAuth.
- `state`: text (PK)
- `restaurant_id`: uuid (FK)
- `provider`: `payment_provider`
- `redirect_after`: text
- `created_at`: timestamptz
- `expires_at`: timestamptz
- `used_at`: timestamptz

### `public.payment_webhook_events` (Consolidada)
Log de auditoria e idempotência para todos os provedores.
- `id`: bigint (PK)
- `provider`: `payment_provider`
- `event_id`: text (Unique por provider para Idempotência)
- `account_id`: uuid (FK restaurant_payment_accounts)
- `payload`: jsonb
- `status`: text (received, processing, processed, failed, ignored)
- `attempts`: int (default 0)
- `last_error`: text
- `processed_at`: timestamptz

## 2. Tipos e Enums

```sql
CREATE TYPE public.payment_provider AS ENUM (
  'mercadopago', 
  'pagbank', 
  'stripe', 
  'asaas', 
  'stone', 
  'cielo', 
  'pagarme', 
  'paypal'
);
```

## 3. Segurança e RLS (Row Level Security)

### Políticas `restaurant_payment_accounts`
- **SELECT**: Apenas `authenticated` que pertençam ao restaurante ou `super_admin`.
- **UPDATE**: Apenas `owner` ou `super_admin`.
- **INSERT/DELETE**: Apenas via lógica de serviço controlada.

### Políticas `restaurant_payment_secrets`
- **ACESSO**: Totalmente bloqueado para SELECT via API.
- **MANIPULAÇÃO**: Exclusiva via funções `SECURITY DEFINER` que validam o `restaurant_id`.

## 4. Índices Críticos
- `idx_payment_accounts_lookup`: Unique B-tree em `(restaurant_id, provider, is_active)`.
- `idx_payment_webhook_idempotency`: Unique B-tree em `(provider, event_id)`.
- `idx_payment_accounts_external`: B-tree em `(provider, provider_account_id)` para roteamento de webhooks.

## 5. Constraints de Negócio
- `chk_provider_env`: `CHECK (provider_environment IN ('sandbox', 'production'))`.
- `chk_provider_status`: `CHECK (provider_status IN ('active', 'disconnected', 'expired', 'error'))`.
- `chk_oauth_expiry`: `CHECK (provider_token_expires_at > updated_at)`.
