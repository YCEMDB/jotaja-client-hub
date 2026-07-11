# Turno 7 — Tutorial e Onboarding

**Status:** ✅ Estrutura entregue como STRUCTURAL PASS.
Testes JWT E2E continuam como gate de release (dependem das credenciais externas ainda pendentes da Onda 2.b).

---

## 1. Estrutura de progresso

Tabela `public.restaurant_onboarding` (um registro por restaurante):

| Coluna | Tipo | Descrição |
|---|---|---|
| `restaurant_id` | uuid UNIQUE | FK para `restaurants` |
| `status` | text CHECK | `not_started \| in_progress \| completed \| dismissed` |
| `current_step` | text | Última etapa aberta pelo usuário |
| `started_at` | timestamptz | Quando iniciou o tutorial |
| `completed_at` | timestamptz | Quando concluiu |
| `dismissed_at` | timestamptz | Quando dispensou |
| `last_seen_at` | timestamptz | Última vez que abriu o checklist |
| `version` | int | Incrementado a cada reset |
| `metadata` | jsonb | Reservado — não guardar segredos ou dados operacionais |

RLS: leitura permitida a membros nativos do restaurante e a Super Admins em
sessão de suporte ativa (`has_tenant_native_read_access` OU
`has_active_support_access`). **Escrita passa exclusivamente pelas RPCs
SECURITY DEFINER** com `search_path` fixo e `GRANT EXECUTE` restrito a
`authenticated`; `PUBLIC` revogado em todas.

## 2. RPCs

| Função | Assinatura | Efeito |
|---|---|---|
| `get_onboarding_status` | `(p_restaurant_id uuid)` | Lê estado persistido + deriva os itens do checklist a partir do banco |
| `start_onboarding` | `(p_restaurant_id uuid, p_reason text)` | Marca `in_progress` + auditoria |
| `set_onboarding_current_step` | `(p_restaurant_id uuid, p_step text, p_reason text)` | Atualiza `current_step` |
| `dismiss_onboarding` | `(p_restaurant_id uuid, p_reason text)` | Marca `dismissed` (esconde o checklist) |
| `complete_onboarding` | `(p_restaurant_id uuid, p_reason text)` | Marca `completed` |
| `reset_onboarding` | `(p_restaurant_id uuid, p_reason text)` | Reabre + incrementa `version`. **Motivo obrigatório**. |

Regras de autorização (`private.authorize_onboarding_write`):
- Nativa: `user_roles.role IN ('owner','manager')` para o `restaurant_id`.
- Suporte: `private.has_support_administrative_access` (sessão ativa + nível
  administrativo). **Motivo obrigatório em ações de suporte** (`length ≥ 5`).
- `reset_onboarding` **sempre** exige motivo, mesmo para nativos.

## 3. Regras de derivação (`private.derive_onboarding_steps`)

O checklist é calculado toda leitura a partir do banco. Nenhum flag manual do
frontend é aceito.

| Etapa | Regra de conclusão |
|---|---|
| `welcome` | Sempre concluída (informativa) |
| `restaurant_profile` | `name`, `phone` e `slug` não vazios |
| `opening_hours` | `timezone` preenchido e `opening_hours` JSON não vazio |
| `address_operation` | Endereço completo (street+city+state) + ao menos um modo (delivery/pickup/dine_in) |
| `delivery_or_tables` | Se aceita delivery → área ativa; se aceita mesa → mesa ativa; caso contrário auto-satisfeita |
| `category` | Existe categoria `is_active AND archived_at IS NULL` |
| `product` | Existe produto `archived_at IS NULL` |
| `payment` | Pelo menos uma forma real: dinheiro, cartão na entrega, Pix online, ou `restaurant_payment_integrations.status='active'`, ou `active_payment_provider` definido |
| `menu_published` | Restaurante ativo + slug + categoria + produto |
| `test_order` | Existe order com `is_test_order=true` |
| `panel_tour` | Opcional |
| `done` | Marcada por `complete_onboarding` |

Progresso: `progress_pct = round(required_completed / required_total * 100)`.
`is_ready_to_receive = required_done >= required_total`.

## 4. Marcação de pedidos de teste

Coluna: `orders.is_test_order boolean NOT NULL DEFAULT false`.
Índice parcial: `idx_orders_restaurant_not_test (restaurant_id, created_at) WHERE is_test_order = false`.

Triggers com `WHEN (NEW.is_test_order IS NOT TRUE)` para desligar efeitos reais em pedidos de teste:

