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
      className="relative py-40 bg-cream"
    >
      <div className="max-w-[1440px] mx-auto px-8">
        <MotionReveal variant="fade" className="text-center mb-24">
          <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-copper mb-8 block">
            Investimento
          </span>
          <h2 className="font-display text-[clamp(2.5rem,5vw,5rem)] leading-[0.9] tracking-[-0.05em] text-foreground">
            Escolha o seu <span className="font-serif italic text-deep-forest">ritmo</span>.
          </h2>
        </MotionReveal>

        <div className="grid md:grid-cols-3 gap-8 items-stretch">
          <MotionStagger>
            <>
              {planos.map((p) => (
                <MotionStaggerItem key={p.name} className="h-full">
                  <div
                    className={`relative h-full flex flex-col p-12 rounded-[32px] border transition-editorial group ${
                      p.highlighted
                        ? "bg-deep-forest text-cream border-deep-forest shadow-2xl scale-[1.02] z-10"
                        : "bg-white border-border hover:shadow-xl"
                    }`}
                  >
                    <div className="mb-8">
                      <span className={`font-mono text-[10px] tracking-widest uppercase ${p.highlighted ? 'text-sage' : 'text-copper'}`}>
                        {p.name}
                      </span>
                      <div className="mt-4 flex items-baseline gap-2">
                        <span className="font-display text-5xl tracking-tighter font-bold">
                          {p.price}
                        </span>
                        <span className={`text-xs opacity-60 font-mono`}>{p.per}</span>
                      </div>
                      <p className={`mt-6 text-sm leading-relaxed ${p.highlighted ? 'text-cream/70' : 'text-muted-foreground'}`}>
                        {p.desc}
                      </p>
                    </div>

                    <ul className="space-y-4 mb-12 flex-1">
                      {p.features.map((f) => (
                        <li key={f} className="flex items-start gap-3 text-sm leading-tight">
                          <span className={`mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0 ${p.highlighted ? 'bg-sage' : 'bg-copper'}`} />
                          <span className={p.highlighted ? 'text-cream/90' : 'text-foreground/80'}>{f}</span>
                        </li>
                      ))}
                    </ul>

                    <a
                      href="#cadastro"
                      className={`inline-flex h-14 items-center justify-center rounded-full font-sans font-bold text-sm tracking-tight transition-editorial ${
                        p.highlighted
                          ? "bg-cream text-deep-forest hover:bg-white"
                          : "bg-deep-forest text-cream hover:opacity-90"
                      }`}
                    >
                      {p.cta}
                    </a>
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
