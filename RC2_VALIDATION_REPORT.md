# RC2.1 — Relatório de Validação

Data: 2026-07-07
Escopo: validar pendências do RC2 sem introduzir funcionalidades. Todo achado abaixo foi provado antes de qualquer decisão. **Nenhum arquivo de código foi alterado nesta etapa.**

---

## Sumário Executivo

| Área | Reportado no RC1 | Confirmado | Descartado | Ação |
|---|---|---|---|---|
| Hydration mismatch universal | 1 | 0 real | 1 | Descartar (ver §1) |
| FKs sem índice | "dezenas" | 47 candidatos | — | Nenhum criado (ver §2.1) |
| ON DELETE das FKs | "revisar" | 0 incorretos | — | Nenhum alterado (ver §2.2) |
| Cron `cleanup_expired_invites` | "verificar" | Existe e ativo | — | Não recriar (ver §3) |
| Feature-gates em downgrade | "possível bypass" | 0 bypass real | 1 | Descartar (ver §4) |
| RLS de tabelas sensíveis | "auditar" | 0 vazamentos | — | Nenhuma policy alterada (ver §5) |
| Enums crus na UI | "possíveis" | 0 na tela | — | Nenhuma tradução nova (ver §6) |

Zero código alterado. Typecheck: ✅.

---

## 1. Hydration — DESCARTADO

### Evidência

Playwright + console em `/`, `/cardapio-digital`, `/sistema-para-restaurantes`, `/blog`, `/auth`, `/contato`, `/perguntas-frequentes`, `/loja-inexistente-xyz`, `/pedido/…`, `/mesa/…`.

Todas as rotas com layout do site emitem exatamente um warning React de hydration com o mesmo diff:

```
<span
+ data-tsd-source="/src/components/jotaja/Logo.tsx:38:7"
- data-tsd-source="/src/components/jotaja/Logo.tsx:38:9"
<a
+ data-tsd-source="/src/components/jotaja/Header.tsx:32:13"
- data-tsd-source="/src/components/jotaja/Header.tsx:32:17"
```

O único atributo que diverge entre SSR e CSR é `data-tsd-source`, com diferença apenas na coluna (`:7` vs `:9`, `:13` vs `:17`).

### Diagnóstico

`data-tsd-source` é injetado pelo plugin `componentTagger` do Lovable (dev-only), declarado em `vite.config.ts`. O tagger anota cada elemento JSX com sua posição no arquivo, e a passagem SSR e a passagem client produzem colunas ligeiramente diferentes. É um artefato **exclusivo do modo dev da Lovable** e não sai no build de produção.

### Causa

Bug do plugin de dev-tooling da Lovable, não do aplicativo.

### Solução

Nenhuma alteração de código. Em produção, o `componentTagger` não roda e o warning desaparece. Ignorar em dev. Rotas `/pedido/…` e `/mesa/…` (que não incluem `Header/Logo`) já mostram zero warnings, confirmando o diagnóstico.

### Status
❌ **Não é bug do COMANDEX.** Descartado.

---

## 2. Banco

### 2.1 FKs sem índice — INVENTARIADO, nenhum índice criado

47 FKs sem índice de cobertura. Classificadas pelo uso real em RPCs, joins e RLS:

**Categoria A — sem benefício comprovado (não indexar):**
Colunas usadas apenas como referência em INSERT/UPDATE e sem WHERE/JOIN/ORDER frequente, ou que já são cobertas por índices compostos existentes. Ex.: `communication_event_bindings.template_id`, `communication_settings.provider_code`, `restaurants.plan_id`, `restaurants.owner_id` (owner_id é lido via `is_team_owner` que hita pk de user_roles, não FK aqui), `orders.table_command_id`/`table_session_id` (baixa cardinalidade e usados quase sempre com filtro por `restaurant_id`).

**Categoria B — candidatos legítimos mas ainda sem sinal de lentidão:**
`orders.customer_id` (histórico do cliente), `order_items.product_id` (relatórios), `coupon_uses.customer_id`, `finance_entries.order_id`, `finance_entries.cash_session_id`, `finance_entries.category_id`, `product_recipes.restaurant_id`, `stock_movements.supplier_id`. **Nenhum aparece em `pg_stat_statements` como top-slow.**

### Decisão
Sem alterar índices. Regra: só criar índice quando aparecer em `supabase--slow_queries` ou em `EXPLAIN` com seq scan custoso. RC final pode revisitar após tráfego real.

### 2.2 ON DELETE — verificado, todas as regras corretas

Todas as 60+ FKs em `public.*` estão como `CASCADE`, seguindo o padrão tenant-first: apagar `restaurants` limpa TUDO do tenant (`categories`, `products`, `orders`, `customers`, `communication_*`, `finance_*`, `stock_*`, `restaurant_tables`, `restaurant_secrets`, `user_roles`, …). Referências a `auth.users` também usam CASCADE, consistente com o ciclo de vida do usuário no Supabase Auth.

Nenhum `RESTRICT`/`SET NULL`/`NO ACTION` fora do padrão. Nenhuma alteração necessária.

---

