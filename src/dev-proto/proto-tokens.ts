/**
 * Isolated CSS for Mesivo dev prototypes.
 * Scoped under [data-theme="mkt-proto" | "app-proto" | "tx-proto" | "moto-proto"]
 * so it never leaks into production styles.
 *
 * Responsive strategy: pure CSS media queries — no JS `isMobile` branching,
 * no SSR/CSR divergence. Desktop chrome is hidden below 768px; mobile chrome
 * (topbar / bottom-nav / bottom-sheet) is hidden at ≥ 768px.
 */
export const PROTO_CSS = `
[data-theme="mkt-proto"], [data-theme="app-proto"], [data-theme="tx-proto"], [data-theme="moto-proto"] {
  --cream:#FFF8EE; --warm:#FFFDFA; --peach:#FFE7D5;
  --tomato:#F0522D; --orange:#FF6B35; --mango:#FFB82E;
  --leaf:#2F7D5B; --leaf-soft:#E5F3EA;
  --coffee:#34241D; --text:#2A211D; --muted:#70645E; --hair:#ECDDD3; --white:#fff;
  --ink:#20211F; --slate:#353631; --stone:#696B64; --line:#E1E2DD; --wash:#F1F1EE; --canvas:#F7F7F5;
  --mono:'Manrope','Inter',system-ui,-apple-system,Segoe UI,sans-serif;
  font-family:'Hind','Inter',system-ui,-apple-system,Segoe UI,sans-serif;
  color: var(--text);
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}

/* ============= Demo data badge (inline chip, never fixed over CTA/FAB) ============= */
.demo-badge{display:inline-flex;align-items:center;background:rgba(32,33,31,.86);color:#FDE6D6;font-family:var(--mono);font-weight:600;font-size:10.5px;letter-spacing:.04em;padding:5px 10px;border-radius:999px;border:1px solid rgba(255,255,255,.14);text-transform:uppercase;pointer-events:none;user-select:none;line-height:1}
.demo-badge:before{content:"";display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--mango);margin-right:8px;box-shadow:0 0 0 3px rgba(255,184,46,.25)}
/* Desktop-only floating badge (marketing landing) */
.demo-badge.demo-floating{position:fixed;right:12px;top:max(12px,env(safe-area-inset-top));z-index:60;backdrop-filter:blur(6px)}
@media (max-width:1023px){ .demo-badge.demo-floating{display:none} }
/* Header-inline badge slot */
.demo-badge-slot{padding:10px 16px 0;display:flex;justify-content:flex-end}
@media (min-width:768px){ .demo-badge-slot{padding:12px 24px 0} }

/* ================= MARKETING ================= */
.mkt-root { background: var(--cream); min-height:100vh; overflow-x:hidden; }
.mkt-container { max-width: 1200px; margin: 0 auto; padding: 0 24px; }
.mkt-header { position:sticky; top:0; background: rgba(255,248,238,.9); backdrop-filter: blur(10px); border-bottom:1px solid var(--hair); z-index:10; }
.mkt-header-inner{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:16px 0}
.mkt-brand { font-family:'Archivo Black',sans-serif; font-size:19px; letter-spacing:-.01em; }
.mkt-nav { display:flex; gap:26px; font-size:14.5px; color:var(--coffee); }
.mkt-nav a { cursor:pointer; }
.mkt-link { font-size:14.5px; color:var(--coffee); cursor:pointer; }
.mkt-menu-btn{display:none;width:40px;height:40px;border-radius:10px;border:1px solid var(--hair);background:#fff;align-items:center;justify-content:center;color:var(--coffee);font-size:20px;line-height:1;cursor:pointer}

.mkt-btn { display:inline-flex; align-items:center; gap:8px; font-weight:600; border-radius:12px; padding:10px 16px; font-size:14.5px; transition: transform .15s, background .15s; cursor:pointer; border:none; }
.mkt-btn-lg { padding:14px 22px; font-size:16px; border-radius:14px; }
.mkt-btn-primary { background: var(--tomato); color:#FFF8EE; box-shadow: 0 8px 20px -8px rgba(240,82,45,.55); }
.mkt-btn-primary:hover { background:#D94425; transform: translateY(-1px); }
.mkt-btn-ghost { background:transparent; color:var(--coffee); border:1px solid var(--hair); }
.mkt-btn-outline-inv { background:transparent; color:#FFF8EE; border:1.5px solid rgba(255,248,238,.55); }

/* Hero */
.mkt-hero { position:relative; padding: 56px 0 88px; overflow:hidden; }
.mkt-hero:before { content:""; position:absolute; inset:0; background:
  radial-gradient(600px 400px at 8% 20%, rgba(255,184,46,.28), transparent 60%),
  radial-gradient(700px 500px at 100% 0%, rgba(240,82,45,.14), transparent 55%);
  pointer-events:none; }
.mkt-hero-grid { display:grid; grid-template-columns: 1.05fr 1fr; gap: 48px; align-items:center; position:relative; }
.mkt-eyebrow { display:inline-flex; align-items:center; gap:8px; background:var(--warm); border:1px solid var(--hair); padding:6px 12px; border-radius:999px; font-size:12.5px; color:var(--coffee); }
.mkt-dot { width:8px; height:8px; border-radius:50%; background: var(--tomato); box-shadow: 0 0 0 4px rgba(240,82,45,.18); }
.mkt-h1 { font-family:'Archivo Black', sans-serif; font-size: clamp(40px, 5.5vw, 68px); line-height:1.02; letter-spacing:-.02em; color: var(--coffee); margin: 18px 0 18px; }
.mkt-h1 em { font-style: italic; font-family: 'Instrument Serif', serif; color: var(--tomato); }
.mkt-accent { color: var(--tomato); }
.mkt-sub { font-size: 18px; line-height:1.55; color: var(--muted); max-width: 520px; }
.mkt-cta-row { display:flex; gap:12px; margin-top: 28px; flex-wrap:wrap; }
.mkt-benefits{display:flex;flex-wrap:wrap;gap:18px;margin-top:26px;font-size:14px;color:var(--coffee)}
.mkt-benefits span{display:inline-flex;align-items:center;gap:8px}
.mkt-benefits span:before{content:"";width:6px;height:6px;border-radius:50%;background:var(--tomato)}

/* Hero stage — DESKTOP composition */
.mkt-hero-stage { position:relative; height: 540px; }
.mkt-flowlines { position:absolute; inset:0; width:100%; height:100%; z-index:0; }
.mkt-mockup-dashboard { position:absolute; left:0; top:20px; width:92%; z-index:2; transform: rotate(-1.2deg); filter: drop-shadow(0 30px 50px rgba(52,36,29,.22)); }
.mkt-mockup-phone { position:absolute; right:-4px; bottom:-4px; width:200px; z-index:3; transform: rotate(3deg); filter: drop-shadow(0 30px 40px rgba(52,36,29,.26)); }
.mkt-badge-float { position:absolute; background:#fff; border:1px solid var(--hair); padding:8px 12px; border-radius:12px; font-size:13px; font-weight:600; box-shadow: 0 12px 24px -12px rgba(52,36,29,.25); z-index:4; }
.mkt-badge-mango { top:36px; right:30px; color:#8B5A00; background:#FFF6DF; border-color:#FFE7A1; }
.mkt-badge-leaf { bottom:120px; left:-8px; color:#1F5A3F; background:#E5F3EA; border-color:#B9DEC7; }

/* Dashboard mock (heavier borders, sharper text) */
.dm { background:#fff; border:1.5px solid #D9C6B6; border-radius:14px; overflow:hidden; }
.dm-top { display:flex; align-items:center; gap:10px; padding:9px 12px; background:#FBF3E7; border-bottom:1px solid #E7D5C1; }
.dm-dots { display:flex; gap:5px; } .dm-dots i { width:10px; height:10px; border-radius:50%; background:#E7CFB6; }
.dm-url { font-size:11.5px; color:#6E5744; font-family:var(--mono); font-weight:500; }
.dm-body { display:grid; grid-template-columns: 148px 1fr; min-height:340px; }
.dm-side { background:#FBF3E7; padding:14px 10px; border-right:1px solid #E7D5C1; }
.dm-logo { width:30px; height:30px; border-radius:9px; background:var(--tomato); color:#FFF8EE; display:grid; place-items:center; font-family:'Archivo Black'; font-size:15px; margin-bottom:14px; }
.dm-item { padding:8px 10px; font-size:13px; color:#3A2E24; border-radius:8px; margin-bottom:2px; font-weight:500; }
.dm-item.on { background:#FFE0C7; color:var(--tomato); font-weight:700; }
.dm-main { padding:16px 18px; }
.dm-header { display:flex; justify-content:space-between; align-items:end; margin-bottom:14px; }
.dm-eyebrow { font-size:11px; color:#6E5744; text-transform:uppercase; letter-spacing:.06em; font-weight:600; font-family:var(--mono);}
.dm-title { font-family:'Archivo Black'; font-size:20px; color:var(--coffee); }
.dm-tabs { display:flex; gap:6px; background:#F5EADC; padding:4px; border-radius:8px; font-size:12px; }
.dm-tabs span { padding:5px 10px; border-radius:6px; color:#6E5744; font-weight:600; }
.dm-tabs span.on { background:#fff; color:var(--coffee); font-weight:700; box-shadow:0 1px 3px rgba(52,36,29,.08); }
.dm-kpis { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; margin-bottom:12px; }
.dm-kpi { background:#FFFDFA; border:1px solid #E7D5C1; border-radius:10px; padding:10px; }
.dm-kpi-l { font-size:11px; color:#6E5744; font-family:var(--mono); font-weight:600; }
.dm-kpi-v { font-family:var(--mono); font-weight:800; font-size:19px; color:var(--coffee); margin:2px 0; letter-spacing:-.01em;}
.dm-kpi-d { font-size:11px; font-weight:700; font-family:var(--mono); }
.d-leaf { color: var(--leaf); } .d-mango { color:#B27D00; } .d-coral { color: var(--tomato); } .d-coffee { color: var(--coffee); }
.dm-orders { display:flex; flex-direction:column; gap:6px; }
.dm-order { display:grid; grid-template-columns: 62px 1fr auto; align-items:center; padding:10px 12px; background:#FFFDFA; border:1px solid #E7D5C1; border-radius:10px; font-size:12.5px; gap:8px;}
.dm-order-id { font-family:var(--mono); font-weight:800; color:var(--coffee); }
.dm-order-orig { color:#5A4A3E; }
.dm-order-status { font-size:11px; font-weight:700; padding:3px 8px; border-radius:999px; font-family:var(--mono); white-space:nowrap;}
.s-coral { background:#FFE0C7; color:var(--tomato); }
.s-mango { background:#FFF3D0; color:#8B5A00; }
.s-leaf { background:#E5F3EA; color:var(--leaf); }
.s-coffee { background:#EDE1D8; color:var(--coffee); }

/* Phone mock */
.pm { background:#fff; border-radius:26px; border:8px solid #2A211D; overflow:hidden; box-shadow:0 20px 40px -20px rgba(52,36,29,.4); }
.pm-notch { height:14px; background:#2A211D; margin:-2px auto 0; width:60px; border-radius:0 0 10px 10px; }
.pm-cover { height:70px; background: linear-gradient(120deg, #F0522D, #FFB82E); position:relative;}
.pm-cover:after{content:"";position:absolute;inset:0;background:radial-gradient(120px 60px at 30% 40%, rgba(255,255,255,.18), transparent 60%);}
.pm-brand { display:flex; gap:10px; align-items:center; padding:10px 12px; border-bottom:1px solid var(--hair); }
.pm-logo { width:36px; height:36px; border-radius:10px; background:var(--coffee); color:var(--mango); display:grid; place-items:center; font-family:'Archivo Black'; font-size:15px; margin-top:-24px; border:2px solid #fff; }
.pm-name { font-family:'Archivo Black'; font-size:13px; color:var(--coffee); }
.pm-open { font-size:10.5px; color: var(--leaf); display:flex; align-items:center; gap:5px; font-weight:600; font-family:var(--mono);}
.pm-open span { width:6px; height:6px; border-radius:50%; background:var(--leaf); }
.pm-cats { display:flex; gap:6px; padding:8px 12px; overflow:hidden; }
.pm-cats span { font-size:10.5px; padding:5px 10px; border-radius:999px; background:#F5EADC; color:#6E5744; white-space:nowrap; font-weight:600;}
.pm-cats span.on { background:var(--coffee); color:var(--cream); }
.pm-items { padding:6px 10px 10px; display:flex; flex-direction:column; gap:6px; }
.pm-item { display:grid; grid-template-columns: 44px 1fr auto; gap:8px; align-items:center; padding:6px; border:1px solid var(--hair); border-radius:10px; background:#FFFDFA; }
.pm-thumb { width:44px; height:44px; border-radius:8px; background: linear-gradient(135deg, #FFB82E, #F0522D); position:relative;}
.pm-thumb:after{content:"";position:absolute;inset:6px;border-radius:6px;background:radial-gradient(circle at 30% 30%,rgba(255,255,255,.35),transparent 55%),linear-gradient(135deg,#8B3E1B,#5B2612);}
.pm-title { font-size:11.5px; font-weight:700; color:var(--coffee); }
.pm-desc { font-size:10px; color:var(--muted); }
.pm-price { font-size:11.5px; font-weight:800; color:var(--tomato); font-family:var(--mono);}
.pm-cta { background:var(--tomato); color:#FFF8EE; padding:10px; text-align:center; font-size:12px; font-weight:700; }

/* Marquee */
.mkt-marquee-wrap { border-top:1px solid var(--hair); border-bottom:1px solid var(--hair); background: var(--warm); padding:14px 0; }
.mkt-marquee { overflow:hidden; }
.mkt-marquee-track { display:flex; white-space:nowrap; animation: mkt-slide 28s linear infinite; }
@media (prefers-reduced-motion: reduce){ .mkt-marquee-track{ animation: none; } }
@keyframes mkt-slide { to { transform: translateX(-50%); } }
.mkt-marquee-item { font-family:'Archivo Black'; font-size:15px; color:var(--coffee); display:inline-flex; align-items:center; gap:10px; opacity:.75; }
.mkt-marquee-dot { width:6px; height:6px; border-radius:50%; background:var(--tomato); }

/* Sections */
.mkt-section { padding: 100px 0; }
.mkt-section-cream { background: var(--warm); }
.mkt-h2 { font-family:'Archivo Black'; font-size: clamp(28px, 3.4vw, 44px); color:var(--coffee); letter-spacing:-.015em; line-height:1.1; }
.mkt-h2-inv { font-family:'Archivo Black'; font-size: clamp(24px, 3vw, 38px); color:#FFF8EE; letter-spacing:-.015em; }
.mkt-sub-inv { color:#EEDFD3; font-size:16px; }
.mkt-center { text-align:center; }
.mkt-max-2xl { max-width: 640px; margin: 12px auto 40px; }
.mkt-eyebrow-alt { font-size: 12px; color:var(--tomato); font-weight:700; text-transform:uppercase; letter-spacing:.08em; margin-bottom:10px; font-family:var(--mono);}
.mkt-two-col { display:grid; grid-template-columns: 1fr 1.15fr; gap: 60px; align-items:center; }
.mkt-bullets { list-style:none; padding:0; margin-top: 22px; display:flex; flex-direction:column; gap:12px; font-size:16px; color:var(--coffee); }
.mkt-bullets li:before { content:"—"; color: var(--tomato); margin-right:10px; font-weight:800; }
.mkt-solution-card { background:#fff; border:1px solid var(--hair); border-radius:22px; padding:26px; box-shadow: 0 30px 60px -40px rgba(52,36,29,.35); }
.mkt-solution-head { display:flex; gap:8px; margin-bottom:14px; flex-wrap:wrap;}
.mkt-tag { background:#FFE7D5; color:var(--tomato); font-size:11px; font-weight:700; padding:5px 10px; border-radius:999px; text-transform:uppercase; letter-spacing:.06em; font-family:var(--mono);}
.mkt-tag-leaf { background:#E5F3EA; color:var(--leaf); }

/* Feature bento */
.mkt-feature-bento { display:grid; grid-template-columns: repeat(4, 1fr); grid-auto-rows: 220px; gap:16px; margin-top: 30px; }
.mkt-feature-card { grid-column: span 1; background:#fff; border:1px solid var(--hair); border-radius:20px; padding:22px; position:relative; overflow:hidden; }
.mkt-feature-lg { grid-column: span 2; grid-row: span 2; }
.mkt-feature-wide { grid-column: span 2; }
.mkt-feature-coral { background: linear-gradient(140deg, var(--tomato), #FF7E4E); border-color:transparent; color:#FFF8EE; grid-column: span 2; }
.mkt-feature-tag { display:inline-block; background:#FFE7D5; color:var(--tomato); font-size:11px; font-weight:700; padding:4px 10px; border-radius:999px; text-transform:uppercase; letter-spacing:.06em; margin-bottom:12px; font-family:var(--mono);}
.mkt-feature-tag-inv { background: rgba(255,248,238,.2); color:#FFF8EE; }
.mkt-feature-tag-leaf { background: var(--leaf-soft); color: var(--leaf); }
.mkt-feature-tag-mango { background:#FFF3D0; color:#8B5A00; }
.mkt-feature-title { font-family:'Archivo Black'; font-size:18px; color:var(--coffee); line-height:1.2; }
.mkt-feature-title-inv { font-family:'Archivo Black'; font-size:20px; color:#FFF8EE; line-height:1.2; }
.mkt-feature-body { font-size:14px; color:var(--muted); margin-top:8px; }
.mkt-feature-body-inv { font-size:14px; color:#FDE6D6; margin-top:8px; }
.mkt-pdv-preview { position:absolute; left:22px; right:22px; bottom:-8px; }

/* CTA final */
.mkt-cta-final { background: var(--coffee); color:#FFF8EE; padding: 60px 0; position:relative; overflow:hidden; }
.mkt-cta-final:before { content:""; position:absolute; right:-100px; top:-100px; width:400px; height:400px; border-radius:50%; background: radial-gradient(circle, rgba(240,82,45,.45), transparent 60%); }
.mkt-cta-final-inner { display:flex; justify-content:space-between; align-items:center; gap:30px; position:relative; flex-wrap:wrap; }

.mkt-footer { background: var(--coffee); color:#EEDFD3; border-top:1px solid #4A362D; }
.mkt-footer-links { display:flex; gap:20px; font-size:13.5px; flex-wrap:wrap;}
.mkt-footer-links a { cursor:pointer; }
.mkt-footer-inner{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:32px 0;flex-wrap:wrap;}

/* Mini components inside cards */
.pdvm { background:#FFFDFA; border:1px solid var(--hair); border-radius:14px; padding:10px; display:grid; grid-template-columns: 1fr 140px; gap:10px; }
.pdvm-cats { grid-column: 1 / -1; display:flex; gap:6px; flex-wrap:wrap;}
.pdvm-cats span { font-size:11px; padding:5px 10px; border-radius:8px; background:#F5EADC; color:var(--muted); }
.pdvm-cats span.on { background: var(--tomato); color:#FFF8EE; font-weight:700; }
.pdvm-grid { display:grid; grid-template-columns: repeat(3,1fr); gap:6px; }
.pdvm-prod { background:#fff; border:1px solid var(--hair); border-radius:10px; padding:8px; text-align:center; }
.pdvm-thumb { height:38px; border-radius:6px; background: linear-gradient(135deg, #FFB82E, #F0522D); margin-bottom:5px; }
.pdvm-name { font-size:10.5px; font-weight:700; color:var(--coffee); }
.pdvm-price { font-size:10px; color:var(--tomato); font-weight:700; font-family:var(--mono);}
.pdvm-cart { background:#fff; border:1px solid var(--hair); border-radius:10px; padding:8px; display:flex; flex-direction:column; gap:4px; }
.pdvm-cart-row { display:flex; justify-content:space-between; font-size:11px; color:var(--coffee); }
.pdvm-cart-total { display:flex; justify-content:space-between; padding-top:5px; border-top:1px dashed var(--hair); font-size:12px; color:var(--coffee); }
.pdvm-cta { margin-top:auto; background:var(--tomato); color:#FFF8EE; border:none; padding:7px; border-radius:8px; font-size:11.5px; font-weight:700; }

.cxm { background:#FFFDFA; border:1px solid var(--hair); border-radius:12px; padding:10px; margin-top:14px; display:flex; flex-direction:column; gap:6px; }
.cxm-row { display:grid; grid-template-columns: 1fr 1fr auto; align-items:center; padding:8px 10px; background:#fff; border:1px solid var(--hair); border-radius:8px; font-size:12.5px; color:var(--coffee); gap:8px; }
.cxm-ok { font-size:10.5px; color:var(--leaf); background:var(--leaf-soft); padding:3px 8px; border-radius:999px; font-weight:700; }
.cxm-warn { font-size:10.5px; color:#8B5A00; background:#FFF3D0; padding:3px 8px; border-radius:999px; font-weight:700; }

/* --- Landing responsive (mobile-first for < 768px) --- */
@media (max-width: 767px){
  .mkt-container{padding:0 18px;width:100%;min-width:0;max-width:100%}
  .mkt-header-inner{padding:12px 0;gap:8px}
  .mkt-nav{display:none}
  .mkt-header-cta{display:none}
  .mkt-menu-btn{display:inline-flex}
  .mkt-hero{padding:24px 0 40px;overflow:visible}
  .mkt-hero-grid{grid-template-columns:1fr;gap:24px;width:100%;min-width:0}
  .mkt-hero-grid > div{min-width:0;width:100%;max-width:100%}
  .mkt-h1{font-size:30px;line-height:1.05;margin:14px 0;word-wrap:break-word;overflow-wrap:break-word;hyphens:auto;width:100%;max-width:100%}
  .mkt-sub{font-size:16px;max-width:100%;width:100%}
  .mkt-cta-row{flex-direction:column;flex-wrap:nowrap;gap:10px;margin-top:22px;width:100%}
  .mkt-cta-row .mkt-btn-lg{width:100%;flex:none;justify-content:center;padding:14px 16px;font-size:15px;min-width:0}
  .mkt-benefits{flex-direction:column;gap:8px;margin-top:18px}
  .mkt-benefits span{font-size:13.5px}
  .mkt-hero-stage{position:relative;height:auto;min-height:0;padding:8px 0 40px;width:100%;max-width:100%;overflow:visible}
  .mkt-mockup-dashboard{position:relative;width:100%;top:0;left:0;transform:none;filter:drop-shadow(0 18px 30px rgba(52,36,29,.18));max-width:100%}
  .mkt-mockup-phone{position:relative;right:auto;bottom:auto;width:60%;max-width:220px;margin:16px auto 0;transform:none;display:block}
  .mkt-badge-float{position:static;display:inline-flex;align-items:center;font-size:11px;padding:6px 10px;margin:10px 8px 0 0}
  .mkt-badge-mango,.mkt-badge-leaf{top:auto;right:auto;bottom:auto;left:auto}
  .mkt-flowlines{display:none}
  .mkt-section{padding:48px 0}
  .mkt-two-col{grid-template-columns:1fr;gap:32px}
  .mkt-feature-bento{grid-template-columns:1fr;grid-auto-rows:auto}
  .mkt-feature-card, .mkt-feature-lg, .mkt-feature-wide, .mkt-feature-coral{grid-column:span 1;grid-row:auto;min-height:200px}
  .mkt-cta-final-inner{flex-direction:column;align-items:stretch;gap:18px}
  .mkt-cta-final-inner > div:last-child{width:100%;flex-direction:column;display:flex;gap:10px}
  .mkt-cta-final-inner .mkt-btn{width:100%;justify-content:center}
  .mkt-footer-inner{flex-direction:column;align-items:flex-start;gap:12px}
}
/* Small tablets keep hero grid stacked to avoid squeezing */
@media (min-width:768px) and (max-width:899px){
  .mkt-hero-grid{grid-template-columns:1fr;gap:32px}
  .mkt-hero-stage{height:auto;min-height:420px}
}

/* ================= APP (DASHBOARD / PDV) ================= */
[data-theme="app-proto"] { background:#F7F7F5; min-height:100vh; }
.app-shell { display:grid; grid-template-columns: 240px 1fr; min-height:100vh; }
.app-side { background:#fff; border-right:1px solid var(--line); padding:18px 14px; }
.app-side-brand { display:flex; align-items:center; gap:10px; padding:6px 8px 22px; }
.app-side-brand-mark { width:32px; height:32px; border-radius:9px; background:var(--tomato); color:#FFF8EE; display:grid; place-items:center; font-family:'Archivo Black'; }
.app-side-brand-name { font-family:'Archivo Black'; font-size:15px; color:var(--ink); }
.app-side-group { font-size:10.5px; color:#8A8C84; text-transform:uppercase; letter-spacing:.08em; padding:16px 8px 8px; font-family:var(--mono); font-weight:600;}
.app-side-item { display:flex; align-items:center; gap:10px; padding:9px 10px; border-radius:8px; font-size:14px; color:var(--slate); cursor:pointer; margin-bottom:2px; font-family:var(--mono); font-weight:500;}
.app-side-item:hover { background:var(--wash); }
.app-side-item.on { background:#FFE7D5; color:var(--tomato); font-weight:700; }
.app-side-ico { width:16px; height:16px; border-radius:4px; background:var(--line); }
.app-side-item.on .app-side-ico { background:var(--tomato); }

.app-main { display:flex; flex-direction:column; min-width:0; }
.app-topbar { background:#fff; border-bottom:1px solid var(--line); padding:12px 24px; display:flex; align-items:center; justify-content:space-between; gap:20px; }
.app-search { flex:1; max-width:400px; background:var(--wash); border-radius:10px; padding:9px 14px; font-size:13.5px; color:var(--stone); }
.app-topbar-actions { display:flex; align-items:center; gap:10px; }
.app-icon-btn { width:36px; height:36px; border-radius:10px; background:var(--wash); display:grid; place-items:center; font-size:14px; }
.app-user { display:flex; align-items:center; gap:9px; padding:4px 10px 4px 4px; background:var(--wash); border-radius:999px; font-family:var(--mono); font-weight:600; font-size:13px;}
.app-user-av { width:28px; height:28px; border-radius:50%; background:var(--tomato); color:#FFF8EE; display:grid; place-items:center; font-size:12px; font-weight:700; }

.app-content { padding: 24px; }
.app-page-h { font-family:'Archivo Black'; font-size:24px; color:var(--ink); letter-spacing:-.01em; }
.app-page-sub { font-size:13.5px; color:var(--stone); margin-top:2px; font-family:var(--mono);}
.app-page-head { display:flex; justify-content:space-between; align-items:end; margin-bottom:20px; flex-wrap:wrap; gap:14px; }
.app-filters { display:flex; gap:6px; flex-wrap:wrap;}
.app-chip { background:#fff; border:1px solid var(--line); padding:7px 14px; border-radius:10px; font-size:13px; color:var(--slate); font-family:var(--mono); font-weight:600;}
.app-chip.on { background:var(--ink); color:#fff; border-color:var(--ink); }

.app-btn { background:var(--tomato); color:#FFF8EE; border:none; padding:9px 16px; border-radius:10px; font-size:13.5px; font-weight:600; cursor:pointer; font-family:var(--mono);}
.app-btn-ghost { background:#fff; border:1px solid var(--line); color:var(--slate); padding:9px 14px; border-radius:10px; font-size:13.5px; font-family:var(--mono); font-weight:600;}

.app-kpi-grid { display:grid; grid-template-columns: repeat(4, 1fr); gap:14px; margin-bottom:20px; }
.app-kpi { background:#fff; border:1px solid var(--line); border-radius:14px; padding:16px 18px; }
.app-kpi-l { font-size:12px; color:var(--stone); text-transform:uppercase; letter-spacing:.05em; font-family:var(--mono); font-weight:600;}
.app-kpi-v { font-family:var(--mono); font-weight:800; font-size:26px; color:var(--ink); margin:6px 0 4px; letter-spacing:-.01em;}
.app-kpi-d { font-size:12px; font-weight:700; font-family:var(--mono);}
.app-kpi-spark { height:32px; margin-top:8px; }

.app-two-col { display:grid; grid-template-columns: 2fr 1fr; gap:16px; }
.app-panel { background:#fff; border:1px solid var(--line); border-radius:14px; padding:18px; }
.app-panel-h { display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; gap:12px; flex-wrap:wrap;}
.app-panel-t { font-family:'Archivo Black'; font-size:15px; color:var(--ink); }

.app-chart { height:220px; position:relative; width:100%;}

.app-order-row { display:grid; grid-template-columns: 70px 1fr 100px 100px 80px; gap:12px; padding:11px 12px; border-bottom:1px solid var(--wash); font-size:13px; align-items:center; }
.app-order-row:last-child { border-bottom:none; }
.app-order-id { font-family:var(--mono); font-weight:800; color:var(--ink); }
.app-order-cli { color:var(--slate); }
.app-order-val { font-weight:700; color:var(--ink); text-align:right; font-family:var(--mono);}
.app-status { font-size:11px; font-weight:700; padding:4px 9px; border-radius:999px; text-align:center; font-family:var(--mono);}
.st-novo { background:#FFE7D5; color:var(--tomato); }
.st-prep { background:#FFF3D0; color:#8B5A00; }
.st-saiu { background:#E5F3EA; color:var(--leaf); }
.st-ok   { background:var(--wash); color:var(--ink); }

.app-caixa-list { display:flex; flex-direction:column; gap:8px; }
.app-caixa-item { display:grid; grid-template-columns: 1fr auto auto; gap:8px; align-items:center; padding:10px 12px; background:#F7F7F5; border-radius:10px; font-size:13px; }

/* --- Mobile chrome (dashboard + pdv) rendered on all viewports, CSS-gated --- */
.app-mob-topbar{display:none;background:#fff;border-bottom:1px solid var(--line);padding:12px 16px;align-items:center;justify-content:space-between;gap:12px;position:sticky;top:0;z-index:20;padding-top:max(12px,env(safe-area-inset-top))}
.app-mob-topbar-l{display:flex;align-items:center;gap:10px;min-width:0}
.app-mob-topbar-icon{width:38px;height:38px;border-radius:10px;background:var(--wash);display:grid;place-items:center;font-size:18px;flex-shrink:0;cursor:pointer;border:none}
.app-mob-topbar-title{font-family:'Archivo Black';font-size:15px;color:var(--ink);line-height:1.15;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.app-mob-topbar-sub{font-size:11px;color:var(--stone);font-family:var(--mono);font-weight:500}
.app-mob-topbar-actions{display:flex;gap:8px;align-items:center;flex-shrink:0}

.app-bottom-nav{display:none;position:fixed;left:0;right:0;bottom:0;background:#fff;border-top:1px solid var(--line);padding:8px 0 max(10px,env(safe-area-inset-bottom));z-index:40}
.app-bottom-nav-inner{display:grid;grid-template-columns:repeat(5,1fr);gap:2px}
.app-bottom-nav-item{background:transparent;border:none;display:flex;flex-direction:column;align-items:center;gap:3px;padding:6px 4px;color:var(--stone);font-size:10.5px;font-family:var(--mono);font-weight:600;cursor:pointer;min-width:0}
.app-bottom-nav-item.on{color:var(--tomato)}
.app-bottom-nav-item svg{width:22px;height:22px}

@media (max-width: 767px){
  .app-shell{grid-template-columns:1fr}
  .app-side{display:none}
  .app-topbar{display:none}
  .app-mob-topbar{display:flex}
  .app-content{padding:14px}
  .app-page-head{margin-bottom:14px}
  .app-page-h{font-size:20px}
  .app-kpi-grid{grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px}
  .app-kpi{padding:12px 14px}
  .app-kpi-v{font-size:20px}
  .app-two-col{grid-template-columns:1fr;gap:12px}
  .app-panel{padding:14px;border-radius:12px}
  .app-order-row{grid-template-columns:56px 1fr auto;grid-template-areas:"id cli val" "id status status";gap:6px 10px;padding:12px}
  .app-order-row .app-order-id{grid-area:id;align-self:center}
  .app-order-row .app-order-cli{grid-area:cli;font-size:12.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0}
  .app-order-row .app-order-val{grid-area:val;font-size:13px}
  .app-order-row .app-status{grid-area:status;justify-self:start;font-size:10.5px}
  .app-order-row > button{display:none}
  .app-bottom-nav{display:block}
  .app-content{padding-bottom:24px}
}
/* Tablet 768–1023: compact — sidebar hidden, KPIs 2×2, panels stacked */
@media (min-width: 768px) and (max-width: 1023px){
  .app-shell{grid-template-columns:1fr}
  .app-side{display:none}
  .app-topbar{display:none}
  .app-mob-topbar{display:flex}
  .app-content{padding:18px 20px}
  .app-kpi-grid{grid-template-columns:1fr 1fr;gap:12px}
  .app-two-col{grid-template-columns:1fr;gap:14px}
  .app-bottom-nav{display:block}
  .app-content{padding-bottom:24px}
}

/* PDV desktop */
.pdv-shell { display:grid; grid-template-columns: 260px 1fr 340px; height:100vh; }
.pdv-cats-col { background:#fff; border-right:1px solid var(--line); overflow-y:auto; }
.pdv-cats-h { padding:16px; border-bottom:1px solid var(--line); }
.pdv-cats-h-t { font-family:'Archivo Black'; font-size:16px; color:var(--ink); }
.pdv-cat { padding:14px 16px; font-size:14px; color:var(--slate); border-bottom:1px solid var(--wash); cursor:pointer; display:flex; justify-content:space-between; align-items:center; font-family:var(--mono); font-weight:600;}
.pdv-cat.on { background:#FFE7D5; color:var(--tomato); font-weight:700; border-left:3px solid var(--tomato); padding-left:13px; }
.pdv-cat-c { font-size:11px; background:var(--wash); padding:2px 8px; border-radius:999px; color:var(--stone); font-family:var(--mono); font-weight:700;}
.pdv-cat.on .pdv-cat-c { background:var(--tomato); color:#fff; }

.pdv-main-col { padding:16px; overflow-y:auto; }
.pdv-search { background:#fff; border:1px solid var(--line); padding:11px 14px; border-radius:10px; font-size:13.5px; color:var(--stone); margin-bottom:14px; }
.pdv-prods { display:grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap:12px; }
.pdv-prod { background:#fff; border:1px solid var(--line); border-radius:12px; padding:12px; cursor:pointer; transition: transform .15s; position:relative;}
.pdv-prod:hover { transform: translateY(-2px); border-color:var(--tomato); }
.pdv-prod-img { height:80px; border-radius:8px; background: linear-gradient(135deg, #FFB82E, #F0522D); margin-bottom:8px; position:relative; overflow:hidden;}
.pdv-prod-img:before{content:"";position:absolute;inset:0;background:radial-gradient(80px 60px at 30% 30%, rgba(255,255,255,.25), transparent 60%);}
.pdv-prod-img.no-img{background:repeating-linear-gradient(45deg,#F5EADC,#F5EADC 8px,#EEE0CE 8px,#EEE0CE 16px);display:grid;place-items:center;color:#B39A83;font-size:24px}
.pdv-prod-img.no-img:before{display:none}
.pdv-prod-name { font-size:13px; font-weight:700; color:var(--ink); line-height:1.3;}
.pdv-prod-price { font-size:14px; color:var(--tomato); font-weight:800; margin-top:4px; font-family:var(--mono);}
.pdv-prod.out{opacity:.55}
.pdv-prod-badge{position:absolute;top:8px;right:8px;background:var(--ink);color:#fff;font-size:10px;font-family:var(--mono);font-weight:700;padding:3px 7px;border-radius:6px;text-transform:uppercase;letter-spacing:.04em}

.pdv-cart-col { background:#fff; border-left:1px solid var(--line); display:flex; flex-direction:column; min-height:0;}
.pdv-cart-h { padding:16px; border-bottom:1px solid var(--line); display:flex; justify-content:space-between; align-items:center; }
.pdv-cart-h-t { font-family:'Archivo Black'; font-size:16px; color:var(--ink); }
.pdv-cart-tag { background:#FFE7D5; color:var(--tomato); font-size:11px; padding:4px 8px; border-radius:6px; font-weight:700; font-family:var(--mono);}
.pdv-cli { padding:12px 16px; border-bottom:1px solid var(--wash); font-size:13px; color:var(--slate); display:flex; justify-content:space-between; }
.pdv-cli-name { font-weight:700; color:var(--ink); font-family:var(--mono);}
.pdv-tipo { display:flex; gap:4px; padding:10px 16px; border-bottom:1px solid var(--wash); }
.pdv-tipo span { flex:1; text-align:center; font-size:12px; padding:7px; border-radius:8px; background:var(--wash); color:var(--stone); cursor:pointer; font-family:var(--mono); font-weight:600;}
.pdv-tipo span.on { background:var(--ink); color:#fff; font-weight:700; }
.pdv-cart-items { flex:1; overflow-y:auto; padding:10px 16px; }
.pdv-cart-item { display:grid; grid-template-columns: 28px 1fr auto; gap:10px; padding:9px 0; border-bottom:1px dashed var(--line); font-size:13px; align-items:center; }
.pdv-cart-item-q { background:var(--ink); color:#fff; width:24px; height:24px; border-radius:6px; display:grid; place-items:center; font-size:11px; font-weight:800; font-family:var(--mono);}
.pdv-cart-item-n { color:var(--slate); }
.pdv-cart-item-p { font-weight:700; color:var(--ink); font-family:var(--mono);}
.pdv-cart-totals { padding:14px 16px; background:var(--canvas); border-top:1px solid var(--line); }
.pdv-tot-row { display:flex; justify-content:space-between; font-size:13px; padding:3px 0; color:var(--stone); font-family:var(--mono);}
.pdv-tot-final { display:flex; justify-content:space-between; padding-top:8px; margin-top:6px; border-top:1px solid var(--line); }
.pdv-tot-final-l { font-family:'Archivo Black'; font-size:14px; color:var(--ink); }
.pdv-tot-final-v { font-family:var(--mono); font-weight:800; font-size:22px; color:var(--ink); letter-spacing:-.01em;}
.pdv-pay { padding:0 16px 16px; display:grid; grid-template-columns: repeat(2,1fr); gap:6px; }
.pdv-pay span { text-align:center; padding:9px; background:var(--wash); border-radius:8px; font-size:12px; color:var(--slate); cursor:pointer; font-family:var(--mono); font-weight:600;}
.pdv-pay span.on { background:var(--leaf-soft); color:var(--leaf); font-weight:700; border:1px solid var(--leaf); }
.pdv-finalize { margin: 0 16px 16px; background:var(--tomato); color:#FFF8EE; border:none; padding:14px; border-radius:12px; font-size:15px; font-weight:700; cursor:pointer; font-family:var(--mono);}

/* PDV mobile (rendered always, CSS-gated) */
.pdv-mob{display:none;flex-direction:column;min-height:100dvh;background:var(--canvas);}
.pdv-mob-cats-strip{display:flex;gap:8px;padding:10px 16px 12px;overflow-x:auto;-webkit-overflow-scrolling:touch;background:#fff;border-bottom:1px solid var(--line);scrollbar-width:none}
.pdv-mob-cats-strip::-webkit-scrollbar{display:none}
.pdv-mob-cats-strip span{padding:8px 14px;font-size:12.5px;border-radius:999px;background:var(--wash);color:var(--slate);white-space:nowrap;font-family:var(--mono);font-weight:700}
.pdv-mob-cats-strip span.on{background:var(--tomato);color:#fff}
.pdv-mob-search{padding:12px 16px 0;position:sticky;top:0}
.pdv-mob-search-input{background:#fff;border:1px solid var(--line);border-radius:12px;padding:12px 14px;font-size:14px;color:var(--stone);display:flex;align-items:center;gap:8px}
.pdv-mob-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:12px 16px 120px}
.pdv-mob-fab{display:none;position:fixed;left:16px;right:16px;bottom:max(12px,env(safe-area-inset-bottom));background:var(--ink);color:#fff;padding:14px 16px;border-radius:16px;justify-content:space-between;align-items:center;gap:12px;box-shadow:0 20px 40px -12px rgba(32,33,31,.5);z-index:30;border:none;cursor:pointer;font-family:var(--mono);font-weight:700;font-size:14px}
.pdv-mob-fab[data-empty="true"]{opacity:.6;pointer-events:none;background:var(--stone)}
.pdv-mob-fab-l{display:flex;align-items:center;gap:12px;min-width:0}
.pdv-mob-fab-c{background:var(--tomato);color:#fff;min-width:26px;height:26px;padding:0 8px;border-radius:999px;display:grid;place-items:center;font-size:12px;font-weight:800;font-family:var(--mono)}
.pdv-mob-fab-total{font-family:var(--mono);font-weight:800;font-size:15px}
@media (max-width:1023px){
  .pdv-shell{display:none}
  .pdv-mob{display:flex}
  .pdv-mob-fab{display:flex}
}
/* Tablet PDV 768–1023: 3-col product grid, wider search hit area */
@media (min-width:768px) and (max-width:1023px){
  .pdv-mob-grid{grid-template-columns:1fr 1fr 1fr;gap:14px;padding:16px 24px 140px}
  .pdv-mob-search{padding:16px 24px 0}
  .pdv-mob-cats-strip{padding:12px 24px 14px}
  .pdv-mob-fab{left:24px;right:24px}
}

/* Bottom sheet (Ver pedido) */
.pdv-sheet-backdrop{position:fixed;inset:0;background:rgba(20,20,20,.5);z-index:40;display:none}
.pdv-sheet{position:fixed;left:0;right:0;bottom:0;background:#fff;border-radius:20px 20px 0 0;z-index:50;max-height:88vh;display:none;flex-direction:column;box-shadow:0 -20px 60px -20px rgba(0,0,0,.35);padding-bottom:env(safe-area-inset-bottom)}
.pdv-sheet-handle{width:44px;height:5px;background:#D6D6D0;border-radius:999px;margin:10px auto}
.pdv-sheet-h{padding:6px 20px 12px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--wash)}
.pdv-sheet-h-t{font-family:'Archivo Black';font-size:17px;color:var(--ink)}
.pdv-sheet-close{background:var(--wash);border:none;width:34px;height:34px;border-radius:50%;font-size:18px;cursor:pointer;color:var(--slate)}
.pdv-sheet-body{overflow-y:auto;padding:14px 20px 12px;display:flex;flex-direction:column;gap:12px}
.pdv-sheet-total{padding:14px 20px;background:var(--canvas);display:flex;justify-content:space-between;align-items:center;border-top:1px solid var(--line)}
.pdv-sheet-total-v{font-family:var(--mono);font-weight:800;font-size:22px;color:var(--ink)}
.pdv-sheet-cta{background:var(--tomato);color:#FFF8EE;border:none;padding:16px;margin:0 20px 16px;border-radius:14px;font-family:var(--mono);font-weight:800;font-size:15px;cursor:pointer}

/* ================= TRANSACIONAL (CARDÁPIO PÚBLICO) ================= */
[data-theme="tx-proto"] { background:#FAFAF7; min-height:100vh; font-family:'Hind',sans-serif; --cart-bar-height:76px; }
.tx-root { min-height:100vh; max-width: 480px; margin: 0 auto; background:#fff; position:relative; }
.tx-cover { height: 220px; position:relative; overflow:hidden; }
.tx-cover-img{position:absolute;inset:0;background-size:cover;background-position:center;}
.tx-cover-fallback{position:absolute;inset:0;background:linear-gradient(135deg,var(--fb-a,#F0522D),var(--fb-b,#B23016));display:grid;place-items:center;overflow:hidden}
.tx-cover-fallback:before{content:"";position:absolute;inset:0;background-image:radial-gradient(circle at 20% 30%,rgba(255,255,255,.14) 2px,transparent 2px),radial-gradient(circle at 70% 60%,rgba(255,255,255,.1) 3px,transparent 3px);background-size:40px 40px,60px 60px;opacity:.6}
.tx-cover-fallback-mark{position:relative;display:flex;flex-direction:column;align-items:center;gap:8px;color:#fff;text-align:center;padding:0 20px}
.tx-cover-fallback-logo{width:60px;height:60px;border-radius:18px;background:rgba(255,255,255,.18);backdrop-filter:blur(6px);border:1.5px solid rgba(255,255,255,.35);display:grid;place-items:center;font-family:'Archivo Black';font-size:24px}
.tx-cover-fallback-name{font-family:'Archivo Black';font-size:20px;letter-spacing:-.01em}
.tx-cover:before{content:"";position:absolute;inset:0;background:linear-gradient(180deg,transparent 40%,rgba(0,0,0,.35));pointer-events:none;z-index:1}
.tx-cover-txt { position:absolute; bottom:16px; left:20px; color:#fff; z-index:2;font-size:12px;opacity:.92;font-family:var(--mono);font-weight:600;letter-spacing:.04em;text-transform:uppercase }

.tx-brand-block { padding: 0 20px; position:relative; z-index:2;}
.tx-brand-card { background:#fff; border-radius:16px; padding:16px; box-shadow: 0 10px 30px -15px rgba(0,0,0,.2); margin-top:-40px; display:flex; gap:14px; align-items:center; }
.tx-brand-logo { width:60px; height:60px; border-radius:14px; background:#23303A; color:#F4C752; display:grid; place-items:center; font-family:'Archivo Black'; font-size:22px; flex-shrink:0; }
.tx-brand-logo-fallback{background:linear-gradient(135deg,var(--fb-a,#F0522D),var(--fb-b,#B23016));color:#fff}
.tx-brand-h { display:flex; flex-direction:column; gap:2px; min-width:0;}
.tx-brand-name { font-family:'Archivo Black'; font-size:19px; color:#111; }
.tx-brand-meta { font-size:12.5px; color:#666; }
.tx-open { display:inline-flex; align-items:center; gap:6px; color:#2F7D5B; font-size:12.5px; font-weight:700; font-family:var(--mono);}
.tx-open.closed{color:#B23016}
.tx-open-dot { width:8px; height:8px; border-radius:50%; background:#2F7D5B; }
.tx-open.closed .tx-open-dot{background:#B23016}

.tx-info-strip{display:flex;gap:14px;padding:14px 20px 0;font-size:12.5px;color:#555;flex-wrap:wrap;font-family:var(--mono);font-weight:500}
.tx-info-strip strong{color:#111;font-weight:700}

.tx-tabs-wrap{position:sticky;top:0;background:#fff;z-index:3;border-bottom:1px solid #EEE;margin-top:16px}
.tx-tabs { padding: 12px 20px; display:flex; gap:20px; overflow-x:auto; scroll-snap-type:x proximity; -webkit-overflow-scrolling:touch;scrollbar-width:none; scroll-padding-inline:20px}
.tx-tabs::-webkit-scrollbar{display:none}
.tx-tab { padding:8px 2px; font-size:14px; color:#666; white-space:nowrap; font-weight:600; scroll-snap-align:start;cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-1px}
.tx-tab.on { color:#111; font-weight:800; border-bottom-color:#23303A; }
.tx-tabs-fade{position:absolute;right:0;top:0;bottom:0;width:36px;background:linear-gradient(90deg,transparent,#fff);pointer-events:none}

.tx-list { padding:12px 20px calc(var(--cart-bar-height) + env(safe-area-inset-bottom) + 40px); }
.tx-cat-h { font-family:'Archivo Black'; font-size:15px; color:#111; margin:20px 0 10px; }
.tx-item { display:grid; grid-template-columns: 1fr 90px; gap:14px; padding:14px 0; border-bottom:1px solid #F0F0EA; }
.tx-item.out{opacity:.5}
.tx-item-info { display:flex; flex-direction:column; min-width:0;}
.tx-item-n { font-size:15px; font-weight:700; color:#111; }
.tx-item-d { font-size:13px; color:#777; margin:3px 0 8px; line-height:1.4; }
.tx-item-p { font-family:var(--mono); font-weight:800; font-size:15px; color:#111; }
.tx-item-img { width:90px; height:90px; border-radius:12px; background: linear-gradient(135deg, #F4C752, #E88C3B); position:relative; overflow:hidden;}
.tx-item-img.no-img{background:repeating-linear-gradient(45deg,#F5EADC,#F5EADC 6px,#EEE0CE 6px,#EEE0CE 12px);display:grid;place-items:center;color:#B39A83;font-size:22px}
.tx-item-plus:after { content:"+"; position:absolute; right:-6px; bottom:-6px; width:26px; height:26px; border-radius:50%; background:#fff; color:#23303A; font-weight:800; display:grid; place-items:center; box-shadow: 0 4px 10px rgba(0,0,0,.15); font-family:var(--mono);font-size:16px }
.tx-item-badge{display:inline-block;font-size:10px;font-family:var(--mono);font-weight:700;text-transform:uppercase;letter-spacing:.05em;padding:3px 7px;border-radius:6px;background:#FFF3D0;color:#8B5A00;margin-bottom:4px;width:max-content}
.tx-item-badge.out-badge{background:#F1F1EE;color:#666}

.tx-cart-fab { position:fixed; left:50%; transform:translateX(-50%); bottom:20px; width:calc(min(100%,480px) - 40px); background:#23303A; color:#fff; padding:14px 18px; border-radius:14px; display:flex; justify-content:space-between; align-items:center; box-shadow: 0 12px 30px -10px rgba(0,0,0,.35); z-index:20; padding-bottom:max(14px,env(safe-area-inset-bottom)); }
.tx-cart-fab-l { display:flex; align-items:center; gap:10px; font-weight:700; font-family:var(--mono);}
.tx-cart-fab-c { background:#F4C752; color:#23303A; min-width:26px; height:26px; padding:0 8px; border-radius:999px; display:grid; place-items:center; font-size:13px; font-weight:800; font-family:var(--mono);}
.tx-cart-fab-t { font-family:var(--mono); font-weight:800; font-size:16px; }

.tx-closed-banner{background:#FFF3D0;color:#8B5A00;font-family:var(--mono);font-weight:700;font-size:13px;padding:12px 20px;text-align:center;border-top:1px solid #F0DFA1;border-bottom:1px solid #F0DFA1}

.tx-powered { text-align:center; padding:16px; font-size:11px; color:#999; font-family:var(--mono);}
.tx-powered strong { color:#F0522D; font-family:'Archivo Black';}

/* Tablet cardapio (768–1023): wider, two-col product grid */
@media (min-width: 768px){
  [data-theme="tx-proto"]{background:linear-gradient(180deg,#F5EADC 0%,#FAFAF7 260px);}
  .tx-root{max-width:760px;box-shadow:0 30px 80px -40px rgba(52,36,29,.3);border-radius:0 0 20px 20px;overflow:hidden}
  .tx-cover{height:280px}
  .tx-list-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
  .tx-item{padding:16px;border:1px solid #F0F0EA;border-radius:16px;border-bottom:1px solid #F0F0EA}
  .tx-cart-fab{width:calc(min(100%,760px) - 40px)}
}

/* ================= MOTOBOY ================= */
[data-theme="moto-proto"]{background:#0F1210;min-height:100dvh;color:#F5F5F0;font-family:'Hind',sans-serif;overflow-x:hidden}
.moto-shell{max-width:480px;margin:0 auto;min-height:100dvh;display:flex;flex-direction:column;padding-bottom:calc(76px + env(safe-area-inset-bottom))}
.moto-topbar{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:16px 18px;padding-top:max(16px,env(safe-area-inset-top));background:#151815;border-bottom:1px solid #262A26}
.moto-topbar-l{display:flex;align-items:center;gap:12px;min-width:0}
.moto-avatar{width:42px;height:42px;border-radius:12px;background:linear-gradient(135deg,#F0522D,#FFB82E);color:#fff;display:grid;place-items:center;font-family:'Archivo Black';font-size:16px;flex-shrink:0}
.moto-topbar-name{font-family:'Archivo Black';font-size:15px;color:#F5F5F0;line-height:1.15}
.moto-topbar-sub{font-size:11.5px;color:#8A8F86;font-family:var(--mono);font-weight:600}
.moto-profile-btn{background:#22261F;border:1px solid #333833;width:40px;height:40px;border-radius:12px;color:#F5F5F0;font-size:16px;display:grid;place-items:center;cursor:pointer}
.moto-status{display:flex;background:#22261F;border-radius:999px;padding:4px;gap:2px;border:1px solid #333833;}
.moto-status button{background:transparent;border:none;color:#8A8F86;font-family:var(--mono);font-weight:700;font-size:12px;padding:6px 12px;border-radius:999px;cursor:pointer;letter-spacing:.02em}
.moto-status button.on{background:#3EE07F;color:#082013}
.moto-status button.busy.on{background:#FFB82E;color:#3A2500}

.moto-summary{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:16px 18px 8px}
.moto-summary-card{background:#181B18;border:1px solid #262A26;border-radius:14px;padding:12px 14px}
.moto-summary-l{font-size:10.5px;color:#8A8F86;font-family:var(--mono);font-weight:600;text-transform:uppercase;letter-spacing:.06em}
.moto-summary-v{font-family:var(--mono);font-weight:800;font-size:22px;color:#F5F5F0;margin-top:4px;letter-spacing:-.01em}
.moto-summary-card.hi .moto-summary-v{color:#3EE07F}

.moto-current-label{font-size:11px;color:#8A8F86;font-family:var(--mono);font-weight:700;text-transform:uppercase;letter-spacing:.08em;padding:16px 20px 8px}

.moto-card{background:#181B18;border:1px solid #262A26;border-radius:18px;margin:0 18px 14px;padding:16px 18px;position:relative;overflow:hidden}
.moto-card:before{content:"";position:absolute;left:0;top:0;bottom:0;width:4px;background:var(--tomato)}
.moto-card.next:before{background:#8A8F86}
.moto-card-h{display:flex;justify-content:space-between;align-items:flex-start;gap:10px;margin-bottom:10px}
.moto-card-tag{display:inline-block;background:rgba(240,82,45,.15);color:#FF8A5F;font-family:var(--mono);font-weight:800;font-size:10.5px;letter-spacing:.06em;text-transform:uppercase;padding:4px 9px;border-radius:6px}
.moto-card.next .moto-card-tag{background:rgba(138,143,134,.15);color:#B0B5AA}
.moto-card-o{font-family:var(--mono);font-weight:800;font-size:16px;color:#F5F5F0}
.moto-card-restaurant{display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px dashed #2A2E29;margin-bottom:10px}
.moto-card-rest-logo{width:36px;height:36px;border-radius:10px;background:#22261F;color:var(--mango);display:grid;place-items:center;font-family:'Archivo Black';font-size:14px;flex-shrink:0}
.moto-card-rest-name{font-family:var(--mono);font-weight:800;font-size:13.5px;color:#F5F5F0}
.moto-card-rest-sub{font-size:11px;color:#8A8F86;font-family:var(--mono)}
.moto-card-addr{color:#DADDD5;font-size:14px;line-height:1.5}
.moto-card-addr strong{font-weight:700;color:#F5F5F0}
.moto-card-meta{display:flex;flex-wrap:wrap;gap:14px 18px;margin-top:14px;padding-top:12px;border-top:1px dashed #2A2E29;font-size:12.5px;font-family:var(--mono);font-weight:600;color:#B0B5AA}
.moto-card-meta b{color:#F5F5F0;font-weight:800}
.moto-card-note{background:#22261F;border-radius:10px;padding:10px 12px;margin-top:12px;font-size:12.5px;color:#DADDD5;line-height:1.5;border-left:2px solid var(--mango)}

.moto-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:14px}
.moto-actions button{background:#22261F;border:1px solid #333833;color:#F5F5F0;padding:12px;border-radius:12px;font-family:var(--mono);font-weight:700;font-size:13px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px}
.moto-actions button:hover{border-color:#4A5147}
.moto-primary{background:#3EE07F !important;color:#082013 !important;border-color:transparent !important;font-size:14px !important;grid-column:span 2;padding:14px !important}
.moto-danger{background:transparent !important;color:#FF6B6B !important;border-color:#3A2020 !important}

.moto-bottom-nav{position:fixed;left:0;right:0;bottom:0;background:#151815;border-top:1px solid #262A26;padding:8px 0 max(10px,env(safe-area-inset-bottom));z-index:30}
.moto-bottom-inner{max-width:480px;margin:0 auto;display:grid;grid-template-columns:repeat(3,1fr);gap:2px}
.moto-bottom-item{background:transparent;border:none;color:#6B7068;padding:8px 4px;font-family:var(--mono);font-weight:700;font-size:11px;display:flex;flex-direction:column;align-items:center;gap:4px;cursor:pointer}
.moto-bottom-item.on{color:#3EE07F}
.moto-bottom-item svg{width:22px;height:22px}

/* ---- mob-grid preview page (kept for /dev/proto/mobile) ---- */
.mob-grid { display:grid; grid-template-columns: repeat(auto-fill, 375px); gap: 40px 24px; padding: 40px; background: linear-gradient(180deg, #F5EADC, #FFF8EE); min-height: 100vh; justify-content:center; }
.mob-frame { width:375px; height:812px; background:#fff; border-radius:32px; border:9px solid #20211F; overflow:hidden; box-shadow: 0 30px 60px -20px rgba(52,36,29,.4); position:relative; display:flex; flex-direction:column; }
.mob-caption { text-align:center; margin-top:14px; font-family:'Archivo Black'; font-size:13px; color:var(--coffee); }
.mob-notch { height:12px; background:#20211F; margin: -1px auto 0; width:80px; border-radius:0 0 12px 12px; z-index:5; position:relative; }
`;
