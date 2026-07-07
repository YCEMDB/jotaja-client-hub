# ComandaHub — Design System Interno

Sistema visual unificado para toda a área administrativa (Admin + Super Admin + Auth).
Área pública (landing, blog, cardápio `$slug` / `loja.$slug`) NÃO usa este sistema.

## Princípios

1. **Zero wrapper local**: nada de `<div className="p-4 md:p-8">` em rotas.
2. **Zero cor hex inline**: sempre tokens (`bg-ink`, `text-ink`, `bg-brand-orange`, `shadow-brutal`).
3. **Um único container**: todas as páginas admin herdam largura, gutter horizontal e ritmo vertical do mesmo componente.
4. **Identidade Sunset Blaze**: laranja `#ff6b35`, magenta `#e84393`, violeta `#7c5cff`, âmbar, ink near-black. Bordas 2px, sombra brutalist.

## Componentes (`src/components/ds/`)

| Componente | Uso |
|---|---|
| `AdminPageLayout` | Padrão para 95% das páginas admin. Header (kicker, título, subtítulo, ícone, actions) + slot de conteúdo. |
| `PageContainer` | Container "cru" (gutter horizontal + max-width). Usar em telas full-height (KDS, PDV, Pedidos kanban) que gerenciam próprio header. |
| `Section` / `SectionHeader` / `SectionContent` | Bloco de conteúdo com chrome brutalist (borda ink, radius, sombra). |
| `DashboardGrid` | Grid responsivo 1/2/N colunas para KPIs. |
| `StatCard` / `EmptyState` | Re-exportados de `src/components/app/`. |
| `FilterBar` / `SearchBar` | Barra de filtros acima de tabelas. |
| `LoadingState` / `ErrorState` | Estados padronizados. |
| `AuthShell` | Card centralizado com blobs de fundo — login, reset, aceitar convite. |

Import único:
```ts
import { AdminPageLayout, Section, DashboardGrid, StatCard, FilterBar } from "@/components/ds";
```

## Uso — página padrão

```tsx
<AdminPageLayout
  title="Clientes"
  subtitle="Base ativa e histórico de pedidos"
  kicker="CRM"
  icon={Users}
  accent="magenta"
  actions={<Button>Novo</Button>}
>
  <DashboardGrid cols={4}>
    <StatCard ... />
  </DashboardGrid>
  <Section>
    <SectionHeader title="Lista" />
    <SectionContent>...</SectionContent>
  </Section>
</AdminPageLayout>
```

## Uso — full-height (KDS, PDV, Pedidos)

```tsx
<PageContainer padded={false} className="pt-6 md:pt-8 pb-6 h-[calc(100vh-3.5rem)] flex flex-col">
  <header>...</header>
  <div className="flex-1 overflow-auto">...</div>
</PageContainer>
```

## Tokens principais (`src/styles.css`)

- Cores: `--brand-orange`, `--brand-magenta`, `--brand-violet`, `--brand-amber`, `--ink`, `--background`, `--card`.
- Sombras: `shadow-brutal` (5px offset), `shadow-glow` (aura laranja).
- Gradiente: `bg-gradient-sunset`, `bg-gradient-mesh`.
- Fontes: `font-display` (Archivo Black) + Hind (body via `body`).

## Regras de manutenção

- Nova página admin/super-admin → **obrigatório** `AdminPageLayout` (ou `PageContainer` para full-height).
- Página nova NÃO pode importar `PageHeader` — foi removido.
- Estados de loading/erro/vazio → sempre `LoadingState` / `ErrorState` / `EmptyState`.
- Cor nova? Adicionar como token em `src/styles.css`, nunca hex inline em componente.
- Ícone no header sempre da lucide-react, cor via prop `accent`.

## Páginas migradas (Fase 1 + 2)

**Admin**: `admin.index`, `admin.clientes`, `admin.cupons`, `admin.entregadores`, `admin.operacoes`, `admin.onboarding`, `admin.relatorios`, `admin.pedidos`, `admin.cardapio`, `admin.comunicacao`, `admin.configuracoes`, `admin.caixa`, `admin.pdv`, `admin.equipe`, `admin.kds` (mantém dark theme intencional, gutters padronizados).

**Super Admin**: `super.index`, `super.lojas`, `super.leads`, `super.planos`, `super.equipe`, `super.avisos`, `super.configuracoes`.

**Auth**: `auth`, `reset-password`, `aceitar-convite.$token` (via `AuthShell`).

## Fora de escopo

- Landing pública (`src/components/jotaja/*`, `src/routes/index.tsx`, blog, comparativos, segmentos).
- Cardápio público (`src/routes/$slug.tsx`, `loja.$slug.tsx`).
- Página de pedido do cliente (`pedido.$orderId.tsx`).

Rewrite dessas áreas será uma sprint separada.
