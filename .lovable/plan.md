## Plano de execução (12 itens)

Vou agrupar em 4 ondas para entregar valor rápido e evitar conflitos de migração.

---

### Onda 1 — Correções urgentes (bugs visíveis)

**1. Email continua "Jotajá"**  
Causa: o webhook `auth-email-hook` ainda não foi ativado no Supabase (DNS de `notify.comandahub.online` ainda propagando) e o fallback usa o nome SMTP padrão.  
Ação:
- Verificar status do domínio (`check_email_domain_status`).
- Forçar o `SITE_NAME = "ComandaHub"` e o `from` em `src/routes/lovable/email/auth/webhook.ts` (já está, validar).
- Trocar temporariamente o **"Sender name"** padrão do Supabase Auth para `ComandaHub` (via `configure_auth`) — assim, mesmo no fallback, não aparece "Jotajá".
- Aguardar publicação para o hook ativar.

**2. Reset de senha não funciona**  
Causa: hoje a página `/reset-password` espera o evento `PASSWORD_RECOVERY` do hash da URL. Como o link agora passa pelo webhook (`notify.comandahub.online/...`), o token chega como `?token_hash=...&type=recovery` e precisa de `supabase.auth.verifyOtp` antes do `updateUser`.  
Ação: reescrever `src/routes/reset-password.tsx` para:
- Ler `token_hash` + `type` da query.
- Chamar `supabase.auth.verifyOtp({ token_hash, type: 'recovery' })`.
- Só então mostrar o formulário e chamar `updateUser({ password })`.
- Fallback: se não houver token, mostrar "link inválido / expirado".

**8. Botão "Finalizar pedido" em branco**  
Causa: em `src/routes/$slug.tsx:319` o botão usa `color:#fff` sobre `var(--brand)` da loja. Quando a cor primária do restaurante é clara, some o texto.  
Ação: aplicar contraste automático (calcular luminância do `--brand` e escolher texto preto/branco) **ou** trocar para token semântico (`bg-brand-orange text-ink` com sombra brutal, alinhado ao design system Sunset Blaze).

**11. Foto errada na landing**  
Ação: identificar o asset usado no Hero (`src/components/jotaja/Hero.tsx` / `Bento.tsx`) e substituir por uma mock-up gerada via `imagegen` mostrando o painel real do ComandaHub (lista de pedidos + cardápio do nosso UI), no estilo brutalist do design system.

---

### Onda 2 — Regras de negócio e licenciamento (itens 3, 4, 5)

**4. Eliminar "domínio próprio"**  
Remover toda a feature do painel do restaurante:
- Apagar seção em `src/routes/_authenticated/admin.configuracoes.tsx`.
- Manter `src/lib/custom-domain.functions.ts` e `api/public/__domain-check.ts` **só para o super-admin** (caso queira no futuro), ou remover por completo. Recomendo **remover do painel da loja** e deixar só visível em `/super`.
- Atualizar copy da landing/comparativos que prometia "domínio próprio" → trocar por "subdomínio ComandaHub grátis".

**3. Definir 3 planos com limites + aplicação**

| Plano | Preço | Pedidos/mês | Usuários | Lojas | Recursos |
|---|---|---|---|---|---|
| **Starter** | R$ 97/mês | até 300 | 1 | 1 | Cardápio digital, link público, Pix/cartão na entrega, WhatsApp, relatórios básicos |
| **Pro** ⭐ | R$ 197/mês | até 1.500 | 5 | 1 | Tudo do Starter + cupons, áreas/taxas de entrega, entregadores, impressão automática, integração Mercado Pago online, relatórios avançados |
| **Business** | R$ 397/mês | ilimitado | ilimitado | até 5 | Tudo do Pro + multi-loja, PDV manual, API, prioridade no suporte, gerente de conta |

Aplicação (server-side, em `src/lib/plan-limits.functions.ts` novo):
- `getPlanLimits(restaurantId)` retorna o plano + limites.
- Middleware no `createOrder`: bloqueia se passar de pedidos/mês (cache em `restaurants.monthly_order_count` + reset via cron).
- UI mostra contador no `admin.index.tsx` ("237 / 300 pedidos este mês").
- Recursos premium escondidos/desabilitados nos planos menores com badge "Disponível no Pro".

Migração: adicionar coluna `restaurants.plan_id` (FK p/ `app_plans`) + `restaurants.monthly_order_count` + `restaurants.month_reset_at`. Popular `app_plans` com os 3 planos acima.

**5. Termos, política, SLA, suporte** (modelo SaaS padrão BR)  
Criar/atualizar:
- `src/routes/termos.tsx` — Termos de uso (assinatura mensal, cancelamento a qualquer momento com aviso de 7 dias, sem multa, propriedade dos dados do cliente, vedações de uso, foro de Vitória/ES).
- `src/routes/privacidade.tsx` — LGPD: dados coletados, base legal, retenção (90 dias após cancelamento), DPO, direitos do titular.
- `src/routes/sla.tsx` (novo) — uptime alvo 99,5%, janelas de manutenção, créditos por descumprimento.
- `src/routes/suporte.tsx` (novo) — canais (WhatsApp seg-sex 9h-19h, email 24h, urgências 24/7 só Business), tempo de resposta por plano.
- Link no Footer.

---

