
## Objetivo

1. Landing page = só **Login** (sem opção de criar conta).
2. Botões "Teste grátis" e o formulário do CTA viram **captura de leads** (salva no banco + e-mail pra você).
3. Painel **Super-Admin** ganha 3 melhorias: gestão de leads, criação manual de loja+dono, métricas globais consolidadas.

---

## 1. Banco de dados (1 migração)

Nova tabela `signup_leads`:
- `name`, `restaurant_name`, `email`, `phone`
- `status`: `new` | `contacted` | `approved` | `rejected`
- `notes` (anotação interna), `restaurant_id` (preenchido quando virar loja)
- `created_at`, `updated_at`

RLS:
- INSERT público (qualquer visitante do site pode enviar)
- SELECT/UPDATE/DELETE apenas super-admin (`is_super_admin(auth.uid())`)

---

## 2. Landing page — só login

**`src/routes/auth.tsx`**: remover a aba "Criar conta", mostrar apenas o formulário de login (e-mail/senha). Sem Google.

**Botões "Testar grátis" do site** (`Header.tsx`, `Hero.tsx`, `Planos.tsx`): em vez de apontar para `/auth`, rolam até a seção `#cadastro` do CTA (formulário de lead).

**Link "Entrar"** discreto no Header → vai para `/auth`.

---

## 3. Formulário de teste grátis (CTA)

`src/components/jotaja/CTA.tsx`:
- Mantém os 4 campos (nome, restaurante, e-mail, WhatsApp).
- Submit → INSERT em `signup_leads` (status `new`).
- Dispara e-mail interno para você notificando o novo lead.
- Mensagem de sucesso: "Recebemos seu cadastro! Em até 24h entraremos em contato pra liberar seu teste de 14 dias."
- Botão muda para **"Quero meu teste grátis"** (não mais "Criar minha conta").

### E-mail de notificação

Usa **Lovable Emails** (built-in). Fluxo:
1. Configurar domínio de envio (diálogo de setup) — pré-requisito.
2. Scaffold de e-mail transacional → server route `send-transactional-email` enfileira o e-mail.
3. Server function `submitLead` (chamada pelo formulário) faz o INSERT e dispara o e-mail para o endereço de admin.

Endereço de destino: pergunto na hora da implementação ("para qual e-mail enviar as notificações?").

---

## 4. Painel Super-Admin — `/admin/super`

A página já lista todas as lojas. Adicionar **abas**:

### Aba "Lojas" (atual, mantida)
Tudo que já existe: lista de restaurantes, ações por loja, login-as, etc.

### Aba "Leads" (nova)
- Tabela com leads de `signup_leads` ordenados por data desc.
- Filtros por status (novos / contatados / aprovados / recusados).
- Ações por linha:
  - **Marcar como contatado** (muda status).
  - **Aprovar e criar loja** → abre modal de "Criar loja" pré-preenchido com os dados do lead (ver abaixo). Ao concluir, marca lead como `approved` e linka `restaurant_id`.
  - **Recusar** (muda status).
  - **Adicionar nota** interna.
- Badge no menu lateral mostrando contagem de leads `new`.

### Aba "Criar loja" / botão global "Nova loja" (novo)
Modal com formulário:
- Dados da loja: nome, slug (auto a partir do nome), telefone, plano (`trial`/`essential`/`professional`), validade do trial (default 14 dias).
- Dados do dono: nome completo, e-mail, telefone, **senha temporária** (gerada automaticamente, mostrada uma única vez para você copiar e enviar manualmente — opcionalmente pode disparar um e-mail de boas-vindas, fica como checkbox).

Server function `createTenant` (admin):
1. `supabaseAdmin.auth.admin.createUser` com a senha gerada e `email_confirm: true`.
2. INSERT em `restaurants` com `owner_id` = id do user criado.
3. INSERT em `user_roles` (`owner` para o restaurante).
4. Retorna a senha gerada uma única vez.

### Aba "Métricas" (nova)
Dashboard consolidado de todas as lojas:
- Cards: total de lojas, lojas ativas, lojas em trial, MRR estimado (soma por plano), pedidos hoje/semana/mês, faturamento bruto agregado.
- Gráfico de pedidos por dia (últimos 30 dias) somando todas as lojas.
- Top 5 lojas por faturamento no mês.
- Lista de trials expirando nos próximos 7 dias.

Tudo via `createServerFn` com `supabaseAdmin` (precisa agregar entre tenants, ignorando RLS).

---

## Arquivos afetados

**Novos**
- `src/routes/_authenticated/admin.super.leads.tsx` (ou aba dentro do super.tsx atual)
- `src/lib/super-admin.functions.ts` — `submitLead`, `listLeads`, `updateLead`, `createTenant`, `getGlobalMetrics`
- Migração SQL: `signup_leads` + RLS

**Editados**
- `src/routes/auth.tsx` — remove signup tab e aba do Google
- `src/components/jotaja/CTA.tsx` — submit → server fn
- `src/components/jotaja/Header.tsx` — "Testar grátis" vai para `#cadastro`; novo link "Entrar" → `/auth`
- `src/components/jotaja/Hero.tsx` — idem
- `src/components/jotaja/Planos.tsx` — idem (já aponta para `#cadastro`, manter)
- `src/routes/_authenticated/admin.super.tsx` — adicionar tabs e ações novas

**Infra de e-mail**
- Domínio de envio (se ainda não configurado — diálogo aparece na implementação)
- Scaffold de e-mail transacional + template "Novo lead recebido"

---

## O que vou perguntar durante a implementação

1. Para qual e-mail enviar a notificação de novo lead?
2. Confirmar se quer **enviar e-mail de boas-vindas com a senha** ao criar loja manualmente, ou só mostrar a senha pra você copiar.
3. Se ainda não tem domínio de e-mail configurado, abrir o diálogo de setup (passo único, depois tudo automático).
