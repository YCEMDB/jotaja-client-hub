---
name: Payment Provider Framework Phase 1.5 Review
description: Architectural review for the Universal Payment Provider infrastructure
type: design
---

# Fase 1.5 — Revisão da Infraestrutura Universal de Pagamentos

Este documento consolida a transição de uma integração específica (Mercado Pago) para um framework universal de Payment Providers na Mesivo.

## 1. Visão Geral da Mudança Estrutural

A plataforma Mesivo deixa de depender de implementações rígidas. O novo modelo de "Payment Provider Framework" isola cada gateway atrás de uma interface comum, garantindo que a adição de novos meios de pagamento no futuro seja trivial.

## 2. Abstração do Banco de Dados

### Transição de Nomenclatura
- **DE:** `mercadopago_token`, `mp_access_token`, `restaurant_secrets` (poluída).
- **PARA:** `restaurant_payment_accounts`, `provider_access_token`, `provider_refresh_token`.

### Benefícios
- **Desacoplamento:** O banco de dados não conhece as particularidades do Mercado Pago.
- **Multi-Tenant Seguro:** Cada conta de pagamento é vinculada a um restaurante e a um provedor específico.
- **Vault First:** Todos os tokens, independentemente do provedor, seguem o mesmo fluxo de criptografia AES-256 gerenciada centralmente.

## 3. Camada de Integração (Service Layer)

### Interface de Provedor
Foi definida uma interface padrão que todos os provedores (Stripe, PagBank, MP, etc.) devem seguir. Isso garante que o módulo de `Orders` e o `Financeiro` não precisem saber qual gateway está processando o pagamento.

### Roteamento de Webhooks
O sistema implementará um `WebhookResolver` central. Quando uma notificação chegar de qualquer provedor, o resolver:
1. Identifica o provedor pela URL ou Payload.
2. Localiza a `restaurant_payment_account` correspondente.
3. Delega o processamento ao `ProviderHandler` específico.
4. Normaliza o status da transação para o padrão Mesivo.

## 4. Segurança e Auditoria

- **OAuth State Universal:** O controle de CSRF agora funciona para qualquer fluxo de autorização externo.
- **Token Rotation:** O framework gerencia a expiração e renovação de tokens de forma genérica, baseando-se no campo `provider_token_expires_at`.
- **Logs de Erro:** Cada provedor tem um `provider_error_log` dedicado na tabela de contas para diagnósticos rápidos sem expor tokens.

## 5. Matriz de Impacto e Isolamento

| Módulo | Estratégia de Isolamento |
| :--- | :--- |
| **Financeiro** | Consome apenas o status normalizado do Mesivo. |
| **Checkout** | Interage com a Service Layer genérica. |
| **Admin UI** | Exibe cards dinâmicos baseados no status da conexão do provedor. |
| **Vault** | Centraliza chaves de criptografia independentes do provedor. |

## 6. Plano de Arquivos (Framework Universal)

### Estrutura de Pastas Proposta
- `src/lib/payments/providers/` (Implementações específicas: `mercadopago/`, `pagbank/`, etc.)
- `src/lib/payments/shared/` (Interface, Tipos, Webhook Resolver, Vault Helpers)
- `src/routes/api/public/payments/webhook` (Endpoint universal)
- `src/routes/api/public/payments/oauth` (Callback universal)

## 7. Próximos Passos (Fase 2)

Com a aprovação desta revisão universal, a Fase 2 (Infraestrutura) focará em:
1. Criar a migração SQL com as tabelas genéricas e o ENUM `payment_provider`.
2. Implementar as funções `SECURITY DEFINER` para manipulação segura de tokens.
3. Desenvolver o esqueleto da `PaymentProviderInterface`.
4. Mapear o Mercado Pago como a primeira implementação deste framework.

---
**Status:** Revisão Arquitetural Universal Concluída. Documentação alinhada aos novos requisitos de desacoplamento. Aguardando autorização para iniciar a Fase 2.
