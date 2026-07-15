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
