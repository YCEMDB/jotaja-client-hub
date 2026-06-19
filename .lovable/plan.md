## Objetivo
Transformar a ComandaHub em referência para mecanismos de busca por IA (ChatGPT, Gemini, Claude, Perplexity, Copilot) e SEO clássico, mantendo a identidade visual atual (Sunset Blaze, Archivo Black + Hind, brutalismo bento).

## Escopo desta entrega

### 1. Arquivos técnicos na raiz (`public/`)
- `llms.txt` — descrição estruturada da ComandaHub, principais URLs e propósito de cada uma (padrão llmstxt.org).
- `llms-full.txt` — versão expandida com FAQs, benefícios, casos de uso (consumível por LLMs).
- `humans.txt` — equipe, agradecimentos.
- `security.txt` — contato de segurança (RFC 9116).
- Atualizar `robots.txt` para liberar GPTBot, Google-Extended, PerplexityBot, ClaudeBot, Bingbot, etc. e apontar sitemap.
- `manifest.json` — revisar (já existe `site.webmanifest`, garantir campos completos).

### 2. Novas páginas GEO (rotas TanStack em `src/routes/`)
Cada uma com H1 único, H2/H3 semânticos, JSON-LD (SoftwareApplication + FAQPage + BreadcrumbList), OG tags, canonical, conteúdo único 800-1500 palavras com bloco "Resposta rápida" no topo (formato extraível por IA):

- `sistema-para-restaurantes.tsx`
- `sistema-para-pizzarias.tsx`
- `sistema-para-lanchonetes.tsx`
- `sistema-para-acaiterias.tsx`
- `sistema-para-bares.tsx`
- `sistema-para-hamburguerias.tsx`
- `sistema-para-delivery.tsx`
- `sistema-de-comandas-digitais.tsx`
- `controle-de-mesas.tsx`
- `gestao-de-restaurantes.tsx`

### 3. Comparativos (novas rotas)
- `comparativo.comandahub-vs-planilha.tsx`
- `comparativo.comandahub-vs-caderno.tsx`
- `comparativo.comandahub-vs-comanda-de-papel.tsx`
- `comparativo.comandahub-vs-controle-manual.tsx`

### 4. Página GEO hub
- `/sobre-a-comandahub` — agrega: "O que é", "Para quem", "Benefícios", "Problemas que resolve", "Diferenciais", "Missão", "Como funciona", "Histórico". Formato Q&A extraível.

### 5. Central de FAQs (50+ perguntas)
- `/perguntas-frequentes` — 50 FAQs reais agrupados (Geral, Pagamentos, Cardápio, Delivery, Mesas, Suporte, Planos, Técnico). Cada FAQ tem pergunta + resposta curta (1 linha, destaque) + resposta detalhada (parágrafo). Renderiza JSON-LD `FAQPage` completo + Accordion shadcn na UI.

### 6. Atualizar `__root.tsx` e index
- JSON-LD global: `Organization`, `WebSite` (com `SearchAction` apontando para `/blog?q=`), `SoftwareApplication` com `AggregateRating`.
- Garantir OG/Twitter completos (já parcial).
- BreadcrumbList por rota onde aplicável.

### 7. Atualizar `sitemap.xml` e navegação
- Adicionar todas as novas URLs no `src/routes/sitemap[.]xml.tsx`.
- Adicionar links no `Footer.tsx` (nova coluna "Soluções" + "Comparativos") para crawlability interna.

### 8. EEAT
- Já existem `sobre.tsx`, `empresa.tsx`. Reforçar com seção "Histórico do produto", "Missão", "Casos de uso reais" na página `/sobre-a-comandahub`.

## Fora do escopo
- Não toco em business logic (pagamentos, pedidos, painel admin).
- Não regenero identidade visual — uso tokens existentes (`bg-ink`, `text-brand-*`, `shadow-brutal`, `font-display`).
- Performance Lighthouse 95+ depende de medições reais; aplico boas práticas (lazy-loading, preconnect já feito, sem libs novas pesadas), mas não posso garantir nota sem rodar Lighthouse.
- Não crio OG images novas (sem placeholders); uso a OG image atual do site.

## Notas técnicas
- Todas as rotas seguem o padrão `createFileRoute` + `head()` com `title`, `description`, `og:*`, `canonical` self-referencial, e `scripts` com JSON-LD.
- Reuso `ContentLayout` para páginas de conteúdo longo (já preparado com `prose`).
- FAQs e blocos de resposta rápida vão como `<article>` semântico com `<dl>/<dt>/<dd>` ou `<details>` para extração fácil por IA.
- llms.txt em português, listando URLs canônicas em `https://comandahub.online`.

Volume estimado: ~20 novos arquivos de rota + 4-5 arquivos estáticos em `public/` + edição de `__root.tsx`, `sitemap[.]xml.tsx`, `Footer.tsx`, `robots.txt`.
