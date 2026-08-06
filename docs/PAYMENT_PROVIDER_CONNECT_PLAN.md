# Relatório de Auditoria Técnica: Implementação Mercado Pago Connect (OAuth) — MESIVO

Este documento apresenta a auditoria técnica da integração atual com o Mercado Pago e a proposta de reformulação definitiva para o padrão **OAuth (Connect)**, eliminando a configuração manual de credenciais pelos lojistas.

## 1. Auditoria da Implementação Atual (Por que falha?)

A arquitetura atual é baseada no modelo de **"Credenciais Diretas"**, que apresenta falhas estruturais para um modelo SaaS escalável:

- **Configuração Manual:** O lojista é obrigado a copiar e colar `Access Token` e `Public Key` no painel administrativo. Isso gera erros de digitação e insegurança.
- **Armazenamento Descentralizado:** Embora as chaves estejam criptografadas no banco (`restaurant_secrets`), a lógica de gestão (como o `verifyMercadoPago`) ainda é dependente de dados fornecidos pelo usuário.
- **Inconsistência de Ambiente:** Não há separação clara e automática entre Sandbox e Produção baseada na conta conectada; o sistema tenta adivinhar o ambiente pelo prefixo do token (`TEST-` vs `APP_USR-`).
- **Checkout Frágil:** O processo de criação de Pix (`createPixPayment`) depende de tokens estáticos que podem expirar, sem mecanismo de `refresh` automático.
- **Exposição de Risco:** Embora o token não seja retornado diretamente ao front, a interface ainda contém campos de input para segredos, o que vai contra a UX de "um clique".

## 2. Arquitetura Proposta: Mesivo Mercado Pago Connect

A nova arquitetura moverá toda a responsabilidade de autenticação para o fluxo OAuth oficial, tratando o Mercado Pago como um provedor de identidade e pagamento.

### Fluxo de Dados:
1. **Frontend:** Botão "Conectar Mercado Pago" chama a Server Function de início.
2. **Server Function (`oauth-start`):** Gera a URL de autorização usando `client_id` da Mesivo e um `state` seguro.
3. **Mercado Pago:** O lojista faz login e autoriza a Mesivo.
4. **Callback (`oauth-callback`):** Rota pública que recebe o `code`, valida o `state`, troca pelo `access_token` e `refresh_token`.
5. **Database:** Armazena os dados na nova tabela `restaurant_payment_accounts` com tokens criptografados.

## 3. Plano de Modificações

### Arquivos a serem modificados/criados:

- **Database (Migrations):**
  - Criar `restaurant_payment_accounts` (id, restaurant_id, provider, provider_user_id, access_token, refresh_token, etc.).
  - Migrar a lógica de `restaurant_secrets` para ser legada ou removida após transição.
- **Server Functions & Helpers:**
  - `src/lib/payments/mercadopago-api.server.ts`: Refatorar para usar o SDK oficial focado em OAuth.
  - `src/lib/payments/mercadopago.functions.ts`: Novas funções `startConnect`, `refreshToken`, `disconnect`.
- **Rotas:**
  - `src/routes/api/public/mercadopago/callback.ts`: Endpoint de recepção do OAuth.
  - `src/routes/api/public/mercadopago/webhook.ts`: Webhook unificado com validação de assinatura.
- **Frontend:**
  - `src/routes/_authenticated/admin.configuracoes.tsx`: Remover inputs de token; implementar o "Card Premium" de conexão.

### Arquivos a serem removidos/substituídos:
- As funções de "Usar credenciais Sandbox" manuais e campos de texto para `Access Token` na UI.

## 4. Riscos e Mitigação

- **Risco:** Perda de conexão em tokens existentes.
  - **Mitigação:** Manter suporte a credenciais legadas em `restaurant_secrets` como fallback temporário durante a fase de migração, marcando-as como "Depreciadas".
- **Risco:** Expiração de tokens.
  - **Mitigação:** Implementar worker de `refresh-token` automático acionado antes de cada transação se `expires_at` estiver próximo.

## 5. Próximos Passos (Após Aprovação)

1. Executar migration da nova tabela e políticas RLS.
2. Implementar `oauth-start` e `oauth-callback`.
3. Atualizar o serviço de pagamento para priorizar tokens da tabela `restaurant_payment_accounts`.
4. Atualizar a UI do painel administrativo.

---
**Aguardando aprovação para iniciar a implementação.**
