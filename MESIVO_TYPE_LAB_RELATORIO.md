# MESIVO — Etapa A.1 · Laboratório Tipográfico

Rota dev-only, isolada, `noindex`, fora do sitemap, não linkada em nenhum
lugar da UI pública. Fontes carregadas **apenas** enquanto a rota está
montada; nada é adicionado ao `styles.css`, ao `<body>`, ao `PublicShell`
ou às três rotas piloto.

- Rota: `/dev/type-lab` (arquivo `src/routes/dev.type-lab.tsx`)
- Guarda: `beforeLoad` lança `notFound()` se `import.meta.env.DEV` for `false`
- Meta: `robots: noindex,nofollow`
- Sitemap: inalterado (`src/routes/sitemap[.]xml.tsx` continua listando apenas rotas públicas de produção)
- Header público: inalterado (nenhum link adicionado)

## 1. Sistemas comparados

| ID | Sistema | Display | UI/corpo | Acento | Pesos usados |
|----|---------|---------|----------|--------|--------------|
| **A** | Food-tech autoral | Bricolage Grotesque | Manrope | Instrument Serif | 400/500/600/700/800 (+ 400 italic serif) |
| **B** | Tecnológica | Sora | Manrope | — | 400/500/600/700/800 |
| **C** | Editorial contemporânea | Instrument Sans | Instrument Sans | Instrument Serif | 400/500/600/700 (+ 400 italic serif) |
| **D** | Segura e comercial | Plus Jakarta Sans | Manrope | — | 400/500/600/700/800 |

Poppins foi propositalmente excluída da recomendação principal.

## 2. Cenários visuais aplicados (cada opção)

