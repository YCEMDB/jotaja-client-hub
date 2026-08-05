import { MotionReveal, MotionText } from "@/components/motion";
import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";

export function LandingHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.3], [1, 0.95]);

  return (
    <section
      ref={containerRef}
      id="produto"
      className="relative min-h-screen flex flex-col items-center pt-32 pb-20 overflow-hidden bg-cream"
    >
      <div className="relative z-10 w-full max-w-[1440px] px-8 text-center">
        <motion.div style={{ opacity, scale }}>
          <MotionReveal variant="fade" delay={0.1}>
            <span className="inline-block font-mono text-[10px] tracking-[0.2em] uppercase text-sage mb-8">
              O sistema operacional do restaurante.
            </span>
          </MotionReveal>

          <div className="max-w-5xl mx-auto">
            <h1 className="font-display text-[clamp(3.5rem,9vw,9rem)] leading-[0.82] tracking-[-0.07em] text-foreground mb-12">
              <MotionText
                lines={["Seu restaurante.", "Em um só ritmo."]}
                delay={0.2}
              />
            </h1>
          </div>

          <MotionReveal delay={0.4}>
            <p className="max-w-xl mx-auto text-xl text-muted-foreground font-sans leading-relaxed mb-12">
              Uma única interface editorial para comandar toda a operação. <br className="hidden md:block" />
              Do salão à cozinha, sem esforço, com precisão absoluta.
            </p>
          </MotionReveal>

          <MotionReveal delay={0.5}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <a
                href="#cadastro"
                className="h-16 px-12 rounded-full bg-deep-forest text-cream font-sans font-bold text-base tracking-tight transition-editorial hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center min-w-[220px]"
              >
                Começar agora
              </a>
              <a
                href="#demo"
                className="h-16 px-12 rounded-full border border-border text-foreground font-sans font-bold text-base tracking-tight transition-editorial hover:bg-deep-forest/5 flex items-center justify-center min-w-[220px]"
              >
                Ver demonstração
              </a>
            </div>
          </MotionReveal>
        </motion.div>

        {/* Cinematic Dashboard Showcase - Refined following image-11.png style */}
        <MotionReveal variant="up" delay={0.7} className="mt-28 w-full">
          <div className="relative w-full max-w-6xl mx-auto perspective-2000">
            <motion.div
              style={{
                rotateX: useTransform(scrollYProgress, [0, 0.3], [10, 0]),
                scale: useTransform(scrollYProgress, [0, 0.3], [0.92, 1]),
              }}
              className="relative w-full aspect-[16/10] bg-white rounded-3xl shadow-[0_50px_100px_-20px_rgba(23,58,52,0.12)] border border-border overflow-hidden"
            >
              {/* Dashboard UI mockup following visual brand guide */}
              <div className="flex h-full text-left">
                {/* Sidebar - Deep Forest */}
                <div className="w-64 bg-deep-forest p-8 hidden md:flex flex-col">
                  <div className="w-8 h-8 rounded-lg bg-cream/10 border border-cream/20 flex items-center justify-center mb-12">
                    <div className="w-4 h-4 grid grid-cols-2 gap-0.5">
                      <div className="bg-cream rounded-[0.5px]" />
                      <div className="bg-cream rounded-[0.5px]" />
                      <div className="bg-cream rounded-[0.5px]" />
                      <div className="bg-copper rounded-[0.5px]" />
                    </div>
                  </div>
                  <div className="space-y-8">
                    {["Visão geral", "Mesas", "Pedidos", "Cardápio", "Financeiro"].map((label, i) => (
                      <div key={label} className="flex items-center gap-4 opacity-60">
                        <div className="w-4 h-4 rounded bg-cream/20" />
                        <div className="h-2 w-24 bg-cream/20 rounded-full" />
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Main Content Area - Cream background style */}
                <div className="flex-1 p-14 bg-[#FAFAFA]">
                  <div className="flex justify-between items-center mb-16">
                    <div>
                      <h2 className="font-display text-3xl tracking-tight text-foreground">Visão geral</h2>
                      <div className="h-1 w-12 bg-copper mt-4 rounded-full" />
                    </div>
                    <div className="h-10 px-4 rounded-full border border-border flex items-center gap-2 text-xs font-mono text-muted-foreground bg-white">
                      <span>Hoje</span>
                      <div className="w-2 h-2 border-r border-b border-muted-foreground rotate-45 mb-1" />
                    </div>
                  </div>
                  
                  {/* Metric Cards following image-11.png */}
                  <div className="grid grid-cols-4 gap-8 mb-16">
                    {[
                      { label: "Faturamento", val: "R$ 12.450,00", trend: "+ 12,5%" },
                      { label: "Pedidos", val: "86", trend: "+ 8,3%" },
                      { label: "Ticket médio", val: "R$ 144,77", trend: "+ 5,7%" },
                      { label: "Mesas ocupadas", val: "14", trend: "+ 2" },
                    ].map((m) => (
                      <div key={m.label} className="bg-white p-6 rounded-2xl border border-border shadow-sm">
                        <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-4 block">{m.label}</span>
                        <div className="font-display text-2xl font-bold mb-2">{m.val}</div>
                        <span className="text-[10px] font-bold text-sage">{m.trend}</span>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-5 gap-10 h-full">
                    {/* Active Orders List */}
                    <div className="col-span-3 space-y-6">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-xs font-bold text-foreground">Pedidos em andamento</span>
                      </div>
                      {[12, 7, 3].map((num, i) => (
                        <div key={num} className="flex items-center justify-between p-5 bg-white rounded-xl border border-border">
                          <div className="flex items-center gap-6">
                            <span className="font-mono text-xs font-bold">Mesa {num}</span>
                            <span className="text-[10px] text-muted-foreground">2 itens</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-[10px] font-mono">12:45</span>
                            <span className={`px-3 py-1 rounded-full text-[9px] font-bold ${i === 2 ? 'bg-sage/10 text-sage' : 'bg-copper/10 text-copper'}`}>
                              {i === 2 ? 'Pronto' : 'Em preparo'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Table Map Visual */}
                    <div className="col-span-2 bg-white rounded-2xl border border-border p-8">
                      <span className="text-xs font-bold mb-8 block">Mapa de mesas</span>
                      <div className="grid grid-cols-3 gap-4">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                          <div 
                            key={m} 
                            className={`aspect-square rounded-xl border flex items-center justify-center text-[10px] font-mono font-bold transition-all ${
                              m === 12 ? 'bg-copper text-white border-copper' : 
                              m % 3 === 0 ? 'bg-deep-forest text-cream border-deep-forest' : 
                              'bg-cream/20 text-foreground border-border'
                            }`}
                          >
                            {m.toString().padStart(2, '0')}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </MotionReveal>
      </div>
    </section>
  );
}
