import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { MotionReveal } from "@/components/motion";

const faqs = [
  {
    q: "Preciso pagar comissão por pedido?",
    a: "Não. Diferente de marketplaces, você paga uma mensalidade fixa. 100% do valor de cada pedido vai direto para o seu caixa.",
  },
  {
    q: "Quanto tempo leva para começar a receber pedidos?",
    a: "Você cadastra os produtos, define a área de entrega e já pode compartilhar o link do seu cardápio. Ferramentas de importação ajudam a acelerar o setup.",
  },
  {
    q: "Posso testar antes de pagar?",
    a: "Sim. Você tem 14 dias grátis com acesso completo ao plano Pro, sem precisar cadastrar cartão de crédito.",
  },
  {
    q: "Os pedidos chegam por onde?",
    a: "Pelo painel Mesivo em tempo real, com aviso sonoro. Também é possível imprimir automaticamente em impressoras térmicas.",
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

export function FAQMesivo() {
  return (
    <section
      id="faq"
      aria-label="Perguntas frequentes"
      style={{ paddingBlock: "clamp(64px, 8vw, 120px)" }}
    >
      <div style={{ maxWidth: 800, marginInline: "auto", paddingInline: "clamp(16px, 4vw, 32px)" }}>
        <MotionReveal variant="fade">
          <div style={{ textAlign: "center", maxWidth: 560, marginInline: "auto" }}>
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "var(--mesivo-tomato)",
              }}
            >
              FAQ
            </span>
            <h2
              style={{
                marginTop: 12,
                fontSize: "clamp(2rem, 3.4vw, 2.75rem)",
                lineHeight: 1.05,
                color: "var(--fg-hi)",
              }}
            >
              Perguntas <span className="mesivo-accent">frequentes</span>
            </h2>
            <p style={{ marginTop: 12, color: "var(--fg-mid)" }}>
              Tudo que você precisa saber antes de começar.
            </p>
          </div>
        </MotionReveal>

        <MotionReveal delay={0.1} style={{ marginTop: 32 }}>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((f, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="border-b last:border-0"
                style={{ borderColor: "var(--hairline)" }}
              >
                <AccordionTrigger
                  className="text-left py-5 hover:no-underline"
                  style={{ color: "var(--fg-hi)", fontSize: 16, fontWeight: 600 }}
                >
                  {f.q}
                </AccordionTrigger>
                <AccordionContent
                  className="pb-5"
                  style={{ color: "var(--fg-mid)", fontSize: 15, lineHeight: 1.6 }}
                >
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </MotionReveal>
      </div>
    </section>
  );
}
