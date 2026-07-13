import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { PROTO_CSS } from "@/dev-proto/proto-tokens";
import { IconImage, IconMenu, IconSearch } from "@/dev-proto/proto-icons";

export const Route = createFileRoute("/dev/proto/pdv")({
  component: ProtoPdv,
  head: () => ({
    meta: [{ title: "Proto · PDV Mesivo (dev)" }, { name: "robots", content: "noindex" }],
  }),
});

type Cat = [name: string, count: number, active: boolean];
type Prod = [name: string, price: string, avail: "ok" | "out" | "no-img"];

const CATS: Cat[] = [
  ["Hambúrgueres", 12, true],
  ["Combos", 6, false],
  ["Bebidas", 18, false],
  ["Sobremesas", 8, false],
  ["Porções", 10, false],
  ["Especiais", 4, false],
];

const PROD: Prod[] = [
  ["Smash duplo", "34,90", "ok"],
  ["Cheddar bacon", "38,50", "ok"],
  ["Veggie", "29,00", "ok"],
  ["Kids", "22,00", "no-img"],
  ["BBQ Ranch", "36,00", "ok"],
  ["Duplo pão preto", "41,00", "ok"],
  ["Frango crispy", "32,50", "ok"],
  ["Costela smoked", "44,00", "out"],
  ["Fish burger", "35,00", "ok"],
  ["Chorizo argentino", "45,00", "ok"],
  ["Buffalo picante", "33,50", "no-img"],
  ["Trufado", "48,00", "ok"],
];

const CART_ITEMS: [string, string, number][] = [
  ["Smash duplo", "34,90", 2],
  ["Cheddar bacon", "38,50", 1],
  ["Coca 350ml", "7,00", 3],
  ["Batata rústica", "18,00", 1],
];

