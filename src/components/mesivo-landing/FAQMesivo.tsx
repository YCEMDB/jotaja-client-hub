import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { MotionReveal } from "@/components/motion";
import { mesivoFaq } from "./faq-data";

const faqs = mesivoFaq;

export function FAQMesivo() {
  return (
    <section
      id="faq"
      aria-label="Perguntas frequentes"
      style={{ paddingBlock: "clamp(64px, 8vw, 120px)" }}
    >
      <div style={{ maxWidth: 800, marginInline: "auto", paddingInline: "clamp(16px, 4vw, 32px)" }}>
        <MotionReveal variant="fade">
          <div className="text-center max-w-xl mx-auto mb-16">
            <span className="text-[10px] font-bold uppercase tracking-widest text-accent mb-6 block">
              FAQ
            </span>
            <h2 className="text-[clamp(2.5rem,5vw,4.5rem)] font-extrabold leading-[0.95] tracking-tight mb-8">
              Perguntas <span className="text-accent">frequentes</span>
            </h2>
            <p className="text-lg font-medium text-muted-foreground">
              Tudo que você precisa saber antes de transformar sua operação.
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
