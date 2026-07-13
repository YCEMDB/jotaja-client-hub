import { createFileRoute } from "@tanstack/react-router";
import { PROTO_CSS } from "@/dev-proto/proto-tokens";
import { IconBell, IconHelp, IconMenu, IconSearch } from "@/dev-proto/proto-icons";

export const Route = createFileRoute("/dev/proto/dashboard")({
  component: ProtoDashboard,
  head: () => ({
    meta: [{ title: "Proto · Dashboard Mesivo (dev)" }, { name: "robots", content: "noindex" }],
  }),
});

const NAV: [string, string][] = [
  ["Início", "on"],
  ["Pedidos", ""],
  ["PDV", ""],
  ["Mesas", ""],
  ["Cardápio", ""],
  ["Clientes", ""],
  ["Estoque", ""],
  ["Caixa", ""],
  ["Relatórios", ""],
  ["Configurações", ""],
];

function ProtoDashboard() {
  return (
    <div data-theme="app-proto">
      <style dangerouslySetInnerHTML={{ __html: PROTO_CSS }} />
      <div className="app-shell">
        {/* Desktop sidebar */}
        <aside className="app-side" aria-label="Navegação lateral">
          <div className="app-side-brand">
            <div className="app-side-brand-mark">M</div>
            <div>
              <div className="app-side-brand-name">Mesivo</div>
              <div style={{ fontSize: 11, color: "#8A8C84" }}>Burger da Praça</div>
            </div>
          </div>
          <div className="app-side-group">Operação</div>
          {NAV.slice(0, 5).map(([n, on]) => (
            <div key={n} className={"app-side-item " + on}>
              <span className="app-side-ico" />
              {n}
            </div>
          ))}
          <div className="app-side-group">Gestão</div>
          {NAV.slice(5).map(([n]) => (
            <div key={n} className="app-side-item">
              <span className="app-side-ico" />
              {n}
            </div>
          ))}
        </aside>

        <div className="app-main">
          {/* Desktop topbar */}
          <div className="app-topbar">
            <div className="app-search">
              <IconSearch size={16} style={{ marginRight: 8, verticalAlign: -3 }} />
              Buscar pedido, cliente, produto…
            </div>
            <div className="app-topbar-actions">
              <button className="app-icon-btn" aria-label="Notificações">
                <IconBell size={18} />
              </button>
              <button className="app-icon-btn" aria-label="Ajuda">
                <IconHelp size={18} />
              </button>
              <div className="app-user">
                <div className="app-user-av">A</div>Ana
              </div>
            </div>
          </div>

          {/* Mobile topbar — visible below 768px only (CSS-gated) */}
          <header className="app-mob-topbar" aria-label="Barra superior móvel">
            <button className="app-mob-topbar-icon" aria-label="Abrir menu">
              <IconMenu size={20} />
            </button>
            <div className="app-mob-topbar-l">
              <div>
                <div className="app-mob-topbar-title">Início</div>
                <div className="app-mob-topbar-sub">Burger da Praça</div>
              </div>
            </div>
            <div className="app-mob-topbar-actions">
              <button className="app-mob-topbar-icon" aria-label="Notificações">
                <IconBell size={18} />
              </button>
              <button className="app-mob-topbar-icon" aria-label="Perfil">
                <span
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: "50%",
                    background: "var(--tomato)",
                    color: "#fff",
                    display: "grid",
                    placeItems: "center",
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  A
                </span>
              </button>
            </div>
          </header>

          {/* Inline demo badge — appears just under the topbar so it never covers charts or CTAs */}
          <div className="demo-badge-slot">
            <span className="demo-badge">Dados demonstrativos</span>
          </div>

          <div className="app-content">
            <div className="app-page-head">
              <div>
                <div className="app-page-h">Bom dia, Ana</div>
                <div className="app-page-sub">Terça, 14 de janeiro · Turno aberto às 08:12</div>
              </div>
              <div className="flex gap-2">
                <button className="app-btn-ghost">Exportar</button>
                <button className="app-btn">Novo pedido</button>
              </div>
            </div>

            <div className="app-kpi-grid">
              <KpiCard
                label="Faturamento hoje"
                value="R$ 4.820"
                delta="+18% vs ontem"
                tone="leaf"
                spark="up"
              />
              <KpiCard
                label="Ticket médio"
                value="R$ 62,10"
                delta="+4% na semana"
                tone="mango"
                spark="flat"
              />
              <KpiCard label="Pedidos" value="78" delta="+12 abertos" tone="coral" spark="up" />
              <KpiCard
                label="Tempo médio"
                value="21 min"
                delta="-3 min meta OK"
                tone="leaf"
                spark="down"
              />
            </div>

            <div className="app-two-col">
              <div className="app-panel">
                <div className="app-panel-h">
                  <div className="app-panel-t">Faturamento por hora</div>
                  <div className="app-filters">
                    <span className="app-chip on">Hoje</span>
                    <span className="app-chip">7 dias</span>
                    <span className="app-chip">30 dias</span>
                  </div>
                </div>
                <FaturamentoChart />
              </div>

              <div className="app-panel">
                <div className="app-panel-h">
                  <div className="app-panel-t">Distribuição por canal</div>
                </div>
                <DonutChart />
                <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
                  {(
                    [
                      ["Salão", "42%", "var(--tomato)"],
                      ["Delivery", "34%", "var(--mango)"],
                      ["Balcão", "18%", "var(--leaf)"],
                      ["Retirada", "6%", "var(--coffee)"],
                    ] as const
                  ).map(([k, v, c]) => (
                    <div
                      key={k}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: 13,
                        alignItems: "center",
                        fontFamily: "var(--mono)",
                      }}
                    >
                      <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: 3,
                            background: c,
                          }}
                        />
                        {k}
                      </span>
                      <strong style={{ color: "var(--ink)", fontWeight: 800 }}>{v}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ marginTop: 16 }} className="app-two-col">
              <div className="app-panel">
                <div className="app-panel-h">
                  <div className="app-panel-t">Pedidos recentes</div>
                  <span
                    style={{
                      fontSize: 12,
                      color: "var(--stone)",
                      fontFamily: "var(--mono)",
                    }}
                  >
                    Atualizado agora
                  </span>
                </div>
                <div>
                  {(
                    [
                      ["#0821", "Mesa 07 · Salão", "R$ 148,00", "Preparando", "prep"],
                      ["#0822", "Rua das Flores, 240", "R$ 96,50", "Saiu p/ entrega", "saiu"],
                      ["#0823", "Balcão", "R$ 42,00", "Entregue", "ok"],
                      ["#0824", "Mesa 12 · Salão", "R$ 218,90", "Novo", "novo"],
                      ["#0825", "Delivery · iFood", "R$ 74,00", "Preparando", "prep"],
                      ["#0826", "Retirada · João", "R$ 39,90", "Novo", "novo"],
                    ] as const
                  ).map(([id, cli, val, st, cls]) => (
                    <div key={id} className="app-order-row">
                      <span className="app-order-id">{id}</span>
                      <span className="app-order-cli">{cli}</span>
                      <span className={"app-status st-" + cls}>{st}</span>
                      <span className="app-order-val">{val}</span>
                      <button
                        className="app-btn-ghost"
                        style={{ padding: "5px 10px", fontSize: 12 }}
                      >
                        Abrir
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="app-panel">
                <div className="app-panel-h">
                  <div className="app-panel-t">Caixa aberto</div>
                  <span
                    style={{
                      fontSize: 11,
                      color: "var(--leaf)",
                      background: "var(--leaf-soft)",
                      padding: "3px 8px",
                      borderRadius: 999,
                      fontWeight: 700,
                      fontFamily: "var(--mono)",
                    }}
                  >
                    Operando
                  </span>
                </div>
                <div className="app-caixa-list">
                  <CaixaRow label="PagBank · Pix" value="R$ 1.284,00" ok />
                  <CaixaRow label="Mercado Pago" value="R$ 986,50" ok />
                  <CaixaRow label="Dinheiro" value="R$ 342,00" ok={false} />
                  <div
                    className="app-caixa-item"
                    style={{ background: "var(--ink)", color: "#fff" }}
                  >
                    <span style={{ fontFamily: "'Archivo Black'" }}>Total</span>
                    <strong
                      style={{
                        color: "#fff",
                        fontFamily: "var(--mono)",
                        fontWeight: 800,
                        fontSize: 18,
                      }}
                    >
                      R$ 2.612,50
                    </strong>
                    <span />
                  </div>
                </div>
                <div style={{ marginTop: 14, display: "flex", gap: 8 }}>
                  <button className="app-btn-ghost" style={{ flex: 1 }}>
                    Sangria
                  </button>
                  <button className="app-btn" style={{ flex: 1 }}>
                    Fechar caixa
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile bottom nav — visible below 768px only */}
          <nav className="app-bottom-nav" aria-label="Navegação inferior">
            <div className="app-bottom-nav-inner">
              <BottomNavItem label="Início" icon="home" on />
              <BottomNavItem label="Pedidos" icon="orders" />
              <BottomNavItem label="PDV" icon="pdv" />
              <BottomNavItem label="Mesas" icon="tables" />
              <BottomNavItem label="Menu" icon="more" />
            </div>
          </nav>
        </div>
      </div>

      <span className="demo-badge demo-floating" aria-hidden>
        Dados demonstrativos
      </span>
    </div>
  );
}

