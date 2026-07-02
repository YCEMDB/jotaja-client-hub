# Automações de Conversa (Sprint 4.3)

Motor de resposta automática por regras, sem IA. Todas as respostas passam pela fila oficial `communication_queue`.

## Regras padrão (seed)

Botão "Regras padrão" em `/admin/comunicacao` → aba **Automações** cria:

| code | trigger | comportamento |
|------|---------|---------------|
| status | `status` | Responde com status/número/total do pedido |
| pix | `pix` | Envia link do cardápio para pagamento |
| menu | `menu` | Envia link do cardápio |
| horario | `horario` | Envia link com horário |
| endereco | `endereco` | Envia link com endereço |
| cancelar | `cancelar` | **handoff**: marca conversa como `needs_human` |
| atendente | `atendente` | **handoff**: marca conversa como `needs_human` |

## Variáveis suportadas

- `{{customer_name}}`, `{{order_number}}`, `{{order_status}}`, `{{order_total}}`, `{{menu_url}}`

Renderização via `private.comm_render` — sanitiza caracteres de controle e neutraliza `{{}}` embutidas em valores.

## Matching

- `trigger_type`: `keyword` (padrão) ou `regex`.
- `match_mode` para keyword: `contains` (padrão), `exact`, `starts_with`.
- Case-insensitive + `unaccent_safe` (remove acentos).
- Ordem de avaliação: `priority ASC, created_at ASC`. Primeira regra que casar dispara.

## Cooldown

Cada `(conversation_id, rule_id)` respeita `cooldown_seconds` (padrão 60s). Segundo `inbound` "status" em <60s não gera novo enqueue. Registrado em `conversation_automation_fires`.

## Fluxo do webhook

1. Evolution → `POST /api/public/hooks/communication/:provider/:settingsId` (HMAC verificado).
2. `parseInbound` extrai `body + media_type/url/mime/caption + raw`.
3. Insere em `conversation_messages` (`direction=inbound`, `source=webhook`).
4. Chama `process_inbound_automation(conversation_id, body)`.
5. Se casou regra:
   - `handoff=true`: `conversations.status='needs_human'` (sem resposta).
   - Caso contrário: renderiza `response_body`, insere em `communication_queue` (`event_name='automation:<code>'`) e em `conversation_messages` (`direction=outbound`, `source=automated`).
   - `pg_notify('comm_queue', ...)` acorda o worker.

## FeatureGate

Chave `automations_max` em `app_plans.features`:
- Starter: 0 (bloqueado)
- Pro: 10 regras
- Business: ilimitado

Enforçado em `upsertAutomationRule` server function.

## Segurança

- RLS: `is_team_owner OR user_roles(employee|manager)` para leitura; owner-only para escrita.
- `SECURITY DEFINER` com `REVOKE` de anon, `GRANT` apenas a `authenticated, service_role`.
- Nunca executa código do usuário — apenas substituição de placeholders.

## Dashboard

RPC `get_conversations_dashboard(restaurant_id)` retorna:
- `open_count`, `unanswered_count`, `avg_response_seconds` (7 dias),
- `messages_sent_today`, `messages_received_today`, `failures_today`.

## Timelines

- `get_order_communication_timeline(order_id)` → mensagens vinculadas ao telefone/order_id.
- `get_customer_conversation_timeline(customer_id)` → mensagens + pedidos.
