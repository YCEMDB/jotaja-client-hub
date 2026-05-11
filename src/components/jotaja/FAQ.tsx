import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

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
    a: "Pelo painel da Comanda em tempo real, com aviso sonoro. Também é possível imprimir automaticamente em impressoras térmicas.",
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
    <section id="faq" className="py-24 md:py-32 bg-background">
      <div className="container mx-auto px-6">
        <div className="max-w-2xl mx-auto text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-primary">
            FAQ
          </span>
          <h2 className="mt-3 text-3xl md:text-4xl font-bold tracking-tight">
            Perguntas frequentes
          </h2>
          <p className="mt-4 text-muted-foreground">
            Tudo que você precisa saber antes de começar.
          </p>
        </div>

        <div className="mt-12 max-w-2xl mx-auto">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className="border-b border-border last:border-0"
              >
                <AccordionTrigger className="text-left text-sm font-semibold py-5 hover:no-underline hover:text-primary">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-5">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
