import { createFileRoute } from "@tanstack/react-router";
import { PROTO_CSS } from "@/dev-proto/proto-tokens";

export const Route = createFileRoute("/dev/proto/cardapio")({
  component: ProtoCardapio,
  head: () => ({
    meta: [{ title: "Proto · Cardápio Público (dev)" }, { name: "robots", content: "noindex" }],
  }),
});

const CATS = ["Mais pedidos", "Burgers", "Combos", "Bebidas", "Sobremesas", "Porções"];

type Item = {
  name: string;
  desc: string;
  price: string;
  status?: "out" | "new" | "no-img";
};

const BURGERS: Item[] = [
  {
    name: "Smash duplo",
    desc: "Dois blends 90g, cheddar, cebola caramelizada, molho da casa no pão brioche.",
    price: "34,90",
  },
  {
    name: "Cheddar bacon",
    desc: "Blend 180g, cheddar cremoso, bacon crocante, alface e tomate.",
    price: "38,50",
    status: "new",
  },
  {
    name: "Veggie da praça",
    desc: "Hambúrguer de grão-de-bico, muçarela, tomate seco e rúcula.",
    price: "29,00",
    status: "no-img",
  },
  {
    name: "Chorizo argentino",
    desc: "Blend picanha 200g, chimichurri e queijo prato derretido.",
    price: "45,00",
    status: "out",
  },
];

const COMBOS: Item[] = [
  {
    name: "Combo Smash",
    desc: "Smash duplo + batata rústica + refrigerante 350ml.",
    price: "48,90",
  },
  {
    name: "Combo Veggie",
    desc: "Veggie + salada verde + suco natural do dia.",
    price: "42,00",
    status: "no-img",
  },
];

function ProtoCardapio() {
  // Brand config coming from the restaurant (mocked here).
  const brand = {
    name: "Burger da Praça",
    initial: "B",
    logoUrl: "", // empty on purpose to showcase fallback
    coverUrl: "", // empty on purpose to showcase fallback
    palette: { a: "#F0522D", b: "#B23016" },
    tagline: "Hambúrgueres artesanais · Vila Madalena",
    isOpen: true,
    fee: "R$ 6,90",
    min: "R$ 30",
    time: "25–35 min",
  };

  return (
    <div data-theme="tx-proto">
      <style dangerouslySetInnerHTML={{ __html: PROTO_CSS }} />
      <div
        className="tx-root"
        style={
          {
            "--fb-a": brand.palette.a,
            "--fb-b": brand.palette.b,
          } as React.CSSProperties
        }
      >
        {/* Cover — real image if configured, editorial fallback otherwise */}
        <div className="tx-cover">
          {brand.coverUrl ? (
            <div className="tx-cover-img" style={{ backgroundImage: `url(${brand.coverUrl})` }} />
          ) : (
            <div className="tx-cover-fallback" aria-hidden>
              <div className="tx-cover-fallback-mark">
                <div className="tx-cover-fallback-logo">{brand.initial}</div>
                <div className="tx-cover-fallback-name">{brand.name}</div>
              </div>
            </div>
          )}
          <div className="tx-cover-txt">Delivery · Retirada · Mesa</div>
        </div>

        <div className="tx-brand-block">
          <div className="tx-brand-card">
            <div
              className={"tx-brand-logo" + (brand.logoUrl ? "" : " tx-brand-logo-fallback")}
              style={
                brand.logoUrl
                  ? { backgroundImage: `url(${brand.logoUrl})`, backgroundSize: "cover" }
                  : undefined
              }
            >
              {!brand.logoUrl && brand.initial}
            </div>
            <div className="tx-brand-h" style={{ flex: 1 }}>
              <div className="tx-brand-name">{brand.name}</div>
              <div className="tx-brand-meta">{brand.tagline}</div>
              <div className={"tx-open" + (brand.isOpen ? "" : " closed")} style={{ marginTop: 4 }}>
                <span className="tx-open-dot" />{" "}
                {brand.isOpen ? `Aberto · entrega ${brand.time}` : "Fechado no momento"}
              </div>
            </div>
          </div>
        </div>

        <div className="tx-info-strip">
          <span>
            Entrega <strong>{brand.time}</strong>
          </span>
          <span>
            Taxa <strong>{brand.fee}</strong>
          </span>
          <span>
            Pedido mín. <strong>{brand.min}</strong>
          </span>
        </div>

        <div className="tx-tabs-wrap">
          <div className="tx-tabs" role="tablist" aria-label="Categorias">
            {CATS.map((c, i) => (
              <div
                key={c}
                className={"tx-tab " + (i === 1 ? "on" : "")}
                role="tab"
                aria-selected={i === 1}
              >
                {c}
              </div>
            ))}
          </div>
          <span className="tx-tabs-fade" aria-hidden />
        </div>

        <div className="tx-list">
          <div className="tx-cat-h">Burgers autorais</div>
          <div className="tx-list-grid">
            {BURGERS.map((it) => (
              <ItemRow key={it.name} item={it} />
            ))}
          </div>

          <div className="tx-cat-h">Combos</div>
          <div className="tx-list-grid">
            {COMBOS.map((it) => (
              <ItemRow key={it.name} item={it} accent />
            ))}
          </div>
        </div>

        <div className="tx-cart-fab">
          <div className="tx-cart-fab-l">
            <div className="tx-cart-fab-c">2</div>
            Ver carrinho
          </div>
          <div className="tx-cart-fab-t">R$ 73,40</div>
        </div>

        <div className="tx-powered">
          Tecnologia <strong>Mesivo</strong>
        </div>
      </div>
    </div>
  );
}

function ItemRow({ item, accent = false }: { item: Item; accent?: boolean }) {
  const isOut = item.status === "out";
  const noImg = item.status === "no-img";
  return (
    <div className={"tx-item" + (isOut ? " out" : "")}>
      <div className="tx-item-info">
        {item.status === "new" && <span className="tx-item-badge">Novo</span>}
        {isOut && <span className="tx-item-badge out-badge">Indisponível</span>}
        <div className="tx-item-n">{item.name}</div>
        <div className="tx-item-d">{item.desc}</div>
        <div className="tx-item-p">R$ {item.price}</div>
      </div>
      <div
        className={"tx-item-img" + (noImg ? " no-img" : "") + (isOut ? "" : " tx-item-plus")}
        style={
          !noImg && accent ? { background: "linear-gradient(135deg, #E88C3B, #B85E2E)" } : undefined
        }
        aria-hidden
      >
        {noImg && <span>🖼</span>}
      </div>
    </div>
  );
}
