import { MotionReveal, MotionStagger, MotionStaggerItem } from "@/components/motion";

const beneficios = [
  { t: "Sem comissão por pedido", d: "Mensalidade fixa. O que você vende, você recebe — 100%." },
  { t: "Setup guiado", d: "Cadastro passo a passo, cardápio importável, link pronto pra divulgar." },
  { t: "Painel em tempo real", d: "Pedido, mesa, cozinha e caixa no mesmo lugar, no mesmo instante." },
  { t: "Pix e cartão integrados", d: "Recebimento direto na sua conta Mercado Pago, sem intermediário." },
  { t: "Impressão automática", d: "Cupom sai direto na térmica assim que o pedido entra." },
  { t: "Suporte que atende", d: "WhatsApp humano, não bot. Responde no mesmo dia útil." },
];

export function Beneficios() {
  return (
    <section
      id="beneficios"
      aria-label="Benefícios do Mesivo"
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
              Por que Mesivo
            </span>
            <h2
              style={{
                marginTop: 12,
                fontSize: "clamp(2rem, 3.6vw, 3rem)",
                lineHeight: 1.02,
                color: "var(--fg-hi)",
              }}
            >
              O que a operação{" "}
              <span className="mesivo-accent">ganha</span> quando tudo conversa.
            </h2>
          </div>
        </MotionReveal>

        <div
          style={{
            marginTop: 40,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 16,
          }}
        >
          <MotionStagger>
            <>
              {beneficios.map((b) => (
                <MotionStaggerItem key={b.t}>
                  <div
                    style={{
                      height: "100%",
                      padding: "22px 24px",
                      borderRadius: 20,
                      border: "1px solid var(--hairline)",
                      backgroundColor: "var(--surface-1)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 17,
                        fontWeight: 700,
                        color: "var(--fg-hi)",
                        letterSpacing: "-0.01em",
                      }}
                    >
                      {b.t}
                    </div>
                    <p style={{ marginTop: 8, color: "var(--fg-mid)", fontSize: 14, lineHeight: 1.55 }}>
                      {b.d}
                    </p>
                  </div>
                </MotionStaggerItem>
              ))}
            </>
          </MotionStagger>
        </div>

      </div>
    </section>
  );
}
