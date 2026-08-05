import { motion } from "motion/react";
import { MotionReveal } from "@/components/motion";

const layouts = [
  {
    name: "Editorial List",
    desc: "Para o cardápio ou listas de pedidos, com tipografia tabular e espaçamento generoso.",
    preview: (
      <div className="space-y-4 font-sans">
        <div className="flex justify-between items-baseline border-b border-border pb-2">
          <span className="font-display font-bold text-lg">Filé ao Molho Madeira</span>
          <span className="font-mono text-sm text-copper">R$ 84,00</span>
        </div>
        <div className="flex justify-between items-baseline border-b border-border pb-2 opacity-50">
          <span className="font-display font-bold text-lg">Risoto de Cogumelos</span>
          <span className="font-mono text-sm text-copper">R$ 62,00</span>
        </div>
      </div>
    )
  },
  {
    name: "Status Cards",
    desc: "Cards de métricas e status com sombras sutis e bordas arredondadas (32px).",
    preview: (
      <div className="bg-white p-6 rounded-[32px] border border-border shadow-sm">
        <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2 block">Vendas Hoje</span>
        <div className="font-display text-3xl font-bold text-deep-forest">R$ 4.290</div>
        <div className="mt-2 text-[10px] font-bold text-sage">+ 15% vs ontem</div>
      </div>
    )
  },
  {
    name: "The Conductor Grid",
    desc: "Mapa de mesas e timeline da cozinha em grid assimétrico.",
    preview: (
      <div className="grid grid-cols-3 gap-2">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className={`aspect-square rounded-xl border flex items-center justify-center font-mono text-xs ${i === 6 ? 'bg-copper border-copper text-white' : 'bg-cream/30 border-border text-deep-forest'}`}>
            0{i}
          </div>
        ))}
      </div>
    )
  }
];

export function MesivoTemplates() {
  return (
    <section id="templates" className="py-32 bg-[#FAF9F6] border-y border-border/50">
      <div className="max-w-[1440px] mx-auto px-8">
        <MotionReveal variant="fade" className="mb-24">
          <div className="grid lg:grid-cols-[1fr_400px] gap-20 items-start">
            <div>
              <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-copper mb-8 block">A Evolução do Design</span>
              <h2 className="font-display text-[clamp(2.5rem,5vw,5rem)] leading-[0.9] tracking-[-0.05em] text-foreground mb-12">
                Do funcional ao <br /><span className="italic font-serif text-deep-forest">Inquestionável</span>.
              </h2>
              
              <div className="grid md:grid-cols-2 gap-8 mb-20">
                <div className="p-10 bg-white border border-border rounded-[40px] shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4">
                    <span className="font-mono text-[9px] uppercase tracking-tighter text-muted-foreground/30 px-2 py-1 border border-border/50 rounded">Legacy 05/07</span>
                  </div>
                  <h3 className="font-display text-xl mb-4 text-slate-400">Design SaaS Padrão</h3>
                  <p className="text-sm text-muted-foreground/60 leading-relaxed font-sans mb-8">
                    Eficiente, azul comercial, bordas de 12px. O "bom" que todo mundo faz.
                  </p>
                  <div className="flex gap-2">
                    <div className="h-8 w-20 bg-blue-500 rounded-lg" />
                    <div className="h-8 w-8 bg-slate-100 rounded-lg" />
                  </div>
                </div>

                <div className="p-10 bg-deep-forest text-cream rounded-[40px] shadow-2xl relative overflow-hidden group ring-1 ring-copper/30">
                  <div className="absolute top-0 right-0 p-4">
                    <span className="font-mono text-[9px] uppercase tracking-tighter text-copper bg-copper/10 px-2 py-1 border border-copper/20 rounded">Current Mesivo</span>
                  </div>
                  <h3 className="font-display text-xl mb-4 text-cream">Design Editorial</h3>
                  <p className="text-sm text-cream/60 leading-relaxed font-sans mb-8">
                    Asimétrico, Deep Forest, bordas de 40px. O "único" que ninguém esquece.
                  </p>
                  <div className="flex gap-2">
                    <div className="h-8 w-24 bg-copper rounded-full" />
                    <div className="h-8 w-8 border border-cream/20 rounded-full" />
                  </div>
                </div>
              </div>

              <div className="grid gap-8">
                <h3 className="font-mono text-[10px] tracking-widest uppercase text-copper mb-4">Anatomia dos Novos Componentes</h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {layouts.map((l) => (
                    <div key={l.name} className="group h-full">
                      <div className="p-8 bg-white border border-border rounded-[32px] shadow-sm transition-editorial group-hover:shadow-md h-full flex flex-col justify-between">
                        <div>
                          <div className="mb-6">
                            <h4 className="font-display text-lg text-foreground mb-2">{l.name}</h4>
                            <p className="text-[10px] text-muted-foreground leading-relaxed uppercase tracking-wide">{l.desc}</p>
                          </div>
                          <div className="py-4 border-t border-border/50">
                            {l.preview}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <aside className="lg:sticky lg:top-32 space-y-8">
              <div className="p-8 bg-cream/50 border border-border rounded-[40px]">
                <h3 className="font-display text-xl mb-6">Próximos Passos</h3>
                <div className="space-y-6">
                  {[
                    { step: "01", title: "Fundação", desc: "Sora + IBM Plex Mono.", active: true },
                    { step: "02", title: "Ritmo", desc: "Transições de 0.7s Bezier.", active: true },
                    { step: "03", title: "Expansão", desc: "Dashboard Mesivo 2028.", active: false },
                  ].map((s) => (
                    <div key={s.step} className={`flex gap-4 ${s.active ? 'opacity-100' : 'opacity-40'}`}>
                      <span className="font-mono text-xs text-copper">{s.step}</span>
                      <div>
                        <h4 className="font-bold text-sm">{s.title}</h4>
                        <p className="text-[10px] text-muted-foreground">{s.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </MotionReveal>
      </div>
    </section>
  );
}
