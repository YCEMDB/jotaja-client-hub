import { Star } from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "./Reveal";

const testimonials = [
  {
    quote:
      "Saímos do iFood e em 3 meses dobramos o faturamento. O painel é simples e o suporte é rápido. Foi a melhor decisão que tomamos.",
    name: "Marcelo Andrade",
    role: "Sócio · Burger House",
    initials: "MA",
  },
  {
    quote:
      "Consigo ver tudo em tempo real: pedidos, entregadores, faturamento. Antes eu vivia no improviso, agora tenho controle de verdade.",
    name: "Camila Rocha",
    role: "Proprietária · Bella Pizza",
    initials: "CR",
  },
  {
    quote:
      "O cardápio ficou lindo e os clientes adoraram. Sem comissão é diferente: cada pedido pesa no caixa do jeito certo.",
    name: "Rafael Mendes",
    role: "Gerente · Sabor & Cia",
    initials: "RM",
  },
];

export function Depoimentos() {
  return (
    <section id="depoimentos" className="py-24 md:py-32 bg-background">
      <div className="container mx-auto px-6">
        <Reveal className="max-w-2xl mx-auto text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-primary">
            Depoimentos
          </span>
          <h2 className="mt-3 text-3xl md:text-4xl font-bold tracking-tight">
            Restaurantes que já fizeram a virada.
          </h2>
        </Reveal>

        <Stagger className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-5">
          {testimonials.map((t) => (
            <StaggerItem key={t.name} className="h-full">
              <figure
                className="rounded-2xl border border-border bg-card p-7 shadow-xs hover:shadow-card-md transition-smooth flex flex-col h-full"
              >
              <div className="flex gap-0.5 text-primary">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>
              <blockquote className="mt-4 text-sm leading-relaxed text-foreground flex-1">
                "{t.quote}"
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-3 pt-5 border-t border-border">
                <div className="w-9 h-9 rounded-full bg-gradient-primary text-white grid place-items-center text-xs font-bold">
                  {t.initials}
                </div>
                <div>
                  <div className="text-sm font-semibold">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
