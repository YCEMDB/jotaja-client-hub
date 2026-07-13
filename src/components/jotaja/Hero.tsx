import { ArrowRight, Check, Bell, CreditCard, Utensils } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LeadFormDialog } from "./LeadFormDialog";
import markUrl from "@/assets/mesivo-mark.svg";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-background">
      {/* Fundo gradiente + malha */}
      <div className="absolute inset-0 bg-gradient-radial pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-mesh opacity-70 pointer-events-none" />
      <div className="absolute inset-0 bg-noise opacity-50 mix-blend-overlay pointer-events-none" />
      <div className="absolute inset-0 pointer-events-none opacity-[0.06] bg-grid" />

      <div className="container mx-auto px-6 pt-12 md:pt-20 pb-20 md:pb-28 relative">
        {/* Selo */}
        <div className="flex justify-center mb-8">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border-2 border-ink/15 bg-background/70 backdrop-blur text-[11px] font-bold uppercase tracking-[0.18em] text-ink/70">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-orange animate-pulse" />
            A plataforma completa para restaurantes
          </span>
        </div>

        {/* HERO MAIN — grid editorial 12 colunas */}
        <div className="grid grid-cols-12 gap-6 lg:gap-10 items-center">
          {/* LEFT — headline */}
          <div className="col-span-12 lg:col-span-7 animate-fade-up">
            <h1 className="font-display text-ink uppercase leading-[0.85] tracking-[-0.055em] text-[clamp(2.5rem,8vw,6.5rem)]">
              Controle o salão.
              <br />
              <span className="text-gradient-sunset">Acelere</span> cada
              <br />
              pedido.
            </h1>

            <p className="mt-8 max-w-xl text-lg md:text-xl text-ink/75 leading-relaxed">
              Centralize pedidos, mesas, comandas, cardápio digital, caixa,
              cozinha, entregas e clientes em uma plataforma criada para a
              rotina real do seu restaurante.
            </p>

            <div className="mt-9 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <LeadFormDialog
                trigger={
                  <Button
                    size="lg"
                    className="rounded-2xl bg-ink text-background hover:bg-ink/90 font-bold px-8 h-14 text-base shadow-brutal hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all uppercase tracking-wider"
                  >
                    Começar gratuitamente
                    <ArrowRight className="w-5 h-5 ml-2" strokeWidth={3} />
                  </Button>
                }
              />
              <Button
                size="lg"
                variant="outline"
                className="rounded-2xl font-bold px-6 h-14 text-base border-2 border-ink/20 hover:bg-ink/5"
                asChild
              >
                <a href="#funcionalidades">Conhecer a plataforma</a>
              </Button>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-ink/60 font-semibold">
              {["14 dias grátis", "sem cartão de crédito", "cancele quando quiser"].map((item) => (
                <div key={item} className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-brand-orange" strokeWidth={3} />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT — mockup HTML do painel + notificações flutuantes */}
          <div className="col-span-12 lg:col-span-5 relative animate-fade-up" style={{ animationDelay: "0.15s" }}>
            <ProductMockup />
          </div>
        </div>
      </div>

      {/* Faixa de operações — canais em uma linha contínua */}
      <div className="relative border-y-[2px] border-ink/10 bg-ink text-background py-5 overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm md:text-base font-display uppercase tracking-wider">
            {["Salão", "Mesas", "Balcão", "Retirada", "Delivery", "Cardápio digital"].map((canal, i, arr) => (
              <span key={canal} className="flex items-center gap-6">
                <span>{canal}</span>
                {i < arr.length - 1 && (
                  <span className="text-brand-orange">·</span>
                )}
              </span>
            ))}
          </div>
          <p className="mt-3 text-center text-xs md:text-sm text-background/60 font-medium">
            Uma única plataforma para todos os canais do seu restaurante.
          </p>
        </div>
      </div>
    </section>
  );
}

/** Mockup do painel Mesivo — HTML puro, sempre com a marca correta. */
function ProductMockup() {
  return (
    <div className="relative">
      {/* Janela do navegador */}
      <div className="relative rounded-2xl overflow-hidden shadow-card-xl ring-1 ring-ink/15 bg-card">
        {/* Chrome */}
        <div className="flex items-center gap-1.5 px-3 py-2.5 bg-ink border-b border-background/10">
          <div className="w-2.5 h-2.5 rounded-full bg-destructive/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-brand-amber" />
          <div className="w-2.5 h-2.5 rounded-full bg-success" />
          <div className="ml-3 text-[10px] text-background/60 font-mono truncate">
            app.mesivo · pedidos
          </div>
        </div>
        {/* Header do painel */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-ink/10 bg-background/60">
          <img src={markUrl} alt="" className="h-6 w-auto" />
          <span className="font-display text-lg tracking-tight text-ink lowercase">mesivo</span>
          <span className="ml-auto text-[10px] font-bold text-ink/50 uppercase tracking-wider">Painel</span>
        </div>
        {/* Kanban */}
        <div className="grid grid-cols-3 gap-2 p-3 bg-background/40">
          {[
            { label: "Novos", count: 3, color: "bg-brand-amber" },
            { label: "Em preparo", color: "bg-brand-orange", count: 2 },
            { label: "Prontos", color: "bg-success", count: 1 },
          ].map((col, ci) => (
            <div key={col.label} className="rounded-lg border border-ink/10 bg-background p-2">
              <div className="flex items-center gap-1.5 mb-2">
                <span className={`w-2 h-2 rounded-full ${col.color}`} />
                <span className="text-[10px] font-bold uppercase tracking-wider text-ink/70">{col.label}</span>
                <span className="ml-auto text-[10px] font-bold text-ink/50">{col.count}</span>
              </div>
              <div className="space-y-1.5">
                {Array.from({ length: col.count }).map((_, i) => (
                  <div key={i} className="rounded-md border border-ink/10 p-2 bg-secondary/30">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold text-ink">#{100 + ci * 10 + i}</span>
                      <span className="text-[9px] text-ink/50">{5 + i}min</span>
                    </div>
                    <div className="h-1 rounded bg-ink/10 w-3/4" />
                    <div className="h-1 rounded bg-ink/10 w-1/2 mt-1" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Notificações flutuantes */}
      <FloatNotification
        className="-top-3 -right-3 md:-top-4 md:-right-6"
        icon={<Bell className="w-3.5 h-3.5" />}
        title="Novo pedido recebido"
        subtitle="Mesa 08 · R$ 74,50"
        tone="orange"
      />
      <FloatNotification
        className="top-1/2 -left-4 md:-left-8 -translate-y-1/2"
        icon={<CreditCard className="w-3.5 h-3.5" />}
        title="Pagamento confirmado"
        subtitle="Pix · #142"
        tone="success"
      />
      <FloatNotification
        className="-bottom-3 right-4 md:-bottom-4 md:right-8"
        icon={<Utensils className="w-3.5 h-3.5" />}
        title="Pedido pronto"
        subtitle="Balcão · #138"
        tone="amber"
      />
    </div>
  );
}

function FloatNotification({
  className = "",
  icon,
  title,
  subtitle,
  tone,
}: {
  className?: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  tone: "orange" | "success" | "amber";
}) {
  const toneClass =
    tone === "orange"
      ? "bg-brand-orange text-white"
      : tone === "success"
        ? "bg-success text-white"
        : "bg-brand-amber text-ink";
  return (
    <div
      className={`absolute z-20 flex items-center gap-2 px-3 py-2 rounded-xl bg-background border-2 border-ink shadow-brutal max-w-[240px] ${className}`}
    >
      <div className={`w-7 h-7 rounded-lg grid place-items-center shrink-0 ${toneClass}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-bold text-ink leading-tight truncate">{title}</p>
        <p className="text-[10px] text-ink/60 leading-tight truncate">{subtitle}</p>
      </div>
    </div>
  );
}
