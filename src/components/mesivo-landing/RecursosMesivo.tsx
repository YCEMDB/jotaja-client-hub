import { MotionReveal } from "@/components/motion";

const recursos = [
  {
    tag: "Interface",
    title: "Comanda Digital",
    desc: "A precisão do papel com a inteligência do digital. Fluxo natural para garçons e cozinha.",
  },
  {
    tag: "Fluxo",
    title: "KDS Profissional",
    desc: "Gerenciamento de tempo real na cozinha. Cronometragem por prato e alertas de atraso.",
  },
  {
    tag: "Gestão",
    title: "Painel Financeiro",
    desc: "DRE, fluxo de caixa e conciliação bancária apresentados com clareza editorial.",
  },
];

export function RecursosMesivo() {
  return (
    <section id="recursos" className="py-40 bg-white border-y border-border">
      <div className="max-w-[1440px] mx-auto px-8">
        <div className="grid lg:grid-cols-3 gap-16">
          {recursos.map((r, i) => (
            <MotionReveal key={r.title} variant="fade" delay={i * 0.1}>
              <div className="group cursor-default">
                <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-sage mb-6 block">
                  {r.tag}
                </span>
                <h3 className="font-display text-4xl tracking-tighter mb-6 group-hover:text-copper transition-editorial">
                  {r.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed mb-8">
                  {r.desc}
                </p>
                <div className="h-px w-full bg-border origin-left group-hover:bg-copper group-hover:scale-x-110 transition-editorial" />
              </div>
            </MotionReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
