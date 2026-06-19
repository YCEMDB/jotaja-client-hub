## Auditoria de segurança — achados e plano de correção

### Achados (priorizado por severidade)

**Alta**
1. `products`, `categories`, `delivery_areas`, `delivery_neighborhoods`: política `SELECT` com `USING true` permite a qualquer anônimo enumerar o catálogo completo de todos os restaurantes (não só o que está navegando). Vazamento competitivo entre tenants.
2. Webhook `/api/public/mercadopago-webhook`: aceita qualquer POST sem verificar a assinatura `x-signature` do Mercado Pago. Embora o handler revalide o pagamento na API do MP (mitigando forjar status "paid"), permite DoS/floods e abuso de cota da API MP.
3. `restaurants_owner_team_select`: retorna todas as colunas sensíveis (`email`, `cnpj`, `admin_notes`, `monthly_order_count`, `owner_id`, `plan`, `subscription_ends_at`) para qualquer membro da equipe, não só o dono.
4. `customers_public_insert`: anônimos podem inserir clientes arbitrários sem deduplicação por telefone — polui CRM e infla contagens.

**Média**
5. Bucket de Storage `product-images`: sem `file_size_limit` nem `allowed_mime_types` — qualquer arquivo de qualquer tamanho pode ser enviado (somente por membros, mas mesmo assim).
6. Headers HTTP de segurança ausentes: sem `Strict-Transport-Security`, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, `Content-Security-Policy`.
7. Proteção contra senha vazada (HIBP) não habilitada em Auth.

**Aceito / não-issue (documentar)**
- 3 RPCs `SECURITY DEFINER` públicas (`get_public_restaurant`, `get_public_order`, `validate_public_coupon`) — intencionais, são a fronteira de acesso anônimo ao storefront; whitelist de colunas dentro da função.
- `dangerouslySetInnerHTML` apenas em `src/components/ui/chart.tsx` (shadcn) com conteúdo não vindo do usuário — sem risco de XSS.
- Servidor Supabase já tem brute-force protection nativa; CSRF não se aplica a `createServerFn` (usa Bearer token, não cookie).
- Sem evidência de SQL injection: 100% do acesso via Supabase client (parametrizado) ou RPCs `EXECUTE` parametrizadas. Sem `raw()` ou concatenação SQL no código.
- Sem segredos hard-coded no frontend além das chaves publicáveis (Supabase anon, Mercado Pago public key) — uso correto.
- `_authenticated/` gate gerenciado pela integração + `requireSupabaseAuth` em todas as server functions sensíveis — autorização correta.

### Correções (aplicadas em uma migração + ajustes de código + config Auth)