function ProtoPdv() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const fabRef = useRef<HTMLButtonElement | null>(null);
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const itemCount = CART_ITEMS.reduce((a, [, , q]) => a + q, 0);

  useEffect(() => {
    if (!sheetOpen) return;
    const prev = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const root = sheetRef.current;
      if (!root) return;
      const focusables = root.querySelectorAll<HTMLElement>(
        'button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])',
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      (prev ?? fabRef.current)?.focus?.();
    };
  }, [sheetOpen]);

  return (
    <div data-theme="app-proto">
      <style dangerouslySetInnerHTML={{ __html: PROTO_CSS }} />

      {/* ===== DESKTOP (>=768px) ===== */}
      <div className="pdv-shell">
        <aside className="pdv-cats-col">
          <div className="pdv-cats-h">
            <div className="pdv-cats-h-t">PDV · Burger da Praça</div>
            <div
              style={{ fontSize: 12, color: "#8A8C84", marginTop: 3, fontFamily: "var(--mono)" }}
            >
              Caixa 01 · Ana
            </div>
          </div>
          {CATS.map(([n, c, on]) => (
            <div key={n} className={"pdv-cat " + (on ? "on" : "")}>
              <span>{n}</span>
              <span className="pdv-cat-c">{c}</span>
            </div>
          ))}
        </aside>

        <div className="pdv-main-col">
          <div className="pdv-search">
            <IconSearch size={15} style={{ marginRight: 8, verticalAlign: -2 }} />
            Buscar produto ou atalho (F3)
          </div>
          <div className="pdv-prods">
            {PROD.map(([n, p, avail]) => (
              <div key={n} className={"pdv-prod" + (avail === "out" ? " out" : "")}>
                {avail === "out" && <span className="pdv-prod-badge">Esgotado</span>}
                <div className={"pdv-prod-img" + (avail === "no-img" ? " no-img" : "")}>
                  {avail === "no-img" && <IconImage size={22} />}
                </div>
                <div className="pdv-prod-name">{n}</div>
                <div className="pdv-prod-price">R$ {p}</div>
              </div>
            ))}
          </div>
        </div>

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
            {CART_ITEMS.map(([n, p, q]) => (
              <div key={n} className="pdv-cart-item">
                <span className="pdv-cart-item-q">{q}</span>
                <span className="pdv-cart-item-n">{n}</span>
                <span className="pdv-cart-item-p">R$ {p}</span>
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

      {/* ===== MOBILE (<768px) ===== */}
      <div className="pdv-mob">
        <header className="app-mob-topbar" aria-label="PDV">
          <button className="app-mob-topbar-icon" aria-label="Abrir menu">
            <IconMenu size={20} />
          </button>
          <div className="app-mob-topbar-l">
            <div>
              <div className="app-mob-topbar-title">PDV · Burger da Praça</div>
              <div className="app-mob-topbar-sub">Caixa 01 · Ana</div>
            </div>
          </div>
        </header>

        <div className="demo-badge-slot">
          <span className="demo-badge">Dados demonstrativos</span>
        </div>

        <div className="pdv-mob-search">
          <div className="pdv-mob-search-input" role="search">
            <IconSearch size={16} /> Buscar produto
          </div>
        </div>

        <div className="pdv-mob-cats-strip" role="tablist" aria-label="Categorias">
          {CATS.map(([n, , on]) => (
            <span key={n} className={on ? "on" : ""} role="tab" aria-selected={on}>
              {n}
            </span>
          ))}
        </div>

        <div className="pdv-mob-grid">
          {PROD.map(([n, p, avail]) => (
            <div key={n} className={"pdv-prod" + (avail === "out" ? " out" : "")}>
              {avail === "out" && <span className="pdv-prod-badge">Esgotado</span>}
              <div className={"pdv-prod-img" + (avail === "no-img" ? " no-img" : "")}>
                {avail === "no-img" && <IconImage size={22} />}
              </div>
              <div className="pdv-prod-name">{n}</div>
              <div className="pdv-prod-price">R$ {p}</div>
            </div>
          ))}
        </div>

        <button
          ref={fabRef}
          type="button"
          className="pdv-mob-fab"
          data-empty={itemCount === 0}
          disabled={itemCount === 0}
          aria-label={`Ver pedido, ${itemCount} itens, total R$ 141,83`}
          aria-haspopup="dialog"
          aria-expanded={sheetOpen}
          onClick={() => setSheetOpen(true)}
        >
          <span className="pdv-mob-fab-l">
            <span className="pdv-mob-fab-c">{itemCount}</span>
            Ver pedido
          </span>
          <span className="pdv-mob-fab-total">R$ 141,83</span>
        </button>
      </div>

      {/* ===== Bottom sheet (mobile) ===== */}
      {sheetOpen && (
        <>
          <div
            className="pdv-sheet-backdrop"
            style={{ display: "block" }}
            role="presentation"
            onClick={() => setSheetOpen(false)}
          />
          <div
            className="pdv-sheet"
            style={{ display: "flex" }}
            role="dialog"
            aria-modal="true"
            aria-label="Pedido em andamento"
            onKeyDown={(e) => {
              if (e.key === "Escape") setSheetOpen(false);
            }}
          >
            <div className="pdv-sheet-handle" />
            <div className="pdv-sheet-h">
              <div className="pdv-sheet-h-t">Pedido #0827 · Salão</div>
              <button
                type="button"
                className="pdv-sheet-close"
                onClick={() => setSheetOpen(false)}
                aria-label="Fechar"
              >
                ×
              </button>
            </div>
            <div className="pdv-sheet-body">
              <div className="pdv-cli" style={{ padding: 0, border: "none" }}>
                <span>Cliente</span>
                <span className="pdv-cli-name">João P. · (11) 98…</span>
              </div>
              <div className="pdv-tipo" style={{ padding: 0, border: "none" }}>
                <span className="on">Salão</span>
                <span>Balcão</span>
                <span>Delivery</span>
                <span>Retirada</span>
              </div>
              {CART_ITEMS.map(([n, p, q]) => (
                <div key={n} className="pdv-cart-item">
                  <span className="pdv-cart-item-q">{q}</span>
                  <span className="pdv-cart-item-n">{n}</span>
                  <span className="pdv-cart-item-p">R$ {p}</span>
                </div>
              ))}
              <div
                className="pdv-cart-totals"
                style={{ borderRadius: 12, borderTop: "1px solid var(--line)" }}
              >
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
              </div>
              <div className="pdv-pay" style={{ padding: 0 }}>
                <span className="on">Pix</span>
                <span>Cartão</span>
                <span>Dinheiro</span>
                <span>Voucher</span>
              </div>
            </div>
            <div className="pdv-sheet-total">
              <span style={{ fontFamily: "'Archivo Black'", fontSize: 14, color: "var(--ink)" }}>
                Total
              </span>
              <span className="pdv-sheet-total-v">R$ 141,83</span>
            </div>
            <button className="pdv-sheet-cta" type="button">
              Finalizar pedido
            </button>
          </div>
        </>
      )}

      <span className="demo-badge demo-floating" aria-hidden>
        Dados demonstrativos
      </span>
    </div>
  );
}
