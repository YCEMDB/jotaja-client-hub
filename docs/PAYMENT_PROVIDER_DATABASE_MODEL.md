---
name: Mercado Pago Database Model
description: Database schema and security model for Mercado Pago Connect in Mesivo V4
type: feature
---

# Modelagem de Banco de Dados — Mercado Pago (Mesivo V4)

## 1. Estrutura de Tabelas

### `public.restaurant_secrets` (Existente - Refatorar)
Armazena as credenciais sensíveis.
- `restaurant_id`: uuid (PK, FK restaurants)
- `mp_access_token_encrypted`: bytea (AES-256 via pgcrypto)
- `mp_refresh_token_encrypted`: bytea (AES-256 via pgcrypto) - **NOVO**
- `mp_public_key`: text - **NOVO (Migrar de restaurants)**
- `mp_merchant_id`: text - **NOVO**
- `mp_token_expires_at`: timestamptz - **NOVO**
- `mp_environment`: text (check 'sandbox', 'production')
- `updated_at`: timestamptz

### `public.mercadopago_oauth_states` (Existente)
Controle de CSRF e expiração para o fluxo OAuth.
- `state`: text (PK)
- `restaurant_id`: uuid (FK)
- `redirect_after`: text
- `created_at`: timestamptz
- `expires_at`: timestamptz
- `used_at`: timestamptz

### `public.mp_webhook_events` (Existente - Refatorar)
Auditoria e processamento de eventos.
- `id`: bigint (PK)
- `event_id`: text (Unique - Idempotência)
- `restaurant_id`: uuid
- `payload`: jsonb
- `status`: text (received, processing, processed, failed, dlq)
- `attempts`: int
- `last_error`: text
- `processed_at`: timestamptz

## 2. Índices e Performance
- `idx_restaurant_secrets_env`: B-tree em `mp_environment` para auditoria rápida.
- `idx_mp_webhook_event_id`: Unique B-tree em `event_id` (Idempotência crítica).
- `idx_mp_webhook_retry`: B-tree composto `(status, next_retry_at)` para jobs de reprocessamento.

## 3. Segurança e RLS (Row Level Security)

### Políticas `restaurant_secrets`
- **SELECT/UPDATE**: Apenas `authenticated` onde `auth.uid()` é o `owner` do restaurante ou possui papel `super_admin`.
- **INSERT/DELETE**: Proibido via API (gerenciado apenas por RPCs `SECURITY DEFINER`).

### Políticas `mp_webhook_events`
- **SELECT**: Apenas equipe do restaurante ou `super_admin`.
- **INSERT**: Apenas via `service_role` (Webhook handler).

## 4. Triggers e Auditoria
- `trg_mp_secret_audit`: Grava em `public.audit_logs` toda vez que um token for rotacionado.
- `trg_mp_webhook_process`: (Opcional) Notifica via `pg_net` ou similar para processamento assíncrono se necessário, embora o handler síncrono seja preferido para Mesivo V4.

## 5. Constraints
- `chk_mp_env`: `CHECK (mp_environment IN ('sandbox', 'production'))`.
- `chk_token_expiry`: `CHECK (mp_token_expires_at > created_at)`.
