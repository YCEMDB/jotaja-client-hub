import { createFileRoute } from "@tanstack/react-router";
import { PROTO_CSS } from "@/dev-proto/proto-tokens";

export const Route = createFileRoute("/dev/proto/dashboard")({
  component: ProtoDashboard,
  head: () => ({
    meta: [{ title: "Proto · Dashboard Mesivo (dev)" }, { name: "robots", content: "noindex" }],
  }),
});

const NAV = [
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
        <aside className="app-side">
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
          <div className="app-topbar">
            <div className="app-search">🔎 Buscar pedido, cliente, produto…</div>
            <div className="app-topbar-actions">
              <div className="app-icon-btn">🔔</div>
              <div className="app-icon-btn">?</div>
              <div className="app-user">
                <div className="app-user-av">A</div>Ana
              </div>
            </div>
          </div>

          <div className="app-content">
            <div className="app-page-head">
              <div>
                <div className="app-page-h">Bom dia, Ana ☕</div>
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
                  {[
                    ["Salão", "42%", "var(--tomato)"],
                    ["Delivery", "34%", "var(--mango)"],
                    ["Balcão", "18%", "var(--leaf)"],
                    ["Retirada", "6%", "var(--coffee)"],
                  ].map(([k, v, c]) => (
                    <div
                      key={k}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: 13,
                        alignItems: "center",
                      }}
                    >
                      <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: 3,
                            background: c as string,
                          }}
                        />
                        {k}
                      </span>
                      <strong style={{ color: "#20211F" }}>{v}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ marginTop: 16 }} className="app-two-col">
              <div className="app-panel">
                <div className="app-panel-h">
                  <div className="app-panel-t">Pedidos recentes</div>
                  <span style={{ fontSize: 12, color: "#696B64" }}>Atualizado agora</span>
                </div>
                <div>
                  {[
                    ["#0821", "Mesa 07 · Salão", "R$ 148,00", "Preparando", "prep"],
                    ["#0822", "Rua das Flores, 240", "R$ 96,50", "Saiu p/ entrega", "saiu"],
                    ["#0823", "Balcão", "R$ 42,00", "Entregue", "ok"],
                    ["#0824", "Mesa 12 · Salão", "R$ 218,90", "Novo", "novo"],
                    ["#0825", "Delivery · iFood", "R$ 74,00", "Preparando", "prep"],
                    ["#0826", "Retirada · João", "R$ 39,90", "Novo", "novo"],
                  ].map(([id, cli, val, st, cls]) => (
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
                    }}
                  >
                    Operando
                  </span>
                </div>
                <div className="app-caixa-list">
                  <div className="app-caixa-item">
                    <span>PagBank · Pix</span>
                    <strong style={{ color: "#20211F" }}>R$ 1.284,00</strong>
                    <span style={{ fontSize: 11, color: "var(--leaf)" }}>✓ conciliado</span>
                  </div>
                  <div className="app-caixa-item">
                    <span>Mercado Pago</span>
                    <strong style={{ color: "#20211F" }}>R$ 986,50</strong>
                    <span style={{ fontSize: 11, color: "var(--leaf)" }}>✓ conciliado</span>
                  </div>
                  <div className="app-caixa-item">
                    <span>Dinheiro</span>
                    <strong style={{ color: "#20211F" }}>R$ 342,00</strong>
                    <span style={{ fontSize: 11, color: "#8B5A00" }}>contar</span>
                  </div>
                  <div className="app-caixa-item" style={{ background: "#20211F", color: "#fff" }}>
                    <span style={{ fontFamily: "'Archivo Black'" }}>Total</span>
                    <strong style={{ color: "#fff", fontFamily: "'Archivo Black'", fontSize: 18 }}>
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
        </div>
      </div>
    </div>
  );
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
        <g key={i}>
          <rect
            x={20 + i * 38}
            y={200 - h * 1.4}
            width="24"
            height={h * 1.4}
            rx="4"
            fill="url(#bar-g)"
            opacity={i === 11 ? 1 : 0.85}
          />
        </g>
      ))}
      {["08h", "10h", "12h", "14h", "16h", "18h", "20h", "22h"].map((l, i) => (
        <text key={l} x={20 + i * 60} y="216" fontSize="10" fill="#8A8C84">
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
    <svg viewBox="0 0 200 200" style={{ height: 160, display: "block", margin: "0 auto" }}>
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
        fontFamily="Archivo Black"
        fontSize="18"
        fill="#20211F"
      >
        78
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle" fontSize="10" fill="#8A8C84">
        pedidos
      </text>
    </svg>
  );
}
