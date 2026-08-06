---
name: Mercado Pago Phase 1 Mapping
description: Complete mapping of files and proposed infrastructure for Phase 1 of Mercado Pago Connect integration
type: feature
---

# Fase 1 — Mapeamento Completo do Código (Mercado Pago Connect)

Este documento cumpre o requisito da **Fase 1** da implementação definitiva do Mercado Pago Connect na Mesivo, garantindo isolamento total e sem modificações de código nesta etapa.

## 1. Mapeamento de Arquivos

### Arquivos Existentes que serão ALTERADOS (Refatoração em Fases Futuras)
Estes arquivos contêm a lógica legada baseada em credenciais manuais e serão migrados para o modelo OAuth Service.
- `src/lib/payments/mercadopago-api.server.ts`: Cliente de API legado. Será refatorado para usar tokens do Vault.
- `src/lib/payments/mercadopago.functions.ts`: Funções de servidor para UI. Serão unificadas com o novo fluxo.
- `src/routes/api/public/mercadopago/callback.ts`: Endpoint de retorno OAuth. Será robustecido com validação de `state`.
- `src/routes/api/public/mercadopago-webhook.ts` (na raiz de public): Webhook legado. Será refatorado para processamento assíncrono.
- `src/routes/_authenticated/admin.configuracoes.tsx`: Interface de configurações. Será alterada apenas na Fase 5 para adicionar o botão Connect.

### Arquivos NOVOS que serão criados
- `src/lib/payments/mercadopago-connect.server.ts`: Lógica central de OAuth, troca de tokens e refresh (Fase 3).
- `src/lib/payments/mercadopago.service.server.ts`: Camada de serviço isolada para abstrair a API do MP (Fase 4).
- `supabase/migrations/[timestamp]_mercadopago_connect_infra.sql`: Infraestrutura de banco, Vault e RLS (Fase 2).

### Arquivos REMOVIDOS
- Nenhum arquivo será removido imediatamente para garantir retrocompatibilidade. A lógica legada será desativada gradualmente após a Fase 8.

## 2. Infraestrutura Proposta (Fase 2)

### Migrations Propostas
- **Tabela `public.restaurant_payment_accounts`**: Centralização de contas conectadas (Mercado Pago, PagBank, etc).
  - Campos: `id`, `restaurant_id`, `provider` (enum), `provider_account_id`, `status`, `metadata` (JSONB), `created_at`, `updated_at`.
- **Vault Integration**: Armazenamento de `access_token` e `refresh_token` criptografados via `pg_vault` (ou tabela de secrets com RLS super-estrito).
- **RLS**: Políticas `SECURITY DEFINER` para garantir que apenas o sistema (Edge/Server Functions) possa rotacionar tokens.

### Edge Functions Propostas (via TanStack Server Routes)
- `/api/public/mercadopago/oauth-start`: Inicia o fluxo gerando o `state` seguro.
- `/api/public/mercadopago/oauth-callback`: Processa o retorno, valida `state`, troca code por tokens e persiste no Vault.

## 3. Riscos e Mitigação

| Risco | Impacto | Mitigação |
| :--- | :--- | :--- |
| **Interrupção de Pagamentos Atuais** | Alto | O sistema continuará usando as credenciais legadas de `restaurant_secrets` até a ativação final na Fase 8. |
| **Falha no Refresh Token** | Médio | Implementação de logs de auditoria e notificação automática para o lojista em caso de desconexão. |
| **Conflito de Multi-tenant** | Crítico | Isolamento absoluto via RLS e validação de `restaurant_id` em todas as rotas de callback. |
| **Vazamento de Tokens** | Crítico | Uso de criptografia AES-256 em repouso e transmissão exclusiva via HTTPS entre Mesivo e Mercado Pago. |

---
**Status:** Aguardando Aprovação do Checkpoint da Fase 1 para iniciar a Fase 2 (Infraestrutura).
