import { MotionReveal } from "@/components/motion";
import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { Terminal, Users, Cpu, Layout } from "lucide-react";

const sections = [
  {
    icon: Layout,
    title: "Interface Editorial",
    desc: "A gestão do seu restaurante com o refinamento de uma revista. Sem ruído, apenas clareza.",
  },
  {
    icon: Cpu,
    title: "Sincronia Invisível",
    desc: "Pedidos, cozinha e financeiro em um fluxo contínuo. Tudo acontece no tempo certo.",
  },
  {
    icon: Users,
    title: "Foco na Experiência",
    desc: "Tecnologia que desaparece para você focar no que importa: a hospitalidade.",
  },
  {
    icon: Terminal,
    title: "Precisão de Dados",
    desc: "Métricas apresentadas com elegância monospaçada. Decisões baseadas em fatos, não intuição.",
  },
];

export function Beneficios() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  return (
    <section
      ref={containerRef}
      id="beneficios"
      className="relative py-40 bg-cream overflow-hidden"
    >
      <div className="max-w-[1440px] mx-auto px-8">
        <div className="grid lg:grid-cols-2 gap-24 items-start">
          <div className="sticky top-40">
            <MotionReveal variant="fade">
              <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-copper mb-8 block">
                Filosofia Mesivo
              </span>
              <h2 className="font-display text-[clamp(2.5rem,5vw,5rem)] leading-[0.9] tracking-[-0.05em] text-foreground mb-12">
                Onde a tecnologia <br /> encontra a <span className="italic text-sage font-serif">serenidade</span>.
              </h2>
              <p className="max-w-md text-lg text-muted-foreground leading-relaxed">
                Nós não construímos apenas software. Nós projetamos o ritmo da sua operação. 
                Cada pixel é pensado para reduzir o esforço cognitivo e elevar o padrão do seu negócio.
              </p>
            </MotionReveal>
          </div>

          <div className="space-y-12">
            {sections.map((item, idx) => (
              <MotionReveal 
                key={item.title} 
                variant="fade" 
                delay={idx * 0.1}
              >
                <div className="group relative p-12 rounded-3xl bg-white border border-border transition-editorial hover:shadow-xl hover:scale-[1.01]">
                  <div className="flex items-start gap-8">
                    <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-cream flex items-center justify-center text-deep-forest group-hover:bg-deep-forest group-hover:text-cream transition-editorial">
                      <item.icon size={20} strokeWidth={1.5} />
                    </div>
                    <div>
                      <h3 className="font-display text-2xl tracking-tight text-foreground mb-4">
                        {item.title}
                      </h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                </div>
              </MotionReveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
