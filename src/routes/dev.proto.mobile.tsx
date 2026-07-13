import { createFileRoute } from "@tanstack/react-router";
import { PROTO_CSS } from "@/dev-proto/proto-tokens";
import {
  IconMenu,
  IconArrow,
  IconSearch,
  IconCheck,
  IconClock,
  IconMoney,
  IconPackage,
} from "@/dev-proto/proto-icons";

export const Route = createFileRoute("/dev/proto/mobile")({
  component: ProtoMobile,
  head: () => ({
    meta: [{ title: "Proto · Mobile Mesivo (dev)" }, { name: "robots", content: "noindex" }],
  }),
});

function ProtoMobile() {
  return (
    <div>
      <style dangerouslySetInnerHTML={{ __html: PROTO_CSS }} />
      <div className="mob-grid" data-theme="mkt-proto">
        <div>
          <div className="mob-frame">
            <MobLanding />
          </div>
          <div className="mob-caption">1. Landing · 375</div>
        </div>
        <div>
          <div className="mob-frame">
            <MobDashboard />
          </div>
          <div className="mob-caption">2. Dashboard · 375</div>
        </div>
        <div>
          <div className="mob-frame">
            <MobPdv />
          </div>
          <div className="mob-caption">3. PDV · 375</div>
        </div>
        <div>
          <div className="mob-frame">
            <MobCardapio />
          </div>
          <div className="mob-caption">4. Cardápio público · 375</div>
        </div>
        <div>
          <div className="mob-frame">
            <MobPedido />
          </div>
          <div className="mob-caption">5. Acompanhamento do pedido · 375</div>
        </div>
        <div>
          <div className="mob-frame">
            <MobMoto />
          </div>
          <div className="mob-caption">6. Motoboy · 375</div>
        </div>
      </div>
    </div>
  );
}

function MobLanding() {
  return (
    <div data-theme="mkt-proto" style={{ display: "flex", flexDirection: "column", flex: 1 }}>
      <div className="mob-notch" />
      <div className="mob-landing">
        <div className="mob-landing-hdr">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <svg width="24" height="24" viewBox="0 0 32 32">
              <rect x="1" y="1" width="30" height="30" rx="9" fill="#F0522D" />
              <path
                d="M8 22V10l4 6 4-6v12M20 10v12M20 10c3 0 5 2 5 5s-2 5-5 5"
                stroke="#FFF8EE"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span style={{ fontFamily: "'Archivo Black'", fontSize: 15 }}>Mesivo</span>
          </div>
          <IconMenu size={22} />
        </div>
        <div className="mob-landing-hero">
          <span className="mkt-eyebrow" style={{ fontSize: 11 }}>
            <span className="mkt-dot" /> Food-tech brasileira
          </span>
          <h1 style={{ marginTop: 12 }}>
            Salão, cozinha e entrega <em>em sintonia</em>.
          </h1>
          <p>Do balcão à moto, um só sistema para o restaurante brasileiro.</p>
          <button>Criar conta grátis</button>
        </div>
        <div className="mob-landing-mock">
          <div className="dm">
            <div className="dm-top">
              <div className="dm-dots">
                <i />
                <i />
                <i />
              </div>
              <div className="dm-url">admin.mesivo.app</div>
            </div>
            <div className="dm-body">
              <aside className="dm-side">
                <div className="dm-logo">M</div>
                {["Início", "Pedidos", "PDV", "Mesas"].map((x, i) => (
                  <div key={x} className={"dm-item " + (i === 1 ? "on" : "")}>
                    {x}
                  </div>
                ))}
              </aside>
              <main className="dm-main" style={{ padding: 10 }}>
                <div className="dm-title" style={{ fontSize: 14 }}>
                  Pedidos ao vivo
                </div>
                <div className="dm-kpis" style={{ marginTop: 8 }}>
                  <div className="dm-kpi">
                    <div className="dm-kpi-l">Faturamento</div>
                    <div className="dm-kpi-v" style={{ fontSize: 13 }}>
                      R$ 4.820
                    </div>
                  </div>
                  <div className="dm-kpi">
                    <div className="dm-kpi-l">Pedidos</div>
                    <div className="dm-kpi-v" style={{ fontSize: 13 }}>
                      78
                    </div>
                  </div>
                </div>
              </main>
            </div>
          </div>
        </div>
        <div style={{ padding: "0 18px 20px" }}>
          <div
            style={{
              fontFamily: "'Archivo Black'",
              fontSize: 20,
              color: "var(--coffee)",
              marginTop: 10,
            }}
          >
            Feito para operação real.
          </div>
          <p style={{ fontSize: 14, color: "var(--muted)", marginTop: 8 }}>
            Comanda, KDS, PDV e cardápio integrados. Sem cola de apps.
          </p>
        </div>
      </div>
    </div>
  );
}