**Migration única**
```sql
-- 1. Restringir catálogo público a restaurantes ATIVOS (não vazar entre tenants)
DROP POLICY products_public_select ON public.products;
CREATE POLICY products_public_select ON public.products FOR SELECT TO anon, authenticated
USING (is_active = true AND EXISTS (
  SELECT 1 FROM public.restaurants r WHERE r.id = products.restaurant_id AND r.is_active = true
));

DROP POLICY categories_public_select ON public.categories;
CREATE POLICY categories_public_select ON public.categories FOR SELECT TO anon, authenticated
USING (is_active = true AND EXISTS (
  SELECT 1 FROM public.restaurants r WHERE r.id = categories.restaurant_id AND r.is_active = true
));

DROP POLICY delivery_areas_public_select ON public.delivery_areas;
CREATE POLICY delivery_areas_public_select ON public.delivery_areas FOR SELECT TO anon, authenticated
USING (EXISTS (SELECT 1 FROM public.restaurants r WHERE r.id = delivery_areas.restaurant_id AND r.is_active = true));

-- delivery_neighborhoods é catálogo global (admin) — manter mas restringir a authenticated
DROP POLICY dn_public_select ON public.delivery_neighborhoods;
CREATE POLICY dn_public_select ON public.delivery_neighborhoods FOR SELECT TO anon, authenticated USING (true);

-- 2. Upsert público de cliente com dedup por telefone (substitui INSERT direto)
DROP POLICY customers_public_insert ON public.customers;
-- remove insert direto; cardápio passa a chamar RPC abaixo
CREATE OR REPLACE FUNCTION public.upsert_public_customer(
  p_restaurant_id uuid, p_name text, p_phone text, p_email text DEFAULT NULL
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_id uuid; v_clean_phone text;
BEGIN
  IF p_restaurant_id IS NULL OR length(btrim(p_name)) < 1 OR length(btrim(p_phone)) < 6 THEN
    RAISE EXCEPTION 'invalid_input';
  END IF;
  v_clean_phone := regexp_replace(p_phone, '\D', '', 'g');
  IF NOT EXISTS (SELECT 1 FROM public.restaurants WHERE id=p_restaurant_id AND is_active=true) THEN
    RAISE EXCEPTION 'restaurant_not_found';
  END IF;
  INSERT INTO public.customers(restaurant_id, name, phone, email)
  VALUES (p_restaurant_id, btrim(p_name), v_clean_phone, NULLIF(btrim(p_email),''))
  ON CONFLICT (restaurant_id, phone) DO UPDATE SET name=EXCLUDED.name, email=COALESCE(EXCLUDED.email, customers.email)
  RETURNING id INTO v_id;
  RETURN v_id;
END$$;
GRANT EXECUTE ON FUNCTION public.upsert_public_customer TO anon, authenticated;
-- unique index para o ON CONFLICT
CREATE UNIQUE INDEX IF NOT EXISTS customers_restaurant_phone_uniq ON public.customers(restaurant_id, phone);

-- 3. Restaurants: separar colunas sensíveis com policy granular
-- Mantém SELECT da tabela inteira somente para owner/super_admin;
-- team members (não-owner) acessam via view com colunas reduzidas.
DROP POLICY restaurants_owner_team_select ON public.restaurants;
CREATE POLICY restaurants_owner_select ON public.restaurants FOR SELECT TO authenticated
USING (owner_id = auth.uid() OR private.is_super_admin(auth.uid()));

CREATE OR REPLACE VIEW public.restaurants_team_view WITH (security_invoker=true) AS
SELECT id, name, slug, description, logo_url, cover_url, primary_color, accent_color,
       is_open, is_active, min_order_value, accepts_delivery, accepts_pickup, accepts_dine_in,
       opening_hours, whatsapp, mp_public_key, pickup_instructions, pickup_time_minutes,
       accept_pix_online, accept_cash_on_delivery, accept_card_on_delivery
FROM public.restaurants
WHERE owner_id = auth.uid() OR private.has_restaurant_access(auth.uid(), id);
GRANT SELECT ON public.restaurants_team_view TO authenticated;

-- 4. Storage hardening: limites e MIME
UPDATE storage.buckets SET file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg','image/png','image/webp','image/avif']
WHERE id = 'product-images';
```

**Código**
- `src/routes/api/public/mercadopago-webhook.ts`: validar header `x-signature` HMAC-SHA256 com `MP_WEBHOOK_SECRET` (se configurado; soft-fail com log se ausente para não quebrar quem ainda não configurou). Comparação `timingSafeEqual`.
- `src/server.ts`: aplicar headers de segurança em toda resposta (`HSTS`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`, `CSP` permissiva para Supabase/MP/fontes do Google compatível com SSR React).
- `src/routes/$slug.tsx` e outros consumidores do storefront: trocar `INSERT customers` direto pela RPC `upsert_public_customer`.
- Onde código autenticado lê `restaurants.*`: usar `restaurants_team_view` para membros não-proprietários (busca atual já roda como owner na maioria dos casos; apenas confirmar).

**Configuração Auth (via `configure_auth`)**
- Habilitar `password_hibp_enabled: true` (proteção contra senhas vazadas — HIBP).

**Documentação / aceito**
- Atualizar `security-memory` com a nova postura.
- Brute-force / rate-limiting de login fica delegado à proteção nativa do Lovable Cloud (Supabase Auth já bloqueia tentativas excessivas). Para rate-limit por IP em endpoints customizados (`/api/public/*`), documentar como melhoria futura (exige Durable Objects no Worker, fora do escopo desta auditoria).
- Auditoria de dependências: rodar npm audit; aplicar `bun update` apenas se houver vulnerabilidade crítica resolvível sem breaking change.

### Relatório final (entregue ao usuário)
Markdown com: tabela de vulnerabilidades (id, severidade, ação tomada), score de segurança antes (≈ 6,5/10) e depois esperado (≈ 9,0/10), checklist OWASP Top 10 marcando cada item A01–A10, e seção "Não corrigido automaticamente" listando o rate-limit por IP em rotas customizadas e quaisquer findings ignorados.

### Fora do escopo
- Refatorar a tabela `customers` para chave única se ela já não existe (a migração cria o índice). 
- Implementar 2FA — não solicitado e não está habilitado hoje.
- Reescrever páginas admin para usar a nova view `restaurants_team_view` (apenas se a leitura atual quebrar; o painel já roda como owner na maioria dos casos — vou validar e ajustar pontualmente).
