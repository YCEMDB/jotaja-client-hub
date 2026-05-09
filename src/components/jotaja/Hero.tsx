import { ArrowRight, Star, ShieldCheck, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import dashboard from "@/assets/dashboard-mockup.png";

export function Hero() {
  return (
    <section id="inicio" className="relative overflow-hidden bg-gradient-warm">
      {/* Decorative blobs */}
      <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-accent/20 blur-3xl" />
      <div className="absolute top-40 -right-40 w-[500px] h-[500px] rounded-full bg-primary/10 blur-3xl" />

      <div className="container relative mx-auto px-6 pt-16 pb-20 lg:pt-24 lg:pb-32">
        <div className="grid lg:grid-cols-[1.05fr,1fr] gap-12 items-center">
          {/* Left: copy */}
          <div className="max-w-2xl">
            {/* Social proof */}
            <div className="inline-flex items-center gap-2 bg-card border border-border rounded-full px-4 py-2 shadow-soft mb-6">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-6 h-6 rounded-full bg-gradient-accent border-2 border-background" />
                ))}
              </div>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-accent text-accent" />
                ))}
              </div>
              <span className="text-sm font-semibold">+2.500 restaurantes ativos</span>
            </div>

            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-extrabold leading-[1.05] tracking-tight mb-6">
              Seu delivery,{" "}
              <span className="marker-highlight">sem comissão.</span>
              <br />
              Sua marca,{" "}
              <span className="text-gradient-primary">seus clientes.</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-8 max-w-xl">
              A plataforma completa pra você receber pedidos pelo WhatsApp, gerenciar cardápio, entregadores e cupons —
              <strong className="text-foreground"> tudo com a sua identidade</strong> e sem dividir lucro com aplicativo.
            </p>

            <div className="flex flex-wrap gap-3 mb-8">
              <Button size="lg" className="h-14 rounded-full font-bold text-base px-7 bg-accent text-accent-foreground hover:bg-accent/90 shadow-accent-lg animate-pulse-glow" asChild>
                <a href="/auth">
                  Testar grátis por 14 dias <ArrowRight className="ml-2 w-5 h-5" />
                </a>
              </Button>
              <Button size="lg" variant="outline" className="h-14 rounded-full font-bold text-base px-7 border-2" asChild>
                <a href="#como-funciona">Ver demonstração</a>
              </Button>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-success" /> Sem cartão de crédito</div>
              <div className="flex items-center gap-1.5"><Zap className="w-4 h-4 text-accent" /> Configurar em 5 minutos</div>
              <div className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-success" /> Cancele quando quiser</div>
            </div>
          </div>

          {/* Right: dashboard mockup */}
          <div className="relative animate-float">
            <div className="absolute inset-0 bg-gradient-accent blur-3xl opacity-30 rounded-full" />
            <img
              src={dashboard}
              alt="Painel de pedidos Comanda"
              className="relative w-full max-w-2xl mx-auto drop-shadow-2xl"
              width={1280}
              height={1024}
            />
            {/* Floating stats card */}
            <div className="absolute -bottom-4 left-4 md:left-0 bg-card rounded-2xl shadow-elegant p-4 flex items-center gap-3 border border-border">
              <div className="w-12 h-12 rounded-xl bg-success/15 flex items-center justify-center">
                <ArrowRight className="w-6 h-6 text-success -rotate-45" />
              </div>
              <div>
                <div className="text-2xl font-display font-extrabold text-foreground">+38%</div>
                <div className="text-xs text-muted-foreground font-medium">vendas no 1º mês</div>
              </div>
            </div>
          </div>
        </div>

        {/* Logo strip */}
        <div className="mt-20 lg:mt-28 text-center">
          <p className="text-sm text-muted-foreground uppercase tracking-widest font-semibold mb-6">
            Restaurantes que aumentaram lucros com Comanda
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-14 opacity-60 grayscale font-display font-extrabold text-xl md:text-2xl">
            <span>BURGER LAB</span>
            <span className="italic">Pizzaria Rosa</span>
            <span className="tracking-widest">PADARIA SOL</span>
            <span>açaí&co</span>
            <span>SUSHI ZEN</span>
          </div>
        </div>
      </div>
    </section>
  );
}
