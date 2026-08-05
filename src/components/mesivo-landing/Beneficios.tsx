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
                color: "var(--accent)",
              }}
            >
              Por que Mesivo
            </span>
            <h2
              className="mt-6 text-[clamp(2.5rem,5vw,4.5rem)] leading-[0.95] tracking-tight font-extrabold text-foreground"
            >
              O que a operação{" "}
              <span className="text-accent">ganha</span> quando tudo conversa.
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
                    className="group relative h-full p-10 rounded-[32px] border border-black/[0.03] bg-white shadow-lg transition-all duration-500 hover:shadow-2xl hover:-translate-y-2"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[32px]" />
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
