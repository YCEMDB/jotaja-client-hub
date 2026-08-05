import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Reveal } from "./Reveal";

const faqs = [
  {
    q: "Preciso pagar comissão por pedido?",
    a: "Não. Diferente de marketplaces, você paga uma mensalidade fixa. 100% do valor de cada pedido vai direto para o seu caixa.",
  },
  {
    q: "Quanto tempo leva para começar a receber pedidos?",
    a: "Em média 30 minutos. Você cadastra os produtos, define a área de entrega e já compartilha o link do seu cardápio.",
  },
  {
    q: "Posso testar antes de pagar?",
    a: "Sim. Você tem 14 dias grátis com acesso completo a todos os recursos do plano Pro, sem precisar cadastrar cartão.",
  },
  {
    q: "Os pedidos chegam por onde?",
    a: "Pelo painel da Mesivo em tempo real, com aviso sonoro. Também é possível imprimir automaticamente em impressoras térmicas.",
  },
  {
    q: "Como funciona o pagamento online?",
    a: "Você integra sua conta Mercado Pago em poucos cliques. O cliente paga por Pix ou cartão e o valor cai direto na sua conta.",
  },
  {
    q: "Posso cancelar quando quiser?",
    a: "Sim. Não há fidelidade. Você cancela pelo painel a qualquer momento, sem multa.",
  },
];

export function FAQ() {
  return (
    <section id="faq" className="py-24 md:py-32 bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-[0.03] pointer-events-none" />
      <div className="container mx-auto px-6 relative">
        <Reveal className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-sunset/10 border-2 border-[#FF6B35]/20 text-[#FF6B35] font-bold text-[10px] uppercase tracking-widest mb-4">
            Dúvidas Comuns
          </div>
          <h2 className="font-display text-4xl md:text-6xl text-ink leading-[0.9] tracking-tighter uppercase mb-6">
            FAQ<span className="text-gradient-sunset">.</span>
          </h2>
          <p className="text-ink/60 max-w-lg mx-auto">
            Tudo que você precisa saber para começar a gerenciar seu restaurante com eficiência hoje mesmo.
          </p>
        </Reveal>

        <Reveal delay={0.1} className="mt-12 max-w-2xl mx-auto">
          <Accordion type="single" collapsible className="w-full space-y-3">
            {faqs.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className="border-4 border-ink bg-card rounded-2xl overflow-hidden shadow-brutal px-2 transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none"
              >
                <AccordionTrigger className="text-left font-display text-base md:text-lg text-ink py-6 hover:no-underline uppercase tracking-tight">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm md:text-base text-ink/70 leading-relaxed pb-6">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </div>
    </section>
  );
}
