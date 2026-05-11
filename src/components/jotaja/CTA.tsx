import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CTA() {
  return (
    <section id="cadastro" className="py-24 md:py-32 bg-background">
      <div className="container mx-auto px-6">
        <div className="relative max-w-5xl mx-auto rounded-3xl overflow-hidden bg-gradient-primary p-10 md:p-16 text-center shadow-blue">
          <div className="absolute inset-0 bg-dots opacity-10 pointer-events-none" />
          <div className="relative">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
              Pronto para vender direto pro seu cliente?
            </h2>
            <p className="mt-4 text-white/80 max-w-xl mx-auto text-base">
              Comece grátis hoje. Sem cartão, sem fidelidade. Em minutos seu restaurante estará online.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                size="lg"
                className="rounded-lg bg-white text-primary hover:bg-white/90 font-semibold px-6 h-11"
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
                className="rounded-lg font-semibold px-6 h-11 bg-transparent border-white/30 text-white hover:bg-white/10 hover:text-white"
                asChild
              >
                <a href="https://wa.me/552120422913" target="_blank" rel="noreferrer">
                  Falar com vendas
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
