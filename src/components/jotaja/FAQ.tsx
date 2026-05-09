import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs = [
  { q: "Quanto custa para usar o Comanda?", a: "Apenas a mensalidade fixa do plano escolhido (a partir de R$ 99/mês). Zero comissão por pedido — você fica com 100% do que vende." },
  { q: "Como chegam os pedidos pra mim?", a: "Direto no painel do Comanda E no WhatsApp do restaurante, organizados, com itens, adicionais, endereço e forma de pagamento." },
  { q: "Meu cliente precisa baixar algum app?", a: "Não. Ele faz o pedido por um link no navegador (celular ou desktop). Sem fricção, conversão muito maior." },
  { q: "Preciso ter WhatsApp no restaurante?", a: "Não é obrigatório, mas é altamente recomendado. A integração com WhatsApp é um dos diferenciais que mais ajuda." },
  { q: "Quais segmentos podem usar?", a: "Restaurantes, hamburguerias, pizzarias, padarias, hortifrutis, açaiterias, bebidas, sushi, marmitarias e qualquer outro delivery." },
  { q: "Comanda traz novos clientes?", a: "Não — Comanda é a ferramenta que organiza o atendimento e fideliza quem você já tem. Em breve teremos módulo de marketing nativo." },
  { q: "Comanda faz a entrega?", a: "Não. Você usa sua equipe própria de entregadores (que cadastra e gerencia no painel) ou parceiros como Loggi (integração disponível)." },
  { q: "Tem suporte humano?", a: "Sim! Atendimento por WhatsApp, telefone, e-mail e TeamViewer. Todos os dias, inclusive feriados, das 8h às 22h." },
  { q: "Consigo ter mais de uma loja (rede/franquia)?", a: "Sim! O plano Rede/Franquia gerencia múltiplas unidades com direcionamento por geolocalização e estatísticas separadas." },
  { q: "Preciso ser CNPJ?", a: "Não. Pessoa Física também pode usar." },
  { q: "Tem fidelidade ou multa?", a: "Nenhuma. Cancele quando quiser, sem letra miúda." },
  { q: "Posso testar antes de pagar?", a: "Sim! 14 dias grátis em qualquer plano, sem cartão de crédito." },
];

export function FAQ() {
  return (
    <section id="faq" className="py-20 md:py-28">
      <div className="container mx-auto px-6 max-w-3xl">
        <div className="text-center mb-12">
          <span className="inline-block bg-accent-soft text-accent-foreground font-bold text-sm px-4 py-1.5 rounded-full mb-4">
            Tira-dúvidas
          </span>
          <h2 className="font-display text-3xl md:text-5xl font-extrabold leading-tight">
            Perguntas <span className="text-gradient-primary">frequentes</span>
          </h2>
          <p className="text-muted-foreground mt-4">
            Não encontrou sua dúvida? Fala com a gente no WhatsApp.
          </p>
        </div>

        <Accordion type="single" collapsible className="space-y-3">
          {faqs.map((f, i) => (
            <AccordionItem
              key={i}
              value={`item-${i}`}
              className="bg-card border border-border rounded-2xl px-6 shadow-soft hover:shadow-card transition-smooth data-[state=open]:border-accent data-[state=open]:shadow-accent-lg"
            >
              <AccordionTrigger className="text-left font-display font-bold hover:no-underline py-5">
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
