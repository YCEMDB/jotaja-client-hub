import { Check, X, TrendingUp } from "lucide-react";

const linhas = [
  { item: "Comissão por pedido", ifood: "12% a 27%", comanda: "0%", destaque: true },
  { item: "Mensalidade", ifood: "R$ 100+", comanda: "R$ 99 fixo" },
  { item: "Cliente é seu", ifood: false, comanda: true, destaque: true },
  { item: "URL personalizada", ifood: false, comanda: true },
  { item: "Pedidos via WhatsApp", ifood: false, comanda: true, destaque: true },
  { item: "Sem fidelidade", ifood: false, comanda: true },
  { item: "Suporte humanizado", ifood: "Bot/Email", comanda: "WhatsApp + Tel" },
  { item: "Marketing próprio (cupons)", ifood: "Limitado", comanda: "Ilimitado" },
];

export function ComparativoIfood() {
  return (
    <section className="py-20 md:py-28">
      <div className="container mx-auto px-6 max-w-4xl">
        <div className="text-center mb-12">
          <span className="inline-flex items-center gap-1.5 bg-accent-soft text-accent-foreground font-bold text-sm px-4 py-1.5 rounded-full mb-4">
            <TrendingUp className="w-4 h-4" /> Comparativo
          </span>
          <h2 className="font-display text-3xl md:text-5xl font-extrabold leading-tight">
            Comandex <span className="text-gradient-primary">vs</span> aplicativos com comissão
          </h2>
        </div>

        <div className="bg-card rounded-3xl shadow-elegant border border-border overflow-hidden">
          <div className="grid grid-cols-3 bg-primary text-primary-foreground">
            <div className="p-5 font-display font-bold text-sm uppercase tracking-wide">Recurso</div>
            <div className="p-5 font-display font-bold text-center text-sm uppercase tracking-wide opacity-80">Apps tradicionais</div>
            <div className="p-5 font-display font-bold text-center bg-accent text-accent-foreground text-sm uppercase tracking-wide">Comandex</div>
          </div>

          {linhas.map((l, i) => (
            <div
              key={i}
              className={`grid grid-cols-3 border-t border-border ${
                l.destaque ? "bg-accent-soft/40" : ""
              }`}
            >
              <div className="p-5 font-semibold">{l.item}</div>
              <div className="p-5 text-center text-muted-foreground flex items-center justify-center">
                {typeof l.ifood === "boolean" ? (
                  l.ifood ? <Check className="w-5 h-5 text-success" /> : <X className="w-5 h-5 text-destructive" />
                ) : (
                  <span className="font-bold">{l.ifood}</span>
                )}
              </div>
              <div className="p-5 text-center font-bold text-foreground flex items-center justify-center">
                {typeof l.comanda === "boolean" ? (
                  l.comanda ? <Check className="w-6 h-6 text-success" /> : <X className="w-5 h-5 text-destructive" />
                ) : (
                  <span>{l.comanda}</span>
                )}
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Calculado com base em valores médios de mercado em 2025.
        </p>
      </div>
    </section>
  );
}
