# Feature Gates — Comandex

Sistema de restrição de funcionalidades por plano. Fonte única: `app_plans.features` JSONB.

## Planos

| Plano | Preço | Público-alvo |
|---|---|---|
| **starter** | R$ 0 / trial | Restaurantes pequenos iniciando digitalização |
| **pro** | R$ — | Operação consolidada, precisa de multiusuário e CRM |
| **business** | R$ — | Redes / alto volume, ilimitado |

## Matriz de Features

| Feature | starter | pro | business | Enforço |
|---|---|---|---|---|
| `max_orders_per_month` | 100 | 1000 | ∞ (null) | ✅ Trigger `enforce_plan_order_limit` |
| `max_users` | 1 (só owner) | 5 | ∞ (null) | ✅ RPC `create_team_invite` |
| `max_products` | 30 | 200 | ∞ | 🚧 UI (frontend) |
| `advanced_coupons` | ❌ | ✅ | ✅ | ✅ Frontend `FeatureGate` |
| `crm` | ❌ | ✅ | ✅ | ✅ Frontend `FeatureGate` |
| `cash_management` | ❌ | ✅ | ✅ | ✅ Frontend `FeatureGate` |
| `custom_domain` | ❌ | ❌ | ✅ | 🚧 |
| `api_access` | ❌ | ❌ | ✅ | 🚧 |
| `priority_support` | ❌ | ✅ | ✅ | Manual |
| `multi_unit` | ❌ | ❌ | ✅ | 🚧 |

Fonte: `SELECT features FROM app_plans WHERE id = 'starter'`.

## Como Funciona

### 1. Hook `usePlanFeatures`
```ts
const { features, plan, loading } = usePlanFeatures(restaurantId);
if (features.advanced_coupons) { ... }
```
Carrega `restaurants.plan_id` + `app_plans.features` uma vez, cacheia em Query.

### 2. Componente `<FeatureGate>`
```tsx
<FeatureGate feature="crm" plan={plan} fallback={<UpgradePrompt />}>
  <CRMPanel />
</FeatureGate>
```
Renderiza `children` se liberado, `fallback` (default: card de upgrade) caso contrário.

### 3. Enforço no Backend
Nunca confiar apenas no frontend para limites duros:
- **Pedidos/mês:** trigger `enforce_plan_order_limit` bloqueia INSERT em `orders`.
- **Usuários:** RPC `create_team_invite` conta membros + convites ativos.
- **Produtos:** 🚧 pendente trigger equivalente.

## Como Adicionar uma Nova Feature

1. **Definir a chave** em `app_plans.features` via migration:
   ```sql
   UPDATE public.app_plans
   SET features = features || jsonb_build_object('kds', true)
   WHERE id IN ('pro','business');
   ```
2. **Documentar** nesta matriz.
3. **Proteger no frontend** com `<FeatureGate feature="kds" plan={plan}>`.
4. **Enforçar no backend** se houver limite quantitativo (trigger ou RPC).
5. **Testar downgrade:** verificar que ao trocar de plano, a feature some da UI.

## Como Trocar de Plano

- Super Admin: `/super-admin/restaurants` → editar → selecionar plano.
- Atualiza `restaurants.plan_id`. Efeito imediato via `usePlanFeatures` (cache invalidado no próximo mount).

## Anti-padrões

- ❌ Hardcode `if (plan === 'pro')` em componentes. Use `features.<nome>`.
- ❌ Adicionar feature só no frontend quando há impacto financeiro (perda de receita).
- ❌ Contar limites lendo do frontend (ex.: `orders.length`) — usar `monthly_order_count` do backend.
