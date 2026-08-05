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
      style={{ paddingBlock: "clamp(64px, 8vw, 120px)", backgroundColor: "var(--background)" }}
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
                color: "var(--accent)",
              }}
            >
              Planos
            </span>
            <h2
              className="mt-6 text-[clamp(2.5rem,5vw,4.5rem)] leading-[0.95] tracking-tight font-extrabold text-foreground"
            >
              Preços simples, <span className="text-accent">sem surpresa</span>.
            </h2>
            <p className="mt-8 text-lg font-medium text-muted-foreground">
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
                className={`relative h-full flex flex-col p-10 rounded-[40px] border transition-all duration-500 group ${
                  p.highlighted
                    ? "bg-white shadow-2xl border-accent/20 scale-105 z-10"
                    : "bg-white/50 border-black/5 hover:bg-white hover:shadow-xl"
                }`}
              >
                {p.highlighted && (
                  <span
                    className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-1.5 rounded-full bg-accent text-white text-[10px] font-bold uppercase tracking-widest shadow-glow"
                  >
                    Mais escolhido
                  </span>
                )}
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--accent)" }}>
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
                    backgroundColor: p.highlighted ? "var(--accent)" : "var(--primary)",
                    color: p.highlighted ? "var(--accent-foreground)" : "var(--primary-foreground)",
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
                          backgroundColor: "var(--accent-soft)",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "var(--accent)",
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
