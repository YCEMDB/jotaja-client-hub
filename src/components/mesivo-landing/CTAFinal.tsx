import { MotionReveal } from "@/components/motion";

export function CTAFinal() {
  return (
    <section className="relative min-h-screen flex items-center justify-center bg-deep-forest overflow-hidden py-40">
      {/* Abstract Background Texture */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute inset-0 bg-noise" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,var(--copper)_0%,transparent_70%)] opacity-20" />
      </div>

      <div className="relative z-10 w-full max-w-4xl mx-auto px-8 text-center">
        <MotionReveal variant="fade">
          <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-sage mb-12 block">
            Pronto para começar?
          </span>
          <h2 className="font-display text-[clamp(3rem,8vw,7rem)] leading-[0.85] tracking-[-0.05em] text-cream mb-16">
            Eleve o nível da sua <span className="italic font-serif text-copper">operação</span> hoje.
          </h2>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <a
              href="#cadastro"
              className="h-16 px-12 rounded-full bg-cream text-deep-forest font-sans font-bold text-base tracking-tight transition-editorial hover:scale-105 active:scale-95 flex items-center justify-center min-w-[240px]"
            >
              Criar minha conta grátis
            </a>
            <a
              href="#contato"
              className="h-16 px-12 rounded-full border border-cream/20 text-cream font-sans font-bold text-base tracking-tight transition-editorial hover:bg-white/5 flex items-center justify-center min-w-[240px]"
            >
              Falar com consultor
            </a>
          </div>
          
          <p className="mt-12 font-mono text-[10px] uppercase tracking-widest text-cream/40">
            Teste grátis por 14 dias — sem cartão de crédito
          </p>
        </MotionReveal>
      </div>
    </section>
  );
}
