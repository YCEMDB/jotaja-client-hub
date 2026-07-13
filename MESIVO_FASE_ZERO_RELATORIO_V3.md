# MESIVO — Fase Zero · Relatório V3

Status: **APROVAÇÃO SOLICITADA** — Onda A NÃO iniciada.

## 1. Resumo das correções V3

- Removidos os últimos emojis remanescentes de `src/routes/dev.proto.mobile.tsx`
  (≡, ⋯, ☕, 🔎, ✓, •, ⏱, 💰, 📦) substituídos por SVGs de
  `@/dev-proto/proto-icons` (`IconMenu`, `IconSearch`, `IconCheck`,
  `IconClock`, `IconMoney`, `IconPackage`).
- Símbolo `→` do CTA landing mobile removido (agora "Criar conta grátis"
  puro, sem glifo).
- Aplicado `eslint --fix` (prettier) nos arquivos dev-only alterados.
- Nenhum outro emoji unicode restante em `src/routes/dev.proto.*.tsx` ou
  `src/dev-proto/` (`rg` seta única remanescente é comentário JSX).

## 2. Arquivos alterados (apenas dev-only)

- `src/routes/dev.proto.mobile.tsx` — remoção final de emojis, imports de
  ícones SVG.
- `src/routes/dev.proto.motoboy.tsx` — cosmético (prettier).

Nenhum arquivo de produção foi tocado. Verificado que **não** foram
modificados:

- `src/styles.css`
- `src/routes/__root.tsx`
- shells reais, rotas reais, componentes compartilhados
- backend, Supabase, RPCs, RLS, migrations
- `package.json`, lockfile

## 3. Screenshots (individuais)

Todos em `/mnt/documents/mesivo-v3-screenshots/` e no zip
`mesivo-fase-zero-screenshots-v3.zip`:

| # | Arquivo | Rota | Viewport |
|---|---------|------|----------|
| 1 | `landing_375.png` | /dev/proto/landing | 375×812 |
| 2 | `landing_390.png` | /dev/proto/landing | 390×844 |
| 3 | `dashboard_375.png` | /dev/proto/dashboard | 375×812 |
| 4 | `dashboard_768.png` | /dev/proto/dashboard | 768×1024 |
| 5 | `pdv_375.png` | /dev/proto/pdv | 375×812 (FAB fechado) |
| 6 | `pdv_768.png` | /dev/proto/pdv | 768×1024 (tablet grid 3 col) |
| 7 | `cardapio_375.png` | /dev/proto/cardapio | 375×812 |
| 8 | `motoboy_375_top.png` | /dev/proto/motoboy | 375×812 topo |
| 9 | `motoboy_375_bottom.png` | /dev/proto/motoboy | 375×812 rolado |
| 10 | `mobile_sheet.png` | /dev/proto/mobile | folha geral |

<presentation-artifact path="mesivo-v3-screenshots/landing_375.png" mime_type="image/png"></presentation-artifact>
<presentation-artifact path="mesivo-v3-screenshots/landing_390.png" mime_type="image/png"></presentation-artifact>
<presentation-artifact path="mesivo-v3-screenshots/dashboard_375.png" mime_type="image/png"></presentation-artifact>
<presentation-artifact path="mesivo-v3-screenshots/dashboard_768.png" mime_type="image/png"></presentation-artifact>
<presentation-artifact path="mesivo-v3-screenshots/pdv_375.png" mime_type="image/png"></presentation-artifact>
<presentation-artifact path="mesivo-v3-screenshots/pdv_768.png" mime_type="image/png"></presentation-artifact>
<presentation-artifact path="mesivo-v3-screenshots/cardapio_375.png" mime_type="image/png"></presentation-artifact>
<presentation-artifact path="mesivo-v3-screenshots/motoboy_375_top.png" mime_type="image/png"></presentation-artifact>
<presentation-artifact path="mesivo-v3-screenshots/motoboy_375_bottom.png" mime_type="image/png"></presentation-artifact>
<presentation-artifact path="mesivo-v3-screenshots/mobile_sheet.png" mime_type="image/png"></presentation-artifact>

## 4. Auditoria de bounding boxes

Script Playwright automatizado nos viewports 375, 390, 430, 768, 1024,
1280 e 1440 — checagem de `documentElement.scrollWidth > innerWidth`.

- **Scroll horizontal:** 0 violações em todas as rotas / viewports.
- **Console errors:** 0.
- **pageerror:** 0.
- **Unhandled rejections:** 0.
- **Hydration mismatch:** 0.

## 5. Ícones SVG — cobertura

Todos os símbolos operacionais mapeados em `src/dev-proto/proto-icons.tsx`
(busca, menu, sino, ajuda, perfil, telefone, mapa, check, alerta,
pacote, dinheiro, cartão, pin, relógio, imagem, burger, seta). Todos com
`aria-hidden` decorativo. Nenhum glifo faltante, nenhum quadrado.

## 6. Gates técnicos

| Gate | Resultado |
|------|-----------|
| `bunx tsgo --noEmit` | **PASS** (exit 0, sem erros) |
| `bunx eslint` dev-only | **PASS** após `--fix` (prettier) |
| `bun run build` | **PASS** (`✓ built in 12.93s`, nitro OK) |
| Playwright 6 rotas | **PASS** (0 issues) |
| Reduced motion | respeitado (hooks `useReducedMotionSafe`) |
| Safe-area / cart-bar | tokens aplicados |

## 7. Git

```
$ git status --short
(clean)
$ git diff --stat
(clean)
```

Todas as alterações V3 ficaram restritas a `src/routes/dev.proto.*.tsx`
e `src/dev-proto/*`. Produção intacta.

## 8. Pendências reais

Nenhuma bloqueante. Onda A pode iniciar após aprovação visual final.

## 9. Artefatos entregues

- `MESIVO_FASE_ZERO_RELATORIO_V3.md`
- `/mnt/documents/mesivo-fase-zero-screenshots-v3.zip`
- `/mnt/documents/mesivo-v3-screenshots/*.png`
