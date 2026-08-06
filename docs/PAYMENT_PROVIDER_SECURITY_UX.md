---
name: Mercado Pago Security & UX Analysis
description: Security analysis and UX states for Mercado Pago Connect in Mesivo V4
type: reference
---

# Segurança e Experiência do Usuário (Mesivo V4)

## 1. Análise de Segurança

### Vetores de Ataque e Mitigações
| Vetor | Mitigação |
| :--- | :--- |
| **OAuth CSRF** | Uso de `state` aleatório de 32 bytes validado no banco com expiração de 10 min. |
| **Token Theft** | Criptografia AES-256 no banco via Supabase Vault (pgcrypto). Chave de criptografia nunca exposta ao browser. |
| **Replay Attack (Webhook)** | Idempotência rigorosa via `event_id` UNIQUE no banco de dados. |
| **Token Expiry** | Sistema automático de Rotação (Refresh Token) disparado antes da expiração. |
| **Multi-tenant Leak** | RLS forçando `restaurant_id = auth.uid()` em todas as queries e funções. |

### Infraestrutura de Tokens
- **Rotation:** Tokens são rotacionados a cada 180 dias (padrão MP) ou sob demanda.
- **Rate Limit:** Implementação de cache para o `access_token` em memória do Worker para evitar excesso de chamadas ao Vault/Banco.

## 2. Mockups de Estados da UI (Financeiro)

O redesenho da tela de Pagamentos eliminará campos manuais, focando em estados claros:

### A. Estado: Não Conectado
- **Visual:** Banner brutalista com gradiente Sunset Blaze.
- **CTA:** Botão "Conectar Mercado Pago" (One-Click).
- **Texto:** "Receba pagamentos via Pix e Cartão com taxas exclusivas."

### B. Estado: Conectado
- **Visual:** Badge verde Neon "Ativo".
- **Info:** Nome da conta conectada (mascarado), Merchant ID e Ambiente (Produção/Sandbox).
- **Ações:** "Testar Conexão" (Gera Pix de R$ 0,01) e "Desconectar".

### C. Estado: Erro / Atenção
- **Visual:** Borda pulsante magenta.
- **Cenários:** Webhook inativo, Token Expirado, Falha na última transação.
- **CTA:** "Reconectar agora" ou "Verificar Status".

## 3. Estratégia de Webhooks (Robustez)
- **Validação:** Verificação obrigatória da assinatura `x-signature` usando o `MP_WEBHOOK_SECRET`.
- **Retry:** Backoff exponencial para falhas de rede (1min, 5min, 15min, 1h).
- **DLQ:** Eventos que falharem após 5 tentativas são movidos para status `dlq` para intervenção manual do suporte Mesivo.
