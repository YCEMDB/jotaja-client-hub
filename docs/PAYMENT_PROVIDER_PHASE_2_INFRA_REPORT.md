---
name: Payment Provider Framework Phase 2 Infrastructure Report
description: Report on the database infrastructure created for the Payment Provider Framework
type: feature
---

# Relatório de Checkpoint — Fase 2: Infraestrutura

A infraestrutura universal para o **Payment Provider Framework (PPF)** foi implementada com sucesso. Este módulo é totalmente aditivo e não altera nenhuma funcionalidade existente da Mesivo.

## 1. Banco de Dados (Migrations)

Foram criados os seguintes objetos no schema `public`:

### Tabelas e Tipos
- **TYPE `public.payment_provider`**: ENUM contendo `mercadopago`, `pagbank`, `stripe`, `asaas`, `stone`, `cielo`, `pagarme`, `paypal`.
- **TABLE `public.restaurant_payment_accounts`**: Armazena metadados públicos e status da conexão.
- **TABLE `public.restaurant_payment_secrets`**: Armazena tokens criptografados (Vault-ready).
- **TABLE `public.payment_oauth_states`**: Controle universal de CSRF para fluxos OAuth.
- **TABLE `public.payment_provider_webhook_logs`**: Log consolidado de auditoria e idempotência.

### Integridade e Performance
- **Índices**: 
    - `idx_payment_accounts_lookup`: Otimizado para busca de provedor ativo por restaurante.
    - `idx_payment_accounts_external`: Para roteamento rápido de webhooks via `provider_account_id`.
    - `idx_oauth_states_expiry`: Para limpeza de estados expirados.
- **Constraints**: 
    - Validação de estados (`active`, `disconnected`, etc).
    - Validação de ambientes (`sandbox`, `production`).
    - Unicidade em `(restaurant_id, provider, provider_account_id)`.

### Segurança e RLS
- **RLS Habilitado**: Todas as 4 tabelas possuem Row Level Security.
- **Policies**: 
    - Isolamento Multi-tenant: Usuários só visualizam dados vinculados ao seu `restaurant_id`.
    - Suporte a Super Admin: Acesso garantido via verificação de role na tabela `user_roles`.
    - **Vault Principle**: A tabela `restaurant_payment_secrets` não possui política de SELECT para usuários autenticados, sendo acessível apenas via `service_role` ou RPCs controladas.

### RPCs (Security Definer)
- `public.save_restaurant_payment_secrets`: Salva tokens de forma segura após validar a posse do restaurante, sem expor a lógica de criptografia ao frontend.

## 2. Segurança e Isolamento

- **Proteção de Tokens**: Armazenados em `bytea` (preparados para AES-256) em tabela isolada e inacessível via API REST padrão.
- **Isolamento Multi-tenant**: Garantido no nível do banco via RLS vinculada à tabela `restaurants`.
- **Dados Ocultos**: O frontend nunca recebe segredos; apenas metadados públicos (nome da conta, status, expiração) são trafegados.

## 3. Impacto no Sistema

**Confirmado**: Nenhum módulo existente foi alterado. 
- `public.restaurants` e `public.orders` permanecem intactos.
- O sistema atual continua operando normalmente; a nova infraestrutura é 100% aditiva.

## 4. Arquivos

- **Criado**: `docs/PAYMENT_PROVIDER_PHASE_2_INFRA_REPORT.md` (Este documento).
- **Modificado**: `supabase/migrations/` (Nova migration aplicada).

## 5. Validação de Infraestrutura

- [x] Migrações aplicadas sem erros.
- [x] RLS validado (Políticas apontando para `restaurant_id` e `user_roles`).
- [x] Constraints de unicidade e integridade referencial ativas.
- [x] RPC `save_restaurant_payment_secrets` criada com `SECURITY DEFINER`.

## 6. Rollback

Para desfazer a Fase 2, execute os seguintes comandos SQL (em ordem reversa):
1. `DROP FUNCTION public.save_restaurant_payment_secrets;`
2. `DROP TABLE public.payment_provider_webhook_logs;`
3. `DROP TABLE public.payment_oauth_states;`
4. `DROP TABLE public.restaurant_payment_secrets;`
5. `DROP TABLE public.restaurant_payment_accounts;`
6. `DROP TYPE public.payment_provider;`

---
**STATUS**: FASE 2 CONCLUÍDA. NENHUMA ALTERAÇÃO DE CÓDIGO REALIZADA. PARADO NO CHECKPOINT OBRIGATÓRIO.
