---
name: Mercado Pago Audit
description: Audit of current Mercado Pago implementation for Mesivo V4
type: reference
---

# Auditoria Técnica Completa — Mercado Pago (Mesivo V4)

Este documento detalha o estado atual da integração com o Mercado Pago antes da migração definitiva para o modelo Connect (OAuth).

## 1. Mapeamento de Arquivos e Componentes

| Arquivo | Finalidade | Status | Impacto |
| :--- | :--- | :--- | :--- |
| `src/lib/payments/mercadopago-api.server.ts` | Cliente HTTP e SDK para comunicação com a API do MP. | **Refatorar** | Centralizar lógica de Refresh Token e Vault. |
| `src/lib/payments/mercadopago.functions.ts` | Server functions para o frontend (Connect Init, Pix Test). | **Refatorar** | Remover hacks de Sandbox e unificar com o novo fluxo OAuth. |
| `src/lib/payments.functions.ts` | Helpers compartilhados de pagamento (Pix, Sync). | **Refatorar** | Mover lógica MP para seu módulo específico. |
| `src/routes/api/public/mercadopago-webhook.ts` | Endpoint de recepção de eventos do MP. | **Refatorar** | Implementar validação robusta de assinatura e DLQ real. |
| `src/routes/api/public/mercadopago/callback.ts` | Callback do fluxo OAuth. | **Refatorar** | Melhorar segurança de `state` e tratamento de erros. |
| `src/routes/_authenticated/admin.financeiro.tsx` | Dashboard financeiro e conciliação. | **Refatorar** | Redesign visual completo (Etapa 5). |
| `src/routes/_authenticated/admin.configuracoes.tsx` | UI de configuração (Aba Pagamentos). | **Refatorar** | Remover campos manuais; adicionar One-Click Connect. |
| `src/routes/pedido.$orderId.tsx` | Acompanhamento de pedido pelo cliente final. | **Mantido** | Pequenos ajustes na exibição do status PIX. |
| `src/routes/$slug.tsx` | Cardápio digital (Checkout). | **Mantido** | Sem alterações estruturais. |

## 2. Banco de Dados e Segurança

### Tabelas Envolvidas
- `public.restaurant_secrets`: Armazena tokens criptografados. **Refatorar** (Adicionar Refresh Tokens).
- `public.order_payments`: Registros canônicos de pagamento. **Mantido**.
- `public.mp_webhook_events`: Log de eventos recebidos. **Refatorar** (Mecanismo de retry/DLQ).
- `public.mercadopago_oauth_states`: Controle de CSRF para OAuth. **Mantido**.

### RLS e Políticas
- Acesso a secrets restrito a `owner` e `super_admin`.
- `order_payments` acessível apenas pela equipe do restaurante e admins.
- `payment_apply_provider_event` (RPC): Ponto crítico de segurança para alteração de status financeiro.

## 3. Riscos Identificados
1. **Quebra de Retrocompatibilidade:** Pedidos antigos que ainda usam `orders.mp_payment_id` sem backfill em `order_payments`.
2. **Exposição de Tokens:** Risco de tokens em texto plano se o Vault/Criptografia falhar.
3. **Idempotência:** Duplicidade de pagamentos se o webhook for processado simultaneamente ao polling do cliente.
4. **Rate Limit:** Bloqueio pela API do Mercado Pago se o polling do cliente for excessivo (4s atual).

## 4. Plano de Ação
- **Fase 1:** Redesign do Financeiro e Configurações (UI).
- **Fase 2:** Infraestrutura de Refresh Token e Rotação automática.
- **Fase 3:** Migração de Segredos para o novo padrão.
- **Fase 4:** Testes E2E em Sandbox.