function MobDashboard() {
  return (
    <div data-theme="app-proto" style={{ display: "flex", flexDirection: "column", flex: 1 }}>
      <div className="mob-notch" style={{ background: "#20211F" }} />
      <div className="mob-dash">
        <div className="mob-dash-hdr">
          <div>
            <div style={{ fontSize: 12, color: "#8A8C84" }}>Terça, 14 jan</div>
            <div className="mob-dash-hdr-t">Bom dia, Ana</div>
          </div>
          <div className="mob-dash-hdr-av">A</div>
        </div>

        <div className="mob-dash-kpis">
          <div className="app-kpi">
            <div className="app-kpi-l">Faturamento</div>
            <div className="app-kpi-v" style={{ fontSize: 20 }}>
              R$ 4.820
            </div>
            <div className="app-kpi-d d-leaf">+18%</div>
          </div>
          <div className="app-kpi">
            <div className="app-kpi-l">Pedidos</div>
            <div className="app-kpi-v" style={{ fontSize: 20 }}>
              78
            </div>
            <div className="app-kpi-d d-coral">+12 abertos</div>
          </div>
          <div className="app-kpi">
            <div className="app-kpi-l">Ticket médio</div>
            <div className="app-kpi-v" style={{ fontSize: 18 }}>
              R$ 62,10
            </div>
            <div className="app-kpi-d d-mango">+4%</div>
          </div>
          <div className="app-kpi">
            <div className="app-kpi-l">Tempo</div>
            <div className="app-kpi-v" style={{ fontSize: 18 }}>
              21 min
            </div>
            <div className="app-kpi-d d-leaf">-3 min</div>
          </div>
        </div>

        <div className="mob-dash-tabs">
          <span className="on">Todos</span>
          <span>Salão</span>
          <span>Delivery</span>
        </div>

        <div
          style={{
            background: "#fff",
            margin: "10px 16px 0",
            border: "1px solid #E1E2DD",
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          {[
            ["#0821", "Mesa 07 · R$ 148", "prep", "Preparando"],
            ["#0822", "Rua das Flores · R$ 96", "saiu", "Saiu"],
            ["#0823", "Balcão · R$ 42", "ok", "Entregue"],
            ["#0824", "Mesa 12 · R$ 218", "novo", "Novo"],
          ].map(([id, cli, cls, st]) => (
            <div key={id} className="mob-dash-order">
              <span className="mob-dash-order-id">{id}</span>
              <span className="mob-dash-order-cli">{cli}</span>
              <span className={"app-status st-" + cls}>{st}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="mob-tabbar">
        <div className="mob-tab on">
          <span className="mob-tab-ico" />
          Início
        </div>
        <div className="mob-tab">
          <span className="mob-tab-ico" />
          Pedidos
        </div>
        <div className="mob-tab">
          <span className="mob-tab-ico" />
          PDV
        </div>
        <div className="mob-tab">
          <span className="mob-tab-ico" />
          Mesas
        </div>
        <div className="mob-tab">
          <span className="mob-tab-ico" />
          Mais
        </div>
      </div>
    </div>
  );
}

function MobPdv() {
  return (
    <div
      data-theme="app-proto"
      style={{ display: "flex", flexDirection: "column", flex: 1, position: "relative" }}
    >
      <div className="mob-notch" style={{ background: "#20211F" }} />
      <div className="mob-pdv">
        <div className="mob-pdv-hdr">
          <div>
            <div style={{ fontFamily: "'Archivo Black'", fontSize: 15 }}>PDV móvel</div>
            <div style={{ fontSize: 11, color: "#8A8C84" }}>Caixa 01 · Ana</div>
          </div>
          <IconMenu size={20} />
        </div>
        <div className="mob-pdv-search">
          <div className="mob-pdv-search-i" style={{display:"flex",alignItems:"center",gap:8}}><IconSearch size={16} /> Buscar produto</div>
        </div>
        <div className="mob-pdv-cats">
          <span className="on">Burgers</span>
          <span>Combos</span>
          <span>Bebidas</span>
          <span>Sobremesas</span>
        </div>
        <div className="mob-pdv-grid">
          {[
            ["Smash duplo", "34,90"],
            ["Cheddar bacon", "38,50"],
            ["Veggie", "29,00"],
            ["Chorizo", "45,00"],
            ["Fish", "35,00"],
            ["Kids", "22,00"],
          ].map(([n, p]) => (
            <div key={n} className="pdv-prod">
              <div className="pdv-prod-img" style={{ height: 80 }} />
              <div className="pdv-prod-name">{n}</div>
              <div className="pdv-prod-price">R$ {p}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="mob-pdv-cart-fab">
        <div style={{ display: "flex", gap: 10, alignItems: "center", fontWeight: 600 }}>
          <div className="mob-pdv-cart-fab-c">4</div>
          Ver pedido
        </div>
        <div className="mob-pdv-cart-fab-t">R$ 141,83</div>
      </div>
    </div>
  );
}

function MobCardapio() {
  return (
    <div
      data-theme="tx-proto"
      style={{ display: "flex", flexDirection: "column", flex: 1, position: "relative" }}
    >
      <div className="mob-notch" style={{ background: "#23303A" }} />
      <div className="tx-root mob-cardapio">
        <div className="tx-cover" style={{ height: 140 }} />
        <div className="tx-brand-block">
          <div className="tx-brand-card">
            <div className="tx-brand-logo">B</div>
            <div className="tx-brand-h">
              <div className="tx-brand-name">Burger da Praça</div>
              <div className="tx-brand-meta">Hambúrgueres · Vila Madalena</div>
              <div className="tx-open">
                <span className="tx-open-dot" /> Aberto · 25–35 min
              </div>
            </div>
          </div>
        </div>
        <div className="tx-tabs" style={{ padding: "16px 20px 0" }}>
          {["Mais", "Burgers", "Combos", "Bebidas"].map((c, i) => (
            <div key={c} className={"tx-tab " + (i === 1 ? "on" : "")}>
              {c}
            </div>
          ))}
        </div>
        <div className="tx-list">
          <div className="tx-cat-h">Burgers</div>
          {[
            ["Smash duplo", "34,90"],
            ["Cheddar bacon", "38,50"],
            ["Veggie", "29,00"],
          ].map(([n, p]) => (
            <div key={n} className="tx-item">
              <div className="tx-item-info">
                <div className="tx-item-n">{n}</div>
                <div className="tx-item-d">Pão brioche, molho da casa e cebola caramelizada.</div>
                <div className="tx-item-p">R$ {p}</div>
              </div>
              <div className="tx-item-img tx-item-plus" />
            </div>
          ))}
        </div>
      </div>
      <div className="tx-cart-fab" style={{ position: "absolute" }}>
        <div className="tx-cart-fab-l">
          <div className="tx-cart-fab-c">2</div>
          Ver carrinho
        </div>
        <div className="tx-cart-fab-t">R$ 73,40</div>
      </div>
    </div>
  );
}

function MobPedido() {
  return (
    <div data-theme="tx-proto" style={{ display: "flex", flexDirection: "column", flex: 1 }}>
      <div className="mob-notch" style={{ background: "#23303A" }} />
      <div className="mob-pedido">
        <div className="mob-pedido-hdr">
          <div
            style={{
              fontSize: 11,
              color: "#666",
              textTransform: "uppercase",
              letterSpacing: ".08em",
            }}
          >
            Pedido #0822
          </div>
          <h2>Chegando em 12 min</h2>
          <p>Burger da Praça · Delivery</p>
        </div>
        <div className="mob-pedido-steps">
          <div className="mob-pedido-step done">
            <div className="mob-pedido-step-i"><IconCheck size={14} /></div>
            <div>
              <div className="mob-pedido-step-t">Recebido</div>
              <div className="mob-pedido-step-h">19:04 · pagamento aprovado</div>
            </div>
          </div>
          <div className="mob-pedido-step done">
            <div className="mob-pedido-step-i"><IconCheck size={14} /></div>
            <div>
              <div className="mob-pedido-step-t">Preparando</div>
              <div className="mob-pedido-step-h">19:08 · na cozinha</div>
            </div>
          </div>
          <div className="mob-pedido-step active">
            <div className="mob-pedido-step-i" aria-hidden="true">3</div>
            <div>
              <div className="mob-pedido-step-t">Saiu para entrega</div>
              <div className="mob-pedido-step-h">19:22 · com Bruno</div>
            </div>
          </div>
          <div className="mob-pedido-step">
            <div className="mob-pedido-step-i">4</div>
            <div>
              <div className="mob-pedido-step-t">Entregue</div>
              <div className="mob-pedido-step-h">previsto 19:34</div>
            </div>
          </div>
        </div>
        <div className="mob-pedido-tot">
          <div>
            <div style={{ fontSize: 11, color: "#CCC", textTransform: "uppercase" }}>
              Total pago
            </div>
            <div className="mob-pedido-tot-t">R$ 96,50</div>
          </div>
          <div
            style={{
              background: "#F4C752",
              color: "#23303A",
              padding: "8px 14px",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 800,
            }}
          >
            Pix
          </div>
        </div>
        <div className="tx-powered" style={{ marginTop: 20 }}>
          Tecnologia <strong>Mesivo</strong>
        </div>
      </div>
    </div>
  );
}

function MobMoto() {
  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, background: "#111" }}>
      <div className="mob-notch" style={{ background: "#000" }} />
      <div className="mob-moto">
        <div className="mob-moto-hdr">
          <div>
            <h2>Bruno · Motoboy</h2>
            <div style={{ fontSize: 11, color: "#888" }}>Turno · 3h 42min</div>
          </div>
          <div className="mob-moto-online">
            <span /> Online
          </div>
        </div>

        <div className="mob-moto-card">
          <span className="mob-moto-card-tag">NOVA ENTREGA</span>
          <div className="mob-moto-card-o">Pedido #0822</div>
          <div className="mob-moto-card-a">
            Rua das Flores, 240 · Ap 12
            <br />
            Vila Madalena · 2,4 km
          </div>
          <div className="mob-moto-card-meta">
            <span style={{display:"inline-flex",alignItems:"center",gap:4}}><IconClock size={13} /> 12 min</span>
            <span style={{display:"inline-flex",alignItems:"center",gap:4}}><IconMoney size={13} /> R$ 8,00</span>
            <span style={{display:"inline-flex",alignItems:"center",gap:4}}><IconPackage size={13} /> 1 sacola</span>
          </div>
        </div>

        <div style={{ padding: "0 16px", fontSize: 13, color: "#999", marginBottom: 8 }}>
          Próxima parada
        </div>
        <div className="mob-moto-card" style={{ marginTop: 0 }}>
          <div style={{ fontSize: 14, color: "#CCC" }}>Retirada em</div>
          <div style={{ fontFamily: "'Archivo Black'", fontSize: 18, marginTop: 4 }}>
            Burger da Praça
          </div>
          <div style={{ fontSize: 13, color: "#999", marginTop: 4 }}>Rua Aspicuelta, 501</div>
        </div>

        <div style={{ marginTop: "auto" }}>
          <button className="mob-moto-btn">ACEITAR ENTREGA</button>
          <button className="mob-moto-btn-2">Recusar</button>
        </div>
      </div>
    </div>
  );
}
