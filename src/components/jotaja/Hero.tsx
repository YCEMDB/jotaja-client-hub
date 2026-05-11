import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-background">
      <div className="absolute inset-0 bg-grid opacity-50 pointer-events-none" />

      <div className="container mx-auto px-6 pt-20 pb-16 md:pt-28 md:pb-24 relative">
        <div className="max-w-3xl mx-auto text-center animate-fade-up">
          <a
            href="#funcionalidades"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-card shadow-xs text-xs font-medium text-muted-foreground hover:text-foreground hover:border-primary/30 transition-smooth"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            Novo: pagamento via Pix instantâneo
            <ArrowRight className="w-3 h-3" />
          </a>

          <h1 className="mt-6 text-4xl sm:text-5xl md:text-[3.5rem] font-bold tracking-tight text-foreground leading-[1.05]">
            A plataforma de delivery
            <br />
            <span className="text-muted-foreground font-bold">feita para o seu restaurante.</span>
          </h1>

          <p className="mt-6 text-base md:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Aumente vendas, automatize a operação e reduza custos com uma plataforma completa.
            Sem comissão por venda, com a sua marca.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              size="lg"
              className="rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-semibold px-6 shadow-blue h-11"
              asChild
            >
              <a href="#cadastro">
                Começar grátis
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </a>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="rounded-lg font-semibold px-6 h-11 border-border hover:bg-muted"
              asChild
            >
              <a href="#funcionalidades">Ver demonstração</a>
            </Button>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
            {[
              "14 dias grátis",
              "Sem cartão de crédito",
              "Cancele quando quiser",
            ].map((item) => (
              <div key={item} className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-primary" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Dashboard mockup */}
        <div className="mt-16 max-w-5xl mx-auto animate-fade-up" style={{ animationDelay: "0.15s" }}>
          <div className="relative">
            <div className="relative rounded-2xl border border-border bg-card shadow-card-xl overflow-hidden">
              {/* Browser chrome */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/40">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-border" />
                  <div className="w-2.5 h-2.5 rounded-full bg-border" />
                  <div className="w-2.5 h-2.5 rounded-full bg-border" />
                </div>
                <div className="flex-1 mx-4">
                  <div className="h-6 max-w-xs mx-auto rounded-md bg-background border border-border text-[10px] grid place-items-center text-muted-foreground">
                    app.comanda.com.br/admin
                  </div>
                </div>
              </div>

              {/* Dashboard content */}
              <div className="grid grid-cols-12 min-h-[420px]">
                {/* Sidebar */}
                <div className="hidden md:flex col-span-3 lg:col-span-2 border-r border-border bg-muted/30 flex-col p-3 gap-1">
                  {["Dashboard", "Pedidos", "Cardápio", "Clientes", "Relatórios", "Cupons"].map((item, i) => (
                    <div
                      key={item}
                      className={`text-xs font-medium px-3 py-2 rounded-md ${
                        i === 0
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground"
                      }`}
                    >
                      {item}
                    </div>
                  ))}
                </div>

                {/* Main */}
                <div className="col-span-12 md:col-span-9 lg:col-span-10 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="text-sm font-semibold">Dashboard</div>
                      <div className="text-xs text-muted-foreground">Visão geral · Hoje</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="px-2 py-1 rounded-md bg-success/10 text-success text-[10px] font-semibold">
                        ● Aberto
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {[
                      { label: "Pedidos hoje", value: "47", delta: "+12%" },
                      { label: "Faturamento", value: "R$ 2.840", delta: "+8%" },
                      { label: "Ticket médio", value: "R$ 60,42", delta: "+3%" },
                      { label: "Tempo médio", value: "28 min", delta: "-5%" },
                    ].map((stat) => (
                      <div
                        key={stat.label}
                        className="rounded-xl border border-border p-3 bg-background"
                      >
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                          {stat.label}
                        </div>
                        <div className="mt-1 flex items-baseline justify-between">
                          <div className="text-lg font-bold">{stat.value}</div>
                          <div className="text-[10px] font-semibold text-success">
                            {stat.delta}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 rounded-xl border border-border p-4 bg-background">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-xs font-semibold">Pedidos recentes</div>
                      <div className="text-[10px] text-muted-foreground">Ver todos</div>
                    </div>
                    <div className="space-y-2">
                      {[
                        { n: "#1248", name: "Ana Silva", val: "R$ 82,50", st: "Pronto", color: "bg-success/10 text-success" },
                        { n: "#1247", name: "Carlos M.", val: "R$ 47,90", st: "Preparo", color: "bg-warning/15 text-warning" },
                        { n: "#1246", name: "Júlia R.", val: "R$ 124,00", st: "Entrega", color: "bg-primary/10 text-primary" },
                      ].map((p) => (
                        <div
                          key={p.n}
                          className="flex items-center justify-between text-xs py-2 border-b border-border last:border-0"
                        >
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-muted-foreground">{p.n}</span>
                            <span className="font-medium">{p.name}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-semibold">{p.val}</span>
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${p.color}`}>
                              {p.st}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Logos / social proof */}
        <div className="mt-16 max-w-4xl mx-auto">
          <p className="text-center text-xs uppercase tracking-widest text-muted-foreground font-semibold">
            +1.200 restaurantes confiam na Comanda
          </p>
          <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-x-8 gap-y-4 items-center justify-items-center opacity-60">
            {["Sabor & Cia", "Bella Pizza", "Burger House", "Açaí Tropical", "Sushi Tokyo"].map((name) => (
              <div key={name} className="text-sm font-bold tracking-tight text-muted-foreground">
                {name}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
