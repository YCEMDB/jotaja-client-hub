import { MotionReveal } from "@/components/motion";

export function CTAFinal() {
  return (
    <section
      id="cadastro"
      aria-label="Começar com o Mesivo"
      style={{
        paddingBlock: "clamp(72px, 9vw, 128px)",
        backgroundColor: "var(--fg-hi)",
        color: "var(--mesivo-cream)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: "auto -10% -40% -10%",
          height: "70%",
          background:
            "radial-gradient(closest-side, color-mix(in oklab, var(--mesivo-tomato) 55%, transparent), transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "relative",
          maxWidth: 720,
          marginInline: "auto",
          paddingInline: "clamp(16px, 4vw, 32px)",
          textAlign: "center",
        }}
      >
        <MotionReveal variant="fade">
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "var(--mesivo-peach)",
            }}
          >
            14 dias grátis · Sem cartão
          </span>
          <h2
            style={{
              marginTop: 16,
              fontSize: "clamp(2.25rem, 4.6vw, 3.75rem)",
              lineHeight: 1,
              color: "var(--mesivo-white)",
            }}
          >
            Pronto para operar em{" "}
            <span className="mesivo-accent" style={{ color: "var(--mesivo-mango)" }}>
              um só ritmo
            </span>
            ?
          </h2>
          <p
            style={{
              marginTop: 16,
              fontSize: "clamp(1rem, 1.4vw, 1.15rem)",
              color: "color-mix(in oklab, var(--mesivo-cream) 80%, transparent)",
              maxWidth: 520,
              marginInline: "auto",
              lineHeight: 1.55,
            }}
          >
            Ative o Mesivo no seu restaurante hoje e comece a receber pedidos
            pelo seu link — sem comissão, sem intermediário.
          </p>

          <div
            style={{
              marginTop: 32,
              display: "flex",
              flexWrap: "wrap",
              gap: 12,
              justifyContent: "center",
            }}
          >
            <a
              href="https://wa.me/5527992877008?text=Quero%20come%C3%A7ar%20com%20o%20Mesivo"
              target="_blank"
              rel="noopener"
              style={{
                display: "inline-flex",
                padding: "14px 26px",
                borderRadius: 999,
                backgroundColor: "var(--mesivo-tomato)",
                color: "var(--mesivo-white)",
                fontWeight: 700,
                fontSize: 15,
              }}
            >
              Começar grátis por 14 dias
            </a>
            <a
              href="/contato"
              style={{
                display: "inline-flex",
                padding: "14px 26px",
                borderRadius: 999,
                border: "1.5px solid color-mix(in oklab, var(--mesivo-cream) 40%, transparent)",
                color: "var(--mesivo-cream)",
                fontWeight: 600,
                fontSize: 15,
              }}
            >
              Falar com especialista
            </a>
          </div>
        </MotionReveal>
      </div>
    </section>
  );
}
