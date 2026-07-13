# MESIVO — Fase Zero · Relatório V4 (Bloqueios Finais)

Status: **APROVAÇÃO SOLICITADA** — Onda A NÃO iniciada. Produção intacta.

## 1. Correções aplicadas (apenas dev-only)

### `src/dev-proto/proto-tokens.ts`
- `.app-bottom-nav` migrada de `position: sticky` → **`position: fixed`** com
  `left:0; right:0; bottom:0; z-index:40`, garantindo bottom navigation
  sempre visível no viewport mobile.
- `.app-content` recebe `padding-bottom: calc(80px + env(safe-area-inset-bottom))`
  em `≤767px` e `768–1023px` para evitar sobreposição com a bottom nav fixa.
- `.app-kpi-grid` alterado para `minmax(0,1fr)` (desktop, mobile e tablet)
  e `.app-kpi` recebeu `min-width:0; overflow:hidden` — corrige overflow
  horizontal dos cards no viewport 375px.

### `src/routes/dev.proto.pdv.tsx`
- Foco inicial no bottom sheet: `closeRef.current?.focus()` ao abrir.
- Foco preso (`Tab`/`Shift+Tab` cíclico) enquanto o sheet estiver aberto.
- Foco restaurado ao FAB ao fechar (Esc, botão ou clique no backdrop).
- `role="dialog"` + `aria-modal="true"` + `aria-labelledby="pdv-sheet-title"`.
- FAB recebe `aria-haspopup="dialog"` + `aria-expanded={sheetOpen}`.
- Botão de fechar recebeu `aria-label="Fechar pedido"` explícito.

## 2. Evidências

### 2.1 PDV 375 · bottom sheet aberto
<presentation-artifact path="mesivo-v4-screenshots/pdv_375_sheet_open.png" mime_type="image/png"></presentation-artifact>

Sheet inclui: itens, quantidades, cliente, tipo (Salão/Balcão/Delivery/Retirada),
desconto, taxa, forma de pagamento, total e CTA "Finalizar pedido".
Handle superior visível, botão fechar acessível, `padding-bottom` respeita
safe-area (`env(safe-area-inset-bottom)`).

**Auditoria a11y automatizada:**
```json
{
  "role": "dialog",
  "ariaModal": "true",
  "ariaLabelledBy": "pdv-sheet-title",
  "position": "fixed",
  "withinViewport": true,
  "focusOnClose": true,        // foco inicial cai no botão fechar
  "hasCTA": true,
  "hasClose": true,
  "bodyScrollable": "auto"     // scroll interno quando conteúdo excede
}
"escape_restores_focus_to_fab": true
```

### 2.2 Dashboard 375 · bottom navigation
<presentation-artifact path="mesivo-v4-screenshots/dashboard_375_bottomnav.png" mime_type="image/png"></presentation-artifact>

Bottom nav fixa no fundo com 5 itens: **Início · Pedidos · PDV · Mesas · Menu**.
Item ativo em `--tomato`, ícones SVG, labels visíveis, safe-area aplicada,
z-index 40, conteúdo com padding inferior para não ficar coberto.

```json
{
  "present": true,
  "position": "fixed",
  "top": 740, "bottom": 812,     // colada no fundo do viewport 812
  "visible": true,
  "items": ["Início","Pedidos","PDV","Mesas","Menu"]
}
```

### 2.3 Auditoria real de bounding boxes

Script Playwright percorre todos os elementos visíveis (`display≠none`,
`visibility≠hidden`, `opacity>0`, `width>0`, `height>0`) e mede
`getBoundingClientRect()`. Elementos dentro de scrollers horizontais
intencionais (`overflow-x: auto|scroll`) e do marquee (`.mq`) são
ignorados conforme regra da entrega.

| Rota | Viewport | Violações relevantes |
|------|----------|----------------------|
| /dev/proto/dashboard | 375×812 | **0** |
| /dev/proto/pdv (sheet aberto) | 375×812 | **0** |

### 2.4 Console / erros
- `console.error`: **0**
- `pageerror`: **0**
- Hydration mismatch: **0** (nenhum warning "Text content did not match" ou
  "Hydration failed").

## 3. Produção intacta

Alterações restritas a:
- `src/dev-proto/proto-tokens.ts`
- `src/routes/dev.proto.pdv.tsx`

Nenhum arquivo de produção (`src/styles.css`, `src/routes/__root.tsx`, shells
reais, componentes compartilhados, backend, migrations, `package.json`) foi
tocado nesta rodada.

## 4. Entrega

- `MESIVO_FASE_ZERO_RELATORIO_V4.md`
- `/mnt/documents/mesivo-v4-screenshots/pdv_375_sheet_open.png`
- `/mnt/documents/mesivo-v4-screenshots/dashboard_375_bottomnav.png`

Aguardando aprovação final da Fase Zero antes de iniciar a Onda A.