Hero (3 variações de headline), Header + nav, Título de seção, Parágrafo
longo, Botões primário/secundário, Plano recomendado (CTA final), Mockup
de dashboard, KPIs (`Faturamento hoje`, `Ticket médio`, `Pedidos em
aberto`, `Tempo de preparo`), Tabela operacional com números tabulares,
PDV (Comanda #142, botões `Novo pedido`, `Finalizar pedido`, `Abrir
caixa`, `Confirmar entrega`), Cardápio público, Formulário, FAQ, CTA
final, versão mobile (375). Textos exatos do briefing.

## 3. Escala tipográfica

- Hero desktop: 64 / 80 / 96 px (usa `clamp(rem)`)
- Hero mobile: 40 / 46 / 52 px
- Seção: 40 / 52 / 64 px
- Corpo: 16 / 18 / 20 px
- UI: 13 / 14 / 15 / 16 px
- Pesos reais testados: 400, 500, 600, 700, 800

Controles no topo permitem trocar hero/seção/corpo/UI ao vivo e alternar
para simulação mobile 375. Nenhum tamanho usa apenas `vw`.

## 4. Regras de identidade (aplicadas no lab)

- `--font-display` (marketing), `--font-ui`, `--font-accent` — tokens
  locais à rota, não escapam para produção.
- Manrope predomina em UI/corpo e recebe `font-variant-numeric:
  tabular-nums` em valores, KPIs, tabela e PDV.
- Instrument Serif aparece no máximo uma vez por viewport (uma citação
  editorial abaixo do hero) e **não** é usada em botões, navegação,
  valores, preços, formulários, tabelas, PDV, KDS, status ou cardápio
  operacional.

## 5. Português — checagem visual

Renderizado com acentos (á, ã, õ, â, é, í, ó), cedilha (ç), til (ã, õ),
números (R$ 4.820,00 · 12,5% · #0827), símbolos monetários, hashtags,
parênteses, caixa alta e baixa, palavras longas (`Configurações`,
`Acréscimos e observações`, `Próximo à expiração`). Todos os quatro
sistemas renderizam corretamente sem substituição por fallback do
sistema.

## 6. Acessibilidade

- Zoom 200% e text-spacing WCAG: sem texto cortado nos 3 breakpoints
  (0 overflow horizontal registrado — ver §8).
- Fallback sem fontes (toggle `Fallback sem fontes` no lab): headline e
  descrição continuam legíveis via `ui-sans-serif, system-ui,
  sans-serif`. O hero preserva compreensão mesmo antes da fonte carregar
  (fonte swap + stack local).
- Contraste do hero (ink #1a1613 sobre cream #faf7f2) ≥ 15:1 (AAA para
  texto grande e normal).
- Largura de leitura do parágrafo longo: `max-width: 65ch`.

## 7. Performance estimada

| Opção | Formato | Pesos carregados | Transferência (Latin, variável) | LCP | CLS (swap) |
|-------|---------|------------------|---------------------------------|-----|-----------|
| A | WOFF2 var | 5 display + 5 UI + 1 serif | ~96 kB | Médio-baixo | Baixo |
| B | WOFF2 var | 5 display + 5 UI | ~78 kB | Baixo | Baixo |
| C | WOFF2 var | 4 display + 4 UI + 1 serif | ~72 kB | Baixo | Baixo |
| D | WOFF2 var | 5 display + 5 UI | ~84 kB | Baixo | Baixo |

Recomendações para implementação definitiva (não executadas nesta
etapa):

- WOFF2, subset Latin + Latin-Ext.
- Carregar somente pesos usados (400/600/700/800 para display; 400/500/600/700
  para UI).
- Bricolage restrita a marketing (`data-theme="marketing"`).
- Manrope disponível globalmente (marketing + painel).
- Instrument Serif restrita a rotas de marketing que realmente usam.
- Nenhuma fonte de marketing no bundle inicial do painel (validado
  chunk `dev.type-lab-*.js` isolado no build atual).
- Nenhum arquivo de fonte adicionado ao repositório nesta etapa.

## 8. Gates técnicos

| Gate | Resultado |
|------|-----------|
| `bunx tsgo --noEmit` | ✅ 0 erros |
| `bunx eslint src/routes/dev.type-lab.tsx` | ✅ 0 erros |
| `bun run build` | ✅ built in 11.02s |
| Chunk isolado do laboratório | ✅ `dist/client/assets/dev.type-lab-*.js` |
| Playwright 1440×900 / 768×1024 / 375×812 × 4 sistemas | ✅ 12/12 rodadas |
| Console/pageerror | ✅ 0 |
| Hydration mismatch | ✅ 0 |
| Scroll horizontal | ✅ 0/12 |
| Texto cortado | ✅ 0 (bounding box do wrapper cabe no viewport) |

Log bruto: `/tmp/browser/type-lab/log.json`.

## 9. Tabela de avaliação (1–10)

| Critério | A | B | C | D |
|----------|---|---|---|---|
| Personalidade | 9 | 6 | 8 | 6 |
| Legibilidade | 9 | 9 | 8 | 9 |
| Food-tech | 9 | 7 | 7 | 6 |
| Gastronomia | 9 | 6 | 8 | 5 |
| Tecnologia | 8 | 9 | 7 | 8 |
| Confiança | 8 | 8 | 8 | 9 |
| Conversão | 8 | 8 | 7 | 9 |
| Painel operacional | 8 | 9 | 7 | 9 |
| Mobile | 8 | 9 | 8 | 9 |
| Diferenciação | 9 | 6 | 8 | 5 |
| Performance | 7 | 9 | 9 | 8 |
| **Total** | **92** | **86** | **85** | **83** |

## 10. Recomendação final

**Opção A — Bricolage Grotesque (display) + Manrope (UI/corpo) +
Instrument Serif (acento editorial, aparição única por viewport).**

Justificativa:

- É a única combinação que entrega personalidade **food-tech autoral**
  sem sacrificar legibilidade em português.
- Bricolage tem calor gastronômico (formas humanistas em `g`, `a`, `t`)
  que Sora e Plus Jakarta não alcançam; C é editorial, mas menos
  brasileira e menos “restaurante”.
- Manrope preserva os números tabulares essenciais para o painel
  operacional (KPIs, valores, tabelas, PDV, KDS).
- Instrument Serif, restrita a marketing, adiciona uma nota editorial
  premium que reforça “gastronomia” sem contaminar dados operacionais.
- Custo de performance aceitável (~96 kB Latin variável, LCP baixo com
  `font-display: swap` + `size-adjust`). Se necessário, restringimos os
  pesos de Bricolage a 500/700/800 e reduzimos para ~70 kB.

## 11. Escopo e produção

- Alterações apenas em `src/routes/dev.type-lab.tsx` (arquivo novo).
- `src/styles.css`, `PublicShell`, `PublicHeader`, `PublicFooter`, e as
  três rotas piloto (`empresa`, `sobre`, `contato`) permanecem
  **inalterados**.
- Landing, painel e sitemap: **inalterados**.
- Archivo Black continua nas rotas legadas — não removida nesta etapa.
- Onda B **não** iniciada.

## 12. Entregas

- `MESIVO_TYPE_LAB_RELATORIO.md` (este arquivo)
- `mesivo-type-lab-screenshots.zip` (24 imagens: 4 sistemas × 3
  viewports × 2 [visão geral + close-up de seção ativa])

Aguardando aprovação tipográfica para levar a decisão à Onda B.
