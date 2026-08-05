import { MotionReveal, MotionText } from "@/components/motion";
import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";

export function LandingHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);

  return (
    <section
      ref={containerRef}
      id="produto"
      className="relative min-h-screen flex flex-col items-center pt-40 pb-20 overflow-hidden bg-cream"
    >
      {/* Studio Lighting Effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div 
          className="absolute top-[-10%] left-[-10%] w-[120%] h-[120%]"
          style={{
            background: "radial-gradient(circle at 50% 30%, rgba(216, 122, 67, 0.03) 0%, transparent 70%)",
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-[1440px] px-8 text-center">
        <motion.div style={{ opacity, y, scale }}>
          <MotionReveal variant="fade" delay={0.1}>
            <span className="inline-block font-mono text-[10px] tracking-[0.2em] uppercase text-sage mb-8">
              Mesivo Operating System
            </span>
          </MotionReveal>

          <div className="max-w-4xl mx-auto">
            <h1 className="font-display text-[clamp(3.5rem,10vw,8.5rem)] leading-[0.85] tracking-[-0.06em] text-foreground mb-12">
              <MotionText
                lines={["Seu restaurante.", "Finalmente sincronizado."]}
                delay={0.2}
              />
            </h1>
          </div>

          <MotionReveal delay={0.4}>
            <p className="max-w-xl mx-auto text-lg text-muted-foreground font-sans leading-relaxed mb-12">
              Uma única interface para comandar toda a operação. <br className="hidden md:block" />
              Do pedido à cozinha, do caixa à gestão. Sem esforço.
            </p>
          </MotionReveal>

          <MotionReveal delay={0.5}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="#cadastro"
                className="group relative inline-flex h-14 items-center justify-center px-10 rounded-full bg-deep-forest text-cream font-sans font-bold text-sm tracking-tight transition-editorial hover:scale-[1.02] active:scale-[0.98]"
              >
                Começar agora
              </a>
              <a
                href="#demo"
                className="inline-flex h-14 items-center justify-center px-10 rounded-full border border-border text-foreground font-sans font-bold text-sm tracking-tight transition-editorial hover:bg-deep-forest/5"
              >
                Ver demonstração
              </a>
            </div>
          </MotionReveal>
        </motion.div>

        {/* Cinematic Dashboard Showcase */}
        <MotionReveal variant="up" delay={0.7} className="mt-24 w-full">
          <div className="relative w-full max-w-6xl mx-auto perspective-2000">
            <motion.div
              style={{
                rotateX: useTransform(scrollYProgress, [0, 0.3], [15, 0]),
                scale: useTransform(scrollYProgress, [0, 0.3], [0.95, 1]),
              }}
              className="relative w-full aspect-[16/10] bg-white rounded-2xl shadow-2xl border border-border overflow-hidden"
            >
              {/* Pseudo Dashboard UI - Magazine/Editorial Style */}
              <div className="flex h-full">
                {/* Sidebar */}
                <div className="w-64 border-r border-border p-8 hidden md:block bg-[#FAFAFA]">
                  <div className="w-8 h-8 rounded-lg bg-deep-forest mb-12" />
                  <div className="space-y-6">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className={`h-1 rounded-full w-${i % 2 === 0 ? '24' : '16'} bg-border`} />
                    ))}
                  </div>
                </div>
                {/* Main */}
                <div className="flex-1 p-12 bg-white">
                  <div className="flex justify-between items-end mb-16">
                    <div>
                      <div className="h-2 w-24 bg-border rounded-full mb-4" />
                      <div className="h-8 w-48 bg-deep-forest/5 rounded-lg" />
                    </div>
                    <div className="h-10 w-10 rounded-full bg-border" />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-12">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="space-y-4">
                        <div className="h-1 w-12 bg-sage/30 rounded-full" />
                        <div className="h-12 w-full bg-cream rounded-xl" />
                        <div className="space-y-2">
                          <div className="h-1 w-full bg-border rounded-full" />
                          <div className="h-1 w-2/3 bg-border rounded-full" />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-20 h-64 w-full bg-[#FDFDFD] border border-border/50 rounded-2xl p-8">
                    <div className="h-2 w-32 bg-border rounded-full mb-8" />
                    <div className="flex items-end gap-2 h-32">
                      {[40, 70, 45, 90, 65, 80, 55].map((h, i) => (
                        <div 
                          key={i} 
                          className="flex-1 bg-deep-forest/5 rounded-t-lg"
                          style={{ height: `${h}%` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Refined Shadow/Glow on Dashboard */}
              <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_100px_rgba(255,255,255,0.5)]" />
            </motion.div>
            
            {/* Dashboard Reflection/Glow */}
            <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-[80%] h-40 bg-deep-forest/5 blur-[100px] rounded-full -z-10" />
          </div>
        </MotionReveal>
      </div>
    </section>
  );
}
