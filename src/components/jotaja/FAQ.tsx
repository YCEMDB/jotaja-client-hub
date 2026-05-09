import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs = [
  { q: "Preciso pagar alguma comissão sobre os pedidos para o Jotajá?", a: "Não. O Jotajá cobra apenas a mensalidade. Você não divide seu lucro com aplicativos que cobram comissão." },
  { q: "Como chegarão os pedidos?", a: "Os pedidos chegam detalhados e organizados para o WhatsApp e para o seu gerenciador de pedidos." },
  { q: "Preciso ter um número de WhatsApp para usar a plataforma?", a: "Não é obrigatório, mas a plataforma é muito mais eficiente com o WhatsApp para gerenciar seu delivery." },
  { q: "Meu cliente vai precisar instalar algum aplicativo?", a: "Não. Seu cliente faz o pedido através de um link sem precisar instalar qualquer aplicativo." },
  { q: "Quais segmentos o Jotajá atende?", a: "Restaurantes em geral, padarias, hortifrutis, depósitos de bebidas e outros. Você cria seu cardápio e gerencia seus pedidos online." },
  { q: "O Jotajá vai me trazer novos clientes?", a: "Não. O Jotajá é uma ferramenta para ajudar e organizar o atendimento de pedidos. Em breve teremos módulo de marketing." },
  { q: "O Jotajá faz a entrega do pedido?", a: "Não. Somos um site de pedidos e gerenciador de delivery. Criamos seu gerenciador, mas não realizamos as entregas." },
  { q: "O Jotajá tem suporte?", a: "Sim. Atendemos via telefone, WhatsApp e email todos os dias, inclusive feriados, das 8h às 22h." },
  { q: "Consigo gerenciar meu cardápio?", a: "Sim. É simples e rápido. Você pode inserir, alterar, excluir, inativar e muito mais. Totalmente configurável." },
  { q: "Consigo receber pedidos via telefone pelo Jotajá?", a: "Sim, temos esse recurso." },
  { q: "Preciso ser Pessoa Jurídica?", a: "Não." },
  { q: "Sou obrigado a cumprir algum tempo de contrato?", a: "No plano mensal, não há fidelidade." },
];

export function FAQ() {
  return (
    <section id="faq" className="py-20 md:py-28 bg-muted/30">
      <div className="container mx-auto px-6 max-w-3xl">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-5xl font-black mb-4">
            Perguntas <span className="text-primary">Frequentes</span>
          </h2>
          <div className="underline-wave" />
          <p className="text-muted-foreground mt-6">
            Não encontrou sua dúvida? Entre em contato conosco!
          </p>
        </div>

        <Accordion type="single" collapsible className="space-y-3">
          {faqs.map((f, i) => (
            <AccordionItem
              key={i}
              value={`item-${i}`}
              className="bg-card border border-border rounded-xl px-6 shadow-soft hover:shadow-card transition-smooth"
            >
              <AccordionTrigger className="text-left font-display font-semibold hover:text-primary hover:no-underline py-5">
                {f.q}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed pb-5">
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
