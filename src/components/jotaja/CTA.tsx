import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function CTA() {
  return (
    <section className="py-20 md:py-28 bg-gradient-primary text-primary-foreground relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute -top-20 -left-20 w-96 h-96 rounded-full bg-white blur-3xl" />
        <div className="absolute -bottom-20 -right-20 w-96 h-96 rounded-full bg-white blur-3xl" />
      </div>
      <div className="container relative mx-auto px-6 text-center max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-widest mb-4 opacity-90">
          Entre em contato e conheça nossos planos!
        </p>
        <h2 className="font-display text-4xl md:text-6xl font-black leading-tight mb-6">
          Tenha sua própria base de clientes no delivery!
        </h2>
        <p className="text-lg md:text-xl opacity-90 mb-8 leading-relaxed">
          O Jotajá agiliza as entregas de pedidos online do seu restaurante usando WhatsApp e redes sociais como principais canais.
        </p>
        <Button size="lg" variant="secondary" className="rounded-full font-bold text-base h-14 px-8 shadow-elegant" asChild>
          <a href="#contato">Quero conhecer agora <ArrowRight className="ml-2 w-5 h-5" /></a>
        </Button>
      </div>
    </section>
  );
}
