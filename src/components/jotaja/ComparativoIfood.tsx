import { Check, X, TrendingUp, Sparkles, Scale } from "lucide-react";

const linhas = [
  { item: "Comissão por pedido", ifood: "12% a 27%", comanda: "0%", destaque: true, icon: "💸" },
  { item: "Mensalidade", ifood: "R$ 100+", comanda: "R$ 99 fixo", icon: "🗓️" },
  { item: "Domínio dos Dados", ifood: false, comanda: true, destaque: true, icon: "👤" },
  { item: "URL personalizada", ifood: false, comanda: true, icon: "🔗" },
  { item: "Pedidos via WhatsApp", ifood: false, comanda: true, destaque: true, icon: "💬" },
  { item: "Fidelidade Obrigatória", ifood: true, comanda: false, icon: "🔒" },
  { item: "Suporte humanizado", ifood: "Chatbot", comanda: "WhatsApp Real", icon: "🤝" },
  { item: "Gestão Financeira", ifood: "Limitada", comanda: "Completa", icon: "📊" },
];

export function ComparativoIfood() {
  return (
    <section className="py-20 md:py-32 relative overflow-hidden">
      {/* Background Decorativo */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-brand-orange/5 blur-3xl rounded-full pointer-events-none -mr-48 -mt-24" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-brand-magenta/5 blur-3xl rounded-full pointer-events-none -ml-40 -mb-20" />

      <div className="container mx-auto px-6 max-w-5xl">
        <div className="flex flex-col items-center text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-orange/10 border-2 border-brand-orange/20 text-brand-orange font-bold text-xs uppercase tracking-[0.2em] mb-6 shadow-glow">
            <Scale className="w-4 h-4" /> Comparativo Real
          </div>
          
          <h2 className="font-display text-4xl md:text-6xl text-ink leading-[0.9] tracking-tighter mb-6">
            MESIVO <span className="text-brand-orange">vs</span> Comissões Abusivas
          </h2>
          
          <p className="text-ink/60 max-w-2xl text-base md:text-lg">
            Por que entregar até 27% do seu faturamento para aplicativos que não são seus? 
            Recupere o controle da sua margem de lucro agora.
          </p>
        </div>

        <div className="relative">
          {/* Brutalist Shadow Effect */}
          <div className="absolute inset-0 bg-ink translate-x-3 translate-y-3 rounded-[2rem] pointer-events-none opacity-10" />
          
          <div className="relative bg-background rounded-[2rem] border-4 border-ink overflow-hidden shadow-brutal">
            {/* Header */}
            <div className="grid grid-cols-[1.5fr_1fr_1fr] md:grid-cols-[2fr_1fr_1.2fr] bg-ink text-background items-center">
              <div className="p-6 md:p-8 font-display font-black text-xs md:text-sm uppercase tracking-widest border-r-2 border-background/10">Recurso</div>
              <div className="p-6 md:p-8 font-display font-black text-center text-xs md:text-sm uppercase tracking-widest opacity-50 border-r-2 border-background/10">Apps de Terceiros</div>
              <div className="p-6 md:p-8 font-display font-black text-center bg-brand-orange text-ink text-xs md:text-sm uppercase tracking-widest">Mesivo</div>
            </div>

            {/* Rows */}
            <div className="divide-y-2 divide-ink/10">
              {linhas.map((l, i) => (
                <div
                  key={i}
                  className={`grid grid-cols-[1.5fr_1fr_1fr] md:grid-cols-[2fr_1fr_1.2fr] items-center transition-colors group ${
                    l.destaque ? "bg-brand-orange/[0.03]" : "hover:bg-ink/[0.01]"
                  }`}
                >
                  <div className="p-5 md:p-7 flex items-center gap-3 border-r-2 border-ink/5">
                    <span className="hidden md:block text-xl opacity-80 group-hover:scale-110 transition-transform">{l.icon}</span>
                    <span className="font-bold text-sm md:text-base text-ink leading-tight">{l.item}</span>
                  </div>
                  
                  <div className="p-5 md:p-7 text-center text-ink/40 border-r-2 border-ink/5 flex items-center justify-center">
                    {typeof l.ifood === "boolean" ? (
                      l.ifood ? (
                        <Check className="w-5 h-5 text-destructive/60" />
                      ) : (
                        <X className="w-5 h-5 text-destructive/40" />
                      )
                    ) : (
                      <span className="font-bold text-xs md:text-sm">{l.ifood}</span>
                    )}
                  </div>
                  
                  <div className={`p-5 md:p-7 text-center flex items-center justify-center ${l.destaque ? "bg-brand-orange/[0.05]" : ""}`}>
                    {typeof l.comanda === "boolean" ? (
                      l.comanda ? (
                        <div className="flex items-center justify-center bg-success/10 text-success p-2 rounded-xl border-2 border-success/20">
                          <Check className="w-5 h-5 md:w-6 md:h-6" strokeWidth={3} />
                        </div>
                      ) : (
                        <div className="flex items-center justify-center bg-ink/5 text-ink/30 p-2 rounded-xl border-2 border-ink/10">
                          <X className="w-5 h-5 md:w-6 md:h-6" />
                        </div>
                      )
                    ) : (
                      <span className="font-display font-black text-sm md:text-xl text-brand-orange tracking-tight">
                        {l.comanda}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer Row */}
            <div className="bg-ink/[0.02] p-6 md:p-10 border-t-4 border-ink flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-brand-magenta/10 border-2 border-brand-magenta/20 flex items-center justify-center text-brand-magenta">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <p className="font-display font-black text-sm md:text-lg text-ink uppercase tracking-tight">Economia Real</p>
                  <p className="text-xs md:text-sm text-ink/60">Baseado em faturamento médio de R$ 40k/mês</p>
                </div>
              </div>
              <div className="bg-ink text-background px-6 py-4 rounded-2xl font-display font-black text-xl md:text-2xl shadow-brutal active:translate-y-1 transition-all">
                Poupe até <span className="text-brand-orange">R$ 10.800/mês</span>
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-[10px] md:text-xs text-ink/40 mt-12 font-bold uppercase tracking-widest">
          * Valores aproximados baseados nas taxas médias do mercado brasileiro em 2026.
        </p>
      </div>
    </section>
  );
}
