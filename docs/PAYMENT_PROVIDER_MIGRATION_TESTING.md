---
name: Mercado Pago Migration & Testing Plan
description: Migration, Refresh Token strategy, and Testing Plan for Mercado Pago Connect
type: feature
---

# Plano de Migração e Testes — Mercado Pago (Mesivo V4)

## 1. Estratégia de Refresh Token

O Mercado Pago fornece um `refresh_token` que deve ser usado para obter um novo `access_token` sem que o usuário precise refazer o login.

- **Detecção:** Ao receber um 401 (Unauthorized) da API do MP, o backend tentará automaticamente a renovação.
- **Persistência:** O novo par de tokens é salvo no Vault, invalidando o anterior.
- **Cron Job:** Uma Edge Function/Task agendada verificará tokens que expiram em menos de 7 dias e forçará a renovação preventiva.

## 2. Plano de Migração (Legacy -> Connect)

### Passo 1: Compatibilidade
- Manter suporte ao `mp_access_token` legado em `restaurant_secrets` enquanto os restaurantes não migram.
- A função `createPixPayment` tentará primeiro o fluxo Connect; se não houver, usará o legado.

### Passo 2: Transição de UI
- Exibir banner para lojistas antigos: "Nova integração disponível. Clique aqui para atualizar e garantir maior segurança."
- Ao conectar via OAuth, o sistema desativa automaticamente as chaves manuais antigas.

### Passo 3: Preservação de Dados
- Nenhuma alteração em `orders` ou `order_payments` existentes. A migração afeta apenas a *origem* das credenciais, não o histórico financeiro.

## 3. Plano de Testes (QA)

### Testes de Integração (Sandbox)
1. **Fluxo OAuth Completo:** Início -> Autorização -> Callback -> Vault Save.
2. **Criação de Pix:** Validar payload (CPF de teste, Email de teste).
3. **Simulação de Webhook:** Envio de payload assinado fake para validar status `paid`.
4. **Idempotência:** Enviar o mesmo `event_id` duas vezes e verificar se apenas um registro é criado.

### Testes de Falha (Resiliência)
1. **Token Inválido:** Verificar se o sistema solicita reconexão ou tenta refresh.
2. **Webhook Timeout:** Verificar se o polling do frontend (fallback) assume a atualização do status.
3. **Cancelamento OAuth:** O usuário fecha a aba do MP antes de autorizar.

### Testes de Carga
- Simulação de 100 webhooks simultâneos para validar concorrência no banco de dados.
