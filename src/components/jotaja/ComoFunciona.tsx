import { Reveal } from "./Reveal";

const steps = [
  {
    num: "01",
    title: "Cria sua loja em 5 minutos",
    desc: "Faz upload do logo, escolhe cores, sobe o cardápio — ou a gente faz tudo junto pra você. Sua URL fica pronta na hora.",
    bullets: ["Wizard guiado", "Importação de cardápio assistida", "Pague só quando estiver vendendo"],
    accent: "bg-brand-amber",
  },
  {
    num: "02",
    title: "Divulga e recebe pedidos",
    desc: "Compartilha o link nas redes, no QR da mesa, no flyer. Cliente acessa, pede e paga — Pix cai em 2s na sua conta.",
    bullets: ["QR code grátis pra mesa", "Compartilhe no Instagram com 1 clique", "Cliente acompanha o pedido sem login"],
    accent: "bg-brand-orange",
  },
  {
    num: "03",
    title: "Gerencia tudo num painel só",
    desc: "Kanban em tempo real, entregadores, cupons, relatórios e CRM dos clientes — sem precisar de 5 ferramentas.",
    bullets: ["Notificação por som a cada pedido", "Imprime na cozinha automaticamente", "Relatórios diários no WhatsApp"],
    accent: "bg-brand-magenta",
  },
];

export function ComoFunciona() {
  return (
    <section className="relative bg-secondary py-24 md:py-32 border-y-[3px] border-ink overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-[0.05] pointer-events-none" />

      <div className="container mx-auto px-6 relative">
        <div className="max-w-3xl mb-16">
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="h-2 w-2 rounded-full bg-brand-magenta" />
            <span className="text-[11px] uppercase tracking-[0.2em] font-bold text-ink/60">
              03 — Como funciona
            </span>
          </div>
          <h2 className="font-display text-ink uppercase leading-[0.85] tracking-[-0.04em] text-[clamp(2.25rem,6vw,5rem)]">
            Do zero ao
            <br />
            <span className="text-gradient-sunset">primeiro pedido</span> em uma
            <br />
            tarde.
          </h2>
        </div>

        <div className="space-y-16 md:space-y-24">
          {steps.map((step, i) => {
            const reverse = i % 2 === 1;
            return (
              <Reveal y={32} key={step.num}>
                <div className={`grid md:grid-cols-[auto_1fr] gap-8 md:gap-14 items-start ${reverse ? "md:[direction:rtl]" : ""}`}>
                  {/* Big number */}
                  <div className="[direction:ltr]">
                    <div className={`font-display text-[110px] md:text-[180px] leading-[0.78] tracking-tighter text-ink/95 ${step.accent} text-ink px-3 inline-block border-2 border-ink shadow-brutal-lg`}>
                      {step.num}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="[direction:ltr]">
                    <h3 className="font-display text-3xl md:text-5xl text-ink leading-[0.95] tracking-tight max-w-[14ch]">
                      {step.title}
                    </h3>
                    <p className="mt-5 text-lg text-ink/70 max-w-xl leading-relaxed">
                      {step.desc}
                    </p>
                    <ul className="mt-6 grid sm:grid-cols-3 gap-3 max-w-2xl">
                      {step.bullets.map((b) => (
                        <li
                          key={b}
                          className="rounded-lg border-2 border-ink bg-background p-3 text-xs font-semibold text-ink leading-snug shadow-brutal"
                        >
                          {b}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
