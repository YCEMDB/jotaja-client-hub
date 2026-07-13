/**
 * Isolated CSS for Mesivo dev prototypes.
 * Scoped under [data-theme="mkt-proto"] / [data-theme="app-proto"] / [data-theme="tx-proto"]
 * so it never leaks into production styles.
 */
export const PROTO_CSS = `
[data-theme="mkt-proto"], [data-theme="app-proto"], [data-theme="tx-proto"] {
  --cream:#FFF8EE; --warm:#FFFDFA; --peach:#FFE7D5;
  --tomato:#F0522D; --orange:#FF6B35; --mango:#FFB82E;
  --leaf:#2F7D5B; --leaf-soft:#E5F3EA;
  --coffee:#34241D; --text:#2A211D; --muted:#70645E; --hair:#ECDDD3; --white:#fff;
  font-family: 'Hind', 'Inter', system-ui, -apple-system, Segoe UI, sans-serif;
  color: var(--text);
  -webkit-font-smoothing: antialiased;
}

/* ================= MARKETING ================= */
.mkt-root { background: var(--cream); min-height:100vh; }
.mkt-container { max-width: 1200px; margin: 0 auto; padding: 0 24px; }
.mkt-header { position:sticky; top:0; background: rgba(255,248,238,.85); backdrop-filter: blur(10px); border-bottom:1px solid var(--hair); z-index:10; }
.mkt-brand { font-family:'Archivo Black',sans-serif; font-size:19px; letter-spacing:-.01em; }
.mkt-nav { display:flex; gap:26px; font-size:14.5px; color:var(--coffee); }
.mkt-nav a { cursor:pointer; }
.mkt-link { font-size:14.5px; color:var(--coffee); cursor:pointer; }

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
.mkt-dot { width:8px; height:8px; border-radius:50%; background: var(--leaf); box-shadow: 0 0 0 4px rgba(47,125,91,.18); }
.mkt-h1 { font-family:'Archivo Black', sans-serif; font-size: clamp(44px, 5.5vw, 68px); line-height:1.02; letter-spacing:-.02em; color: var(--coffee); margin: 18px 0 18px; }
.mkt-h1 em { font-style: italic; font-family: 'Instrument Serif', serif; color: var(--tomato); }
.mkt-accent { color: var(--tomato); }
.mkt-sub { font-size: 18px; line-height:1.55; color: var(--muted); max-width: 520px; }
.mkt-cta-row { display:flex; gap:12px; margin-top: 28px; flex-wrap:wrap; }
.mkt-social { display:flex; align-items:center; gap:14px; margin-top: 30px; font-size:14px; color:var(--muted); }
.mkt-avatars { display:flex; }
.mkt-avatars span { width:32px; height:32px; border-radius:50%; margin-right:-8px; display:grid; place-items:center; color:#FFF8EE; font-size:12px; font-weight:700; border:2px solid var(--cream); }

/* Hero stage */
.mkt-hero-stage { position:relative; height: 520px; }
.mkt-flowlines { position:absolute; inset:0; width:100%; height:100%; z-index:0; }
.mkt-mockup-dashboard { position:absolute; left:0; top:20px; width:88%; z-index:2; transform: rotate(-1.5deg); filter: drop-shadow(0 30px 50px rgba(52,36,29,.18)); }
.mkt-mockup-phone { position:absolute; right:-10px; bottom:-10px; width:210px; z-index:3; transform: rotate(4deg); filter: drop-shadow(0 30px 40px rgba(52,36,29,.22)); }
.mkt-badge-float { position:absolute; background:#fff; border:1px solid var(--hair); padding:8px 12px; border-radius:12px; font-size:13px; font-weight:600; box-shadow: 0 12px 24px -12px rgba(52,36,29,.25); z-index:4; }
.mkt-badge-mango { top:36px; right:30px; color:#8B5A00; background:#FFF6DF; border-color:#FFE7A1; }
.mkt-badge-leaf { bottom:120px; left:-8px; color:#1F5A3F; background:#E5F3EA; border-color:#B9DEC7; }

/* Dashboard mock */
.dm { background:#fff; border:1px solid var(--hair); border-radius:14px; overflow:hidden; }
.dm-top { display:flex; align-items:center; gap:10px; padding:8px 12px; background:#FBF3E7; border-bottom:1px solid var(--hair); }
.dm-dots { display:flex; gap:5px; } .dm-dots i { width:9px; height:9px; border-radius:50%; background:#E7CFB6; }
.dm-url { font-size:11px; color:var(--muted); }
.dm-body { display:grid; grid-template-columns: 148px 1fr; min-height:340px; }
.dm-side { background:#FBF3E7; padding:14px 10px; border-right:1px solid var(--hair); }
.dm-logo { width:28px; height:28px; border-radius:8px; background:var(--tomato); color:#FFF8EE; display:grid; place-items:center; font-family:'Archivo Black'; font-size:14px; margin-bottom:14px; }
.dm-item { padding:8px 10px; font-size:12.5px; color:var(--coffee); border-radius:8px; margin-bottom:2px; }
.dm-item.on { background:#FFE7D5; color:var(--tomato); font-weight:700; }
.dm-main { padding:16px 18px; }
.dm-header { display:flex; justify-content:space-between; align-items:end; margin-bottom:14px; }
.dm-eyebrow { font-size:11px; color:var(--muted); text-transform:uppercase; letter-spacing:.06em; }
.dm-title { font-family:'Archivo Black'; font-size:20px; color:var(--coffee); }
.dm-tabs { display:flex; gap:6px; background:#F5EADC; padding:4px; border-radius:8px; font-size:12px; }
.dm-tabs span { padding:5px 10px; border-radius:6px; color:var(--muted); }
.dm-tabs span.on { background:#fff; color:var(--coffee); font-weight:600; }
.dm-kpis { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; margin-bottom:12px; }
.dm-kpi { background:#FFFDFA; border:1px solid var(--hair); border-radius:10px; padding:10px; }
.dm-kpi-l { font-size:11px; color:var(--muted); }
.dm-kpi-v { font-family:'Archivo Black'; font-size:18px; color:var(--coffee); margin:2px 0; }
.dm-kpi-d { font-size:11px; font-weight:600; }
.d-leaf { color: var(--leaf); } .d-mango { color:#B27D00; } .d-coral { color: var(--tomato); } .d-coffee { color: var(--coffee); }
.dm-orders { display:flex; flex-direction:column; gap:6px; }
.dm-order { display:grid; grid-template-columns: 60px 1fr auto; align-items:center; padding:9px 12px; background:#FFFDFA; border:1px solid var(--hair); border-radius:10px; font-size:12.5px; }
.dm-order-id { font-family:'Archivo Black'; color:var(--coffee); }
.dm-order-orig { color:var(--muted); }
.dm-order-status { font-size:11px; font-weight:700; padding:3px 8px; border-radius:999px; }
.s-coral { background:#FFE7D5; color:var(--tomato); }
.s-mango { background:#FFF3D0; color:#8B5A00; }
.s-leaf { background:#E5F3EA; color:var(--leaf); }
.s-coffee { background:#EDE1D8; color:var(--coffee); }

/* Phone mock */
.pm { background:#fff; border-radius:26px; border:8px solid #2A211D; overflow:hidden; }
.pm-notch { height:14px; background:#2A211D; margin:-2px auto 0; width:60px; border-radius:0 0 10px 10px; }
.pm-cover { height:70px; background: linear-gradient(120deg, #F0522D, #FFB82E); }
.pm-brand { display:flex; gap:10px; align-items:center; padding:10px 12px; border-bottom:1px solid var(--hair); }
.pm-logo { width:36px; height:36px; border-radius:10px; background:var(--coffee); color:var(--mango); display:grid; place-items:center; font-family:'Archivo Black'; font-size:15px; margin-top:-24px; border:2px solid #fff; }
.pm-name { font-family:'Archivo Black'; font-size:13px; color:var(--coffee); }
.pm-open { font-size:10.5px; color: var(--leaf); display:flex; align-items:center; gap:5px; }
.pm-open span { width:6px; height:6px; border-radius:50%; background:var(--leaf); }
.pm-cats { display:flex; gap:6px; padding:8px 12px; overflow:hidden; }
.pm-cats span { font-size:10.5px; padding:5px 10px; border-radius:999px; background:#F5EADC; color:var(--muted); white-space:nowrap; }
.pm-cats span.on { background:var(--coffee); color:var(--cream); }
.pm-items { padding:6px 10px 10px; display:flex; flex-direction:column; gap:6px; }
.pm-item { display:grid; grid-template-columns: 44px 1fr auto; gap:8px; align-items:center; padding:6px; border:1px solid var(--hair); border-radius:10px; background:#FFFDFA; }
.pm-thumb { width:44px; height:44px; border-radius:8px; background: linear-gradient(135deg, #FFB82E, #F0522D); }
.pm-title { font-size:11.5px; font-weight:700; color:var(--coffee); }
.pm-desc { font-size:10px; color:var(--muted); }
.pm-price { font-size:11.5px; font-weight:800; color:var(--tomato); }
.pm-cta { background:var(--tomato); color:#FFF8EE; padding:10px; text-align:center; font-size:12px; font-weight:700; }

/* Marquee */
.mkt-marquee-wrap { border-top:1px solid var(--hair); border-bottom:1px solid var(--hair); background: var(--warm); padding:14px 0; }
.mkt-marquee { overflow:hidden; }
.mkt-marquee-track { display:flex; white-space:nowrap; animation: mkt-slide 28s linear infinite; }
@keyframes mkt-slide { to { transform: translateX(-50%); } }
.mkt-marquee-item { font-family:'Archivo Black'; font-size:15px; color:var(--coffee); display:inline-flex; align-items:center; gap:10px; opacity:.75; }
.mkt-marquee-dot { width:6px; height:6px; border-radius:50%; background:var(--tomato); }

/* Sections */
.mkt-section { padding: 100px 0; }
.mkt-section-cream { background: var(--warm); }
.mkt-h2 { font-family:'Archivo Black'; font-size: clamp(30px, 3.4vw, 44px); color:var(--coffee); letter-spacing:-.015em; line-height:1.1; }
.mkt-h2-inv { font-family:'Archivo Black'; font-size: clamp(28px, 3vw, 38px); color:#FFF8EE; letter-spacing:-.015em; }
.mkt-sub-inv { color:#EEDFD3; font-size:16px; }
.mkt-center { text-align:center; }
.mkt-max-2xl { max-width: 640px; margin: 12px auto 40px; }
.mkt-eyebrow-alt { font-size: 12px; color:var(--tomato); font-weight:700; text-transform:uppercase; letter-spacing:.08em; margin-bottom:10px; }
.mkt-two-col { display:grid; grid-template-columns: 1fr 1.15fr; gap: 60px; align-items:center; }
.mkt-bullets { list-style:none; padding:0; margin-top: 22px; display:flex; flex-direction:column; gap:12px; font-size:16px; color:var(--coffee); }
.mkt-bullets li:before { content:"—"; color: var(--tomato); margin-right:10px; font-weight:800; }
.mkt-solution-card { background:#fff; border:1px solid var(--hair); border-radius:22px; padding:26px; box-shadow: 0 30px 60px -40px rgba(52,36,29,.35); }
.mkt-solution-head { display:flex; gap:8px; margin-bottom:14px; }
.mkt-tag { background:#FFE7D5; color:var(--tomato); font-size:11px; font-weight:700; padding:5px 10px; border-radius:999px; text-transform:uppercase; letter-spacing:.06em; }
.mkt-tag-leaf { background:#E5F3EA; color:var(--leaf); }
.mkt-flow-diagram { padding:8px; }

/* Feature bento */
.mkt-feature-bento { display:grid; grid-template-columns: repeat(4, 1fr); grid-auto-rows: 220px; gap:16px; margin-top: 30px; }
.mkt-feature-card { grid-column: span 1; background:#fff; border:1px solid var(--hair); border-radius:20px; padding:22px; position:relative; overflow:hidden; }
.mkt-feature-lg { grid-column: span 2; grid-row: span 2; }
.mkt-feature-wide { grid-column: span 2; }
.mkt-feature-coral { background: linear-gradient(140deg, var(--tomato), #FF7E4E); border-color:transparent; color:#FFF8EE; grid-column: span 2; }
.mkt-feature-tag { display:inline-block; background:#FFE7D5; color:var(--tomato); font-size:11px; font-weight:700; padding:4px 10px; border-radius:999px; text-transform:uppercase; letter-spacing:.06em; margin-bottom:12px; }
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
.mkt-footer-links { display:flex; gap:20px; font-size:13.5px; }
.mkt-footer-links a { cursor:pointer; }

/* Mini components inside cards */
.pdvm { background:#FFFDFA; border:1px solid var(--hair); border-radius:14px; padding:10px; display:grid; grid-template-columns: 1fr 140px; gap:10px; }
.pdvm-cats { grid-column: 1 / -1; display:flex; gap:6px; }
.pdvm-cats span { font-size:11px; padding:5px 10px; border-radius:8px; background:#F5EADC; color:var(--muted); }
.pdvm-cats span.on { background: var(--tomato); color:#FFF8EE; font-weight:700; }
.pdvm-grid { display:grid; grid-template-columns: repeat(3,1fr); gap:6px; }
.pdvm-prod { background:#fff; border:1px solid var(--hair); border-radius:10px; padding:8px; text-align:center; }
.pdvm-thumb { height:38px; border-radius:6px; background: linear-gradient(135deg, #FFB82E, #F0522D); margin-bottom:5px; }
.pdvm-name { font-size:10.5px; font-weight:700; color:var(--coffee); }
.pdvm-price { font-size:10px; color:var(--tomato); font-weight:700; }
.pdvm-cart { background:#fff; border:1px solid var(--hair); border-radius:10px; padding:8px; display:flex; flex-direction:column; gap:4px; }
.pdvm-cart-row { display:flex; justify-content:space-between; font-size:11px; color:var(--coffee); }
.pdvm-cart-total { display:flex; justify-content:space-between; padding-top:5px; border-top:1px dashed var(--hair); font-size:12px; color:var(--coffee); }
.pdvm-cta { margin-top:auto; background:var(--tomato); color:#FFF8EE; border:none; padding:7px; border-radius:8px; font-size:11.5px; font-weight:700; }

.cxm { background:#FFFDFA; border:1px solid var(--hair); border-radius:12px; padding:10px; margin-top:14px; display:flex; flex-direction:column; gap:6px; }
.cxm-row { display:grid; grid-template-columns: 1fr 1fr auto; align-items:center; padding:8px 10px; background:#fff; border:1px solid var(--hair); border-radius:8px; font-size:12.5px; color:var(--coffee); gap:8px; }
.cxm-ok { font-size:10.5px; color:var(--leaf); background:var(--leaf-soft); padding:3px 8px; border-radius:999px; font-weight:700; }
.cxm-warn { font-size:10.5px; color:#8B5A00; background:#FFF3D0; padding:3px 8px; border-radius:999px; font-weight:700; }

/* ================= APP (DASHBOARD / PDV) ================= */
[data-theme="app-proto"] { background:#F7F7F5; min-height:100vh; }
.app-shell { display:grid; grid-template-columns: 240px 1fr; min-height:100vh; }
.app-side { background:#fff; border-right:1px solid #E1E2DD; padding:18px 14px; }
.app-side-brand { display:flex; align-items:center; gap:10px; padding:6px 8px 22px; }
.app-side-brand-mark { width:32px; height:32px; border-radius:9px; background:var(--tomato); color:#FFF8EE; display:grid; place-items:center; font-family:'Archivo Black'; }
.app-side-brand-name { font-family:'Archivo Black'; font-size:15px; color:#20211F; }
.app-side-group { font-size:10.5px; color:#8A8C84; text-transform:uppercase; letter-spacing:.08em; padding:16px 8px 8px; }
.app-side-item { display:flex; align-items:center; gap:10px; padding:9px 10px; border-radius:8px; font-size:14px; color:#353631; cursor:pointer; margin-bottom:2px; }
.app-side-item:hover { background:#F1F1EE; }
.app-side-item.on { background:#FFE7D5; color:var(--tomato); font-weight:600; }
.app-side-ico { width:16px; height:16px; border-radius:4px; background:#E1E2DD; }
.app-side-item.on .app-side-ico { background:var(--tomato); }

.app-main { display:flex; flex-direction:column; }
.app-topbar { background:#fff; border-bottom:1px solid #E1E2DD; padding:12px 24px; display:flex; align-items:center; justify-content:space-between; gap:20px; }
.app-search { flex:1; max-width:400px; background:#F1F1EE; border-radius:10px; padding:9px 14px; font-size:13.5px; color:#8A8C84; }
.app-topbar-actions { display:flex; align-items:center; gap:10px; }
.app-icon-btn { width:36px; height:36px; border-radius:10px; background:#F1F1EE; display:grid; place-items:center; font-size:14px; }
.app-user { display:flex; align-items:center; gap:9px; padding:4px 10px 4px 4px; background:#F1F1EE; border-radius:999px; }
.app-user-av { width:28px; height:28px; border-radius:50%; background:var(--tomato); color:#FFF8EE; display:grid; place-items:center; font-size:12px; font-weight:700; }

.app-content { padding: 24px; }
.app-page-h { font-family:'Archivo Black'; font-size:24px; color:#20211F; letter-spacing:-.01em; }
.app-page-sub { font-size:13.5px; color:#696B64; margin-top:2px; }
.app-page-head { display:flex; justify-content:space-between; align-items:end; margin-bottom:20px; flex-wrap:wrap; gap:14px; }
.app-filters { display:flex; gap:6px; }
.app-chip { background:#fff; border:1px solid #E1E2DD; padding:7px 14px; border-radius:10px; font-size:13px; color:#353631; }
.app-chip.on { background:#20211F; color:#fff; border-color:#20211F; }

.app-btn { background:var(--tomato); color:#FFF8EE; border:none; padding:9px 16px; border-radius:10px; font-size:13.5px; font-weight:600; cursor:pointer; }
.app-btn-ghost { background:#fff; border:1px solid #E1E2DD; color:#353631; padding:9px 14px; border-radius:10px; font-size:13.5px; }

.app-kpi-grid { display:grid; grid-template-columns: repeat(4, 1fr); gap:14px; margin-bottom:20px; }
.app-kpi { background:#fff; border:1px solid #E1E2DD; border-radius:14px; padding:16px 18px; }
.app-kpi-l { font-size:12px; color:#696B64; text-transform:uppercase; letter-spacing:.05em; }
.app-kpi-v { font-family:'Archivo Black'; font-size:26px; color:#20211F; margin:6px 0 4px; }
.app-kpi-d { font-size:12px; font-weight:600; }
.app-kpi-spark { height:32px; margin-top:8px; }

.app-two-col { display:grid; grid-template-columns: 2fr 1fr; gap:16px; }
.app-panel { background:#fff; border:1px solid #E1E2DD; border-radius:14px; padding:18px; }
.app-panel-h { display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; }
.app-panel-t { font-family:'Archivo Black'; font-size:15px; color:#20211F; }

.app-chart { height:220px; position:relative; }

.app-order-row { display:grid; grid-template-columns: 70px 1fr 90px 100px 80px; gap:12px; padding:11px 12px; border-bottom:1px solid #F1F1EE; font-size:13px; align-items:center; }
.app-order-row:last-child { border-bottom:none; }
.app-order-id { font-family:'Archivo Black'; color:#20211F; }
.app-order-cli { color:#353631; }
.app-order-val { font-weight:700; color:#20211F; text-align:right; }
.app-status { font-size:11px; font-weight:700; padding:4px 9px; border-radius:999px; text-align:center; }
.st-novo { background:#FFE7D5; color:var(--tomato); }
.st-prep { background:#FFF3D0; color:#8B5A00; }
.st-saiu { background:#E5F3EA; color:var(--leaf); }
.st-ok   { background:#F1F1EE; color:#20211F; }

.app-caixa-list { display:flex; flex-direction:column; gap:8px; }
.app-caixa-item { display:grid; grid-template-columns: 1fr auto auto; gap:8px; align-items:center; padding:10px 12px; background:#F7F7F5; border-radius:10px; font-size:13px; }

/* PDV */
.pdv-shell { display:grid; grid-template-columns: 260px 1fr 340px; height:100vh; }
.pdv-cats-col { background:#fff; border-right:1px solid #E1E2DD; overflow-y:auto; }
.pdv-cats-h { padding:16px; border-bottom:1px solid #E1E2DD; }
.pdv-cats-h-t { font-family:'Archivo Black'; font-size:16px; color:#20211F; }
.pdv-cat { padding:14px 16px; font-size:14px; color:#353631; border-bottom:1px solid #F1F1EE; cursor:pointer; display:flex; justify-content:space-between; align-items:center; }
.pdv-cat.on { background:#FFE7D5; color:var(--tomato); font-weight:700; border-left:3px solid var(--tomato); padding-left:13px; }
.pdv-cat-c { font-size:11px; background:#F1F1EE; padding:2px 8px; border-radius:999px; color:#696B64; }
.pdv-cat.on .pdv-cat-c { background:var(--tomato); color:#fff; }

.pdv-main-col { padding:16px; overflow-y:auto; }
.pdv-search { background:#fff; border:1px solid #E1E2DD; padding:11px 14px; border-radius:10px; font-size:13.5px; color:#8A8C84; margin-bottom:14px; }
.pdv-prods { display:grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap:12px; }
.pdv-prod { background:#fff; border:1px solid #E1E2DD; border-radius:12px; padding:12px; cursor:pointer; transition: transform .15s; }
.pdv-prod:hover { transform: translateY(-2px); border-color:var(--tomato); }
.pdv-prod-img { height:70px; border-radius:8px; background: linear-gradient(135deg, #FFB82E, #F0522D); margin-bottom:8px; }
.pdv-prod-name { font-size:13px; font-weight:600; color:#20211F; }
.pdv-prod-price { font-size:14px; color:var(--tomato); font-weight:800; margin-top:2px; }

.pdv-cart-col { background:#fff; border-left:1px solid #E1E2DD; display:flex; flex-direction:column; }
.pdv-cart-h { padding:16px; border-bottom:1px solid #E1E2DD; display:flex; justify-content:space-between; align-items:center; }
.pdv-cart-h-t { font-family:'Archivo Black'; font-size:16px; color:#20211F; }
.pdv-cart-tag { background:#FFE7D5; color:var(--tomato); font-size:11px; padding:4px 8px; border-radius:6px; font-weight:700; }
.pdv-cli { padding:12px 16px; border-bottom:1px solid #F1F1EE; font-size:13px; color:#353631; display:flex; justify-content:space-between; }
.pdv-cli-name { font-weight:600; color:#20211F; }
.pdv-tipo { display:flex; gap:4px; padding:10px 16px; border-bottom:1px solid #F1F1EE; }
.pdv-tipo span { flex:1; text-align:center; font-size:12px; padding:7px; border-radius:8px; background:#F1F1EE; color:#696B64; cursor:pointer; }
.pdv-tipo span.on { background:#20211F; color:#fff; font-weight:600; }
.pdv-cart-items { flex:1; overflow-y:auto; padding:10px 16px; }
.pdv-cart-item { display:grid; grid-template-columns: 28px 1fr auto; gap:10px; padding:9px 0; border-bottom:1px dashed #E1E2DD; font-size:13px; align-items:center; }
.pdv-cart-item-q { background:#20211F; color:#fff; width:24px; height:24px; border-radius:6px; display:grid; place-items:center; font-size:11px; font-weight:700; }
.pdv-cart-item-n { color:#353631; }
.pdv-cart-item-p { font-weight:700; color:#20211F; }
.pdv-cart-totals { padding:14px 16px; background:#F7F7F5; border-top:1px solid #E1E2DD; }
.pdv-tot-row { display:flex; justify-content:space-between; font-size:13px; padding:3px 0; color:#696B64; }
.pdv-tot-final { display:flex; justify-content:space-between; padding-top:8px; margin-top:6px; border-top:1px solid #E1E2DD; }
.pdv-tot-final-l { font-family:'Archivo Black'; font-size:14px; color:#20211F; }
.pdv-tot-final-v { font-family:'Archivo Black'; font-size:22px; color:#20211F; }
.pdv-pay { padding:0 16px 16px; display:grid; grid-template-columns: repeat(2,1fr); gap:6px; }
.pdv-pay span { text-align:center; padding:9px; background:#F1F1EE; border-radius:8px; font-size:12px; color:#353631; cursor:pointer; }
.pdv-pay span.on { background:var(--leaf-soft); color:var(--leaf); font-weight:700; border:1px solid var(--leaf); }
.pdv-finalize { margin: 0 16px 16px; background:var(--tomato); color:#FFF8EE; border:none; padding:14px; border-radius:12px; font-size:15px; font-weight:700; cursor:pointer; }

/* ================= TRANSACIONAL (CARDÁPIO PÚBLICO) ================= */
[data-theme="tx-proto"] { background:#FAFAF7; min-height:100vh; font-family:'Hind',sans-serif; }
.tx-root { min-height:100vh; }
.tx-cover { height: 220px; position:relative; background: linear-gradient(120deg, #23303A, #3D5769); overflow:hidden; }
.tx-cover:before { content:""; position:absolute; inset:0; background: radial-gradient(400px 300px at 30% 40%, rgba(255,255,255,.15), transparent 60%); }
.tx-cover-txt { position:absolute; bottom:20px; left:20px; color:#fff; }
.tx-cover-eyebrow { font-size:12px; opacity:.85; }
.tx-brand-block { padding: 0 20px; position:relative; }
.tx-brand-card { background:#fff; border-radius:16px; padding:16px; box-shadow: 0 10px 30px -15px rgba(0,0,0,.2); margin-top:-40px; display:flex; gap:14px; align-items:center; }
.tx-brand-logo { width:60px; height:60px; border-radius:14px; background:#23303A; color:#F4C752; display:grid; place-items:center; font-family:'Archivo Black'; font-size:22px; flex-shrink:0; }
.tx-brand-h { display:flex; flex-direction:column; gap:2px; }
.tx-brand-name { font-family:'Archivo Black'; font-size:19px; color:#111; }
.tx-brand-meta { font-size:12.5px; color:#666; }
.tx-open { display:inline-flex; align-items:center; gap:6px; color:#2F7D5B; font-size:12.5px; font-weight:600; }
.tx-open-dot { width:8px; height:8px; border-radius:50%; background:#2F7D5B; }
.tx-tabs { padding: 20px 20px 0; display:flex; gap:16px; overflow-x:auto; border-bottom:1px solid #EEE; }
.tx-tab { padding:10px 2px; font-size:14px; color:#666; white-space:nowrap; }
.tx-tab.on { color:#111; font-weight:700; border-bottom:2px solid #23303A; }
.tx-list { padding:12px 20px 100px; }
.tx-cat-h { font-family:'Archivo Black'; font-size:15px; color:#111; margin:20px 0 10px; }
.tx-item { display:grid; grid-template-columns: 1fr 90px; gap:14px; padding:14px 0; border-bottom:1px solid #F0F0EA; }
.tx-item-info { display:flex; flex-direction:column; }
.tx-item-n { font-size:15px; font-weight:700; color:#111; }
.tx-item-d { font-size:13px; color:#777; margin:3px 0 8px; line-height:1.4; }
.tx-item-p { font-family:'Archivo Black'; font-size:15px; color:#111; }
.tx-item-img { width:90px; height:90px; border-radius:12px; background: linear-gradient(135deg, #F4C752, #E88C3B); }
.tx-item-plus { position:relative; }
.tx-item-plus:after { content:"+"; position:absolute; right:-6px; bottom:-6px; width:26px; height:26px; border-radius:50%; background:#fff; color:#23303A; font-weight:700; display:grid; place-items:center; box-shadow: 0 4px 10px rgba(0,0,0,.15); }
.tx-cart-fab { position:fixed; left:20px; right:20px; bottom:20px; background:#23303A; color:#fff; padding:14px 18px; border-radius:14px; display:flex; justify-content:space-between; align-items:center; box-shadow: 0 12px 30px -10px rgba(0,0,0,.35); }
.tx-cart-fab-l { display:flex; align-items:center; gap:10px; font-weight:600; }
.tx-cart-fab-c { background:#F4C752; color:#23303A; width:26px; height:26px; border-radius:50%; display:grid; place-items:center; font-size:13px; font-weight:800; }
.tx-cart-fab-t { font-family:'Archivo Black'; font-size:16px; }
.tx-powered { text-align:center; padding:16px; font-size:11px; color:#999; }
.tx-powered strong { color:#F0522D; }

/* MOBILE PROTOTYPE PANELS */
.mob-grid { display:grid; grid-template-columns: repeat(3, 375px); gap: 40px 24px; padding: 40px; background: linear-gradient(180deg, #F5EADC, #FFF8EE); min-height: 100vh; justify-content:center; }
.mob-frame { width:375px; height:812px; background:#fff; border-radius:32px; border:9px solid #20211F; overflow:hidden; box-shadow: 0 30px 60px -20px rgba(52,36,29,.4); position:relative; display:flex; flex-direction:column; }
.mob-caption { text-align:center; margin-top:14px; font-family:'Archivo Black'; font-size:13px; color:var(--coffee); }
.mob-notch { height:12px; background:#20211F; margin: -1px auto 0; width:80px; border-radius:0 0 12px 12px; z-index:5; position:relative; }

/* mobile landing */
.mob-landing { background: var(--cream); flex:1; overflow:auto; padding-bottom:20px; }
.mob-landing-hdr { display:flex; justify-content:space-between; align-items:center; padding:14px 18px; }
.mob-landing-hero { padding:20px 18px 30px; }
.mob-landing-hero h1 { font-family:'Archivo Black'; font-size:32px; line-height:1.05; color:var(--coffee); }
.mob-landing-hero em { font-family:'Instrument Serif',serif; color:var(--tomato); font-style:italic; }
.mob-landing-hero p { font-size:14.5px; color:var(--muted); margin-top:12px; line-height:1.5; }
.mob-landing-hero button { background:var(--tomato); color:#FFF8EE; border:none; padding:14px; border-radius:12px; font-weight:700; margin-top:20px; width:100%; }
.mob-landing-mock { margin:20px 18px; background:#fff; border:1px solid var(--hair); border-radius:16px; padding:12px; box-shadow: 0 20px 40px -20px rgba(52,36,29,.25); }
.mob-landing-mock .dm { border:none; }
.mob-landing-mock .dm-body { grid-template-columns: 68px 1fr; min-height:220px; }
.mob-landing-mock .dm-side { padding:8px 4px; }
.mob-landing-mock .dm-item { padding:5px 6px; font-size:9px; }
.mob-landing-mock .dm-kpis { grid-template-columns:repeat(2,1fr); }

/* mobile dashboard */
.mob-dash { background:#F7F7F5; flex:1; overflow:auto; }
.mob-dash-hdr { background:#fff; padding:14px 16px; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #E1E2DD; }
.mob-dash-hdr-t { font-family:'Archivo Black'; font-size:17px; color:#20211F; }
.mob-dash-hdr-av { width:34px; height:34px; border-radius:50%; background:var(--tomato); color:#FFF8EE; display:grid; place-items:center; font-weight:700; font-size:13px; }
.mob-dash-kpis { display:grid; grid-template-columns: 1fr 1fr; gap:10px; padding:14px 16px; }
.mob-dash-panel { background:#fff; margin: 6px 16px; border:1px solid #E1E2DD; border-radius:12px; padding:14px; }
.mob-dash-tabs { display:flex; padding:10px 16px 0; gap:6px; }
.mob-dash-tabs span { padding:7px 12px; font-size:12px; border-radius:8px; background:#fff; border:1px solid #E1E2DD; color:#353631; }
.mob-dash-tabs span.on { background:#20211F; color:#fff; border-color:#20211F; }
.mob-dash-order { display:grid; grid-template-columns: 40px 1fr auto; align-items:center; padding:11px 14px; border-top:1px solid #F1F1EE; font-size:13px; background:#fff; }
.mob-dash-order-id { font-family:'Archivo Black'; color:#20211F; font-size:12px; }
.mob-dash-order-cli { color:#353631; }
.mob-tabbar { display:flex; background:#fff; border-top:1px solid #E1E2DD; padding:10px 0 12px; }
.mob-tab { flex:1; text-align:center; font-size:10.5px; color:#8A8C84; display:flex; flex-direction:column; align-items:center; gap:4px; }
.mob-tab-ico { width:22px; height:22px; border-radius:6px; background:#E1E2DD; }
.mob-tab.on { color:var(--tomato); font-weight:700; }
.mob-tab.on .mob-tab-ico { background:var(--tomato); }

/* mobile pdv */
.mob-pdv { background:#F7F7F5; flex:1; overflow:auto; }
.mob-pdv-hdr { background:#fff; padding:14px 16px; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #E1E2DD; }
.mob-pdv-search { padding:10px 16px; }
.mob-pdv-search-i { background:#fff; border:1px solid #E1E2DD; padding:10px 14px; border-radius:10px; font-size:13px; color:#8A8C84; }
.mob-pdv-cats { display:flex; padding:0 16px 8px; gap:6px; overflow-x:auto; }
.mob-pdv-cats span { padding:8px 14px; font-size:12.5px; border-radius:999px; background:#fff; border:1px solid #E1E2DD; white-space:nowrap; color:#353631; }
.mob-pdv-cats span.on { background:var(--tomato); color:#fff; border-color:var(--tomato); font-weight:700; }
.mob-pdv-grid { display:grid; grid-template-columns: 1fr 1fr; gap:10px; padding:0 16px; }
.mob-pdv-cart-fab { position:absolute; left:16px; right:16px; bottom:12px; background:#20211F; color:#fff; padding:14px 16px; border-radius:14px; display:flex; justify-content:space-between; align-items:center; }
.mob-pdv-cart-fab-c { background:var(--tomato); color:#fff; width:26px; height:26px; border-radius:50%; display:grid; place-items:center; font-size:12px; font-weight:800; }
.mob-pdv-cart-fab-t { font-family:'Archivo Black'; font-size:15px; }

/* mobile pedido */
.mob-pedido { background:#FAFAF7; flex:1; overflow:auto; padding:20px; }
.mob-pedido-hdr { text-align:center; padding:16px 0; }
.mob-pedido-hdr h2 { font-family:'Archivo Black'; font-size:22px; color:#111; }
.mob-pedido-hdr p { font-size:13px; color:#666; margin-top:4px; }
.mob-pedido-steps { background:#fff; border-radius:14px; padding:20px 16px; margin: 14px 0; }
.mob-pedido-step { display:grid; grid-template-columns: 30px 1fr; gap:14px; padding:12px 0; position:relative; }
.mob-pedido-step-i { width:26px; height:26px; border-radius:50%; background:#EEE; color:#999; display:grid; place-items:center; font-size:12px; font-weight:700; z-index:2; }
.mob-pedido-step.done .mob-pedido-step-i { background:#2F7D5B; color:#fff; }
.mob-pedido-step.active .mob-pedido-step-i { background:#F0522D; color:#fff; }
.mob-pedido-step:not(:last-child):before { content:""; position:absolute; left:13px; top:32px; bottom:-14px; width:2px; background:#EEE; }
.mob-pedido-step.done:not(:last-child):before { background:#2F7D5B; }
.mob-pedido-step-t { font-size:14px; font-weight:700; color:#111; }
.mob-pedido-step-h { font-size:12px; color:#666; margin-top:2px; }
.mob-pedido-tot { background:#23303A; color:#fff; padding:18px; border-radius:14px; display:flex; justify-content:space-between; align-items:center; }
.mob-pedido-tot-t { font-family:'Archivo Black'; font-size:22px; }

/* mobile motoboy */
.mob-moto { background:#111; color:#fff; flex:1; overflow:auto; display:flex; flex-direction:column; }
.mob-moto-hdr { padding:16px; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #333; }
.mob-moto-hdr h2 { font-family:'Archivo Black'; font-size:18px; }
.mob-moto-online { color:#3EE07F; font-size:12px; font-weight:700; display:flex; align-items:center; gap:6px; }
.mob-moto-online span { width:8px; height:8px; border-radius:50%; background:#3EE07F; }
.mob-moto-card { margin:16px; background:#1D1D1D; border:1px solid #333; border-radius:14px; padding:18px; }
.mob-moto-card-tag { background:#F0522D; color:#fff; padding:5px 10px; border-radius:6px; font-size:11px; font-weight:700; display:inline-block; }
.mob-moto-card-o { font-family:'Archivo Black'; font-size:22px; margin:12px 0 4px; }
.mob-moto-card-a { font-size:14px; color:#CCC; line-height:1.5; }
.mob-moto-card-meta { display:flex; gap:14px; margin-top:14px; font-size:12px; color:#999; }
.mob-moto-btn { background:#3EE07F; color:#0A2418; border:none; padding:18px; font-family:'Archivo Black'; font-size:18px; border-radius:14px; margin:16px; }
.mob-moto-btn-2 { background:transparent; color:#fff; border:1.5px solid #444; padding:14px; border-radius:14px; margin:0 16px 16px; font-weight:600; font-size:14px; }

/* mobile cardapio */
.mob-cardapio { background:#FAFAF7; flex:1; overflow:auto; padding-bottom:80px; }
`;