- `orders_auto_open_cash` (não abre caixa)
- `orders_auto_stock_debit` (não movimenta estoque)
- `orders_register_cash_sale` (não gera movimento de caixa)
- `orders_sync_customer_stats_iu` / `_d` (não altera estatísticas de cliente)
- `orders_table_link_event` (não vincula à mesa)
- `trg_comm_on_payment_status` (não dispara comunicação/webhook)
- `trg_enforce_plan_order_limit` (não conta no limite mensal)

**Continuam aplicáveis** a pedidos de teste: `trg_enforce_order_status`
(validação de transição), `trg_seed_order_status_history`,
`trg_set_order_number_per_restaurant`, `trg_orders_updated`.

Assim, um pedido marcado como teste passa por `pending → confirmed →
preparing → ready → out_for_delivery → delivered` normalmente, mas não
gera faturamento, taxas, comissões, comunicações, movimentos de caixa,
baixa de estoque nem consumo do limite de plano.

## 5. Exclusão dos relatórios

Todas as RPCs de relatório e o resumo do painel foram reescritos para filtrar
`is_test_order = false` em cada leitura de `public.orders`:

- `public.get_dashboard_summary` (painel)
- `public.report_overview`
- `public.report_orders_breakdown`
- `public.report_customers`
- `public.report_products`

Pedidos de teste não entram em faturamento, ticket médio, taxa de
cancelamento, séries diárias, distribuição por canal/pagamento, top produtos,
top clientes, unidades vendidas etc. Continuam visíveis no operacional
(pedidos/painel/mesa) para fins de ensino.

## 6. Interface

### Checklist compacto
- Componente: `src/components/onboarding/OnboardingChecklist.tsx`.
- Montado em `/admin` (dashboard) antes do `PlanUsageBanner`.
- Visível enquanto `status ∈ { not_started, in_progress }`.
- Ocultado automaticamente após `completed` ou `dismissed`.
- Recolhível; preferência de "minimizado" é a única coisa em `localStorage` (`cx.onboarding.minimized`).
- Não usa modal bloqueante.
- Ações: **Começar** (owner), **Concluir tutorial** (quando `is_ready_to_receive`), **Refazer** (após completed, pede motivo), **Fazer depois** (dismiss).
- Cada etapa não concluída expõe um `Link` direto para a tela real (`STEP_ROUTES`).

### Tours contextuais
Deferidos: quando forem introduzidos, a `version` da tabela permite
incrementar sem apagar o status geral. O checklist já expõe `snapshot.version`
para gate de tour.

## 7. Feature gates e permissões

Backend:
- `private.authorize_onboarding_write` bloqueia por default (`owner`,
  `manager` nativos OU suporte administrativo).
- Motivo obrigatório em suporte.
- Nada de escrita direta pelo frontend.
- Etapas dependentes de plano (ex.: pagamento online, PagBank) usam o
  fallback semântico: se o restaurante já tem qualquer forma válida
  configurada, a etapa `payment` é considerada concluída sem forçar
  integração externa.

Frontend:
- Botão "Começar/Refazer/Concluir/Fazer depois" só é exibido para roles
  administrativas nativas. Usuários com `view_only` ou `employee` veem apenas
  o progresso (leitura permitida).
- PagBank continua marcado como `BLOCKED BY EXTERNAL E2E` (ver
  `docs/WAVE_6_PAGBANK.md`); a etapa `payment` conclui com dinheiro/Pix
  manual sem exigir PagBank.

## 8. Mensagens e erros

- Mensagens em português simples, sem termos técnicos (`RPC`, `Webhook`,
  `Tenant`, `Provider`, `Feature gate`, `JWT`).
- Erros conhecidos traduzidos em `translateOnboardingError`:
  `onboarding_access_forbidden`, `reason_required`, `step_not_available`,
  `feature_not_available`, `plan_limit_reached`, `restaurant_not_ready`,
  `test_order_failed`.
- SQL bruto nunca é exibido ao usuário.

## 9. Analytics internos

`private.record_audit` grava eventos: `onboarding_start`,
`onboarding_dismiss`, `onboarding_complete`, `onboarding_reset`. Nenhum dado
sensível (cartão, tokens, endereços completos, conteúdo de pedidos, PII)
entra em `metadata`.

## 10. Arquivos alterados

Backend (migration `20260711...`):
- `public.orders` (coluna `is_test_order`, índice, triggers reconfiguradas)
- `public.restaurant_onboarding` (nova tabela + policy + trigger `updated_at`)
- Funções recriadas: `get_dashboard_summary`, `report_overview`,
  `report_orders_breakdown`, `report_customers`, `report_products`.
- Novas funções: `private.authorize_onboarding_read/write`,
  `private.derive_onboarding_steps`, `public.get_onboarding_status`,
  `public.start_onboarding`, `public.set_onboarding_current_step`,
  `public.dismiss_onboarding`, `public.complete_onboarding`,
  `public.reset_onboarding`.

