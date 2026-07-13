import { createFileRoute } from "@tanstack/react-router";
import { PROTO_CSS } from "@/dev-proto/proto-tokens";

export const Route = createFileRoute("/dev/proto/cardapio")({
  component: ProtoCardapio,
  head: () => ({ meta: [{ title: "Proto · Cardápio Público (dev)" }, { name: "robots", content: "noindex" }] }),
});

const CATS = ["Mais pedidos", "Burgers", "Combos", "Bebidas", "Sobremesas", "Porções"];

const ITEMS = [
  ["Smash duplo", "Dois blends 90g, cheddar, cebola caramelizada, molho da casa no pão brioche.", "34,90"],
  ["Cheddar bacon", "Blend 180g, cheddar cremoso, bacon crocante, alface e tomate.", "38,50"],
  ["Veggie da praça", "Hambúrguer de grão-de-bico, muçarela, tomate seco e rúcula.", "29,00"],
  ["Chorizo argentino", "Blend picanha 200g, chimichurri e queijo prato derretido.", "45,00"],
];

function ProtoCardapio() {
  return (
    <div data-theme="tx-proto">
      <style dangerouslySetInnerHTML={{ __html: PROTO_CSS }} />
      <div className="tx-root" style={{ maxWidth: 430, margin: "0 auto", background: "#fff", minHeight: "100vh", position: "relative" }}>
        <div className="tx-cover">
          <div className="tx-cover-txt">
            <div className="tx-cover-eyebrow">Delivery · Retirada · Mesa</div>
          </div>
        </div>

        <div className="tx-brand-block">
          <div className="tx-brand-card">
            <div className="tx-brand-logo">B</div>
            <div className="tx-brand-h" style={{ flex: 1 }}>
              <div className="tx-brand-name">Burger da Praça</div>
              <div className="tx-brand-meta">Hambúrgueres artesanais · Vila Madalena</div>
              <div className="tx-open" style={{ marginTop: 4 }}>
                <span className="tx-open-dot" /> Aberto · entrega 25–35 min · min R$ 30
              </div>
            </div>
          </div>
        </div>

        <div className="tx-tabs">
          {CATS.map((c, i) => (
            <div key={c} className={"tx-tab " + (i === 1 ? "on" : "")}>{c}</div>
          ))}
        </div>

        <div className="tx-list">
          <div className="tx-cat-h">Burgers autorais</div>
          {ITEMS.map(([n, d, p]) => (
            <div key={n} className="tx-item">
              <div className="tx-item-info">
                <div className="tx-item-n">{n}</div>
                <div className="tx-item-d">{d}</div>
                <div className="tx-item-p">R$ {p}</div>
              </div>
              <div className="tx-item-img tx-item-plus" />
            </div>
          ))}

          <div className="tx-cat-h">Combos</div>
          {[
            ["Combo Smash", "Smash duplo + batata rústica + refrigerante 350ml.", "48,90"],
            ["Combo Veggie", "Veggie + salada verde + suco natural do dia.", "42,00"],
          ].map(([n, d, p]) => (
            <div key={n} className="tx-item">
              <div className="tx-item-info">
                <div className="tx-item-n">{n}</div>
                <div className="tx-item-d">{d}</div>
                <div className="tx-item-p">R$ {p}</div>
              </div>
              <div className="tx-item-img tx-item-plus" style={{ background: "linear-gradient(135deg, #E88C3B, #B85E2E)" }} />
            </div>
          ))}
        </div>

        <div className="tx-cart-fab">
          <div className="tx-cart-fab-l">
            <div className="tx-cart-fab-c">2</div>
            Ver carrinho
          </div>
          <div className="tx-cart-fab-t">R$ 73,40</div>
        </div>

        <div className="tx-powered">
          Tecnologia <strong>Mesivo</strong> · Powered by Mesivo
        </div>
      </div>
    </div>
  );
}
