import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "./Reveal";

export function CTA() {
  return (
    <section id="cadastro" className="py-24 md:py-32 bg-background">
      <div className="container mx-auto px-6">
        <Reveal y={24} className="relative max-w-5xl mx-auto rounded-2xl overflow-hidden bg-foreground text-background p-12 md:p-16 shadow-card-xl">
          <div className="grid md:grid-cols-[1fr_auto] gap-8 md:items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                Comece a vender direto
                <br />
                <span className="text-background/60">para o seu cliente hoje.</span>
              </h2>
              <p className="mt-4 text-background/70 max-w-lg text-base leading-relaxed">
                Teste grátis por 14 dias. Sem cartão, sem fidelidade.
                Em minutos seu restaurante estará online.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row md:flex-col gap-3">
              <Button
                size="lg"
                className="rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-semibold px-6 h-11 shadow-blue"
                asChild
              >
                <a href="/auth">
                  Criar conta grátis
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </a>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="rounded-lg font-semibold px-6 h-11 bg-transparent border-background/20 text-background hover:bg-background/10 hover:text-background"
                asChild
              >
                <a href="https://wa.me/552120422913" target="_blank" rel="noreferrer">
                  Agendar demonstração
                </a>
              </Button>
            </div>
        </Reveal>
        </div>
      </div>
    </section>
  );
}
