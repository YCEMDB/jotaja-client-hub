import { createFileRoute } from "@tanstack/react-router";
import { PROTO_CSS } from "@/dev-proto/proto-tokens";
import { IconBell, IconCheck, IconArrow, IconMenu } from "@/dev-proto/proto-icons";

export const Route = createFileRoute("/dev/proto/landing")({
  component: ProtoLanding,
  head: () => ({
    meta: [{ title: "Proto · Landing Mesivo (dev)" }, { name: "robots", content: "noindex" }],
  }),
});

function ProtoLanding() {
  return (
    <div data-theme="mkt-proto" className="mkt-root">
      <style dangerouslySetInnerHTML={{ __html: PROTO_CSS }} />

      {/* Header */}
      <header className="mkt-header">
        <div className="mkt-container mkt-header-inner">
          <div className="flex items-center gap-2">
            <MesivoMark />
            <span className="mkt-brand">Mesivo</span>
          </div>
          <nav className="mkt-nav">
            <a>Produto</a>
            <a>Segmentos</a>
            <a>Preços</a>
            <a>Blog</a>
            <a>Contato</a>
          </nav>
          <div className="mkt-header-cta flex items-center gap-3">
            <a className="mkt-link">Entrar</a>
            <button className="mkt-btn mkt-btn-primary">Criar conta grátis</button>
          </div>
          <button className="mkt-menu-btn" aria-label="Abrir menu">
            <IconMenu size={20} />
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="mkt-hero">
        <div className="mkt-container mkt-hero-grid">
          <div>
            <span className="mkt-eyebrow">
              <span className="mkt-dot" /> Feito para a rotina real de restaurantes
            </span>
            <h1 className="mkt-h1">
              O sistema que <em>conecta</em> salão,
              <br />
              cozinha e entrega
              <span className="mkt-accent">.</span>
            </h1>
            <p className="mkt-sub">
              Mesivo unifica pedidos, PDV, KDS e cardápio digital em uma plataforma calorosa, leve e
              feita pra restaurante de verdade. Do balcão à moto.
            </p>
            <div className="mkt-cta-row">
              <button className="mkt-btn mkt-btn-primary mkt-btn-lg">
                Começar agora <IconArrow size={16} />
              </button>
              <button className="mkt-btn mkt-btn-ghost mkt-btn-lg">Ver demonstração</button>
            </div>
            <div className="mkt-benefits">
              <span>14 dias grátis</span>
              <span>Sem cartão</span>
              <span>Migração assistida</span>
            </div>
          </div>

          {/* Hero mockup composition */}
          <div className="mkt-hero-stage">
            <FlowLines />
            <div className="mkt-mockup-dashboard">
              <DashMockup />
            </div>
            <div className="mkt-mockup-phone">
              <PhoneMenuMockup />
            </div>
            <div className="mkt-badge-float mkt-badge-mango">
              <IconBell size={13} style={{ marginRight: 6 }} /> Novo pedido · Mesa 07
            </div>
            <div className="mkt-badge-float mkt-badge-leaf">
              <IconCheck size={13} style={{ marginRight: 6 }} /> Entregue em 24 min
            </div>
          </div>
        </div>
      </section>

      {/* Marquee ops */}
      <section className="mkt-marquee-wrap">
        <div className="mkt-marquee">
          <div className="mkt-marquee-track">
            {Array.from({ length: 2 }).map((_, k) => (
              <div key={k} className="flex gap-10 pr-10">
                {[
                  "Salão",
                  "Cozinha",
                  "Balcão",
                  "Delivery",
                  "Retirada",
                  "Mesas",
                  "Comandas",
                  "Estoque",
                  "Fiscal",
                  "Motoboy",
                ].map((w) => (
                  <span key={w} className="mkt-marquee-item">
                    <span className="mkt-marquee-dot" /> {w}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Problema → Solução */}
      <section className="mkt-section">
        <div className="mkt-container">
          <div className="mkt-two-col">
            <div>
              <h3 className="mkt-eyebrow-alt">O problema</h3>
              <h2 className="mkt-h2">Sua operação está fragmentada em 5 apps.</h2>
              <ul className="mkt-bullets">
                <li>Comanda de papel se perde entre o salão e a cozinha</li>
                <li>Cardápio digital vive fora do PDV</li>
                <li>Motoboy sem rota clara e sem previsão</li>
                <li>Caixa fecha no escuro, sem conciliação real</li>
              </ul>
            </div>
            <div className="mkt-solution-card">
              <div className="mkt-solution-head">
                <span className="mkt-tag">A solução</span>
                <span className="mkt-tag mkt-tag-leaf">Uma só plataforma</span>
              </div>
              <FlowDiagram />
            </div>
          </div>
        </div>
      </section>

      {/* Feature grid */}
      <section className="mkt-section mkt-section-cream">
        <div className="mkt-container">
          <h2 className="mkt-h2 mkt-center">Tudo o que sua operação precisa, sem cola de apps.</h2>
          <p className="mkt-sub mkt-center mkt-max-2xl">
            Mesivo foi desenhada pensando no fluxo real do restaurante brasileiro — do balcão ao
            motoboy.
          </p>

          <div className="mkt-feature-bento">
            <div className="mkt-feature-card mkt-feature-lg">
              <div className="mkt-feature-tag">PDV</div>
              <h3 className="mkt-feature-title">
                Balcão veloz, atalhos de teclado, split de pagamento
              </h3>
              <div className="mkt-pdv-preview">
                <PdvMiniMockup />
              </div>
            </div>
            <div className="mkt-feature-card mkt-feature-coral">
              <div className="mkt-feature-tag mkt-feature-tag-inv">Cardápio</div>
              <h3 className="mkt-feature-title-inv">QR na mesa, WhatsApp e link direto</h3>
              <p className="mkt-feature-body-inv">
                Cardápio próprio do restaurante, Mesivo por trás.
              </p>
            </div>
            <div className="mkt-feature-card">
              <div className="mkt-feature-tag mkt-feature-tag-leaf">KDS</div>
              <h3 className="mkt-feature-title">Cozinha em tela grande, alto contraste</h3>
              <p className="mkt-feature-body">
                Modo tela cheia com fila por prioridade e SLA visual.
              </p>
            </div>
            <div className="mkt-feature-card">
              <div className="mkt-feature-tag mkt-feature-tag-mango">Motoboy</div>
              <h3 className="mkt-feature-title">App do entregador com rota e status</h3>
              <p className="mkt-feature-body">Interface externa, botões grandes, sem decoração.</p>
            </div>
            <div className="mkt-feature-card mkt-feature-wide">
              <div className="mkt-feature-tag">Caixa & Financeiro</div>
              <h3 className="mkt-feature-title">
                Conciliação de PagBank e Mercado Pago em tempo real
              </h3>
              <p className="mkt-feature-body">
                Fechamento com trilha auditável, evento por evento.
              </p>
              <CaixaMini />
            </div>
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="mkt-cta-final">
        <div className="mkt-container mkt-cta-final-inner">
          <div>
            <h2 className="mkt-h2-inv">Pronto para tirar o papel da cozinha?</h2>
            <p className="mkt-sub-inv">14 dias grátis. Sem cartão. Migração assistida.</p>
          </div>
          <div className="flex gap-3">
            <button className="mkt-btn mkt-btn-primary mkt-btn-lg">Começar agora</button>
            <button className="mkt-btn mkt-btn-outline-inv mkt-btn-lg">Falar com vendas</button>
          </div>
        </div>
      </section>

      <footer className="mkt-footer">
        <div className="mkt-container mkt-footer-inner">
          <div className="flex items-center gap-2 opacity-90">
            <MesivoMark small /> <span>Mesivo · 2026</span>
          </div>
          <div className="mkt-footer-links">
            <a>Termos</a>
            <a>Privacidade</a>
            <a>Segurança</a>
            <a>Status</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ---------- inline SVG assets ---------- */
export function MesivoMark({ small = false }: { small?: boolean }) {
  const s = small ? 22 : 28;
  return (
    <svg width={s} height={s} viewBox="0 0 32 32" fill="none" aria-label="Mesivo">
      <rect x="1" y="1" width="30" height="30" rx="9" fill="#F0522D" />
      <path
        d="M8 22V10l4 6 4-6v12M20 10v12M20 10c3 0 5 2 5 5s-2 5-5 5"
        stroke="#FFF8EE"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FlowLines() {
  return (
    <svg className="mkt-flowlines" viewBox="0 0 600 500" fill="none" aria-hidden>
      <path
        d="M20 60 C 180 60 220 220 380 220"
        stroke="#F0522D"
        strokeWidth="1.5"
        strokeDasharray="4 6"
        opacity="0.5"
      />
      <path
        d="M40 460 C 200 460 260 300 420 300"
        stroke="#FFB82E"
        strokeWidth="1.5"
        strokeDasharray="4 6"
        opacity="0.6"
      />
      <circle cx="20" cy="60" r="4" fill="#F0522D" />
      <circle cx="40" cy="460" r="4" fill="#FFB82E" />
    </svg>
  );
}

function DashMockup() {
  return (
    <div className="dm">
      <div className="dm-top">
        <div className="dm-dots">
          <i />
          <i />
          <i />
        </div>
        <div className="dm-url">admin.mesivo.app · Painel</div>
      </div>
      <div className="dm-body">
        <aside className="dm-side">
          <div className="dm-logo">M</div>
          {["Início", "Pedidos", "PDV", "Mesas", "Cardápio", "Caixa", "Relatórios"].map((x, i) => (
            <div key={x} className={"dm-item " + (i === 1 ? "on" : "")}>
              {x}
            </div>
          ))}
        </aside>
        <main className="dm-main">
          <div className="dm-header">
            <div>
              <div className="dm-eyebrow">Hoje · Terça</div>
              <div className="dm-title">Pedidos ao vivo</div>
            </div>
            <div className="dm-tabs">
              <span className="on">Todos</span>
              <span>Salão</span>
              <span>Delivery</span>
            </div>
          </div>
          <div className="dm-kpis">
            <Kpi label="Faturamento" value="R$ 4.820" delta="+18%" tone="leaf" />
            <Kpi label="Ticket médio" value="R$ 62,10" delta="+4%" tone="mango" />
            <Kpi label="Pedidos" value="78" delta="+12" tone="coral" />
            <Kpi label="Tempo médio" value="21 min" delta="-3 min" tone="leaf" />
          </div>
          <div className="dm-orders">
            {(
              [
                ["#0821", "Mesa 07", "Preparando", "coral"],
                ["#0822", "Delivery · Rua das Flores", "Saiu", "mango"],
                ["#0823", "Balcão", "Entregue", "leaf"],
                ["#0824", "Mesa 12", "Novo", "coffee"],
              ] as const
            ).map(([id, o, s, tone]) => (
              <div key={id} className="dm-order">
                <div className="dm-order-id">{id}</div>
                <div className="dm-order-orig">{o}</div>
                <div className={"dm-order-status s-" + tone}>{s}</div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  delta,
  tone,
}: {
  label: string;
  value: string;
  delta: string;
  tone: string;
}) {
  return (
    <div className="dm-kpi">
      <div className="dm-kpi-l">{label}</div>
      <div className="dm-kpi-v">{value}</div>
      <div className={"dm-kpi-d d-" + tone}>{delta}</div>
    </div>
  );
}

function PhoneMenuMockup() {
  return (
    <div className="pm">
      <div className="pm-notch" />
      <div className="pm-cover" />
      <div className="pm-brand">
        <div className="pm-logo">B</div>
        <div>
          <div className="pm-name">Burger da Praça</div>
          <div className="pm-open">
            <span /> Aberto agora · 25–35 min
          </div>
        </div>
      </div>
      <div className="pm-cats">
        {["Mais pedidos", "Burgers", "Bebidas", "Sobremesas"].map((c, i) => (
          <span key={c} className={i === 1 ? "on" : ""}>
            {c}
          </span>
        ))}
      </div>
      <div className="pm-items">
        {(
          [
            ["Smash duplo", "R$ 34,90"],
            ["Cheddar bacon", "R$ 38,50"],
            ["Veggie", "R$ 29,00"],
          ] as const
        ).map(([n, p]) => (
          <div key={n} className="pm-item">
            <div className="pm-thumb" />
            <div>
              <div className="pm-title">{n}</div>
              <div className="pm-desc">Pão brioche · molho da casa</div>
            </div>
            <div className="pm-price">{p}</div>
          </div>
        ))}
      </div>
      <div className="pm-cta">Ver carrinho · 1 item</div>
    </div>
  );
}

function FlowDiagram() {
  const nodes: [string, string][] = [
    ["Salão", "#F0522D"],
    ["Cozinha", "#FFB82E"],
    ["Balcão", "#2F7D5B"],
    ["Delivery", "#34241D"],
    ["Motoboy", "#F0522D"],
    ["Cliente", "#FFB82E"],
  ];
  const positions: [number, number][] = [
    [90, 60],
    [260, 60],
    [430, 60],
    [90, 200],
    [260, 200],
    [430, 200],
  ];
  return (
    <svg viewBox="0 0 520 260" width="100%" aria-label="Fluxo Mesivo">
      <defs>
        <marker
          id="arr"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto"
        >
          <path d="M0,0 L10,5 L0,10 z" fill="#34241D" />
        </marker>
      </defs>
      {(
        [
          [90, 60, 260, 60],
          [260, 60, 430, 60],
          [90, 200, 260, 200],
          [260, 200, 430, 200],
          [90, 60, 90, 200],
          [430, 60, 430, 200],
        ] as const
      ).map(([x1, y1, x2, y2], i) => (
        <line
          key={i}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke="#34241D"
          strokeWidth="1.2"
          strokeDasharray="3 5"
          markerEnd="url(#arr)"
          opacity="0.5"
        />
      ))}
      {nodes.map(([label, c], i) => {
        const [cx, cy] = positions[i];
        return (
          <g key={label}>
            <circle cx={cx} cy={cy} r="34" fill="#FFFDFA" stroke={c} strokeWidth="2.2" />
            <text
              x={cx}
              y={cy + 4}
              textAnchor="middle"
              fontSize="12"
              fill="#34241D"
              fontWeight="600"
            >
              {label}
            </text>
          </g>
        );
      })}
      <circle cx="260" cy="130" r="46" fill="#F0522D" />
      <text x="260" y="128" textAnchor="middle" fill="#FFF8EE" fontSize="13" fontWeight="700">
        Mesivo
      </text>
      <text x="260" y="144" textAnchor="middle" fill="#FFE7D5" fontSize="10">
        core
      </text>
    </svg>
  );
}

function PdvMiniMockup() {
  return (
    <div className="pdvm">
      <div className="pdvm-cats">
        {["Hambúrgueres", "Bebidas", "Sobremesas"].map((c, i) => (
          <span key={c} className={i === 0 ? "on" : ""}>
            {c}
          </span>
        ))}
      </div>
      <div className="pdvm-grid">
        {["Smash", "Cheddar", "Veggie", "Bacon", "Duplo", "Kids"].map((n) => (
          <div key={n} className="pdvm-prod">
            <div className="pdvm-thumb" />
            <div className="pdvm-name">{n}</div>
            <div className="pdvm-price">R$ 29,90</div>
          </div>
        ))}
      </div>
      <div className="pdvm-cart">
        <div className="pdvm-cart-row">
          <span>1× Smash</span>
          <span>R$ 29,90</span>
        </div>
        <div className="pdvm-cart-row">
          <span>1× Coca lata</span>
          <span>R$ 7,00</span>
        </div>
        <div className="pdvm-cart-total">
          <span>Total</span>
          <strong>R$ 36,90</strong>
        </div>
        <button className="pdvm-cta">Finalizar</button>
      </div>
    </div>
  );
}

function CaixaMini() {
  return (
    <div className="cxm">
      <div className="cxm-row">
        <span>PagBank Pix</span>
        <strong>R$ 1.284,00</strong>
        <span className="cxm-ok">conciliado</span>
      </div>
      <div className="cxm-row">
        <span>Mercado Pago</span>
        <strong>R$ 986,50</strong>
        <span className="cxm-ok">conciliado</span>
      </div>
      <div className="cxm-row">
        <span>Dinheiro</span>
        <strong>R$ 342,00</strong>
        <span className="cxm-warn">contar</span>
      </div>
    </div>
  );
}
