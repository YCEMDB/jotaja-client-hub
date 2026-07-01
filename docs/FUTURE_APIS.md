# APIs Futuras — Comandex

Arquitetura prevista. **Nada aqui está implementado** — este documento existe para guiar decisões de design.

## 🚧 WhatsApp Business API

**Objetivo:** enviar confirmação de pedido, atualizações de status e campanhas via WA oficial (não apenas deep link).

- Provider: Meta Cloud API direto OU BSP (360dialog, Zenvia).
- Templates aprovados: `order_confirmed`, `order_out_for_delivery`, `order_delivered`, `campaign_promo`.
- Tabela: `whatsapp_templates` (id, name, status, body_pt).
- Fila: `pgmq.q_whatsapp` (dedicada, com DLQ).
- Consumer: server function `sendWhatsAppTemplate` chamada por consumidor da fila.
- Custo: por template session — restaurar em `restaurant_secrets` cifrado.
- Opt-in obrigatório: `customers.opt_in_whatsapp`.

## 🚧 API Pública (v1)

**Público-alvo:** integradores (POS, ERPs) do plano `business`.

- Autenticação: API key por restaurante (`Bearer sk_live_...`), gerada em `/admin/api-keys`.
- Tabela: `api_keys` (hash SHA-256, `restaurant_id`, `scopes[]`, `last_used_at`, `revoked_at`).
- Rota base: `/api/public/v1/*` — todas exigem header `Authorization`.
- Endpoints previstos:
  - `GET /orders` — listar (com paginação/filter)
  - `GET /orders/:id`
  - `POST /orders` — criar pedido interno
  - `PATCH /orders/:id/status` — proxy para `update_order_status`
  - `GET /products` / `POST /products`
  - `GET /customers`
- Rate limit: 60 req/min por key (sliding window em Redis ou tabela).
- Versionamento: no path (`/v1`).
- Observabilidade: log de cada request em `api_requests`.

## 🚧 Webhooks (out)

**Objetivo:** notificar sistema externo do restaurante em eventos.

- Tabela: `webhook_endpoints` (`restaurant_id`, `url`, `secret`, `events[]`).
- Eventos: `order.created`, `order.status_changed`, `order.paid`, `customer.created`.
- Entrega: server function assíncrona com assinatura HMAC `X-Comandex-Signature`.
- Retry: exponential backoff (1min, 5min, 30min, 2h). Após 4 falhas → desativa endpoint.
- Log: `webhook_deliveries`.

## 🚧 Multiunidade

**Objetivo:** rede de restaurantes gerida por um único grupo.

- Nova tabela: `restaurant_groups` (id, name, owner_id).
- `restaurants.group_id` (nullable) — FK.
- Novo role `group_admin` — visão consolidada de N restaurantes.
- Cardápio compartilhado opcional (`products.group_id`).
- Dashboard consolidado: `/group/dashboard` — receita, pedidos, ranking de lojas.
- Relatórios cross-unidade.

## 🚧 CRM Avançado

Já parcialmente implementado (`customers`). Expansões:

- Segmentos com view materializada.
- Automações: gatilho ("aniversário chegou") → ação ("enviar cupom via WA").
- Score de churn.
- Integração Zapier/Make via webhooks.

## 🚧 Programa de Fidelidade

- Config por restaurante em `restaurants.loyalty_config` JSONB:
  ```json
  { "cashback_percent": 5, "points_per_real": 1, "min_redeem": 100 }
  ```
- Colunas em `customers`: `cashback_balance`, `loyalty_points`.
- RPCs: `apply_loyalty_reward`, `credit_cashback_on_order`.
- UI: banner no cardápio + widget "seu saldo".

## 🚧 KDS (Kitchen Display System)

**Sprint 3 (próxima).**

- Rota: `/kds/:station?` (station opcional: `kitchen`, `bar`, `all`).
- Modo full-screen (fecha sidebar).
- Colunas: `pending` (novos), `preparing`, `ready`.
- Drag & drop entre colunas → `update_order_status`.
- Timer visual por card (verde < 10min, amarelo 10-20, vermelho > 20).
- Som em novo pedido (config por station).
- Config por restaurante: quais estações existem, roteamento por categoria de produto.

## 🚧 Mesas e Comandas (Dine-in)

- Nova tabela: `tables` (`restaurant_id`, `number`, `qr_code`, `capacity`, `status`).
- Cliente escaneia QR → cardápio já com `type=dine_in` e `table_id`.
- Comanda aberta: agrupa múltiplos pedidos até fechamento.
- Split de conta.
- Chamar garçom (evento `service_requested`).

## 🚧 App do Entregador (PWA)

**Sprint 6.**

- Rota `/driver` (auth por telefone + código).
- Lista de entregas atribuídas.
- Aceitar/recusar.
- Navegação (deep link Google Maps/Waze).
- Confirmação de entrega com foto/assinatura.
- Ganhos do dia.

## 🚧 Importador iFood

- OAuth iFood Merchant.
- Sync inicial: catálogo (categorias + produtos + imagens).
- Sync contínuo: pedidos entrando no iFood aparecem no painel Comandex.
- Sync bidirecional de status.
- Reconciliação de estoque.

## 🚧 Importador Anota Aí

- Import one-shot via export CSV/JSON do Anota Aí.
- Mapeamento de campos.
- Preview antes de commit.
- Rollback disponível por 7 dias.

---

## Princípios para APIs Futuras

- Toda API externa DEVE usar RPCs existentes (não escrever direto em tabela).
- Toda integração DEVE ser opt-in por plano (`business` para maioria).
- Toda escrita externa DEVE gerar entrada em audit log.
- Toda credencial DEVE ficar em `restaurant_secrets` cifrada.
- Nunca expor `service_role` a integradores.