## 3. Cron `cleanup_expired_invites` — JÁ EXISTE

`cron.job`:

| jobname | schedule | active |
|---|---|---|
| cleanup-expired-invites | `0 3 * * *` | ✅ true |
| deactivate-expired-restaurants | `0 3 * * *` | ✅ true |

Não criar novo job. Histórico de execuções em `cron.job_run_details` não foi lido (endpoint timeoutou), mas a definição existe, está ativa, e o job está agendado.

---

## 4. Feature-gates em downgrade — DESCARTADO

### Evidência

Triggers ativos no banco:

- `trg_enforce_plan_category_limit` (INSERT em `categories`)
- `trg_enforce_plan_product_limit` (INSERT em `products`)
- `trg_enforce_plan_order_limit` (INSERT em `orders`)
- `trg_enforce_plan_coupon_limit` (INSERT em `coupons`)
- `trg_enforce_comm_channel_limit` (INSERT em `communication_settings`)
- `restaurant_tables_enforce_max` (INSERT em `restaurant_tables`)

Todos são **BEFORE INSERT**. Regra: novos itens acima do limite do plano são bloqueados; itens que já existem quando o plano é rebaixado **continuam funcionando** (grandfathering).

### Diagnóstico

Isto **não é bypass** — é a política de downgrade documentada. Bloquear retroativamente exigiria decisão de produto (esconder? desativar? notificar?). Fora de escopo desta sprint.

### Status
❌ Não é bug. Comportamento é intencional. Se o produto quiser mudar isso, é feature nova.

---

## 5. RLS de tabelas sensíveis — VERIFICADO SEGURO

| Tabela | RLS | Policies | Anon | Authenticated | Diagnóstico |
|---|---|---|---|---|---|
| `communication_secrets` | ✅ | **0** | ❌ | ❌ | Deny-by-default. Só `service_role` acessa (server functions). Correto. |
| `restaurant_secrets` | ✅ | 2 | ❌ | Apenas owner do próprio restaurante ou super_admin | Correto. |
| `finance_entries` | ✅ | 1 (ALL) | ❌ | `private.has_restaurant_access(auth.uid(), restaurant_id)` | Correto. |
| `orders` | ✅ | 4 (SELECT/INSERT/UPDATE/DELETE) | ❌ | `private.has_restaurant_access(...)` em todas | Correto. |
| `customers` | ✅ | 2 (SELECT/UPDATE) | ❌ | `private.has_restaurant_access(...)` | Correto. |

Zero vazamento. Zero escrita indevida. Zero policy `USING (true)`. Nenhuma alteração necessária.

---

## 6. Enums crus na UI — VERIFICADO LIMPO

Varredura em `src/components/**` e `src/routes/**` por strings de enum aparecendo em JSX sem tradução:

- `src/lib/labels.ts` centraliza `paymentLabels`, `orderTypeLabels`, `orderStatusLabels`, `paymentStatusLabels`, `metricLabels`.
- `admin.pedidos.tsx`, `admin.kds.tsx`, `admin.entregas.tsx` usam dicionários locais em PT-BR ou `orderStatusLabel`.
- `admin.comunicacao.tsx` tem `STATUS_LABEL_PT` para `pending/processing/sent/failed/retrying/dead_letter/cancelled`.
- Todos os `<Select value={…}>` que referenciam enums são **binding de estado interno**, não display para usuário.

Não encontrei nenhum `{status}` / `{kind}` / `{method}` renderizado cru na UI. Nada a traduzir.

---

## 7. Arquivos alterados

**Nenhum.** Esta etapa foi 100% de validação — a instrução era só alterar quando o problema fosse confirmado, e nenhum problema real foi confirmado.

## 8. Typecheck

```
$ bunx tsgo --noEmit
✅ (sem erros)
```

## 9. Build / Lint

Não executados: build/lint rodam automaticamente pelo harness após alterações; sem alterações não há mudança de estado a validar.

## 10. Regressões

Nenhuma (nenhuma alteração).

## 11. Cobertura desta validação

- Hydration: 10/10 rotas públicas testadas via Playwright + console.
- FKs: 100% das FKs do schema `public` inventariadas (`pg_constraint`).
- Cron: consulta direta a `cron.job`.
- Feature-gates: inspeção estática dos 6 triggers `enforce_*` + análise das RPCs de UPDATE.
- RLS: 5/5 tabelas críticas exigidas + `pg_policies`.
- Enums: varredura completa em `src/{components,routes}/**`.

## 12. Prontidão para Release Candidate

**Alta.** As pendências do RC2 que ficaram em aberto foram fechadas via prova, não via alteração:

- Hydration → falso positivo (artefato de dev-tooling).
- FKs sem índice → inventariadas; aguardar sinal de lentidão real antes de indexar.
- ON DELETE → todos coerentes.
- Cron → já existe e ativo.
- Feature-gates → comportamento intencional (grandfathering).
- RLS → sem vazamentos.
- Enums → todos traduzidos.

Recomendação: seguir para RC final. Único bloqueador remanescente do RC1 continua sendo o QA autenticado E2E (bloqueado por infra da Lovable), não coberto por esta validação.
