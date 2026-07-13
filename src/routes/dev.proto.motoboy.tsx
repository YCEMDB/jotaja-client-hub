import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PROTO_CSS } from "@/dev-proto/proto-tokens";
import {
  IconUser,
  IconMap,
  IconPhone,
  IconCheck,
  IconAlert,
  IconPackage,
  IconPin,
  IconClock,
  IconMoney,
  IconCard,
} from "@/dev-proto/proto-icons";

export const Route = createFileRoute("/dev/proto/motoboy")({
  component: ProtoMotoboy,
  head: () => ({
    meta: [{ title: "Proto · Motoboy Mesivo (dev)" }, { name: "robots", content: "noindex" }],
  }),
});

function ProtoMotoboy() {
  const [status, setStatus] = useState<"free" | "busy">("free");
  const [tab, setTab] = useState<"delivery" | "history" | "profile">("delivery");

  return (
    <div data-theme="moto-proto">
      <style dangerouslySetInnerHTML={{ __html: PROTO_CSS }} />
      <div className="moto-shell">
        {/* Topbar */}
        <header className="moto-topbar">
          <div className="moto-topbar-l">
            <div className="moto-avatar" aria-hidden>
              B
            </div>
            <div>
              <div className="moto-topbar-name">Bruno Alves</div>
              <div className="moto-topbar-sub">Turno · 3h 42min</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div className="moto-status" role="tablist" aria-label="Status do entregador">
              <button
                type="button"
                className={status === "free" ? "on" : ""}
                onClick={() => setStatus("free")}
                aria-pressed={status === "free"}
              >
                Disponível
              </button>
              <button
                type="button"
                className={"busy " + (status === "busy" ? "on" : "")}
                onClick={() => setStatus("busy")}
                aria-pressed={status === "busy"}
              >
                Ocupado
              </button>
            </div>
            <button className="moto-profile-btn" aria-label="Perfil">
              <IconUser size={18} />
            </button>
          </div>
        </header>

        {/* Summary */}
        <section className="moto-summary" aria-label="Resumo do turno">
          <div className="moto-summary-card">
            <div className="moto-summary-l">Pendentes</div>
            <div className="moto-summary-v">2</div>
          </div>
          <div className="moto-summary-card">
            <div className="moto-summary-l">Em rota</div>
            <div className="moto-summary-v">1</div>
          </div>
          <div className="moto-summary-card hi">
            <div className="moto-summary-l">Concluídas</div>
            <div className="moto-summary-v">7</div>
          </div>
        </section>

        {tab === "delivery" && (
          <>
            <div className="moto-current-label">Entrega atual</div>

            <article className="moto-card" aria-label="Entrega em rota">
              <div className="moto-card-h">
                <div>
                  <span className="moto-card-tag">Em rota</span>
                  <div className="moto-card-o" style={{ marginTop: 8 }}>
                    Pedido #0822
                  </div>
                </div>
              </div>

              <div className="moto-card-restaurant">
                <div className="moto-card-rest-logo">B</div>
                <div style={{ minWidth: 0 }}>
                  <div className="moto-card-rest-name">Burger da Praça</div>
                  <div className="moto-card-rest-sub">Rua Aspicuelta, 501 · Vila Madalena</div>
                </div>
              </div>

              <div className="moto-card-addr">
                <div
                  style={{
                    fontSize: 11,
                    color: "#8A8F86",
                    fontFamily: "var(--mono)",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: ".06em",
                    marginBottom: 4,
                  }}
                >
                  Entregar para
                </div>
                <strong>Maria Silva</strong>
                <br />
                Rua das Flores, 240 · Ap 12
                <br />
                Vila Madalena · CEP 05432-010
              </div>

              <div className="moto-card-meta">
                <span>
                  📍 <b>2,4 km</b>
                </span>
                <span>
                  ⏱ ETA <b>12 min</b>
                </span>
                <span>
                  💵 Cobrar <b>R$ 96,50</b>
                </span>
                <span>💳 Pix pago</span>
              </div>

              <div className="moto-card-note">
                <strong>Observação:</strong> portão amarelo, interfone 12B. Cliente pediu para ligar
                ao chegar.
              </div>

              <div className="moto-actions">
                <button type="button" aria-label="Abrir endereço no mapa">
                  🗺 Abrir no mapa
                </button>
                <button type="button" aria-label="Ligar para o cliente">
                  📞 Ligar
                </button>
                <button type="button" className="moto-primary">
                  ✅ Confirmar entrega
                </button>
                <button type="button" className="moto-danger">
                  ⚠ Informar problema
                </button>
              </div>
            </article>

            <div className="moto-current-label">Próxima na fila</div>

            <article className="moto-card next" aria-label="Próxima entrega">
              <div className="moto-card-h">
                <div>
                  <span className="moto-card-tag">Aguardando retirada</span>
                  <div className="moto-card-o" style={{ marginTop: 8 }}>
                    Pedido #0826
                  </div>
                </div>
              </div>

              <div className="moto-card-restaurant">
                <div className="moto-card-rest-logo">P</div>
                <div style={{ minWidth: 0 }}>
                  <div className="moto-card-rest-name">Pizza Napoli</div>
                  <div className="moto-card-rest-sub">Rua Fradique Coutinho, 82</div>
                </div>
              </div>

              <div className="moto-card-addr">
                <div
                  style={{
                    fontSize: 11,
                    color: "#8A8F86",
                    fontFamily: "var(--mono)",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: ".06em",
                    marginBottom: 4,
                  }}
                >
                  Entregar para
                </div>
                <strong>Carlos Menezes</strong>
                <br />
                Av. Rebouças, 3900 · Sala 42
              </div>

              <div className="moto-card-meta">
                <span>
                  📍 <b>3,1 km</b>
                </span>
                <span>
                  ⏱ ETA <b>18 min</b>
                </span>
                <span>
                  💵 Cobrar <b>R$ 128,00</b>
                </span>
                <span>💳 Dinheiro</span>
              </div>

              <div className="moto-actions">
                <button type="button">🗺 Abrir no mapa</button>
                <button type="button" className="moto-primary">
                  📦 Confirmar retirada
                </button>
              </div>
            </article>
          </>
        )}

        {tab === "history" && (
          <div style={{ padding: "24px 20px", color: "#8A8F86", fontFamily: "var(--mono)" }}>
            Histórico do turno · em breve
          </div>
        )}
        {tab === "profile" && (
          <div style={{ padding: "24px 20px", color: "#8A8F86", fontFamily: "var(--mono)" }}>
            Perfil e ajustes · em breve
          </div>
        )}
      </div>

      <nav className="moto-bottom-nav" aria-label="Navegação inferior">
        <div className="moto-bottom-inner">
          <button
            className={"moto-bottom-item" + (tab === "delivery" ? " on" : "")}
            onClick={() => setTab("delivery")}
            aria-current={tab === "delivery" ? "page" : undefined}
          >
            <svg viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M3 13h14l3-6h-4M3 13v5h2a2 2 0 1 0 4 0h6a2 2 0 1 0 4 0h1v-5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinejoin="round"
              />
            </svg>
            Entregas
          </button>
          <button
            className={"moto-bottom-item" + (tab === "history" ? " on" : "")}
            onClick={() => setTab("history")}
            aria-current={tab === "history" ? "page" : undefined}
          >
            <svg viewBox="0 0 24 24" fill="none" aria-hidden>
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
              <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Histórico
          </button>
          <button
            className={"moto-bottom-item" + (tab === "profile" ? " on" : "")}
            onClick={() => setTab("profile")}
            aria-current={tab === "profile" ? "page" : undefined}
          >
            <svg viewBox="0 0 24 24" fill="none" aria-hidden>
              <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
              <path
                d="M4 21c1-4 5-6 8-6s7 2 8 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            Perfil
          </button>
        </div>
      </nav>

      <div className="demo-badge" aria-hidden>
        Dados demonstrativos
      </div>
    </div>
  );
}
