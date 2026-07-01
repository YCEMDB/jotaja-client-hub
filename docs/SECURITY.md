# Segurança — Comandex

## Postura Geral

- **Zero trust no cliente:** toda validação crítica é servidor.
- **RLS obrigatório** em 100% das tabelas `public`.
- **Segredos isolados** em `restaurant_secrets` e `vault`.
- **RPCs `SECURITY DEFINER`** com `SET search_path = public, pg_temp`.

## Autenticação

- Provedor: Supabase Auth.
- Métodos ativos: Email/senha, Google OAuth.
- Anonymous sign-ups: **desabilitado**.
- Auto-confirm email: **desabilitado** (usuário confirma).
- Sessão JWT armazenada em `localStorage` (SPA) — refresh automático.

### Fluxo de bootstrap
1. Trigger `handle_new_user` cria `profiles` no primeiro login.
2. `useAuth` carrega perfil + `user_roles` + restaurante vinculado.
3. Redireciona conforme papel.

## Autorização

Modelo baseado em papéis persistidos em `public.user_roles`.

| Role | Escopo |
|---|---|
| `super_admin` | Plataforma inteira |
| `owner` | Um restaurante (via `restaurants.owner_id`) |
| `manager` | Operacional + config do restaurante vinculado |
| `employee` | Operacional do restaurante vinculado |

**Anti-padrão bloqueado:** roles nunca ficam em `profiles` (evita escalonamento de privilégio via UPDATE do próprio perfil).

Helper canônico:
```sql
public.is_team_owner(_uid uuid, _restaurant_id uuid) RETURNS boolean
-- true se: _uid é owner do restaurante OR _uid é super_admin
-- Bloqueia spoofing: rejeita se _uid ≠ auth.uid() e caller não é super_admin.
```

## `SECURITY DEFINER` — Regras

Toda função `SECURITY DEFINER` DEVE:
1. Definir `SET search_path = public, pg_temp` (ou `'public'`).
2. Validar `auth.uid()` quando o contexto exigir.
3. Nunca receber `_user_id` sem verificar contra `auth.uid()`.
4. Ter GRANT explícito para `authenticated`/`anon` conforme o caso.

## Rate Limit

- 🚧 **Não implementado no app.** Rely no rate limit padrão do Supabase (por IP).
- Planejado: middleware em rotas `/api/public/*` com contador em `app_settings`.

## Validação de Entrada

RPCs públicas validam:
- Comprimento de strings (nome 1–120, phone 6–20, notas ≤ 500).
- Formatos (regex de email, telefone só dígitos).
- Ranges numéricos (quantities ≥ 1, prices ≥ 0).
- Whitelist de enums.
- Cupom sob `FOR UPDATE` (evita race).

## Webhooks

Rota `/api/public/mp-webhook`:
- Verifica HMAC do Mercado Pago (`x-signature`).
- `timingSafeEqual` para comparação.
- Sem verificação → responde 401 antes de tocar no banco.

## Segredos

| Local | Uso |
|---|---|
| `restaurant_secrets.mp_access_token` | Token MP por restaurante — acesso via RPC/helper |
| `vault.decrypted_secrets` | `email_queue_service_role_key` (Postgres) |
| Env do Worker | `SUPABASE_*`, `LOVABLE_API_KEY`, `MP_WEBHOOK_SECRET` |
| Frontend | Apenas `VITE_SUPABASE_PUBLISHABLE_KEY` (chave publishable) |

**Nunca** commitar service role key. **Nunca** logar tokens.

## Boas Práticas Obrigatórias

- ✅ Toda tabela nova: `CREATE TABLE` → `GRANT` → `ENABLE RLS` → `CREATE POLICY` na mesma migration.
- ✅ Toda RPC: `SET search_path`.
- ✅ Toda escrita crítica: via RPC, nunca `.from('t').update()` no cliente.
- ✅ Toda migration reversível (comentar como reverter).
- ❌ Nunca `GRANT ALL ... TO anon`.
- ❌ Nunca policy `USING (true)` sem filtro.
- ❌ Nunca confiar em `plan` ou `role` vindo do cliente.
- ❌ Nunca retornar `restaurant_secrets` em RPC pública.

## Auditoria

- `order_status_history` — imutável, INSERT-only.
- 🚧 `audit_log` genérico (Sprint 5) para operações administrativas críticas.

## Descobertas Fechadas (histórico)

- Sprint 2.1: `is_team_owner` hardened contra spoofing de `_uid`.
- Sprint 2.2.g: removido `is_open` (redundante) e `plan` (substituído por `plan_id`).
- Auditoria pré-Sprint 3: RPC `create_public_order` restringida a chamadas anônimas legítimas + validação de restaurante ativo.