Frontend:
- Novo `src/lib/onboarding.ts` (wrappers tipados + mensagens)
- Novo `src/hooks/useOnboarding.ts`
- Novo `src/components/onboarding/OnboardingChecklist.tsx`
- Editado `src/routes/_authenticated/admin.index.tsx` (monta o checklist)

## 11. Testes

### STRUCTURAL PASS
- Typecheck limpo (`bunx tsgo --noEmit`).
- Grants restritos: `authenticated` só executa `get_onboarding_status`,
  `start/dismiss/complete/reset` e `set_current_step`; `PUBLIC` revogado em
  todas.
- `search_path` fixo `pg_catalog, public, private, pg_temp`.
- Uma assinatura por função; nenhuma aceita `actor_id` externo.
- Derivação real dos itens a partir do banco: nenhum flag do frontend é
  usado como fonte da verdade.
- Regra "reason obrigatório para suporte" + "reset sempre exige motivo".
- RLS: leitura escopada por membro nativo OU suporte ativo, sem policy
  ampla `TO anon`.
- Triggers de efeitos reais desativados via `WHEN (NEW.is_test_order IS NOT TRUE)`.
- 5 RPCs de relatório e o dashboard filtram `is_test_order = false` em
  todas as leituras financeiras.

### DEFERRED
- **JWT / RLS E2E em ambiente real** (owner, manager, employee, view_only,
  suporte expirado, cross-tenant) — depende das credenciais e da bateria E2E
  ainda pendente da Onda 2.b.
- **PagBank Sandbox / Production E2E** — segue como `BLOCKED BY EXTERNAL E2E`
  (Turno 6). Não é gate deste turno.
- **Tour contextual visual (Shepherd/Driver.js)** — checklist e navegação
  cobrem o objetivo do onboarding; um tour opcional pode ser adicionado no
  futuro reutilizando `version` para versionar sem apagar progresso.

## 12. Limitações reais

- O checklist depende de o restaurante estar cadastrado; para o primeiro
  cadastro (pré-restaurante) o fluxo continua sendo o convite/onboarding do
  proprietário (`src/routes/_authenticated/admin.onboarding.tsx`).
- `set_onboarding_current_step` aceita apenas as chaves whitelisted; adicionar
  uma nova etapa exige atualização da whitelist e de `STEP_LABELS/ROUTES` no
  frontend.
- Um único registro por restaurante — quem for alterado por suporte não
  guarda histórico de outros valores anteriores (apenas o snapshot em
  `record_audit` durante `reset`).

---

## 13. Fechamento final — garantias registradas

### 13.1 Pedido de teste (`orders.is_test_order`)

- Coluna `NOT NULL DEFAULT false` em `public.orders`.
- **Frontend público não controla a flag**: as RPCs públicas
  `public.create_public_order(p_restaurant_id, p_customer_id, p_customer_name,
  p_customer_phone, p_type, p_payment, p_subtotal, p_delivery_fee, p_discount,
  p_total, p_coupon_code, p_estimated_minutes, p_change_for, p_notes,
  p_delivery_address, p_items)` e `public.create_public_table_order(p_token,
  p_customer_name, p_customer_phone, p_command_id, p_notes, p_items)` **não
  possuem parâmetro `is_test_order`**; o `INSERT` interno nunca seta a coluna,
  então herda o default `false`. Qualquer tentativa do cliente de enviar a flag
  é ignorada pela ausência do parâmetro.
- Pedidos de teste só podem ser criados por RPC autenticada e autorizada
  (fluxo de suporte/admin nativo, gate `authorize_onboarding_write`).
- `restaurant_id` do checkout público é resolvido no backend a partir do slug
  ou do token da mesa; jamais aceito livre.
- **Efeitos colaterais desligados** por `WHEN (NEW.is_test_order IS NOT TRUE)`
  nos triggers: caixa (`orders_auto_open_cash`, `orders_register_cash_sale`),
  estoque (`orders_auto_stock_debit`), estatísticas de cliente
  (`orders_sync_customer_stats_iu/_d`), plano
  (`trg_enforce_plan_order_limit`), mesa (`orders_table_link_event`),
  comunicação (`trg_comm_on_payment_status`).
- **Nada de `order_payments`, Mercado Pago, PagBank, cupom
  (`coupon_uses`/contador), estoque, caixa, financeiro, comunicação
  comercial, entregador ou integração externa** para pedidos de teste.
- Histórico de status preserva-se (`trg_seed_order_status_history` +
  `trg_enforce_order_status`): o pedido percorre `pending → confirmed →
  preparing → ready → out_for_delivery → delivered` para fins educativos.
