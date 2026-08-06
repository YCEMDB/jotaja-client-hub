---
name: Mercado Pago Phase 1.5 Architectural Review
description: Comprehensive architectural review and infrastructure design for Mercado Pago Connect integration
type: design
---

# Fase 1.5 — Revisão Arquitetural Completa (Mercado Pago Connect)

Este documento detalha a infraestrutura, fluxos e segurança da integração Mercado Pago Connect, garantindo isolamento total e estabilidade da plataforma Mesivo.

## 1. Arquitetura do Banco de Dados

### Por que `restaurant_payment_accounts`?
Atualmente, as credenciais estão em `restaurant_secrets`. A criação de `restaurant_payment_accounts` é necessária para:
- **Multi-Provedor:** Suportar Mercado Pago, PagBank e outros no mesmo restaurante sem poluir a tabela de segredos genéricos.
- **Normalização:** Separar metadados públicos (Merchant ID, Status da Conexão, Ambiente) de segredos sensíveis (Tokens).
- **Escalabilidade:** Permitir que um restaurante tenha múltiplas contas ou métodos de pagamento de forma organizada.

### Estrutura Proposta
- **Tabela:** `public.restaurant_payment_accounts`
- **PK:** `id uuid DEFAULT gen_random_uuid()`
- **Relacionamentos:** `restaurant_id uuid REFERENCES public.restaurants(id) ON DELETE CASCADE`
- **Campos:**
  - `provider`: `text` (check `mercado_pago`, `pagbank`)
  - `provider_account_id`: `text` (ID único no MP)
  - `status`: `text` (check `active`, `expired`, `disconnected`)
  - `environment`: `text` (check `sandbox`, `production`)
  - `metadata`: `jsonb` (Armazena informações não sensíveis como nome da conta, email MP)
  - `created_at / updated_at`: `timestamptz`
- **Índices:**
  - `idx_payment_accounts_res_provider`: B-tree em `(restaurant_id, provider)` - busca rápida no checkout.
  - `idx_payment_accounts_external_id`: Unique B-tree em `(provider, provider_account_id)` - essencial para webhooks.
- **Auditoria:** Trigger que alimenta `public.audit_logs` em toda alteração de status ou provedor.

## 2. Fluxo OAuth Detalhado

1.  **Início:** Admin clica em "Conectar". Frontend chama `mercadopagoConnectInit`.
2.  **State:** Backend gera um `state` (UUID + Timestamp) e salva em `public.mercadopago_oauth_states`.
3.  **Autorização:** Usuário é redirecionado para o MP com `client_id` e `state`.
4.  **Callback:** MP redireciona para `/api/public/mercadopago/callback?code=...&state=...`.
5.  **Validação:** O handler valida se o `state` existe, pertence ao restaurante e não expirou (Proteção CSRF).
6.  **Exchange:** Backend chama API do MP para trocar `code` por `access_token` e `refresh_token`.
7.  **Vault:** Os tokens são criptografados (AES-256) e salvos via RPC `SECURITY DEFINER` na tabela de secrets protegida.
8.  **Account:** Cria/Atualiza o registro em `restaurant_payment_accounts`.
9.  **Checkout:** Quando um cliente paga, o sistema busca a conta `active` do restaurante e usa o token do Vault.
10. **Refresh:** Se o token expirar ou falhar, um job/handler usa o `refresh_token` para obter novos tokens e atualiza o Vault automaticamente.

## 3. Multi-Tenant e Isolamento

- **Isolamento de Dados:** Cada consulta ao banco incluirá obrigatoriamente `WHERE restaurant_id = auth.get_restaurant_id()`.
- **RLS:** Políticas de `SELECT` em `restaurant_payment_accounts` garantem que funcionários só vejam a conta do seu próprio restaurante.
- **Webhook Routing:** O webhook recebe o `provider_account_id`. O sistema busca o `restaurant_id` correspondente na tabela de contas, garantindo que o pagamento de um restaurante nunca seja creditado em outro.
- **Refresh Token Isolation:** O processo de refresh é atômico por `account_id`, garantindo que uma falha em um restaurante não afete outros.

## 4. Segurança e Criptografia

- **Criptografia:** AES-256-GCM para tokens em repouso. A chave de criptografia é gerenciada pelo Supabase Vault, inacessível via API REST.
- **CSRF:** O uso obrigatório do parâmetro `state` impede ataques de Cross-Site Request Forgery.
- **Rate Limiting:** Implementado via `mercadopago_oauth_states` (máximo de 3 tentativas por hora por restaurante).
- **Expiração:** `state` expira em 10 minutos. Tokens OAuth seguem a validade do provedor (MP).
- **Auditoria:** Registro completo de "Connect", "Disconnect" e "Token Refresh" nos logs do sistema.

## 5. Matriz de Impacto

| Módulo | Impacto | Risco | Alteração |
| :--- | :--- | :--- | :--- |
| **Checkout/Cardápio** | Nenhum | Baixo | Apenas passará a ler a nova tabela de contas se disponível. |
| **Painel Admin** | Nenhum | Baixo | Nova aba de configuração adicionada sem tocar nas existentes. |
| **Financeiro** | Nenhum | Baixo | Lançamentos continuam sendo feitos via `order_payments`. |
| **Caixa/KDS/Mesas** | Nenhum | Nulo | Estes módulos não interagem com o provedor de pagamento. |
| **RLS/Segurança** | Nenhum | Médio | Novas políticas serão adicionadas, sem alterar as atuais. |

## 6. Plano de Rollback

1.  **Migrations:** Uso de `down.sql` para remover tabelas e tipos criados.
2.  **Vault:** Os segredos novos serão versionados. Em caso de erro, os segredos antigos em `restaurant_secrets` permanecem intactos.
3.  **Código:** A nova lógica será protegida por um Feature Flag (`mp_connect_enabled`). Desativar a flag volta o sistema ao comportamento anterior instantaneamente.
4.  **Banco:** O `DROP TABLE` da nova tabela não afeta as tabelas core (`orders`, `restaurants`).

## 7. Plano de Testes

- **Unitários:** Validação de criptografia/descriptografia.
- **Integração:** Fluxo de troca de code (Mocked para CI, Real para Sandbox).
- **Segurança:** Teste de injeção de `state` inválido e acesso cross-tenant.
- **E2E (Playwright):** Fluxo completo desde o clique no admin até a confirmação do Pix no cardápio (Sandbox).
- **Concorrência:** Múltiplos webhooks simultâneos para o mesmo pedido.

## 8. Lista Exata de Arquivos (Planejado)

### Arquivos Novos
- `src/lib/payments/mercadopago-connect.server.ts`
- `src/lib/payments/mercadopago.service.server.ts`
- `supabase/migrations/[timestamp]_mp_connect_infra.sql`

### Arquivos Modificados
- `src/lib/payments/mercadopago-api.server.ts` (Refatoração interna)
- `src/routes/api/public/mercadopago/callback.ts` (Implementação lógica)
- `src/routes/_authenticated/admin.configuracoes.tsx` (Nova UI)

---
**Status:** Revisão Arquitetural Fase 1.5 entregue. Nenhuma alteração de código realizada. Aguardando auditoria final para permissão da Fase 2.
