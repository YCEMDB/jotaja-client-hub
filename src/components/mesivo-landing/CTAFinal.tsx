import { MotionReveal } from "@/components/motion";

export function CTAFinal() {
  return (
    <section
      id="cadastro"
      className="relative py-24 md:py-40 bg-primary overflow-hidden text-center"
    >
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[80%] h-[80%] bg-accent/20 blur-[120px] rounded-full" />
        <div className="absolute inset-0 bg-noise opacity-10 mix-blend-overlay" />
      </div>

      <div className="container relative z-10 mx-auto px-6 max-w-4xl">
        <MotionReveal variant="fade">
          <span className="text-[10px] font-bold uppercase tracking-widest text-accent mb-8 block">
            14 dias grátis · Sem cartão
          </span>
          
          <h2 className="text-[clamp(2.5rem,6vw,5rem)] font-extrabold leading-[0.9] tracking-[-0.04em] text-primary-foreground mb-8">
            Pronto para operar em <br />
            <span className="text-accent">um só ritmo</span>?
          </h2>

          <p className="text-lg md:text-xl font-medium text-primary-foreground/70 leading-relaxed mb-12 max-w-2xl mx-auto">
            Ative o Mesivo no seu restaurante hoje e comece a receber pedidos
            pelo seu link — sem comissão, sem intermediário.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="https://wa.me/5527992877008?text=Quero%20come%C3%A7ar%20com%20o%20Mesivo"
              target="_blank"
              rel="noopener"
              className="w-full sm:w-auto px-10 py-5 rounded-full bg-accent text-white font-bold text-lg shadow-glow transition-transform hover:scale-105 active:scale-95"
            >
              Começar Agora
            </a>
            <a
              href="/contato"
              className="w-full sm:w-auto px-10 py-5 rounded-full border border-white/20 text-white font-bold text-lg backdrop-blur-sm hover:bg-white/10 transition-colors"
            >
              Falar com Especialista
            </a>
          </div>
        </MotionReveal>
      </div>
    </section>
  );
}
