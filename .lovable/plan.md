## Diagnóstico

Encontrei 3 e-mails de recuperação travados em `pending` no `email_send_log` desde ontem. Ou seja: o usuário pediu reset, o webhook **enfileirou** corretamente, mas o **cron dispatcher (`process-email-queue`) não está drenando a fila**. É por isso que "nada chega".

Causas prováveis (ordem de probabilidade):
1. O job de cron `process-email-queue` não foi provisionado no Supabase de **produção** (só no Test). Isso acontece quando o setup de e-mail foi feito antes da publicação atual.
2. Domínio `notify.comandahub.online` pode estar `awaiting_dns` — DNS migrou pra Cloudflare há pouco.
3. Vault secret `email_queue_service_role_key` pode estar desatualizado.

## O que vou fazer

### 1. Reset de senha (e-mails travados na fila)
- Rodar `setup_email_infra` novamente (idempotente) — re-provisiona cron, vault secret e RPC.
- Verificar status do domínio `notify.comandahub.online` em Cloud → Emails.
- Confirmar que a fila drena (e-mails saem de `pending` para `sent`).

### 2. E-mail com credenciais ao criar restaurante
Hoje `createTenant` em `src/lib/super-admin.functions.ts` retorna a senha temporária só no JSON da resposta (super-admin vê na tela, dono nunca recebe).

Vou:
- Criar template transacional `restaurant-welcome.tsx` com: nome do restaurante, link de login (`https://comandahub.online/auth`), e-mail, **senha temporária**, instrução pra trocar no primeiro acesso.
- Scaffold de e-mails transacionais (se ainda não estiver pronto) e disparar o e-mail dentro de `createTenant` após inserir o restaurante.
- Enviar também quando o super-admin **resetar a senha de um dono** (item 4).

### 3. Senha gerada não funciona
Bug em `createTenant`: quando o e-mail já existe (`found`), retornamos `temporary_password: null` mas **não atualizamos a senha** — o super-admin pensa que deve usar a senha mostrada antes, e o dono real não sabe a dele.

Vou:
- Se o usuário já existe, chamar `supabaseAdmin.auth.admin.updateUserById(ownerId, { password: <nova>, email_confirm: true })` para garantir senha conhecida.
- Sempre retornar `temporary_password` populada.
- Garantir `email_confirm: true` no `createUser` (já está) **e** validar que o usuário está confirmado para conseguir logar de primeira.

### 4. Reset de senha pelo Super-Admin
Adicionar em `src/routes/_super/super.lojas.tsx` (lista de lojas), em cada linha, um botão "Resetar senha do dono" que:
- Gera nova senha temporária via server fn `resetOwnerPassword` (super-admin only).
- Atualiza no Auth via admin API.
- Dispara o e-mail transacional `restaurant-welcome` (mesmo template, reaproveitado) com a nova senha.
- Mostra a senha em toast/modal para o super-admin copiar como fallback.

### 5. Adicionar novos Super-Admins
Criar nova aba **"Equipe / Super-Admins"** em `src/routes/_super/super.equipe.tsx`:
- Lista atual de `user_roles` com `role='super_admin'` (join com `profiles`).
- Botão "Adicionar Super-Admin": form com nome + e-mail.
  - Server fn `addSuperAdmin` (proteção: só super-admin existente pode chamar).
  - Cria usuário se não existir (com senha temporária e `email_confirm: true`).
  - Insere `user_roles(user_id, role='super_admin', restaurant_id=null)`.
  - Dispara e-mail transacional `admin-welcome.tsx` com link `/auth` e credenciais.
- Botão "Remover" em cada linha (com confirmação; impede auto-remoção).
- Adicionar link no sidebar do `_super.tsx`.

## Arquivos afetados

**Backend / server fns:**
- `src/lib/super-admin.functions.ts` — corrigir `createTenant` (sempre setar senha, enviar e-mail), adicionar `resetOwnerPassword`, `addSuperAdmin`, `removeSuperAdmin`, `listSuperAdmins`.
- `src/lib/email-transactional.functions.ts` (novo) — helper `sendTransactionalEmail` que enfileira via `enqueue_email`.

**Templates de e-mail (novos):**
- `src/lib/email-templates/restaurant-welcome.tsx`
- `src/lib/email-templates/admin-welcome.tsx`
- `src/lib/email-templates/registry.ts` (registrar)

**UI:**
- `src/routes/_super/super.lojas.tsx` — botão "Resetar senha".
- `src/routes/_super/super.equipe.tsx` (novo) — gestão de super-admins.
- `src/routes/_super.tsx` — adicionar item de menu "Equipe".
- `src/components/super/CreateTenantDialog.tsx` — mostrar aviso "credenciais também foram enviadas por e-mail".

**Infra:**
- Re-rodar setup de e-mail para garantir cron na instância de produção.
- Scaffold de e-mails transacionais (se ainda não houver `send-transactional-email` route).

## Notas técnicas
- Todos os e-mails passam pela fila (`enqueue_email` → `transactional_emails` / `auth_emails`), respeitando rate-limit e retry.
- Senhas geradas com `crypto.getRandomValues` (já implementado).
- RLS continua aplicando — apenas super-admins veem/manipulam super-admins e resetam senhas.
- Após implementar, vou pedir pra você **publicar** para o cron rodar em produção.

Quer que eu siga com tudo de uma vez?