### Onda 3 — Operação do restaurante (6, 7, 9, 10)

**6. Impressão automática (escolha: navegador + diálogo silencioso)**  
- Página `src/routes/_authenticated/admin.pedidos.tsx`: ao receber pedido novo via realtime, dispara `window.print()` com layout 80mm (já temos `src/lib/print-receipt.ts`).
- Nova aba em **Configurações → Impressão**:
  - Toggle "Imprimir pedidos automaticamente".
  - Quantidade de vias (1-3).
  - Instruções para o lojista configurar Chrome em modo `--kiosk-printing` (passo a passo + botão "copiar comando").
  - Botão "Testar impressão".
- Som de alerta ao chegar pedido (já existe parcial em `order-notifications.ts`, garantir).

**7. Modalidades entrega + retirada na loja**  
Auditar e garantir que ambas funcionam em todo o fluxo:
- Cardápio público (`$slug.tsx`): seletor "Entrega / Retirar na loja" no checkout. Se retirada → some campo endereço, mostra endereço da loja + tempo estimado de retirada.
- Admin (`admin.configuracoes.tsx`): toggles `accepts_delivery` e `accepts_pickup` + campos `pickup_time_minutes` e `pickup_instructions`.
- Pedidos (`admin.pedidos.tsx`): badge visível indicando o tipo, filtro por tipo.
- Recibo impresso: mostra "RETIRADA" em destaque quando for pickup.

**9. PDV manual no painel admin**  
Nova rota `src/routes/_authenticated/admin.pdv.tsx`:
- Busca rápida de produtos do cardápio (atalhos por categoria).
- Carrinho lateral com qtd / observações.
- Cliente: buscar por telefone (autocompleta) ou cadastro rápido inline.
- Tipo: Delivery / Retirada / Balcão.
- Pagamento: Pix / Dinheiro / Cartão / "A combinar".
- Confirma → cria order no mesmo schema (marcando `source = 'manual'`).
- Acessível só por planos Pro/Business (com upsell no Starter).
- Item no menu lateral do admin.

**10. Bairros pré-cadastrados Vitória + Vila Velha**  
Pesquisar lista oficial via `websearch` (IBGE / prefeituras).
- Nova tabela `delivery_neighborhoods` (template global): `id, city, state, name`.
- Tabela `restaurant_delivery_zones`: `restaurant_id, neighborhood_id, fee, eta_minutes, is_active` (lojista preenche valores).
- Seed inicial com ~80 bairros de Vitória + ~100 de Vila Velha.
- UI em **Configurações → Áreas de entrega**: lista pré-populada, lojista só define taxa e ativa/desativa. Botão "Adicionar bairro fora da lista".
- No checkout do cardápio: select de bairros (não digitação livre) → puxa taxa automática.

---

### Onda 4 — Polimento

**12. Visão de empresário (revisão final)**  
Depois de tudo acima, passada de revisão pensando em conversão e operação:
- CTA do hero: foco em "Comece grátis em 5 min" + prova social.
- Comparativo iFood com números reais e calculadora de economia.
- Onboarding (`admin.onboarding.tsx`) com checklist visual.
- Email de boas-vindas com link direto p/ cadastrar 1º produto.
- Página de upgrade clara dentro do admin quando bate limite.

---

## Detalhes técnicos

**Migrações necessárias (1 só batch):**
- `restaurants`: + `plan_id uuid`, + `monthly_order_count int default 0`, + `month_reset_at timestamptz`, + `pickup_time_minutes int`, + `pickup_instructions text`, + `auto_print_enabled bool default false`, + `auto_print_copies int default 1`.
- `orders`: + `source text default 'web' check in ('web','manual','whatsapp')`.
- Nova tabela `delivery_neighborhoods` (RLS: SELECT público).
- Nova tabela `restaurant_delivery_zones` (RLS: SELECT público, INSERT/UPDATE/DELETE só dono da loja).
- Seed dos 3 planos em `app_plans` + ~180 bairros.
- Cron diário (pg_cron) para zerar `monthly_order_count` no dia 1.

**Arquivos novos:**
- `src/lib/plan-limits.functions.ts`
- `src/routes/_authenticated/admin.pdv.tsx`
- `src/routes/sla.tsx`, `src/routes/suporte.tsx`
- `src/components/admin/PlanLimitBadge.tsx`, `DeliveryZonesEditor.tsx`, `AutoPrintSettings.tsx`

**Arquivos editados (principais):**
- `src/routes/reset-password.tsx` (verifyOtp)
- `src/routes/$slug.tsx` (botão checkout + seletor entrega/retirada + bairros)
- `src/routes/_authenticated/admin.configuracoes.tsx` (remover domínio, adicionar impressão, retirada, áreas)
- `src/routes/_authenticated/admin.pedidos.tsx` (auto-print + badge tipo)
- `src/components/jotaja/Hero.tsx` (nova imagem)
- `src/routes/termos.tsx`, `src/routes/privacidade.tsx` (reescrever)

**O que NÃO vou mexer:**  
Schema dos pedidos existentes, fluxo de autenticação Google, integração Mercado Pago já configurada.

---

Ao final entrego um resumo de empresário: o que mudou para o cliente final, o que mudou para o lojista, e o que isso destrava em receita (planos Pro/Business + PDV manual + auto-print são os 3 maiores diferenciais agora).
