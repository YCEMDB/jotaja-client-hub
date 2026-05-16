import { ArrowRight, Check, TrendingUp, Zap, ShoppingBag, Star, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-background">
      {/* Mesh background blobs */}
      <div className="absolute inset-0 bg-gradient-mesh opacity-90 pointer-events-none" />
      <div className="absolute -top-20 -left-20 w-[420px] h-[420px] rounded-full bg-brand-orange/30 blur-3xl animate-blob pointer-events-none" />
      <div className="absolute top-40 -right-32 w-[480px] h-[480px] rounded-full bg-brand-magenta/25 blur-3xl animate-blob pointer-events-none" style={{ animationDelay: "3s" }} />
      <div className="absolute inset-0 bg-noise opacity-60 pointer-events-none mix-blend-overlay" />

      <div className="container mx-auto px-6 pt-20 pb-20 md:pt-28 md:pb-28 relative">
        {/* Top headline block */}
        <div className="max-w-5xl animate-fade-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-ink text-background text-xs font-bold uppercase tracking-wider shadow-brutal">
            <Sparkles className="w-3.5 h-3.5 text-brand-amber" />
            Novo · Pix instantâneo liberado
          </div>

          <h1 className="mt-8 font-display text-[clamp(2.75rem,8vw,6.5rem)] leading-[0.88] tracking-[-0.05em] text-ink">
            Seu delivery,
            <br />
            <span className="text-gradient-sunset">sem ninguém</span>
            <br />
            no meio.
          </h1>

          <p className="mt-8 max-w-2xl text-lg md:text-xl text-ink/70 leading-relaxed font-medium">
            Cardápio digital, pedidos, pagamento e gestão num só lugar — com a <span className="font-bold text-ink">sua marca</span> e <span className="bg-brand-amber/40 px-1.5 rounded-md font-bold text-ink">zero comissão</span> por venda.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Button
              size="lg"
              className="rounded-2xl bg-ink text-background hover:bg-ink/90 font-bold px-7 h-14 text-base shadow-brutal-lg hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
              asChild
            >
              <a href="#cadastro">
                Começar grátis · 14 dias
                <ArrowRight className="w-5 h-5 ml-2" />
              </a>
            </Button>
            <Button
              size="lg"
              variant="ghost"
              className="rounded-2xl font-bold px-6 h-14 text-base text-ink hover:bg-ink/5 underline underline-offset-4 decoration-2 decoration-brand-orange"
              asChild
            >
              <a href="#funcionalidades">Ver demonstração →</a>
            </Button>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-ink/60 font-medium">
            {["Sem cartão", "Cancele quando quiser", "Suporte humano"].map((item) => (
              <div key={item} className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-brand-orange" strokeWidth={3} />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* BENTO GRID */}
        <div className="mt-16 grid grid-cols-12 gap-4 md:gap-5 animate-fade-up" style={{ animationDelay: "0.15s" }}>
          {/* Big card — Dashboard mockup */}
          <div className="col-span-12 lg:col-span-8 rounded-3xl bg-ink text-background p-6 md:p-8 shadow-xl relative overflow-hidden group">
            <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-brand-orange/30 blur-3xl group-hover:bg-brand-orange/40 transition-all duration-700" />
            <div className="relative">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="text-xs uppercase tracking-widest text-brand-amber font-bold">Painel ao vivo</div>
                  <div className="font-display text-2xl mt-1">Hoje, terça-feira</div>
                </div>
                <div className="px-3 py-1.5 rounded-full bg-success/20 text-success text-xs font-bold border border-success/30">
                  ● ABERTO
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "Pedidos", value: "47", delta: "+12%", icon: ShoppingBag },
                  { label: "Faturamento", value: "R$2.840", delta: "+8%", icon: TrendingUp },
                  { label: "Ticket médio", value: "R$60", delta: "+3%", icon: Star },
                  { label: "Tempo médio", value: "28min", delta: "-5%", icon: Zap },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-2xl bg-background/5 backdrop-blur border border-background/10 p-4 hover:bg-background/10 transition-smooth"
                  >
                    <stat.icon className="w-4 h-4 text-brand-amber mb-2" />
                    <div className="text-[10px] uppercase tracking-wider text-background/60 font-bold">
                      {stat.label}
                    </div>
                    <div className="mt-1 font-display text-2xl">{stat.value}</div>
                    <div className="text-[10px] font-bold text-success mt-0.5">{stat.delta}</div>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-2xl bg-background/5 backdrop-blur border border-background/10 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-background/80">Pedidos recentes</div>
                  <div className="text-[10px] text-background/50">Ver todos →</div>
                </div>
                <div className="space-y-2.5">
                  {[
                    { n: "#1248", name: "Ana Silva", val: "R$ 82,50", st: "Pronto", color: "bg-success/20 text-success" },
                    { n: "#1247", name: "Carlos M.", val: "R$ 47,90", st: "Preparo", color: "bg-brand-amber/20 text-brand-amber" },
                    { n: "#1246", name: "Júlia R.", val: "R$ 124,00", st: "Entrega", color: "bg-brand-magenta/20 text-brand-magenta" },
                  ].map((p) => (
                    <div key={p.n} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs text-background/50">{p.n}</span>
                        <span className="font-semibold">{p.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold">{p.val}</span>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${p.color}`}>
                          {p.st}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Big number — comissão */}
          <div className="col-span-12 sm:col-span-6 lg:col-span-4 rounded-3xl bg-gradient-sunset p-6 md:p-8 text-background relative overflow-hidden flex flex-col justify-between min-h-[280px]">
            <div className="absolute inset-0 bg-noise opacity-30 mix-blend-overlay" />
            <div className="relative">
              <div className="text-xs uppercase tracking-widest font-bold opacity-90">Comissão por venda</div>
              <div className="font-display text-[8rem] md:text-[10rem] leading-none mt-2 tracking-tighter">0%</div>
            </div>
            <div className="relative text-sm font-semibold opacity-95">
              O lucro do pedido é todo seu. Sem taxa por venda, sempre.
            </div>
          </div>

          {/* Quote / depoimento */}
          <div className="col-span-12 sm:col-span-6 lg:col-span-4 rounded-3xl bg-card border-2 border-ink p-6 md:p-7 shadow-brutal flex flex-col justify-between">
            <div>
              <div className="flex gap-0.5 text-brand-amber">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>
              <p className="mt-4 font-display text-xl leading-tight text-ink">
                "Saí do iFood e dobrei o lucro em <span className="text-brand-magenta">2 meses</span>."
              </p>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-sunset" />
              <div>
                <div className="font-bold text-sm text-ink">Rafael Costa</div>
                <div className="text-xs text-ink/60">Bella Pizza · SP</div>
              </div>
            </div>
          </div>

          {/* Stat cards */}
          <div className="col-span-6 lg:col-span-2 rounded-3xl bg-brand-magenta text-background p-5 md:p-6 flex flex-col justify-between min-h-[180px]">
            <div className="text-xs uppercase tracking-widest font-bold opacity-90">Lojas ativas</div>
            <div className="font-display text-5xl md:text-6xl tracking-tight">1.2k+</div>
          </div>

          <div className="col-span-6 lg:col-span-3 rounded-3xl bg-ink text-background p-5 md:p-6 flex flex-col justify-between min-h-[180px] relative overflow-hidden">
            <div className="absolute inset-0 bg-grid opacity-20" />
            <div className="relative text-xs uppercase tracking-widest font-bold text-brand-amber">Tempo de setup</div>
            <div className="relative">
              <div className="font-display text-5xl md:text-6xl tracking-tight">15min</div>
              <div className="text-xs font-medium text-background/60 mt-1">do cadastro à primeira venda</div>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-3 rounded-3xl bg-brand-amber/30 border-2 border-ink p-5 md:p-6 flex flex-col justify-between min-h-[180px]">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ink">
              <Zap className="w-4 h-4 fill-current" /> Pix instantâneo
            </div>
            <div>
              <div className="font-display text-3xl text-ink leading-tight">Receba em 2s</div>
              <div className="text-xs text-ink/70 font-medium mt-1">Sem aguardar D+30 de operadora</div>
            </div>
          </div>

          {/* CTA wide */}
          <div className="col-span-12 lg:col-span-4 rounded-3xl bg-card border-2 border-ink p-6 md:p-7 flex flex-col justify-between min-h-[180px] shadow-brutal hover:shadow-brutal-lg transition-all">
            <div className="text-xs uppercase tracking-widest font-bold text-brand-magenta">Comece agora</div>
            <div>
              <div className="font-display text-2xl text-ink leading-tight">
                14 dias grátis.<br />Zero risco.
              </div>
              <Button
                asChild
                className="mt-4 rounded-xl bg-ink text-background hover:bg-ink/90 font-bold w-full h-11"
              >
                <a href="#cadastro">
                  Quero testar <ArrowRight className="w-4 h-4 ml-1.5" />
                </a>
              </Button>
            </div>
          </div>
        </div>

        {/* Social proof marquee */}
        <div className="mt-16 max-w-5xl mx-auto">
          <p className="text-center text-xs uppercase tracking-[0.25em] text-ink/50 font-bold">
            +1.200 restaurantes confiam na ComandaHub
          </p>
          <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-x-8 gap-y-4 items-center justify-items-center">
            {["Sabor & Cia", "Bella Pizza", "Burger House", "Açaí Tropical", "Sushi Tokyo"].map((name) => (
              <div key={name} className="font-display text-base tracking-tight text-ink/40 hover:text-ink transition-smooth">
                {name}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
