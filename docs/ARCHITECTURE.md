# Arquitetura Geral — Comandex

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | React 19 + TanStack Start v1 + Vite 7 |
| Roteamento | TanStack Router (file-based, `src/routes/`) |
| Estado servidor | TanStack Query |
| Estilo | Tailwind v4 + tokens semânticos em `src/styles.css` |
| Backend | Supabase (Postgres 15 + PostgREST + Realtime) |
| Auth | Supabase Auth (email/password, Google OAuth) |
| Pagamentos | Mercado Pago (PIX online, checkout transparente) |
| Runtime servidor | Cloudflare Workers (workerd, nodejs_compat) |
| Deploy | Lovable Cloud |

## Visão Macro

```mermaid
graph TB
  subgraph Cliente
    A[Cardápio Público]
    B[Painel Admin]
    C[Painel Super Admin]
  end
  subgraph Edge[Cloudflare Workers]
    D[SSR + Server Functions]
    E[/api/public/webhooks/]
  end
  subgraph Supabase
    F[(Postgres + RLS)]
    G[Auth]
    H[Realtime]
    I[Storage: product-images]
    J[pg_cron + pgmq]
  end
  subgraph Externo
    K[Mercado Pago]
    L[WhatsApp Web]
  end

  A -->|RPC públicas| F
  B -->|RPC autenticadas + RLS| F
  C -->|RPC super_admin| F
  A --> D
  B --> D
  D --> F
  E <-->|webhooks| K
  A -->|deep link| L
  F --> H
  H -.->|order_status_changes| B
  G --> F
  J --> F
```

## Frontend

- **Rotas públicas**: `/`, `/planos`, `/glossario`, `/$slug` (cardápio), `/auth`, landing pages segmentadas.
- **Rotas autenticadas**: `/admin/*` (owner/manager/employee), `/super-admin/*` (super_admin).
- **Guardas**: `useAuth` + verificação de `user_roles` server-side via RPC `is_team_owner`.
- **Padrão de leitura**: `queryClient.ensureQueryData()` no loader + `useSuspenseQuery` no componente.
- **Padrão de escrita**: sempre via RPC (`supabase.rpc(...)`) — nunca `INSERT/UPDATE` direto em tabela crítica.

## Backend

### Filosofia
- **Toda regra crítica em SQL** (`SECURITY DEFINER` com `search_path` fixo).
- **RLS bloqueia por padrão**; RPC público substitui `SELECT` anônimo quando necessário.
- **Tabelas nunca aceitam escritas cruas** para pedidos, cupons, convites, papéis.

### Componentes
| Componente | Responsabilidade |
|---|---|
| Tabelas `public.*` | Persistência com RLS |
| Schema `private` | Helpers internos (não acessíveis via API) |
| RPCs | API pública tipada com validação |
| Triggers | Consistência (updated_at, order_number, customer stats, state machine) |
| pgmq | Filas assíncronas (emails transacionais) |
| pg_cron | Dispatcher periódico da fila de emails |
| Edge functions | ❌ Não utilizadas (substituídas por `createServerFn` + `/api/public/*`) |

## Fluxo — Pedidos

```mermaid
sequenceDiagram
  participant U as Cliente
  participant W as Web (/$slug)
  participant R as RPC create_public_order
  participant DB as Postgres
  participant T as Triggers
  participant P as Painel Admin

  U->>W: Adiciona itens + finaliza
  W->>R: create_public_order(items, coupon, customer)
  R->>DB: Valida horário, cupom, cliente
  R->>DB: INSERT orders + order_items
  T->>DB: set_order_number, seed_history, enforce_plan_limit, cash_sale
  DB-->>W: {id, order_number, total}
  W-->>U: Confirmação + WhatsApp deep link
  DB->>P: Realtime NOTIFY order_status_changes
  P->>R: update_order_status(id, novo_status)
  R->>T: enforce_order_status_transition
  R->>DB: INSERT order_status_history
```

## Fluxo — Clientes

```mermaid
graph LR
  A[Checkout público] -->|upsert por telefone| B[public.customers]
  C[Painel Admin CRM] -->|leitura RLS| B
  D[Trigger sync_customer_stats] -->|orders| B
  B -->|total_orders, total_spent, last_order_at| C
```

Identificador único: `(restaurant_id, phone)` — telefone normalizado (só dígitos).

## Fluxo — Pagamentos

```mermaid
graph TB
  A[Cliente escolhe PIX online] --> B[Server Function cria preferência MP]
  B --> C[Mercado Pago retorna qr_code]
  C --> D[Cliente paga]
  D --> E[MP → /api/public/mp-webhook]
  E -->|HMAC verificado| F[UPDATE orders.payment_status=paid]
  A2[Cliente escolhe dinheiro/cartão na entrega] --> G[Pedido criado como pending]
  G --> H[Trigger register_cash_sale_on_order]
  H --> I[cash_movements se caixa aberto]
```

## Fluxo — Autenticação

```mermaid
graph LR
  A[/auth] -->|email+senha ou Google| B[Supabase Auth]
  B --> C[handle_new_user trigger]
  C --> D[public.profiles]
  B --> E[useAuth hook]
  E -->|carrega restaurant + role| F[Redirect por papel]
  F -->|owner/manager/employee| G[/admin]
  F -->|super_admin| H[/super-admin]
  F -->|sem restaurante| I[/onboarding]
```

## Fluxo — Permissões

```mermaid
graph TD
  A[Requisição] --> B{auth.uid?}
  B -->|não| C[RLS anon: apenas RPCs públicas]
  B -->|sim| D{role?}
  D -->|super_admin| E[Acesso total]
  D -->|owner| F[Restaurante próprio]
  D -->|manager| G[Restaurante vinculado - operacional + config]
  D -->|employee| H[Restaurante vinculado - operacional]
  F --> I[is_team_owner = true]
  G --> J[user_roles.role='manager']
  H --> K[user_roles.role='employee']
```

## Estrutura de Diretórios

```
src/
├── routes/              # File-based routing (TanStack)
│   ├── __root.tsx       # Head, providers, favicon
│   ├── index.tsx        # Landing
│   ├── $slug.tsx        # Cardápio público
│   ├── admin/           # Painel restaurante
│   ├── super-admin/     # Painel plataforma
│   └── api/public/      # Webhooks
├── components/          # UI shadcn + componentes de domínio
├── hooks/               # useAuth, usePlanFeatures, ...
├── integrations/supabase/  # Cliente autogerado (NÃO EDITAR)
├── lib/                 # Server functions (*.functions.ts)
└── styles.css           # Tokens semânticos + tema
supabase/migrations/     # SQL versionado
docs/                    # Esta documentação
```
