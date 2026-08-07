---
name: Payment Provider Framework Phase 3 Completion Report
description: Detailed technical report on the OAuth connection flow implementation and RPC inventory.
type: feature
---

# Relatório Técnico — Fase 3: Payment Provider Connection / OAuth

A Fase 3 foi concluída com a implementação do fluxo universal de conexão OAuth, utilizando o Mercado Pago como o primeiro provedor integrado ao **Payment Provider Framework (PPF)**.

## 1. Inventário de RPCs (Banco de Dados)

Conforme solicitado, seguem os detalhes das RPCs manipuladas nesta fase. Nenhuma RPC de módulos core foi alterada.

### Novas RPCs Criadas
- **`public.save_payment_oauth_state`**
    - **Assinatura:** `(p_restaurant_id uuid, p_provider payment_provider, p_metadata jsonb default '{}') RETURNS text`
    - **Finalidade:** Gera um state criptograficamente seguro (UUID v4), armazena-o com expiração de 15 minutos e vincula ao restaurante para prevenir CSRF.
    - **Segurança:** `SECURITY INVOKER` (Respeita permissões do usuário logado).
    - **Grants:** `GRANT EXECUTE ON FUNCTION public.save_payment_oauth_state TO authenticated;`
    - **Tabelas acessadas:** `public.payment_oauth_states` (INSERT).

- **`public.verify_and_consume_oauth_state`**
    - **Assinatura:** `(p_state text, p_restaurant_id uuid) RETURNS jsonb`
    - **Finalidade:** Valida se o state existe, se pertence ao restaurante, se não expirou e se ainda é válido. Consome o state (marca como usado) para impedir ataques de replay.
    - **Segurança:** `SECURITY INVOKER`.
    - **Grants:** `GRANT EXECUTE ON FUNCTION public.verify_and_consume_oauth_state TO authenticated, service_role;`
    - **Tabelas acessadas:** `public.payment_oauth_states` (SELECT, UPDATE).

### RPCs Existentes / Mantidas (Fase 2)
- **`public.save_restaurant_payment_secrets`**
    - **Assinatura:** `(p_restaurant_id uuid, p_provider payment_provider, p_provider_account_id text, p_access_token text, p_refresh_token text, p_expires_at timestamptz, p_raw_data jsonb default '{}') RETURNS void`
    - **Finalidade:** Persistência segura de credenciais sensíveis.
    - **Segurança:** `SECURITY DEFINER` (Necessário para escrita em tabela protegida/Vault).
    - **Tabelas acessadas:** `public.restaurant_payment_secrets` (INSERT/UPDATE), `public.restaurant_payment_accounts` (INSERT/UPDATE).

## 2. Framework e Adapters (Código)

- **`IMesivoPaymentProvider`**: Interface universal que define o contrato para `getAuthorizationUrl`, `exchangeAuthorizationCode` e `disconnect`.
- **`MercadoPagoAdapter`**: Implementação específica que isola a SDK/API do Mercado Pago, garantindo que o Core da Mesivo não dependa de bibliotecas externas de pagamento.
- **Isolamento de Tokens**: O `access_token` é trocado no servidor e enviado diretamente para o Vault via RPC `SECURITY DEFINER`. O frontend recebe apenas a confirmação de sucesso e metadados públicos.

## 3. Segurança e Multi-tenant

- **CSRF Protection**: Implementada via tabela `payment_oauth_states`.
- **Tenant Binding**: O fluxo OAuth é iniciado e finalizado validando o `restaurant_id` da sessão autenticada contra o state gerado.
- **Zero Exposure**: Tokens nunca são registrados em logs, impressos no console ou retornados para o frontend.

## 4. Status das Regras de Negócio

- [x] Vínculo seguro com `restaurant_id`.
- [x] Persistência segura das credenciais.
- [x] Desconexão funcional.
- [x] Ausência de integração com pagamentos/checkout (Escopo preservado).
- [x] Ausência de alteração funcional nos módulos core (Pedidos, Caixa, etc).

---
**ESTADO ATUAL**: AGUARDANDO PLANO DA FASE 4.
