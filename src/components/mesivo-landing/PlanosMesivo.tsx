import { MotionReveal, MotionStagger, MotionStaggerItem } from "@/components/motion";

const planos = [
  {
    name: "Starter",
    price: "R$ 97",
    per: "/mês",
    desc: "Para quem está começando o delivery próprio.",
    features: [
      "Cardápio digital com link exclusivo",
      "Até 30 produtos e 10 categorias",
      "Até 300 pedidos por mês",
      "1 usuário",
      "Áreas de entrega e mensagens transacionais",
    ],
    cta: "Começar teste grátis",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "R$ 197",
    per: "/mês",
    desc: "Operação completa para restaurantes em ritmo diário.",
    features: [
      "Tudo do Starter, com limites maiores",
      "PDV, salão e até 30 mesas",
      "Estoque, cupons (até 20) e drivers (até 5)",
      "Pagamento online e impressão automática",
      "Relatórios avançados e finance básico",
      "Até 5 usuários e 1.500 pedidos/mês",
    ],
    cta: "Testar Pro grátis",
    highlighted: true,
  },
  {
    name: "Business",
    price: "R$ 397",
    per: "/mês",
    desc: "Para redes e restaurantes com alto volume.",
    features: [
      "Tudo do Pro, sem limites de uso",
      "Multi-loja (até 5 unidades)",
      "Finance DRE e conciliação",
      "API de integração e receitas de estoque",
      "Campanhas de marketing e 5 canais de comunicação",
    ],
    cta: "Começar teste grátis",
    highlighted: false,
  },
];

export function PlanosMesivo() {
  return (
    <section
      id="planos"
      aria-label="Planos e preços"
      style={{ paddingBlock: "clamp(64px, 8vw, 120px)", backgroundColor: "var(--mesivo-cream)" }}
    >
      <div style={{ maxWidth: 1120, marginInline: "auto", paddingInline: "clamp(16px, 4vw, 32px)" }}>
        <MotionReveal variant="fade">
          <div style={{ maxWidth: 640, marginInline: "auto", textAlign: "center" }}>
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "var(--mesivo-tomato)",
              }}
            >
              Planos
            </span>
            <h2
              style={{
                marginTop: 12,
                fontSize: "clamp(2rem, 3.6vw, 3rem)",
                lineHeight: 1.02,
                color: "var(--fg-hi)",
              }}
            >
              Preços simples, <span className="mesivo-accent">sem surpresa</span>.
            </h2>
            <p style={{ marginTop: 12, color: "var(--fg-mid)" }}>
              14 dias grátis em qualquer plano. Mensalidade fixa, sem comissão por venda. Cancele quando quiser.
            </p>
          </div>
        </MotionReveal>

        <div
          style={{
            marginTop: 40,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 20,
          }}
        >
          <MotionStagger>
            <>

          {planos.map((p) => (
            <MotionStaggerItem key={p.name}>
              <div
                style={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  padding: "28px 26px",
                  borderRadius: 24,
                  backgroundColor: "var(--mesivo-warm-white)",
                  border: p.highlighted
                    ? "1.5px solid var(--mesivo-tomato)"
                    : "1px solid var(--hairline)",
                  boxShadow: p.highlighted
                    ? "0 24px 60px -30px color-mix(in oklab, var(--mesivo-tomato) 40%, transparent)"
                    : "none",
                  position: "relative",
                }}
              >
                {p.highlighted && (
                  <span
                    style={{
                      position: "absolute",
                      top: -12,
                      left: 20,
                      padding: "4px 12px",
                      borderRadius: 999,
                      backgroundColor: "var(--mesivo-tomato)",
                      color: "var(--mesivo-white)",
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                    }}
                  >
                    Mais escolhido
                  </span>
                )}
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--mesivo-tomato)" }}>
                  {p.name}
                </div>
                <div
                  style={{
                    marginTop: 12,
                    display: "flex",
                    alignItems: "baseline",
                    gap: 4,
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "clamp(2.25rem, 3.4vw, 2.75rem)",
                      fontWeight: 700,
                      color: "var(--fg-hi)",
                      lineHeight: 1,
                    }}
                  >
                    {p.price}
                  </span>
                  <span style={{ color: "var(--fg-mid)", fontSize: 14 }}>{p.per}</span>
                </div>
                <p style={{ marginTop: 8, color: "var(--fg-mid)", fontSize: 14, lineHeight: 1.5 }}>
                  {p.desc}
                </p>
                <a
                  href="#cadastro"
                  style={{
                    marginTop: 20,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "12px 18px",
                    borderRadius: 999,
                    fontWeight: 600,
                    fontSize: 14,
                    backgroundColor: p.highlighted ? "var(--mesivo-tomato)" : "var(--fg-hi)",
                    color: "var(--mesivo-white)",
                  }}
                >
                  {p.cta}
                </a>
                <ul
                  style={{
                    marginTop: 22,
                    display: "grid",
                    gap: 10,
                    listStyle: "none",
                    padding: 0,
                    flex: 1,
                  }}
                >
                  {p.features.map((f) => (
                    <li
                      key={f}
                      style={{
                        display: "flex",
                        gap: 10,
                        alignItems: "flex-start",
                        color: "var(--fg-hi)",
                        fontSize: 14,
                        lineHeight: 1.45,
                      }}
                    >
                      <span
                        aria-hidden
                        style={{
                          marginTop: 3,
                          width: 14,
                          height: 14,
                          borderRadius: 999,
                          backgroundColor: "var(--mesivo-peach)",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "var(--mesivo-tomato)",
                          fontSize: 10,
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                      >
                        ✓
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
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
