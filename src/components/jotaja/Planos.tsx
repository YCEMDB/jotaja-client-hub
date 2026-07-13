import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  MotionSection,
  MotionReveal,
  MotionStagger,
  MotionStaggerItem,
} from "@/components/motion";

/**
 * Planos — Onda 3.
 *
 * Auditoria de conteúdo:
 * - Removidos recursos ainda não disponíveis publicamente na plataforma:
 *   "Múltiplas unidades", "API e integrações", "Gerente de sucesso dedicado"
 *   e "Áreas de entrega e motoboys" com nível de automação não confirmado.
 * - Mantidos apenas recursos que existem hoje na Mesivo (cardápio digital,
 *   pedidos online, PDV / caixa, cupons, cardápio ilimitado, painel único,
 *   suporte).
 * - Preços, teste grátis e CTAs são apresentados como referência inicial —
 *   caso os valores oficiais mudem, atualize aqui em vez de duplicar em
 *   páginas SEO.
 *
 * Paleta: sem violet / magenta / roxo SaaS. Destaque em laranja-coral.
 */
const plans = [
  {
    name: "Starter",
    price: "R$ 99",
    desc: "Para quem está começando o delivery próprio.",
    features: [
      "Cardápio digital ilimitado",
      "Pedidos online via link exclusivo",
      "Pagamento por Pix e cartão",
      "1 usuário",
      "Suporte por e-mail",
    ],
    cta: "Começar agora",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "R$ 199",
    desc: "Operação completa para restaurantes em ritmo diário.",
    features: [
      "Tudo do Starter",
      "PDV integrado (salão, mesas, balcão)",
      "Cupons e promoções",
      "Relatórios diários da operação",
      "Até 5 usuários",
      "Suporte prioritário no WhatsApp",
    ],
    cta: "Testar Pro",
    highlighted: true,
  },
  {
    name: "Business",
    price: "R$ 399",
    desc: "Para restaurantes com maior volume por dia.",
    features: [
      "Tudo do Pro",
      "Usuários ilimitados",
      "Fluxos de delivery e retirada",
      "Suporte prioritário estendido",
    ],
    cta: "Falar com o time",
    highlighted: false,
  },
];

export function Planos() {
  return (
    <MotionSection
      id="planos"
      className="py-24 md:py-32 bg-secondary border-y border-border"
      aria-label="Planos e preços"
    >
      <div className="container mx-auto px-6">
        <MotionReveal className="max-w-2xl mx-auto text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-brand-orange">
            Planos
          </span>
          <h2 className="mt-3 font-display text-3xl md:text-5xl text-ink tracking-tight uppercase leading-[0.95]">
            Preços simples, sem surpresa.
          </h2>
          <p className="mt-4 text-ink/70">
            Mensalidade fixa, sem comissão por venda. Cancele quando quiser.
          </p>
        </MotionReveal>

        <MotionStagger
          className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto"
          delay={0.05}
        >
          {plans.map((plan) => (
            <MotionStaggerItem
              key={plan.name}
              className={`relative rounded-2xl p-7 flex flex-col h-full bg-card border-2 border-ink shadow-brutal ${
                plan.highlighted ? "ring-2 ring-brand-orange ring-offset-2 ring-offset-secondary" : ""
              }`}
            >
              {plan.highlighted && (
                <div
                  className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-brand-orange text-ink text-xs font-bold border-2 border-ink shadow-brutal"
                >
                  Recomendado
                </div>
              )}
              <div>
                <h3 className="font-display text-xl text-ink tracking-tight">{plan.name}</h3>
                <p className="mt-1 text-xs text-ink/60">{plan.desc}</p>
              </div>
              <div className="mt-5 flex items-baseline gap-1">
                <span className="font-display text-4xl text-ink tracking-tight">{plan.price}</span>
                <span className="text-sm text-ink/60">/mês</span>
              </div>
              <Button
                className={`mt-6 w-full rounded-lg font-semibold border-2 border-ink shadow-brutal ${
                  plan.highlighted
                    ? "bg-brand-orange text-ink hover:bg-brand-orange/90"
                    : "bg-ink text-background hover:bg-ink/90"
                }`}
                asChild
              >
                <a href="#cadastro">{plan.cta}</a>
              </Button>
              <ul className="mt-7 space-y-3 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <Check
                      className="w-4 h-4 text-brand-orange mt-0.5 flex-shrink-0"
                      strokeWidth={2.5}
                      aria-hidden="true"
                    />
                    <span className="text-ink/80">{f}</span>
                  </li>
                ))}
              </ul>
            </MotionStaggerItem>
          ))}
        </MotionStagger>
      </div>
    </MotionSection>
  );
}
