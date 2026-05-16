import { Store, DollarSign, Clock, Percent } from "lucide-react";

const items = [
  { label: "Restaurantes", value: "+1.247", icon: Store, color: "text-brand-amber" },
  { label: "Processado / mês", value: "R$ 9,4M", icon: DollarSign, color: "text-brand-orange" },
  { label: "Pix em média", value: "2 seg", icon: Clock, color: "text-brand-magenta" },
  { label: "Comissão", value: "0%", icon: Percent, color: "text-brand-violet" },
];

export function Stats() {
  return (
    <section className="relative bg-ink text-background border-y-[3px] border-ink overflow-hidden">
      <div className="absolute inset-0 bg-noise opacity-40 pointer-events-none" />
      <div className="container mx-auto px-6 py-8 md:py-10 relative">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-background/15">
          {items.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-ink px-4 md:px-6 py-4 md:py-5 flex items-center gap-4">
              <div className={`w-10 h-10 grid place-items-center rounded-lg bg-background/10 border border-background/20 ${color}`}>
                <Icon className="w-5 h-5" strokeWidth={2.5} />
              </div>
              <div className="min-w-0">
                <div className="font-display text-2xl md:text-3xl leading-none">{value}</div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-background/50 font-bold mt-1.5 truncate">
                  {label}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