function CaixaRow({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <div className="app-caixa-item">
      <span>{label}</span>
      <strong style={{ color: "var(--ink)", fontFamily: "var(--mono)", fontWeight: 800 }}>
        {value}
      </strong>
      <span
        style={{
          fontSize: 11,
          color: ok ? "var(--leaf)" : "#8B5A00",
          fontFamily: "var(--mono)",
          fontWeight: 700,
        }}
      >
        {ok ? "✓ conciliado" : "contar"}
      </span>
    </div>
  );
}

function BottomNavItem({
  label,
  icon,
  on = false,
}: {
  label: string;
  icon: "home" | "orders" | "pdv" | "tables" | "more";
  on?: boolean;
}) {
  return (
    <button
      className={"app-bottom-nav-item" + (on ? " on" : "")}
      aria-current={on ? "page" : undefined}
    >
      <NavIcon name={icon} />
      {label}
    </button>
  );
}

function NavIcon({ name }: { name: "home" | "orders" | "pdv" | "tables" | "more" }) {
  const stroke = "currentColor";
  const w = 2;
  switch (name) {
    case "home":
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1v-9.5Z"
            stroke={stroke}
            strokeWidth={w}
            strokeLinejoin="round"
          />
        </svg>
      );
    case "orders":
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden>
          <rect x="4" y="4" width="16" height="16" rx="3" stroke={stroke} strokeWidth={w} />
          <path d="M8 9h8M8 13h8M8 17h5" stroke={stroke} strokeWidth={w} strokeLinecap="round" />
        </svg>
      );
    case "pdv":
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden>
          <rect x="3" y="6" width="18" height="12" rx="2" stroke={stroke} strokeWidth={w} />
          <path d="M7 10h10M7 14h6" stroke={stroke} strokeWidth={w} strokeLinecap="round" />
        </svg>
      );
    case "tables":
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden>
          <rect x="3" y="8" width="18" height="4" rx="1" stroke={stroke} strokeWidth={w} />
          <path
            d="M6 12v6M18 12v6M9 12v3M15 12v3"
            stroke={stroke}
            strokeWidth={w}
            strokeLinecap="round"
          />
        </svg>
      );
    case "more":
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M4 7h16M4 12h16M4 17h16" stroke={stroke} strokeWidth={w} strokeLinecap="round" />
        </svg>
      );
  }
}

