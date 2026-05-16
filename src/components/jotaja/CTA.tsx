import { LeadForm } from "./LeadFormDialog";
import { Check } from "lucide-react";

export function CTA() {
  return (
    <section id="cadastro" className="relative bg-ink text-background overflow-hidden border-y-[3px] border-ink">
      <div className="absolute inset-0 bg-noise opacity-50 pointer-events-none" />
      <div
        className="absolute -top-32 -right-32 w-[480px] h-[480px] rounded-full opacity-50 blur-3xl"
        style={{ background: "var(--gradient-sunset)" }}
      />
      <div
        className="absolute -bottom-32 -left-32 w-[420px] h-[420px] rounded-full opacity-30 blur-3xl"
        style={{ background: "radial-gradient(circle, oklch(0.5 0.22 290) 0%, transparent 70%)" }}
      />

      <div className="container mx-auto px-6 py-24 md:py-32 relative">
        <div className="grid lg:grid-cols-[1.1fr_1fr] gap-12 lg:gap-20 items-start">
          <div>
            <div className="inline-flex items-center gap-2 mb-6">
              <span className="h-2 w-2 rounded-full bg-brand-orange animate-pulse" />
              <span className="text-[11px] uppercase tracking-[0.2em] font-bold text-background/70">
                09 — Comece agora
              </span>
            </div>
            <h2 className="font-display text-background uppercase leading-[0.85] tracking-[-0.04em] text-[clamp(2.5rem,7vw,6rem)]">
              Seu delivery,
              <br />
              <span className="text-gradient-sunset">do seu jeito</span>,
              <br />
              <span className="italic font-normal" style={{ fontFamily: "Hind", fontWeight: 300 }}>
                sem intermediário.
              </span>
            </h2>
            <p className="mt-8 text-lg text-background/70 max-w-lg leading-relaxed">
              Preencha aqui. Em minutos um especialista te chama no WhatsApp,
              monta seu cardápio junto e libera tudo.
            </p>

            <ul className="mt-8 space-y-3">
              {[
                "Configuração assistida — 0 dor de cabeça",
                "Cardápio + pagamentos online já no dia 1",
                "Migração do iFood / Anota Aí incluída",
                "Cancele quando quiser, sem multa",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-0.5 w-6 h-6 grid place-items-center rounded-full bg-brand-orange text-ink border-2 border-background shrink-0">
                    <Check className="w-3.5 h-3.5" strokeWidth={4} />
                  </span>
                  <span className="text-background/90 font-medium">{item}</span>
                </li>
              ))}
            </ul>

            <div className="mt-10 flex items-center gap-6 text-xs text-background/50 font-bold uppercase tracking-widest">
              <span>+1.247 lojas</span>
              <span className="w-px h-4 bg-background/20" />
              <span>R$ 9,4M / mês</span>
              <span className="w-px h-4 bg-background/20" />
              <span>0% comissão</span>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -top-3 -left-3 bg-brand-orange text-ink px-4 py-2 rounded-lg text-[11px] font-bold uppercase tracking-widest border-2 border-background shadow-brutal z-10 rotate-[-2deg]">
              Resposta em &lt; 5min
            </div>
            <div className="rounded-2xl bg-background text-ink p-6 md:p-8 border-2 border-background shadow-brutal-lg">
              <LeadForm />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
