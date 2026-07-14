import { MotionReveal } from "@/components/motion";
import { FlowDiagram } from "@/components/mesivo-graphics/FlowDiagram";

const passos = [
  { n: "01", t: "Cliente pede", d: "Cardápio digital no link único do seu restaurante — sem app pra baixar." },
  { n: "02", t: "Pedido entra", d: "Chega no painel, com aviso sonoro, cupom, forma de pagamento e endereço." },
  { n: "03", t: "Cozinha produz", d: "KDS mostra por etapa e por tempo. Nada de comanda perdida ou pedido dobrado." },
  { n: "04", t: "Saiu / entregue", d: "Status atualiza em tempo real pro cliente e pro seu caixa. Fim do dia fecha sozinho." },
];

export function FluxoPedidos() {
  return (
    <section
      id="como-funciona"
      aria-label="Como o Mesivo funciona no dia a dia"
      style={{ paddingBlock: "clamp(64px, 8vw, 120px)" }}
    >
      <div style={{ maxWidth: 1200, marginInline: "auto", paddingInline: "clamp(16px, 4vw, 32px)" }}>
        <MotionReveal variant="fade">
          <div style={{ maxWidth: 640 }}>
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "var(--mesivo-tomato)",
              }}
            >
              Como funciona
            </span>
            <h2
              style={{
                marginTop: 12,
                fontSize: "clamp(2rem, 3.6vw, 3rem)",
                lineHeight: 1.02,
                color: "var(--fg-hi)",
              }}
            >
              Um pedido entra. Ele passa por{" "}
              <span className="mesivo-accent">quatro etapas</span> — sem
              atravessar caderno nenhum.
            </h2>
            <p style={{ marginTop: 16, color: "var(--fg-mid)", maxWidth: 540 }}>
              O Mesivo conecta cliente, painel, cozinha e caixa. Cada etapa
              deixa rastro, cada operador vê o que precisa ver.
            </p>
          </div>
        </MotionReveal>

        <MotionReveal variant="up" delay={0.15} style={{ marginTop: 40 }}>
          <div
            style={{
              borderRadius: 24,
              border: "1px solid var(--hairline)",
              backgroundColor: "var(--surface-1)",
              padding: "clamp(20px, 3vw, 32px)",
            }}
          >
            <FlowDiagram />
          </div>
        </MotionReveal>

        <ol
          style={{
            marginTop: 40,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
            gap: 20,
            listStyle: "none",
            padding: 0,
            counterReset: "step",
          }}
        >
          {passos.map((p, i) => (
            <MotionReveal key={p.n} as="li" variant="up" delay={i * 0.06}>
              <div
                style={{
                  height: "100%",
                  padding: "20px 22px",
                  borderRadius: 20,
                  border: "1px solid var(--hairline)",
                  backgroundColor: "var(--mesivo-warm-white)",
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: 32,
                    fontWeight: 700,
                    color: "var(--mesivo-tomato)",
                    lineHeight: 1,
                  }}
                >
                  {p.n}
                </div>
                <div
                  style={{
                    marginTop: 12,
                    fontSize: 18,
                    fontWeight: 700,
                    color: "var(--fg-hi)",
                  }}
                >
                  {p.t}
                </div>
                <p style={{ marginTop: 8, color: "var(--fg-mid)", fontSize: 14, lineHeight: 1.5 }}>
                  {p.d}
                </p>
              </div>
            </MotionReveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
