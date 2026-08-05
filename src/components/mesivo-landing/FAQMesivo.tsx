import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { MotionReveal } from "@/components/motion";
import { mesivoFaq } from "./faq-data";

export function FAQMesivo() {
  return (
    <section
      id="faq"
      className="py-40 bg-white"
    >
      <div className="max-w-[1440px] mx-auto px-8">
        <div className="grid lg:grid-cols-[400px_1fr] gap-20 items-start">
          <MotionReveal variant="fade" className="lg:sticky lg:top-40">
            <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-copper mb-8 block">
              Dúvidas
            </span>
            <h2 className="font-display text-[clamp(2.5rem,5vw,5rem)] leading-[0.9] tracking-[-0.05em] text-foreground mb-8">
              Sincronia <br /><span className="italic font-serif text-deep-forest">Total</span>.
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed font-sans">
              Tudo que você precisa saber para elevar o padrão da sua operação.
            </p>
          </MotionReveal>

          <MotionReveal variant="fade" delay={0.1}>
            <Accordion type="single" collapsible className="w-full space-y-4">
              {mesivoFaq.map((f, i) => (
                <AccordionItem
                  key={i}
                  value={`faq-${i}`}
                  className="border border-border rounded-[32px] px-8 bg-cream/30 transition-editorial hover:bg-cream/50"
                >
                  <AccordionTrigger className="font-display text-xl text-left py-8 hover:no-underline hover:text-copper transition-editorial">
                    {f.q}
                  </AccordionTrigger>
                  <AccordionContent className="font-sans text-base leading-relaxed text-muted-foreground pb-8">
                    {f.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </MotionReveal>
        </div>
      </div>
    </section>
  );
}
