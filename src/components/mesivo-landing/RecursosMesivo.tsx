import type { ReactNode } from "react";
import { MotionReveal } from "@/components/motion";
import { MockupPhoneCardapio } from "@/components/mesivo-mockups/MockupPhoneCardapio";
import { MockupMesas } from "@/components/mesivo-mockups/MockupMesas";
import { MockupKDS } from "@/components/mesivo-mockups/MockupKDS";
import { MockupCaixa } from "@/components/mesivo-mockups/MockupCaixa";

type Bloco = {
  id: string;
  eyebrow: string;
  title: ReactNode;
  desc: string;
  bullets: string[];
  mockup: ReactNode;
  reverse?: boolean;
};

const blocos: Bloco[] = [
  {
    id: "cardapio",
    eyebrow: "Cardápio digital",
    title: (
      <>
        Um link, <span className="text-accent">todo o cardápio</span>.
      </>
    ),
    desc: "O cliente pede pelo celular sem baixar app; você atualiza no painel e o cardápio muda na hora.",
    bullets: ["Categorias ilimitadas", "Adicionais e observações", "Esgotar item em 1 toque"],
    mockup: (
      <div className="perspective-2000">
        <div className="relative transform-gpu rotate-y-6 rotate-x-3 scale-90">
           <MockupPhoneCardapio className="h-full w-full mx-auto" />
        </div>
      </div>
    ),
  },
  {
    id: "mesas",
    eyebrow: "Mesas e comandas",
    title: <>Cada mesa tem sua história.</>,
    desc: "Abre comanda, transfere pedido, divide conta, imprime só a parte de quem vai embora.",
    bullets: ["Transferência entre mesas", "Divisão de conta", "Impressão parcial"],
    mockup: <MockupMesas />,
    reverse: true,
  },
  {
    id: "cozinha",
    eyebrow: "Cozinha (KDS)",
    title: (
      <>
        Cozinha com <span className="text-accent">ritmo próprio</span>.
      </>
    ),
    desc: "Pedidos aparecem por etapa com relógio por item. Sem comanda perdida, sem produção duplicada.",
    bullets: ["Etapas configuráveis", "Cronômetro por pedido", "Confirmação por toque"],
    mockup: <MockupKDS />,
  },
  {
    id: "caixa",
    eyebrow: "Caixa e financeiro",
    title: <>Fim do dia que fecha sozinho.</>,
    desc: "Abertura, sangrias, suprimentos e conferência. Relatório do turno gerado em 1 clique.",
    bullets: ["Fechamento por turno", "Relatório PDF/CSV", "Conciliação por método"],
    mockup: <MockupCaixa />,
    reverse: true,
  },
];

export function RecursosMesivo() {
  return (
    <section id="recursos" className="py-24 md:py-40 bg-background overflow-hidden">
      <div className="container mx-auto px-6">
        {blocos.map((b) => (
          <div
            key={b.id}
            id={b.id}
            className={`grid gap-16 md:grid-cols-2 items-center mb-24 last:mb-0`}
          >
            <MotionReveal
              variant="fade"
              className={b.reverse ? "md:order-2" : "md:order-1"}
            >
              <div className="max-w-xl">
                <span className="text-[10px] font-bold uppercase tracking-widest text-accent mb-6 block">
                  {b.eyebrow}
                </span>
                <h3 className="text-[clamp(2rem,4vw,3.5rem)] font-extrabold leading-[0.95] tracking-tight mb-8">
                  {b.title}
                </h3>
                <p className="text-lg text-muted-foreground font-medium leading-relaxed mb-10">
                  {b.desc}
                </p>
                <ul className="grid gap-4">
                  {b.bullets.map((x) => (
                    <li key={x} className="flex items-center gap-4 text-foreground font-bold text-sm">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-accent/10 text-accent flex items-center justify-center text-[10px]">
                        ✓
                      </span>
                      {x}
                    </li>
                  ))}
                </ul>
              </div>
            </MotionReveal>

            <MotionReveal
              variant="up"
              delay={0.1}
              className={`relative ${b.reverse ? "md:order-1" : "md:order-2"}`}
            >
              <div className="relative p-4 md:p-8 rounded-[40px] border border-black/[0.03] bg-white shadow-2xl transition-transform duration-700 hover:scale-[1.02]">
                <div className="absolute inset-0 bg-gradient-to-tr from-accent/[0.03] to-transparent rounded-[40px]" />
                <div className="relative z-10">
                  {b.mockup}
                </div>
              </div>
            </MotionReveal>
          </div>
        ))}
      </div>
    </section>
  );
}
