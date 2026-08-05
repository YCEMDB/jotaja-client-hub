import { MotionReveal } from "@/components/motion";

const problemas = [
  "Pedido chega por WhatsApp, mesa por caderno, retirada por telefone.",
  "Cozinha só sabe do pedido quando o garçom lembra.",
  "Fechamento de caixa consome horas e nunca bate.",
  "Marketplaces cobram 20% de comissão e ficam com seu cliente.",
];

const solucoes = [
  "Todos os canais chegam no mesmo painel, em tempo real.",
  "Cozinha vê o pedido no KDS assim que ele entra.",
  "Caixa fecha em minutos, com relatório automático por turno.",
  "Você recebe direto no seu Pix ou conta, sem intermediário.",
];

export function ProblemaSolucao() {
  return (
    <section
      id="problema-solucao"
      className="py-40 bg-white"
    >
      <div className="max-w-[1440px] mx-auto px-8">
        <MotionReveal variant="fade" className="text-center mb-24">
          <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-copper mb-8 block">
            O Contraste
          </span>
          <h2 className="font-display text-[clamp(2.5rem,5vw,5rem)] leading-[0.9] tracking-[-0.05em] text-foreground mb-12">
            A rotina real, <br /><span className="italic font-serif text-deep-forest">antes e depois</span> do Mesivo.
          </h2>
        </MotionReveal>

        <div className="grid lg:grid-cols-2 gap-8">
          <MotionReveal variant="fade">
            <div className="p-16 rounded-[40px] bg-[#F1F1F1] border border-border h-full">
              <div className="flex items-center gap-4 mb-12">
                <span className="w-10 h-10 rounded-full bg-border flex items-center justify-center font-mono text-sm text-muted-foreground">
                  —
                </span>
                <span className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
                  Sem Mesivo
                </span>
              </div>
              <ul className="space-y-8">
                {problemas.map((p) => (
                  <li key={p} className="text-xl text-muted-foreground leading-relaxed font-sans opacity-60">
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          </MotionReveal>

          <MotionReveal variant="fade" delay={0.1}>
            <div className="p-16 rounded-[40px] bg-deep-forest border border-deep-forest h-full shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-copper/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-12">
                  <span className="w-10 h-10 rounded-full bg-copper flex items-center justify-center font-mono text-sm text-white">
                    ✓
                  </span>
                  <span className="font-mono text-[10px] tracking-widest uppercase text-copper">
                    Com Mesivo
                  </span>
                </div>
                <ul className="space-y-8">
                  {solucoes.map((s) => (
                    <li key={s} className="text-xl text-cream leading-relaxed font-sans">
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </MotionReveal>
        </div>
      </div>
    </section>
  );
}
