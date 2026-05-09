import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const planos = [
  {
    nome: "Essencial",
    preco: "99",
    desc: "Pra quem está começando no delivery próprio",
    features: [
      "Cardápio digital + URL própria",
      "Pedidos via WhatsApp",
      "Painel de pedidos em tempo real",
      "Até 500 pedidos/mês",
      "1 usuário",
      "Suporte por e-mail",
    ],
  },
  {
    nome: "Profissional",
    preco: "199",
    desc: "Pra quem quer escalar e profissionalizar",
    destaque: true,
    features: [
      "Tudo do Essencial",
      "Pedidos ilimitados",
      "Cupons e promoções",
      "Gestão de entregadores",
      "Pagamento online integrado",
      "CRM + relatórios avançados",
      "Multiusuário (até 5)",
      "Suporte premium WhatsApp",
    ],
  },
  {
    nome: "Rede / Franquia",
    preco: "Sob consulta",
    desc: "Múltiplas unidades com gestão centralizada",
    features: [
      "Tudo do Profissional",
      "Lojas ilimitadas",
      "Direcionamento por geolocalização",
      "Estatísticas por unidade",
      "Customer Success dedicado",
      "Onboarding presencial",
      "API de integração",
    ],
  },
];

export function Planos() {
  return (
    <section id="planos" className="py-20 md:py-28 bg-muted/40">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12 max-w-2xl mx-auto">
          <span className="inline-block bg-accent-soft text-accent-foreground font-bold text-sm px-4 py-1.5 rounded-full mb-4">
            Planos
          </span>
          <h2 className="font-display text-3xl md:text-5xl font-extrabold leading-tight mb-4">
            Mensalidade fixa, <span className="marker-highlight">zero surpresa</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Sem comissão, sem fidelidade. 14 dias grátis em todos os planos.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {planos.map((p) => (
            <div
              key={p.nome}
              className={`relative rounded-3xl p-8 transition-smooth hover:-translate-y-1 ${
                p.destaque
                  ? "bg-gradient-primary text-primary-foreground shadow-elegant scale-105 border-2 border-accent"
                  : "bg-card border border-border shadow-card"
              }`}
            >
              {p.destaque && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground text-xs font-extrabold px-4 py-1.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> Mais popular
                </div>
              )}
              <h3 className="font-display font-extrabold text-2xl mb-1">{p.nome}</h3>
              <p className={`text-sm mb-6 ${p.destaque ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                {p.desc}
              </p>

              <div className="mb-6">
                {p.preco === "Sob consulta" ? (
                  <div className="font-display font-extrabold text-3xl">Sob consulta</div>
                ) : (
                  <div className="flex items-baseline gap-1">
                    <span className={`text-lg font-bold ${p.destaque ? "text-accent" : "text-muted-foreground"}`}>R$</span>
                    <span className="font-display font-extrabold text-5xl">{p.preco}</span>
                    <span className={`text-sm ${p.destaque ? "text-primary-foreground/70" : "text-muted-foreground"}`}>/mês</span>
                  </div>
                )}
              </div>

              <Button
                className={`w-full rounded-full font-bold mb-6 ${
                  p.destaque
                    ? "bg-accent text-accent-foreground hover:bg-accent/90"
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                }`}
                size="lg"
                asChild
              >
                <a href="#cadastro">Começar agora</a>
              </Button>

              <ul className="space-y-3">
                {p.features.map((f) => (
                  <li key={f} className="flex gap-2.5 text-sm">
                    <Check className={`w-5 h-5 flex-shrink-0 ${p.destaque ? "text-accent" : "text-success"}`} />
                    <span className={p.destaque ? "text-primary-foreground/90" : "text-foreground"}>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