function KpiCard({
  label,
  value,
  delta,
  tone,
  spark,
}: {
  label: string;
  value: string;
  delta: string;
  tone: string;
  spark: string;
}) {
  return (
    <div className="app-kpi">
      <div className="app-kpi-l">{label}</div>
      <div className="app-kpi-v">{value}</div>
      <div className={"app-kpi-d d-" + tone}>{delta}</div>
      <svg viewBox="0 0 200 40" className="app-kpi-spark" preserveAspectRatio="none">
        <path
          d={
            spark === "up"
              ? "M0 32 L30 26 L60 28 L90 20 L120 18 L150 10 L180 12 L200 6"
              : spark === "down"
                ? "M0 8 L30 14 L60 12 L90 20 L120 22 L150 26 L180 30 L200 34"
                : "M0 20 L30 18 L60 22 L90 20 L120 24 L150 18 L180 22 L200 20"
          }
          fill="none"
          stroke={tone === "leaf" ? "#2F7D5B" : tone === "mango" ? "#FFB82E" : "#F0522D"}
          strokeWidth="2"
        />
      </svg>
    </div>
  );
}

function FaturamentoChart() {
  const bars = [30, 45, 38, 62, 78, 55, 90, 105, 88, 72, 95, 120];
  return (
    <svg viewBox="0 0 480 220" className="app-chart" preserveAspectRatio="none">
      <defs>
        <linearGradient id="bar-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F0522D" />
          <stop offset="1" stopColor="#FFB82E" />
        </linearGradient>
      </defs>
      {[0, 1, 2, 3].map((i) => (
        <line
          key={i}
          x1="0"
          x2="480"
          y1={40 + i * 50}
          y2={40 + i * 50}
          stroke="#F1F1EE"
          strokeDasharray="3 4"
        />
      ))}
      {bars.map((h, i) => (
        <rect
          key={i}
          x={20 + i * 38}
          y={200 - h * 1.4}
          width="24"
          height={h * 1.4}
          rx="4"
          fill="url(#bar-g)"
          opacity={i === 11 ? 1 : 0.85}
        />
      ))}
      {["08h", "10h", "12h", "14h", "16h", "18h", "20h", "22h"].map((l, i) => (
        <text key={l} x={20 + i * 60} y="216" fontSize="10" fill="#8A8C84" fontFamily="Manrope">
          {l}
        </text>
      ))}
    </svg>
  );
}

