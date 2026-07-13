import { createFileRoute } from "@tanstack/react-router";
import { PROTO_CSS } from "@/dev-proto/proto-tokens";

export const Route = createFileRoute("/dev/proto/pdv")({
  component: ProtoPdv,
  head: () => ({
    meta: [{ title: "Proto · PDV Mesivo (dev)" }, { name: "robots", content: "noindex" }],
  }),
});

const CATS = [
  ["Hambúrgueres", 12, true],
  ["Combos", 6, false],
  ["Bebidas", 18, false],
  ["Sobremesas", 8, false],
  ["Porções", 10, false],
  ["Especiais", 4, false],
];

const PROD = [
  ["Smash duplo", "34,90"],
  ["Cheddar bacon", "38,50"],
  ["Veggie", "29,00"],
  ["Kids", "22,00"],
  ["BBQ Ranch", "36,00"],
  ["Duplo pão preto", "41,00"],
  ["Frango crispy", "32,50"],
  ["Costela smoked", "44,00"],
  ["Fish burger", "35,00"],
  ["Chorizo argentino", "45,00"],
  ["Buffalo picante", "33,50"],
  ["Trufado", "48,00"],
];

function ProtoPdv() {
  return (
    <div data-theme="app-proto">
      <style dangerouslySetInnerHTML={{ __html: PROTO_CSS }} />
      <div className="pdv-shell">
        {/* Categorias */}
        <aside className="pdv-cats-col">
          <div className="pdv-cats-h">
            <div className="pdv-cats-h-t">PDV · Burger da Praça</div>
            <div style={{ fontSize: 12, color: "#8A8C84", marginTop: 3 }}>Caixa 01 · Ana</div>
          </div>
          {CATS.map(([n, c, on]) => (
            <div key={n as string} className={"pdv-cat " + (on ? "on" : "")}>
              <span>{n as string}</span>
              <span className="pdv-cat-c">{c}</span>
            </div>
          ))}
        </aside>

        {/* Produtos */}
        <div className="pdv-main-col">
          <div className="pdv-search">🔎 Buscar produto ou atalho (F3)</div>
          <div className="pdv-prods">
            {PROD.map(([n, p]) => (
              <div key={n} className="pdv-prod">
                <div className="pdv-prod-img" />
                <div className="pdv-prod-name">{n}</div>
                <div className="pdv-prod-price">R$ {p}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Carrinho */}
        <aside className="pdv-cart-col">
          <div className="pdv-cart-h">
            <div className="pdv-cart-h-t">Pedido #0827</div>
            <span className="pdv-cart-tag">Em andamento</span>
          </div>

          <div className="pdv-cli">
            <span>Cliente</span>
            <span className="pdv-cli-name">João P. · (11) 98…</span>
          </div>

          <div className="pdv-tipo">
            <span className="on">Salão</span>
            <span>Balcão</span>
            <span>Delivery</span>
            <span>Retirada</span>
          </div>

          <div className="pdv-cart-items">
            {[
              ["Smash duplo", "34,90", 2],
              ["Cheddar bacon", "38,50", 1],
              ["Coca 350ml", "7,00", 3],
              ["Batata rústica", "18,00", 1],
            ].map(([n, p, q]) => (
              <div key={n as string} className="pdv-cart-item">
                <span className="pdv-cart-item-q">{q as number}</span>
                <span className="pdv-cart-item-n">{n as string}</span>
                <span className="pdv-cart-item-p">R$ {p as string}</span>
              </div>
            ))}
          </div>

          <div className="pdv-cart-totals">
            <div className="pdv-tot-row">
              <span>Subtotal</span>
              <span>R$ 149,30</span>
            </div>
            <div className="pdv-tot-row">
              <span>Desconto (5%)</span>
              <span>-R$ 7,47</span>
            </div>
            <div className="pdv-tot-row">
              <span>Taxa de entrega</span>
              <span>R$ 0,00</span>
            </div>
            <div className="pdv-tot-final">
              <span className="pdv-tot-final-l">Total</span>
              <span className="pdv-tot-final-v">R$ 141,83</span>
            </div>
          </div>

          <div className="pdv-pay">
            <span className="on">Pix</span>
            <span>Cartão</span>
            <span>Dinheiro</span>
            <span>Voucher</span>
          </div>

          <button className="pdv-finalize">Finalizar pedido · F9</button>
        </aside>
      </div>
    </div>
  );
}