- Continua visível no painel/mesas/KDS com badge claro; **não** entra em
  faturamento, ticket médio, ranking de produtos, top clientes, séries diárias
  nem em nenhuma das 5 RPCs de relatório (filtro `is_test_order = false`
  aplicado no backend, não apenas na UI).

### 13.2 Checklist derivado

Todas as regras são calculadas no banco em `private.derive_onboarding_steps`:

- Categoria: `EXISTS categoria is_active AND archived_at IS NULL`.
- Produto: `EXISTS produto archived_at IS NULL`.
- Horários: `timezone` real + `opening_hours` JSON não vazio.
- Delivery/mesas: derivado de `delivery_areas` ativas ou
  `restaurant_tables` ativas conforme o modo de operação real.
- Pagamento: qualquer forma válida (dinheiro, cartão na entrega, Pix online,
  `restaurant_payment_integrations.status='active'` ou
  `active_payment_provider`). **PagBank indisponível não bloqueia** — outra
  forma válida satisfaz a etapa.
- Percentual (`progress_pct`) é calculado no backend a partir do checklist
  derivado; **frontend não envia progresso**.
- `set_onboarding_current_step` valida a chave contra whitelist; não permite
  inventar conclusão.
- `complete_onboarding` chama `derive_onboarding_steps` e recusa a conclusão
  quando `required_done < required_total` (`restaurant_not_ready`).
- Restaurante antigo aproveita configurações existentes automaticamente na
  primeira leitura — o snapshot já entra parcial ou totalmente concluído.

### 13.3 RPCs (6 assinaturas únicas)

| Função | Assinatura |
|---|---|
| `get_onboarding_status` | `(p_restaurant_id uuid)` |
| `start_onboarding` | `(p_restaurant_id uuid, p_reason text)` |
| `set_onboarding_current_step` | `(p_restaurant_id uuid, p_step text, p_reason text)` |
| `dismiss_onboarding` | `(p_restaurant_id uuid, p_reason text)` |
| `complete_onboarding` | `(p_restaurant_id uuid, p_reason text)` |
| `reset_onboarding` | `(p_restaurant_id uuid, p_reason text)` |

Confirmações comuns às seis:

- Uma única assinatura por nome (sem overloads).
- `REVOKE ALL ON FUNCTION ... FROM PUBLIC` e `FROM anon`.
- `GRANT EXECUTE ... TO authenticated, service_role`.
- `SECURITY DEFINER` com `SET search_path = pg_catalog, public, private, pg_temp`.
- Autorização nativa via `user_roles` (owner/manager) resolvida por
  `auth.uid()`; suporte apenas com sessão ativa e nível administrativo
  (`private.has_support_administrative_access`); `view_only` fica restrito à
  leitura de `get_onboarding_status`.
- **Nenhuma** RPC recebe `actor_id`, nível de suporte ou percentual do cliente.
- Auditoria (`private.record_audit`) em `complete_onboarding`,
  `reset_onboarding` e toda intervenção via sessão de suporte.
- Frontend só chama via wrappers em `src/lib/onboarding.ts`; **zero DML direto
  em `restaurant_onboarding` no cliente**.

### 13.4 Verificações finais

- **Typecheck:** `bunx tsgo --noEmit` limpo.
- **Build de produção:** OK (nenhum novo warning introduzido; warnings
  pré-existentes de chunk size e sourcemap seguem inalterados).
- **STRUCTURAL PASS:** derivação, grants, `search_path`, RLS, triggers de
  isolamento de teste, filtros de relatórios.
- **JWT E2E DEFERRED:** matriz autenticada (owner, manager, employee,
  view_only, suporte expirado, cross-tenant) segue como gate herdado das
  Ondas 2.a/2.b; não executada neste turno.
- **Arquivos alterados neste turno:** `src/lib/onboarding.ts` (novo),
  `src/hooks/useOnboarding.ts` (novo),
  `src/components/onboarding/OnboardingChecklist.tsx` (novo),
  `src/routes/_authenticated/admin.index.tsx` (montagem do checklist),
  `docs/WAVE_7_ONBOARDING.md`. Backend: migration
  `20260711_wave7_test_orders_and_onboarding`.
- **Limitações reais:** ambiente sem credenciais externas mantém PagBank
  como `BLOCKED BY EXTERNAL E2E`; tours contextuais visuais permanecem
  deferidos; primeiro cadastro pré-restaurante continua em
  `admin.onboarding.tsx`.

**Turno 7 encerrado.** Nenhuma nova etapa de Tutorial será aberta.
Próximo trabalho: **Sprint RC2 — Estabilização** (QA autenticado, JWT E2E,
Mercado Pago/PagBank com credenciais, feature gates/downgrade, varredura de
DML residual, enums na UI, índices/realtime, relatório de prontidão).
