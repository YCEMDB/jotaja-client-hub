---
name: Mesivo typography system (approved A.1)
description: Official font roles, scale, weights, and mobile rules for Mesivo rebrand. Bricolage marketing-only, Manrope product, Instrument Serif accent.
type: design
---
# Mesivo Typography (Etapa A.1 approved)

## Roles
- **Bricolage Grotesque** — marketing display ONLY: hero, section titles on public pages, campaigns, short commercial callouts. NEVER in painel, tables, forms, PDV, KDS, status, filters, prices, long text.
- **Manrope** — body, UI, nav, buttons, forms, cardápio, painel, PDV, KDS, tables, numbers, reports, badges, status, prices.
- **Instrument Serif** — editorial accent only. Max 1 perceptible use per viewport (word / short phrase / short quote). NEVER in buttons, prices, nav, forms, painel, PDV, KDS, status, tables, operational menu.

## Scale
- Hero: `clamp(2.5rem, 5.7vw, 5.5rem)`, line-height 0.96, letter-spacing -0.045em, weight 750
- Section title: `clamp(2rem, 4vw, 3.75rem)`, LH 1, LS -0.035em, weight 700
- Body large: `clamp(1.0625rem, 1.25vw, 1.25rem)`, LH 1.6
- UI: 14–16px base, LH 1.4–1.5
- Never use `vw` alone. Mobile 375: start ~40px hero, never 52px fixed.

## Weights loaded
- Bricolage: 600, 700, 800 (skip 400/500 if unused)
- Manrope: 400, 500, 600, 700; 800 only for KPIs when needed
- Instrument Serif: 400 normal + italic

## Loading rules
- WOFF2 variable when advantageous, Latin + Latin-Extended, `font-display: swap`, metric-compatible fallback
- Bricolage loaded ONLY on marketing pages; Instrument Serif ONLY where used; Manrope everywhere
- No marketing fonts in painel initial bundle

## Numbers
`font-variant-numeric: tabular-nums lining-nums` on prices, KPIs, times, orders, caixa, reports, tables. Never Instrument Serif on operational numbers.

## Mobile responsive rules (mandatory audit)
Beyond `scrollWidth`, audit bounding boxes of text + buttons — `overflow: hidden` can mask clipped content. Enforce `max-width: 100%`, `min-width: 0`, `text-wrap: balance` on titles, `overflow-wrap` when needed. No desktop min-width.

## Wordmark
"mesivo" in header uses MesivoMark + Manrope until an official wordmark is approved. Never type Bricolage as a logo. No letter deformation or exaggerated tracking.

## Archivo Black (legacy)
Kept temporarily on non-migrated routes. Replace with Bricolage only on pages migrated during Onda B. No global replace. Do not remove Archivo while any legacy route depends on it.

## Lab
`/dev/type-lab` stays dev-only (noindex, 404 in prod). Never publish.
