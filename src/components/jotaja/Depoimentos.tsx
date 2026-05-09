import { Star, Quote } from "lucide-react";

const depoimentos = [
  {
    nome: "Marcelo Silva",
    cargo: "Dono da Pizzaria Forno di Roma",
    texto: "Saí do iFood depois de 3 anos perdendo 25% por pedido. Em 2 meses no Comanda recuperei o investimento. Meu lucro dobrou e meus clientes finalmente são MEUS.",
    avatar: "🧑‍🍳",
    estrelas: 5,
  },
  {
    nome: "Ana Paula Costa",
    cargo: "Padaria Aurora — RJ",
    texto: "O suporte é o que mais me impressiona. Toda dúvida é resolvida no WhatsApp em minutos. Configurei tudo sozinha em uma tarde.",
    avatar: "👩‍🍳",
    estrelas: 5,
  },
  {
    nome: "Roberto Tanaka",
    cargo: "Sushi Zen — SP",
    texto: "Os pedidos chegam organizados direto na cozinha. Equipe ganhou tempo, eu ganhei controle. E a economia mensal é absurda.",
    avatar: "👨‍🍳",
    estrelas: 5,
  },
];

export function Depoimentos() {
  return (
    <section className="py-20 md:py-28">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12 max-w-2xl mx-auto">
          <span className="inline-block bg-accent-soft text-accent-foreground font-bold text-sm px-4 py-1.5 rounded-full mb-4">
            Quem usa, recomenda
          </span>
          <h2 className="font-display text-3xl md:text-5xl font-extrabold leading-tight">
            Donos de restaurante <span className="text-gradient-primary">apaixonados</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {depoimentos.map((d, i) => (
            <div
              key={i}
              className="bg-card rounded-3xl p-8 border border-border shadow-card hover:shadow-elegant transition-smooth relative"
            >
              <Quote className="absolute top-6 right-6 w-10 h-10 text-accent/30" />
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: d.estrelas }).map((_, j) => (
                  <Star key={j} className="w-4 h-4 fill-accent text-accent" />
                ))}
              </div>
              <p className="text-foreground leading-relaxed mb-6 relative">"{d.texto}"</p>
              <div className="flex items-center gap-3 pt-5 border-t border-border">
                <div className="w-12 h-12 rounded-full bg-gradient-accent flex items-center justify-center text-2xl">
                  {d.avatar}
                </div>
                <div>
                  <div className="font-display font-bold text-sm">{d.nome}</div>
                  <div className="text-xs text-muted-foreground">{d.cargo}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
