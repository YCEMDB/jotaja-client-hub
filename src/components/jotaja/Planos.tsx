import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const plans = [
  {
    name: "Starter",
    price: "R$ 99",
    desc: "Para quem está começando o delivery próprio.",
    features: [
      "Cardápio digital ilimitado",
      "Pedidos online via link",
      "Pix e cartão na entrega",
      "1 usuário",
      "Suporte por e-mail",
    ],
    cta: "Começar grátis",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "R$ 199",
    desc: "Operação completa para restaurantes em crescimento.",
    features: [
      "Tudo do Starter",
      "Cupons e promoções",
      "Áreas de entrega e motoboys",
      "Relatórios avançados",
      "Até 5 usuários",
      "Suporte prioritário no WhatsApp",
    ],
    cta: "Testar 14 dias grátis",
    highlighted: true,
  },
  {
    name: "Business",
    price: "R$ 399",
    desc: "Para redes e restaurantes de alto volume.",
    features: [
      "Tudo do Pro",
      "Múltiplas unidades",
      "API e integrações",
      "Usuários ilimitados",
      "Gerente de sucesso dedicado",
    ],
    cta: "Falar com vendas",
    highlighted: false,
  },
];

export function Planos() {
  return (
    <section id="planos" className="py-24 md:py-32 bg-gradient-soft border-y border-border">
      <div className="container mx-auto px-6">
        <div className="max-w-2xl mx-auto text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-primary">
            Planos
          </span>
          <h2 className="mt-3 text-3xl md:text-4xl font-bold tracking-tight">
            Preços simples, sem surpresa.
          </h2>
          <p className="mt-4 text-muted-foreground">
            Mensalidade fixa, sem comissão por venda. Cancele quando quiser.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl p-7 flex flex-col ${
                plan.highlighted
                  ? "bg-card border-2 border-primary shadow-blue"
                  : "bg-card border border-border shadow-xs"
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                  Mais escolhido
                </div>
              )}
              <div>
                <h3 className="text-base font-semibold tracking-tight">{plan.name}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{plan.desc}</p>
              </div>
              <div className="mt-5 flex items-baseline gap-1">
                <span className="text-4xl font-bold tracking-tight">{plan.price}</span>
                <span className="text-sm text-muted-foreground">/mês</span>
              </div>
              <Button
                className={`mt-6 w-full rounded-lg font-semibold ${
                  plan.highlighted
                    ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-blue"
                    : "bg-foreground text-background hover:bg-foreground/90"
                }`}
                asChild
              >
                <a href="#cadastro">{plan.cta}</a>
              </Button>
              <ul className="mt-7 space-y-3 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" strokeWidth={2.5} />
                    <span className="text-foreground/80">{f}</span>
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
