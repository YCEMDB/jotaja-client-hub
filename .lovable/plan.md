## Plano de Conteúdo SEO — 30 dias (ComandaHub)

Baseado em dados do Semrush (BR). Foco em ranquear rápido com termos de KDI baixo e capturar tráfego de comparação ("alternativa ao iFood", "vs Goomer/Anota.ai").

### Diagnóstico rápido

- Domínio ainda novo, sem dados Semrush — janela ideal para criar autoridade tópica antes que o conteúdo escale.
- Pilar competitivo: "cardapio digital" (4.400/mês, KDI 46) — viável, mas exige cluster.
- Mina de ouro de KDI 0–10: "cardapio whatsapp", "sistema de pedidos para restaurante", "alternativa ifood", além de dezenas de "como fazer X" com 20–70/mês cada (somados, tráfego relevante).
- Concorrentes a atacar diretamente em páginas comparativas: Goomer, Anota.ai, Saipos, Abrahão, Olaclick, Sischef, Simpliza.

### Estratégia em 3 frentes

1. **Hub & spoke**: 1 página pilar ("cardápio digital") + 8 artigos satélites linkando para ela.
2. **Long-tail "como fazer X"**: cada artigo cobre 3–5 variações próximas (volume baixo individual, alto somado, KDI ~0).
3. **Páginas de comparação/alternativa**: capturam intenção de troca, que converte muito.

### Calendário (4 semanas, 3 conteúdos/semana = 12 peças)

#### Semana 1 — Fundação e quick wins

- **Seg** — Pilar: `/cardapio-digital` — "Cardápio Digital: o guia completo para restaurantes em 2026" (alvo: cardapio digital, cardápio digital, cardapio para restaurante).
- **Qua** — Blog: `/blog/como-fazer-cardapio-digital-whatsapp` (cobre 6 variações de "cardapio whatsapp", KDI 0).
- **Sex** — Landing: `/alternativa-ifood` — "Alternativa ao iFood sem comissão" (KDI 0, alta intenção).

#### Semana 2 — Comparativos (alta conversão)

- **Seg** — `/comparativo/comandahub-vs-goomer`
- **Qua** — `/comparativo/comandahub-vs-anota-ai`
- **Sex** — `/comparativo/comandahub-vs-saipos`

Estrutura comum: tabela de preços, taxas, funcionalidades, prós/contras, CTA.

#### Semana 3 — Long-tail "como fazer"

- **Seg** — `/blog/como-criar-cardapio-digital-qr-code` (cobre 5 variações de QR Code).
- **Qua** — `/blog/como-fazer-cardapio-digital-gratis` (cobre 4 variações "gratis/gratuito").
- **Sex** — `/blog/como-montar-cardapio-digital-canva-vs-plataforma` (intercepta quem busca Canva).

#### Semana 4 — Nicho vertical + conversão

- **Seg** — `/segmentos/pizzaria/sistema-de-pedidos`
- **Qua** — `/segmentos/hamburgueria/cardapio-digital`
- **Sex** — `/blog/sistema-de-pedidos-para-restaurante` (KDI 0, alta CPC $3,05 = intenção comercial).

### Padrão técnico por página (head meta TanStack)

Toda página nova precisa, no `head()` do route file:

- `title` dentro de `meta` (≤60 chars, com keyword principal)
- `description` (≤160 chars)
- `og:title`, `og:description`, `og:url`
- `link rel="canonical"` apontando para `https://comandahub.online/<rota>`
- JSON-LD: `Article` nos blogs, `Product` nas landings de comparativo, `FAQPage` quando houver FAQ
- H1 único com a keyword exata, H2s com variações
- Link interno: todos os satélites apontam para o pilar `/cardapio-digital`

### Checklist de publicação

1. Criar route file em `src/routes/` (ex: `blog.como-fazer-cardapio-digital-whatsapp.tsx`).
2. Preencher `head()` conforme padrão acima.
3. Adicionar entrada em `sitemap.xml`.
4. Linkar do menu/footer quando aplicável.
5. Solicitar indexação no Search Console.

### Resultados esperados em 30 dias

- 12 páginas indexadas cobrindo ~40 variações de keyword.
- Primeiros rankings em termos KDI 0 (cardapio whatsapp, alternativa ifood) já em 2–4 semanas.
- Pilar "cardapio digital" leva 60–90 dias para escalar — começar agora é crítico.
- Páginas comparativas tendem a converter 3–5× mais que blog (intenção de troca).

### Próximo passo sugerido

Quer que eu já comece criando o **route file da página pilar `/cardapio-digital`** com toda a estrutura SEO (head meta, JSON-LD, H1/H2s, links internos para os satélites)?