function DonutChart() {
  const seg = [
    { p: 0.42, c: "#F0522D" },
    { p: 0.34, c: "#FFB82E" },
    { p: 0.18, c: "#2F7D5B" },
    { p: 0.06, c: "#34241D" },
  ];
  let acc = 0;
  const r = 55;
  const cx = 100;
  const cy = 100;
  return (
    <svg
      viewBox="0 0 200 200"
      style={{ height: 160, display: "block", margin: "0 auto" }}
      aria-label="Distribuição por canal"
    >
      {seg.map((s, i) => {
        const start = acc;
        acc += s.p;
        const a1 = start * 2 * Math.PI - Math.PI / 2;
        const a2 = acc * 2 * Math.PI - Math.PI / 2;
        const large = s.p > 0.5 ? 1 : 0;
        const x1 = cx + r * Math.cos(a1),
          y1 = cy + r * Math.sin(a1);
        const x2 = cx + r * Math.cos(a2),
          y2 = cy + r * Math.sin(a2);
        return (
          <path
            key={i}
            d={`M${cx} ${cy} L${x1} ${y1} A${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`}
            fill={s.c}
          />
        );
      })}
      <circle cx={cx} cy={cy} r="34" fill="#fff" />
      <text
        x={cx}
        y={cy - 2}
        textAnchor="middle"
        fontFamily="Manrope"
        fontWeight={800}
        fontSize="20"
        fill="#20211F"
      >
        78
      </text>
      <text
        x={cx}
        y={cy + 14}
        textAnchor="middle"
        fontSize="10"
        fill="#8A8C84"
        fontFamily="Manrope"
      >
        pedidos
      </text>
    </svg>
  );
}
