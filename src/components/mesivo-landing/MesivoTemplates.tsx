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
    <section id="templates" className="py-40 bg-[#FAF9F6]">
      <div className="max-w-[1440px] mx-auto px-8">
        <MotionReveal variant="fade" className="mb-24">
          <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-copper mb-8 block">Plano de Ação & Design System</span>
          <h2 className="font-display text-[clamp(2.5rem,5vw,5rem)] leading-[0.9] tracking-[-0.05em] text-foreground mb-12">
            O plano para a <br /><span className="italic font-serif text-deep-forest">Identidade Mesivo</span>.
          </h2>
          
          <div className="grid md:grid-cols-2 gap-20 items-start">
            <div className="space-y-12">
              <div className="p-8 bg-deep-forest text-cream rounded-[40px] shadow-xl">
                <h3 className="font-display text-2xl mb-6">Etapa 01: A Fundação</h3>
                <ul className="space-y-4 font-sans text-cream/70 text-sm">
                  <li className="flex items-center gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-copper" />
                    Consolidação da paleta Deep Forest / Copper / Cream.
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-copper" />
                    Tipografia Sora (Display) e IBM Plex Mono (Dados).
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-copper" />
                    Iconografia minimalista com stroke 1.5.
                  </li>
                </ul>
              </div>

              <div className="p-8 border border-border rounded-[40px]">
                <h3 className="font-display text-2xl mb-6 text-foreground">Etapa 02: O Ritmo</h3>
                <ul className="space-y-4 font-sans text-muted-foreground text-sm">
                  <li className="flex items-center gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-sage" />
                    Transições de scroll suaves (MotionReveal/MotionText).
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-sage" />
                    Micro-interações de 60fps em botões e cards.
                  </li>
                </ul>
              </div>
            </div>

            <div className="grid gap-8">
              <h3 className="font-mono text-[10px] tracking-widest uppercase text-copper mb-4">Protótipos de Componentes</h3>
              {layouts.map((l) => (
                <div key={l.name} className="group">
                  <div className="mb-4">
                    <h4 className="font-display text-xl text-foreground mb-2">{l.name}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">{l.desc}</p>
                  </div>
                  <div className="p-10 bg-white border border-border rounded-[32px] shadow-sm transition-editorial group-hover:shadow-md">
                    {l.preview}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </MotionReveal>
      </div>
    </section>
  );
}
