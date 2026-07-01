# TODO Técnico — Comandex

Débito técnico e pendências identificadas. Priorizado por impacto.

## 🔴 Crítico
_(bloqueiam features seguras ou comprometem SLA)_

- [ ] **Rate limit em RPCs públicas** — `create_public_order`, `validate_public_coupon` não têm proteção anti-abuse. Dep.: middleware em `/api/public/*` + tabela contador.
- [ ] **Retry policy do webhook MP** — hoje se `mp-webhook` falhar, pagamento fica sem sincronizar. Dep.: DLQ + reprocessamento.
- [ ] **Trigger `enforce_plan_product_limit`** — `max_products` só é checado no frontend. Dep.: nova trigger em `products`.

## 🟠 Alto
_(afetam experiência ou observabilidade)_

- [ ] **Audit log genérico** — operações administrativas (mudança de plano, exclusão de dados) sem trilha. Dep.: tabela `audit_log` + helpers.
- [ ] **Testes E2E do checkout** — hoje só validado manualmente. Dep.: Playwright suite.
- [ ] **Backup do `restaurants.opening_hours`** — schema JSONB sem validação; um UPDATE malformado quebra `is_restaurant_open_now`. Dep.: CHECK constraint com validação de estrutura.
- [ ] **Índice em `order_status_history(order_id, created_at)`** — queries de timeline sem índice explícito.
- [ ] **Deprecar `mp_public_key` em `restaurants`** — mover para `restaurant_secrets` para consistência.
- [ ] **Migração de imagens legadas** — alguns `products.image_url` apontam para hosts externos; mover para bucket `product-images`.

## 🟡 Médio
_(qualidade de código / UX)_

- [ ] **Padronizar mensagens de erro** — hoje algumas RPCs retornam PT-BR e outras EN; consolidar em EN + i18n no frontend.
- [ ] **`useAuth` refatoração** — hook faz demais (perfil, roles, restaurante). Quebrar em `useProfile`, `useRestaurant`.
- [ ] **Documentar contract de `delivery_address`** — hoje JSONB livre; definir Zod schema.
- [ ] **Cleanup de `signup_leads`** — sem retenção; leads antigos acumulam. Dep.: cron mensal.
- [ ] **Loading skeletons consistentes** — algumas rotas usam spinners, outras skeletons. Padronizar.
- [ ] **Mobile: bottom sheet no carrinho** — hoje é dialog central; UX melhor com sheet.

## 🟢 Baixo
_(nice-to-have)_

- [ ] **Storybook** para componentes de UI.
- [ ] **CI check** que roda `supabase--linter` em PR.
- [ ] **Sitemap dinâmico** por restaurante ativo.
- [ ] **Dark mode** no cardápio público (opt-in do restaurante).
- [ ] **Atalhos de teclado** no painel admin (KDS: 1=confirmar, 2=preparar, etc.).
- [ ] **PWA install prompt** no cardápio público.

## Dependências

```
Rate limit ─┬─► Testes E2E (para validar limites)
            └─► Webhook retry
Audit log ──► Compliance LGPD (Sprint 5)
Product limit ──► Não bloqueia mas evita abuso do starter
```
