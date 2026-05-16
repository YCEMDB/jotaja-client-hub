## Objetivo

Hoje `/admin/super` vive dentro do mesmo layout dos restaurantes (sidebar com Pedidos, Cardápio, Cupons, etc.) — coisas que não fazem sentido para o super-admin. Vou dar ao super-admin uma área dedicada em `/super`, com sidebar, header e visual próprios, totalmente desacoplada do painel de restaurante.

## Arquitetura de rotas

```text
src/routes/
  _authenticated.tsx              ← layout do RESTAURANTE (sem link super-admin)
  _authenticated/
    admin.*.tsx                   ← painel do restaurante (inalterado)
  _super.tsx                      ← NOVO layout exclusivo do super-admin
  _super/
    super.index.tsx               ← /super (visão geral + KPIs)
    super.lojas.tsx               ← /super/lojas
    super.leads.tsx               ← /super/leads
    super.pagamentos.tsx          ← /super/pagamentos
    super.planos.tsx              ← /super/planos
    super.avisos.tsx              ← /super/avisos
    super.configuracoes.tsx       ← /super/configuracoes
```

`_super.tsx` faz `beforeLoad` checando `isSuperAdmin` — se não for, redireciona para `/admin`.

## Layout dedicado (`_super.tsx`)

Estética distinta do painel do restaurante para ficar óbvio que é outro contexto:

- Sidebar **violeta/ink** (`bg-brand-violet` no header da sidebar) em vez de laranja, com badge "SUPER-ADMIN" no topo.
- Itens de menu próprios: Visão geral, Lojas, Leads, Pagamentos, Planos & Preços, Avisos globais, Configurações.
- Header superior com troca rápida "Voltar ao painel da loja" (link para `/admin`) — útil quando o super-admin também é dono de uma loja.
- Sem o seletor de restaurante do layout normal (super-admin enxerga tudo via tabelas, não por contexto de loja).

## Quebra do `admin.super.tsx` atual

O arquivo grande (Tabs com Lojas / Leads / Pagamentos / Métricas / Notas) vira componentes em `src/components/super/` e cada um ganha sua rota:

- `LojasPanel.tsx` → `super.lojas.tsx`
- `LeadsPanel.tsx` → `super.leads.tsx`
- `PagamentosPanel.tsx` → `super.pagamentos.tsx`
- `MetricsPanel.tsx` → `super.index.tsx` (KPIs viram a home do super)
- Novos: `PlanosPanel.tsx`, `AvisosPanel.tsx`, `ConfiguracoesPanel.tsx` (já existem as tabelas `app_plans`, `global_announcements`, `app_settings`).

## Limpeza do painel do restaurante

- Remover o bloco "Super-Admin" do `_authenticated.tsx` (linhas 100–109).
- Redirect: quem acessar `/admin/super` é redirecionado para `/super` (mantém compat com links antigos).

## Detalhes técnicos

- `_super.tsx` usa `useAuth()` e em `beforeLoad`/efeito redireciona não-super para `/admin`.
- Cada painel chama as server functions existentes em `super-admin.functions.ts` (sem mudança de backend).
- Adicionar à `useAuth` nada — `isSuperAdmin` já existe.
- Sem migrações de banco.

## Arquivos a tocar

Novos: `src/routes/_super.tsx`, `src/routes/_super/super.index.tsx`, `super.lojas.tsx`, `super.leads.tsx`, `super.pagamentos.tsx`, `super.planos.tsx`, `super.avisos.tsx`, `super.configuracoes.tsx`, componentes em `src/components/super/`.

Editados: `src/routes/_authenticated.tsx` (remover link super), `src/routes/_authenticated/admin.super.tsx` (vira redirect para `/super`).

## Confirmação rápida

- (1) Mantenho `/admin/super` como redirect, ou removo de vez?
- (2) Quer que o super-admin que também é dono de loja ainda veja o seletor de restaurante no header do `/super` (atalho rápido) ou só o botão "Voltar ao painel da loja"?
