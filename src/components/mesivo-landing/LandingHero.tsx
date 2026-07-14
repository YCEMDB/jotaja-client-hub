import { MotionReveal, MotionText } from "@/components/motion";
import { CoralGlow } from "@/components/mesivo-graphics/CoralGlow";
import { MockupPhoneCardapio } from "@/components/mesivo-mockups/MockupPhoneCardapio";

/**
 * LandingHero — bloco de abertura da home Mesivo.
 * Tipografia: Bricolage no display (escala clamp), Instrument Serif no acento,
 * Manrope no corpo. Números em tabular-nums (herdado do variant="landing").
 */
export function LandingHero() {
  return (
    <section
      id="produto"
      aria-label="Apresentação da plataforma Mesivo"
      style={{
        position: "relative",
        overflow: "hidden",
        paddingBlock: "clamp(56px, 8vw, 112px)",
      }}
    >
      <CoralGlow
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: 1200,
          marginInline: "auto",
          paddingInline: "clamp(16px, 4vw, 32px)",
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr)",
          gap: "clamp(32px, 5vw, 56px)",
          alignItems: "center",
        }}
      >
        <div className="grid gap-10 md:grid-cols-[1.15fr_1fr] md:items-center">
          <div>
            <MotionReveal variant="fade" delay={0}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "6px 14px",
                  borderRadius: 999,
                  border: "1px solid var(--hairline)",
                  backgroundColor: "color-mix(in oklab, var(--mesivo-cream) 90%, transparent)",
                  color: "var(--mesivo-coffee)",
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: "0.02em",
                  textTransform: "uppercase",
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 999,
                    backgroundColor: "var(--mesivo-tomato)",
                  }}
                />
                Plataforma completa para restaurantes
              </span>
            </MotionReveal>

            <div
              className="mt-6"
              style={{
                fontSize: "clamp(2.5rem, 5.7vw, 5.5rem)",
                lineHeight: 0.96,
                letterSpacing: "-0.045em",
                fontWeight: 750 as unknown as number,
                color: "var(--fg-hi)",
              }}
            >
              <MotionText
                as="h1"
                lines={[
                  "Seu restaurante,",
                  <>
                    em um <span className="mesivo-accent">só ritmo</span>.
                  </>,
                ]}
                ariaLabel="Seu restaurante, em um só ritmo."
              />
            </div>


            <MotionReveal delay={0.2}>
              <p
                style={{
                  marginTop: 20,
                  maxWidth: 540,
                  fontSize: "clamp(1rem, 1.2vw, 1.15rem)",
                  lineHeight: 1.55,
                  color: "var(--fg-mid)",
                }}
              >
                Cardápio digital, pedidos online, PDV, mesas, comandas, cozinha e
                caixa — sincronizados em tempo real. Sem comissão por venda, com
                fluxo pensado para a rotina de quem opera todos os dias.
              </p>
            </MotionReveal>

            <MotionReveal
              delay={0.32}
              style={{
                marginTop: 28,
                display: "flex",
                flexWrap: "wrap",
                gap: 12,
              }}
            >
              <a
                href="#cadastro"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "14px 24px",
                  borderRadius: 999,
                  backgroundColor: "var(--mesivo-tomato)",
                  color: "var(--mesivo-white)",
                  fontWeight: 600,
                  fontSize: 15,
                }}
              >
                Começar grátis por 14 dias
              </a>
              <a
                href="#como-funciona"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "14px 24px",
                  borderRadius: 999,
                  border: "1.5px solid var(--hairline-strong, var(--hairline))",
                  color: "var(--fg-hi)",
                  fontWeight: 600,
                  fontSize: 15,
                  backgroundColor: "transparent",
                }}
              >
                Ver como funciona
              </a>
            </MotionReveal>

            <MotionReveal
              delay={0.4}
              style={{
                marginTop: 20,
                fontSize: 13,
                color: "var(--fg-low)",
                display: "flex",
                gap: 16,
                flexWrap: "wrap",
              }}
            >
              <span>Sem cartão de crédito</span>
              <span aria-hidden>•</span>
              <span>Setup em 30 minutos</span>
              <span aria-hidden>•</span>
              <span>Suporte no WhatsApp</span>
            </MotionReveal>
          </div>

          <MotionReveal variant="up" delay={0.15}>
            <div
              style={{
                position: "relative",
                aspectRatio: "3 / 4",
                maxWidth: 360,
                marginInline: "auto",
                borderRadius: 32,
                background:
                  "linear-gradient(160deg, var(--mesivo-peach) 0%, var(--mesivo-cream) 100%)",
                border: "1px solid var(--hairline)",
                padding: 20,
                boxShadow: "0 30px 60px -30px color-mix(in oklab, var(--mesivo-tomato) 30%, transparent)",
              }}
            >
              <MockupPhoneCardapio className="h-full w-full" />
            </div>
          </MotionReveal>
        </div>

        <MotionReveal variant="fade" delay={0.5}>
          <ul
            aria-label="Métricas operacionais"
            style={{
              marginTop: 24,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: 16,
              padding: "20px 24px",
              borderRadius: 20,
              border: "1px solid var(--hairline)",
              backgroundColor: "color-mix(in oklab, var(--mesivo-warm-white) 92%, transparent)",
            }}
          >
            {[
              { k: "1.400+", l: "restaurantes ativos" },
              { k: "R$ 0", l: "de comissão por pedido" },
              { k: "30 min", l: "para começar a vender" },
              { k: "24/7", l: "suporte especializado" },
            ].map((it) => (
              <li key={it.l} style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "clamp(1.6rem, 2.4vw, 2rem)",
                    fontWeight: 700,
                    color: "var(--fg-hi)",
                    lineHeight: 1,
                  }}
                >
                  {it.k}
                </div>
                <div
                  style={{
                    marginTop: 6,
                    fontSize: 12,
                    color: "var(--fg-mid)",
                    letterSpacing: "0.02em",
                  }}
                >
                  {it.l}
                </div>
              </li>
            ))}
          </ul>
        </MotionReveal>
      </div>
    </section>
  );
}
