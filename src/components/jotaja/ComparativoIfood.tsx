import { Scale } from "lucide-react";

const COMPARISON_DATA = [
  { label: "Taxa por Pedido", ifood: "27%", mesivo: "0%", sub: "Comissão do Marketplace" },
  { label: "Mensalidade", ifood: "R$ 130+", mesivo: "R$ 99", sub: "Custo fixo mensal" },
  { label: "Base de Clientes", ifood: "Deles", mesivo: "Sua", sub: "Propriedade dos dados" },
  { label: "Recebimento Pix", ifood: "7 a 30 dias", mesivo: "Imediato", sub: "Fluxo de caixa" },
  { label: "Suporte", ifood: "Ticket/Bot", mesivo: "WhatsApp", sub: "Atendimento direto" },
];

export function ComparativoIfood() {
  return (
    <section className="py-24 md:py-40 bg-background relative overflow-hidden border-y-4 border-ink">
      <div className="absolute inset-0 bg-grid opacity-[0.03] pointer-events-none" />
      
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="grid lg:grid-cols-[1fr_1.2fr] gap-16 md:gap-24 items-start">
          
          {/* Lado Esquerdo: Texto de Venda */}
          <div className="relative z-10 lg:sticky lg:top-32">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-orange/10 border border-brand-orange/30 rounded text-brand-orange font-bold text-[10px] uppercase tracking-widest mb-8">
              <Scale className="w-3 h-3" /> Transparência Total
            </div>
            
            <h2 className="font-display text-5xl md:text-7xl text-ink leading-[0.85] tracking-tighter mb-8 uppercase">
              Pare de sustentar <br />
              <span className="text-brand-orange border-b-4 border-brand-orange">o aplicativo</span>
            </h2>
            
            <p className="text-ink/60 text-lg md:text-xl max-w-md mb-12 leading-tight font-bold">
              A conta é simples: quanto mais você vende nos apps tradicionais, menos você lucra. No Mesivo, o crescimento é seu.
            </p>

            <div className="p-8 bg-secondary border-4 border-ink shadow-brutal rounded-none transform -rotate-1">
              <p className="font-display text-xs uppercase tracking-widest text-ink/40 mb-2">Impacto no Caixa</p>
              <p className="font-display text-4xl text-ink leading-none uppercase">
                Poupe <span className="text-brand-orange underline">R$ 10.800</span>
              </p>
              <p className="text-[10px] font-black text-ink/30 mt-4 uppercase tracking-widest leading-none">
                Cálculo baseado em faturamento de R$ 40k/mês
              </p>
            </div>
          </div>

          {/* Lado Direito: Tabela Brutalista Industrial */}
          <div className="relative">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-brand-orange/20 blur-[100px] rounded-full" />
            
            <div className="relative border-[6px] border-ink bg-background shadow-[12px_12px_0_0_#000] rounded-none overflow-hidden">
              {/* Header Tabela */}
              <div className="grid grid-cols-[1.5fr_1fr_1fr] bg-ink text-background py-6 px-4 md:px-8 border-b-[6px] border-ink">
                <div className="font-display font-black text-[10px] md:text-xs uppercase tracking-[0.2em]">Pilar</div>
                <div className="font-display font-black text-[10px] md:text-xs uppercase tracking-[0.2em] text-center opacity-40">Marketplace</div>
                <div className="font-display font-black text-[10px] md:text-xs uppercase tracking-[0.2em] text-center text-brand-orange">Mesivo</div>
              </div>

              {/* Rows */}
              <div className="divide-y-4 divide-ink">
                {COMPARISON_DATA.map((row, i) => (
                  <div key={i} className="grid grid-cols-[1.5fr_1fr_1fr] items-center group transition-colors hover:bg-brand-orange/5">
                    <div className="py-6 px-4 md:px-8 border-r-4 border-ink">
                      <p className="font-display font-black text-sm md:text-lg text-ink uppercase leading-none">{row.label}</p>
                      <p className="text-[10px] text-ink/40 uppercase font-bold mt-2 tracking-wider leading-none">{row.sub}</p>
                    </div>
                    
                    <div className="py-6 px-2 text-center border-r-4 border-ink bg-ink/[0.02]">
                      <span className="font-display font-bold text-xs md:text-sm text-ink/30 italic uppercase strike-diagonal">{row.ifood}</span>
                    </div>

                    <div className="py-6 px-2 text-center bg-brand-orange/[0.08]">
                      <span className="font-display font-black text-xl md:text-3xl text-ink tracking-tight uppercase">
                        {row.mesivo}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Banner de Fechamento */}
              <div className="bg-ink p-5 flex items-center justify-center gap-4">
                <div className="flex gap-1">
                  {[1,2,3].map(i => <div key={i} className="w-1 h-4 bg-brand-orange" />)}
                </div>
                <p className="font-display font-black text-[10px] md:text-xs text-background uppercase tracking-[0.3em]">
                  Operação Profissional <span className="text-brand-orange">Mesivo</span>
                </p>
                <div className="flex gap-1">
                  {[1,2,3].map(i => <div key={i} className="w-1 h-4 bg-brand-orange" />)}
                </div>
              </div>
            </div>
            
            <p className="text-[10px] font-black text-ink/20 mt-8 uppercase tracking-[0.3em] text-right">
              * Dados técnicos atualizados 2026
            </p>
          </div>

        </div>
      </div>
    </section>
  );
}