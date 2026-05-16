## O que está mudando

### 1. Slug auto-gerado (sem input manual)
**Onboarding (`admin.onboarding.tsx`)** e **CreateTenantDialog (super-admin)**:
- Remover o campo "Link da sua loja / slug" do formulário.
- Gerar slug no submit: `slugify(name)` + verificação de unicidade. Se já existir, sufixar com `-2`, `-3`… até passar.
- Validar contra `isReservedSlug` (se reservado, sufixar também).
- No `createTenant` server fn: gera slug a partir de `restaurant_name` e tenta variações até achar livre — não recebe mais slug do client.

### 2. Aba Métricas — **manter, consertar**
Hoje ela chama `getGlobalMetrics` (serverFn com `requireSupabaseAuth`) e provavelmente está estourando silenciosamente (toast some, fica em loading ou em "Sem dados.").

Passos:
- Rodar `invoke-server-function` + `server-function-logs` em `/admin/super` para identificar o erro real (suspeitos: bearer token não chega, `assertSuperAdmin` joga 403, ou query em `orders` falha por volume).
- Adicionar `try/catch` que mostra o erro na UI (não só toast) para não ficar mudo.
- Ajustar `getGlobalMetrics` se precisar (ex.: paginar `orders` se passar de 1000 linhas — limite default do Supabase).
- Garantir que `attachSupabaseAuth` está em `src/start.ts` (pré-req do `requireSupabaseAuth`).

### 3. Formulário "Começar grátis" na home → grava lead + envia WhatsApp
- Novo componente **`src/components/jotaja/LeadFormDialog.tsx`** (Dialog brutalista Sunset Blaze):
  - Campos: nome, nome do restaurante, e-mail, WhatsApp, cidade (opcional), mensagem (opcional).
  - Validação Zod (lengths que casam com a policy `signup_leads_public_insert`).
  - Submit: `INSERT` em `signup_leads` → depois `window.open` para `https://wa.me/5527992877008?text=...` com os dados pré-preenchidos.
  - Toast de sucesso e reset.
- Trocar CTAs "Começar grátis" / "Criar conta grátis" no **Hero** e no **CTA** para abrir esse dialog.
- `/auth` continua para quem já tem conta (link "Entrar" no header).

### 4. Repensar a home — tirar a cara de "slide"
Hoje a página é pilha vertical com seções de altura/espaço uniformes → parece carrossel. Reescrita editorial:

1. **Hero** (mantém).
2. **Stats em barra full-bleed** sobre `bg-ink` — uma faixa fina, não uma seção solta.
3. **Bento "Tudo que você precisa"** — substitui `Vantagens` + `Funcionalidades` por um único bento grid asymmetric com cards de tamanhos diferentes, mockups reais do sistema, ícones grandes, `shadow-brutal`. Densidade alta.
4. **"Como funciona em 3 passos"** — zig-zag (texto + screenshot alternando lados), número gigante (font-display 10rem) à margem.
5. **Comparativo iFood vs ComandaHub** — tabela brutalista lado a lado, fundo `brand-magenta/10`, bordas grossas.
6. **Depoimentos em masonry** — cards de alturas diferentes, não slider.
7. **Planos** — 3 cards, o do meio elevado com `shadow-brutal-lg` + badge "Recomendado".
8. **FAQ** — accordion denso em 2 colunas no desktop.
9. **CTA final** — full-bleed `bg-ink` com o LeadFormDialog inline (formulário direto na página) + telefone WhatsApp grande.

Cada seção ganha um **kicker** ("01 — VANTAGENS") em vez de título solto → ritmo editorial.

### 5. Super-Admin como página única e completa
`admin.super.tsx` continua numa rota só, com abas:
- **Lojas** (mantém).
- **Leads** (mantém).
- **Métricas** (consertar — ver item 2).
- **Planos & Preços** (nova): editar nome, preço mensal e features de cada plano.
- **Avisos globais** (nova): banner que aparece no topo de todos os painéis (texto + cor + on/off + expiração).
- **Configurações gerais** (nova): WhatsApp de suporte, e-mail de contato, URL pública.

## Schema novo

```sql
CREATE TABLE public.app_plans (
  id text PRIMARY KEY,                -- 'trial' | 'essential' | 'professional'
  name text NOT NULL,
  price_monthly numeric NOT NULL DEFAULT 0,
  features jsonb NOT NULL DEFAULT '[]',
  position int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);
-- RLS: SELECT público. INSERT/UPDATE/DELETE só super-admin.

CREATE TABLE public.global_announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message text NOT NULL,
  variant text NOT NULL DEFAULT 'info',
  is_active boolean NOT NULL DEFAULT true,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
-- RLS: SELECT autenticado. INSERT/UPDATE/DELETE só super-admin.

CREATE TABLE public.app_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
-- RLS: SELECT público. INSERT/UPDATE só super-admin.
```

Seed: 3 linhas em `app_plans` (trial, essential, professional) com os preços atuais.

## Arquivos tocados
- `src/routes/_authenticated/admin.onboarding.tsx` — remove campo slug.
- `src/routes/_authenticated/admin.super.tsx` — debug Métricas; adiciona Planos / Avisos / Config; CreateTenantDialog sem campo slug.
- `src/lib/super-admin.functions.ts` — `createTenant` gera slug único; `getGlobalMetrics` com paginação se necessário.
- `src/components/jotaja/LeadFormDialog.tsx` — novo.
- `src/components/jotaja/Hero.tsx`, `CTA.tsx` — botões abrem o dialog.
- `src/routes/index.tsx` — nova composição (bento + zig-zag + comparativo + masonry + planos + FAQ + CTA inline).
- Componentes novos/refeitos: `Bento.tsx`, `ComoFunciona.tsx` re-layout, `Depoimentos.tsx` masonry, `Stats.tsx` faixa.
- `useGlobalAnnouncement` hook + render em `_authenticated.tsx`.

## Verificação
- Onboarding: nome "Burger do Zé" → slug `burger-do-ze`; segundo igual → `burger-do-ze-2`.
- Super-Admin → "Nova loja" sem campo slug.
- Aba Métricas carrega números e gráfico (ou mostra mensagem de erro clara, não fica mudo).
- "Começar grátis" no Hero abre modal, salva em `signup_leads`, abre WhatsApp pré-preenchido.
- Home: densidades visivelmente diferentes entre seções (faixa fina, bento denso, zig-zag amplo, masonry irregular).
