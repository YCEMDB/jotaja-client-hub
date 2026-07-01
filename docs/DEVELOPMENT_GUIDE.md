# Guia de Desenvolvimento — Comandex

**Documento mais importante do projeto.** Toda contribuição DEVE seguir estas regras.

## Princípios Não Negociáveis

### 1. Fonte Única de Verdade
- Cada domínio tem **uma** tabela canônica.
- Owners: `restaurants.owner_id` (nunca duplicar em `profiles`).
- Plano: `restaurants.plan_id` (nunca colunas `is_pro`, `is_business`, etc.).
- Horários: `restaurants.opening_hours` + `open_mode` + `timezone`.
- Status de pedido: `orders.status` + `order_status_history`.
- ❌ **Nunca** criar coluna que já existe em outra tabela.

### 2. Backend-First
Toda lógica crítica reside em SQL (`SECURITY DEFINER`):
- Preço final, desconto, taxa de entrega
- Validação de cupom
- Transição de status
- Limites de plano
- Numeração de pedido

O frontend **exibe** resultados, não os calcula.

### 3. Máquina de Estados
- Toda alteração de `orders.status` passa por `update_order_status()`.
- Transições inválidas retornam `check_violation`.
- Trigger bloqueia UPDATE direto (`status_change_forbidden`).

### 4. FeatureGate para Funcionalidades Pagas
```tsx
<FeatureGate feature="crm" plan={plan}>
  <CRMPanel />
</FeatureGate>
```
- Limites duros (usuários, pedidos/mês): também no backend.

### 5. Validação de Entrada em RPCs Públicas
Toda RPC anon-callable:
- Valida comprimentos, formatos, ranges.
- Rejeita com `ERRCODE` semântico.
- Nunca confia em `p_customer_id` sem re-derivar do telefone.

### 6. Migrations Reversíveis
- Toda migration inclui comentário `-- REVERT:` com o rollback.
- `DROP` em produção sempre precedido de deprecation em sprint anterior.

### 7. Triggers Documentados
- Toda trigger nova adicionada em [DATABASE.md](./DATABASE.md#triggers).
- Comentário SQL explicando o **por quê** (não o "o quê").

### 8. RLS em Toda Tabela Nova
Estrutura obrigatória na mesma migration:
```sql
CREATE TABLE public.x (...);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.x TO authenticated;
GRANT ALL ON public.x TO service_role;
-- GRANT SELECT ON public.x TO anon;  -- só se justificado
ALTER TABLE public.x ENABLE ROW LEVEL SECURITY;
CREATE POLICY "..." ON public.x ...;
```

### 9. Arquitetura Consolidada
Antes de criar algo novo:
1. Existe RPC/tabela que já resolve? → Reutilize.
2. Existe padrão similar? → Siga o mesmo formato.
3. É genuinamente novo? → Documente antes de implementar.

## Regras de Código

### Frontend
- ✅ TanStack Query para leituras (`useSuspenseQuery` + `ensureQueryData` no loader).
- ✅ shadcn/ui + tokens semânticos (`bg-brand-orange`, `shadow-brutal`).
- ✅ Componentes pequenos e focados.
- ❌ `useEffect + fetch` para leitura inicial.
- ❌ Hardcode de cor (`text-white`, `bg-[#fff]`) — usar tokens.
- ❌ Componentes acima de ~300 linhas — quebrar.

### Backend
- ✅ RPC nova → adicione teste manual documentado + entrada em [RPCS.md](./RPCS.md).
- ✅ `SET search_path = public, pg_temp` em toda função.
- ❌ Consultas ad-hoc do frontend em tabelas críticas — usar RPC.
- ❌ `SECURITY DEFINER` sem justificativa.

### Server Functions (`createServerFn`)
- Coloque em `src/lib/*.functions.ts` (nunca em `src/server/*`).
- Leia env com `process.env.X` **dentro** do `.handler()`.
- Use `.inputValidator()` com Zod.
- Protegidas: `.middleware([requireSupabaseAuth])`.

## O Que NÃO Fazer

- ❌ Duplicar regras de negócio em frontend + backend.
- ❌ Duplicar consultas (crie um hook único).
- ❌ Criar segunda fonte de verdade ("cache" que vira canônico).
- ❌ Executar SQL fora do padrão (via console admin, edge function raw, etc.).
- ❌ Acessar tabelas críticas (`orders`, `coupons`, `user_roles`) diretamente do cliente para escrita.
- ❌ Bypassar RLS com service_role no frontend.
- ❌ Adicionar dependência Node-only (ver [server-runtime]).
- ❌ Editar arquivos autogerados (`src/integrations/supabase/*`, `routeTree.gen.ts`).

## Checklist antes de Merge

- [ ] Migration com GRANTs + RLS + rollback comentado
- [ ] RPC nova documentada em `docs/RPCS.md`
- [ ] Feature nova em `docs/FEATURE_GATES.md` (se aplicável)
- [ ] Sem `console.log` em produção
- [ ] Tipos TS válidos (sem `any` novo)
- [ ] `docs/CHANGELOG.md` atualizado
- [ ] Testado manualmente em mobile (viewport 375px)
- [ ] Sem regressão em fluxo público (`/`, `/$slug`, checkout)

## Sempre Utilizar as RPCs Oficiais

| Ação | RPC obrigatória |
|---|---|
| Criar pedido | `create_public_order` |
| Alterar status | `update_order_status` |
| Validar cupom (pré-checkout) | `validate_public_coupon` |
| Convidar equipe | `create_team_invite` |
| Aceitar convite | `accept_team_invite` |
| Verificar aberto | `is_restaurant_open_now` |
| Ler cardápio público | `get_public_restaurant/categories/products` |
| Timeline do pedido | `get_order_history` |

Se sua funcionalidade não cabe em uma RPC existente: **crie uma nova RPC**, não escreva do frontend.
