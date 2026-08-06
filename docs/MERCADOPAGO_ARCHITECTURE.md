---
name: Mercado Pago Architecture
description: Architecture design for Mercado Pago Connect in Mesivo V4
type: design
---

# Arquitetura Mercado Pago Connect — Mesivo V4

## 1. Fluxo de Autorização (OAuth 2.0)

```mermaid
sequenceDiagram
    participant User as Usuário (Admin)
    participant Front as Frontend (React)
    participant Back as Backend (Server Fn)
    participant DB as Banco (Supabase + Vault)
    participant MP as Mercado Pago OAuth

    User->>Front: Clica em "Conectar Mercado Pago"
    Front->>Back: mercadopagoConnectInit()
    Back->>DB: Gera state único + expiração
    Back-->>Front: Retorna URL de autorização MP
    Front->>MP: Redireciona para Mercado Pago
    MP->>User: Pede autorização
    User->>MP: Autoriza
    MP->>Back: GET /api/public/mercadopago/callback?code=...&state=...
    Back->>DB: Valida state (anti-CSRF)
    Back->>MP: Troca code por access_token + refresh_token
    MP-->>Back: Retorna tokens + public_key
    Back->>DB: Criptografa e salva no Vault (restaurant_secrets)
    Back-->>User: Redireciona para o Painel (Sucesso)
```

## 2. Fluxo de Pagamento Pix

```mermaid
sequenceDiagram
    participant Customer as Cliente Final
    participant Front as Cardápio ($slug)
    participant Back as Server Fn (createPixPayment)
    participant MP as Mercado Pago API
    participant DB as Banco (order_payments)

    Customer->>Front: Finaliza Pedido (Pix)
    Front->>Back: Solicita criação de cobrança
    Back->>DB: Recupera access_token criptografado
    Back->>MP: POST /v1/payments (com Idempotency-Key)
    MP-->>Back: Retorna QR Code + ID do Pagamento
    Back->>DB: Registra order_payments (status: waiting)
    Back-->>Front: Exibe QR Code ao Cliente
```

## 3. Fluxo de Webhook e Conciliação

```mermaid
sequenceDiagram
    participant MP as Mercado Pago (Webhook)
    participant Hook as /api/public/mercadopago-webhook
    participant DB as Banco (mp_webhook_events)
    participant RPC as RPC (payment_apply_provider_event)
    participant Finance as Módulo Financeiro

    MP->>Hook: Evento "payment.updated"
    Hook->>Hook: Valida Assinatura (X-Signature)
    Hook->>DB: Salva payload (idempotência por event_id)
    Hook->>RPC: Processa evento e atualiza status
    RPC->>DB: Atualiza order_payments para "paid"
    RPC->>Finance: Gera lançamento de entrada no DRE/Caixa
    Hook-->>MP: 200 OK
```

## 4. Estratégia de Refresh Token

- **Gatilho:** Falha 401 na API ou verificação periódica (TTL).
- **Processo:** O Backend utiliza o `refresh_token` salvo para obter um novo par de tokens.
- **Rotação:** O novo `refresh_token` substitui o antigo imediatamente para manter a validade da conexão sem intervenção do lojista.
