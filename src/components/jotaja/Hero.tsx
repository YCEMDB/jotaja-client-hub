import { ArrowRight, Check, Star, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LeadFormDialog } from "./LeadFormDialog";
import heroMobile from "@/assets/hero-app-mobile.png";
import heroKanban from "@/assets/hero-admin-kanban.png";
import sunsetTexture from "@/assets/sunset-texture.jpg";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-background">
      {/* Layer 1: full-bleed sunset texture, masked at top */}
      <div
        className="absolute inset-x-0 top-0 h-[88%] opacity-95"
        style={{
          backgroundImage: `url(${sunsetTexture})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          maskImage:
            "linear-gradient(180deg, black 0%, black 60%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(180deg, black 0%, black 60%, transparent 100%)",
        }}
      />
      {/* Layer 2: noise grain over everything */}
      <div className="absolute inset-0 bg-noise opacity-60 mix-blend-overlay pointer-events-none" />
      {/* Layer 3: thick grid lines on top — editorial scaffolding */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.07] bg-grid" />

      <div className="container mx-auto px-6 pt-10 md:pt-16 pb-24 md:pb-32 relative">
        {/* Top bar — manifesto strip */}
        <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold uppercase tracking-[0.2em] text-ink/70 mb-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-ink text-background">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            v4.2 ao vivo
          </span>
          <span className="hidden md:inline">·</span>
          <span className="hidden md:inline">+1.247 restaurantes</span>
          <span className="hidden md:inline">·</span>
          <span className="hidden md:inline">R$ 9,4M processados/mês</span>
          <span className="ml-auto text-ink/50">São Paulo / Brasil</span>
        </div>

        {/* HERO MAIN — asymmetric editorial split */}
        <div className="grid grid-cols-12 gap-6 lg:gap-10 items-start">
          {/* LEFT: headline (7 cols) */}
          <div className="col-span-12 lg:col-span-7 animate-fade-up">
            <h1 className="font-display text-ink uppercase leading-[0.82] tracking-[-0.055em] text-[clamp(3rem,9.5vw,8rem)]">
              Pare de pagar
              <br />
              <span className="relative inline-block">
                <span className="relative z-10 text-background">comissão</span>
                <span className="absolute inset-0 -rotate-1 bg-ink z-0 -mx-2" />
              </span>
              <br />
              <span className="italic font-normal" style={{ fontFamily: "Hind", fontWeight: 300, letterSpacing: "-0.02em" }}>
                para vender
              </span>
              <br />
              <span className="text-gradient-sunset">seu próprio</span>
              <br />
              <span className="">delivery.</span>
            </h1>

            <p className="mt-10 max-w-xl text-lg md:text-xl text-ink/80 leading-relaxed font-medium">
              Comandex é o sistema completo de delivery próprio:{" "}
              <span className="bg-brand-amber/50 px-1.5 font-bold text-ink">
                cardápio digital
              </span>
              ,{" "}
              <span className="bg-brand-magenta/30 px-1.5 font-bold text-ink">
                gestão de pedidos
              </span>{" "}
              e{" "}
              <span className="underline decoration-4 decoration-brand-orange underline-offset-2 font-bold">
                Pix instantâneo
              </span>{" "}
              — com a sua marca, sem intermediário.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <LeadFormDialog
                trigger={
                  <Button
                    size="lg"
                    className="rounded-2xl bg-ink text-background hover:bg-ink/90 font-bold px-8 h-16 text-base shadow-brutal-lg hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all uppercase tracking-wider"
                  >
                    Começar grátis
                    <ArrowRight className="w-5 h-5 ml-2" strokeWidth={3} />
                  </Button>
                }
              />
              <div className="flex flex-col">
                <Button
                  size="lg"
                  variant="ghost"
                  className="rounded-2xl font-bold px-2 h-auto text-base text-ink hover:bg-transparent underline underline-offset-4 decoration-2 decoration-brand-magenta hover:decoration-4 self-start"
                  asChild
                >
                  <a href="#funcionalidades">Ver sistema funcionando →</a>
                </Button>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink/60 font-semibold mt-1 px-2">
                  {["14 dias grátis", "sem cartão", "cancele quando quiser"].map((item) => (
                    <div key={item} className="flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 text-brand-orange" strokeWidth={3} />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: layered product screenshots (5 cols) */}
          <div className="col-span-12 lg:col-span-5 relative min-h-[520px] lg:min-h-[680px] animate-fade-up" style={{ animationDelay: "0.15s" }}>
            {/* Kanban screenshot — base layer, rotated */}
            <div
              className="absolute right-0 top-8 w-[115%] lg:w-[130%] rounded-2xl overflow-hidden shadow-card-xl ring-1 ring-ink/20"
              style={{ transform: "rotate(3deg)" }}
            >
              <div className="flex items-center gap-1.5 px-3 py-2 bg-ink border-b border-background/10">
                <div className="w-2.5 h-2.5 rounded-full bg-destructive/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-brand-amber" />
                <div className="w-2.5 h-2.5 rounded-full bg-success" />
                <div className="ml-3 text-[10px] text-background/60 font-mono">app.comandahub.online/pedidos</div>
              </div>
              <img
                src={heroKanban}
                alt="Painel de gestão de pedidos do Comandex — kanban com colunas Novos, Em Preparo e Prontos"
                className="block w-full h-auto"
                width={1600}
                height={1024}
              />
            </div>

            {/* Mobile storefront — overlapping foreground, counter-rotated */}
            <div
              className="absolute -left-4 lg:-left-12 bottom-0 w-[58%] lg:w-[62%] rounded-[2rem] overflow-hidden shadow-glow ring-[6px] ring-ink"
              style={{ transform: "rotate(-7deg)" }}
            >
              <img
                src={heroMobile}
                alt="Cardápio digital do Comandex no celular — loja Bella Pizza com produtos e carrinho"
                className="block w-full h-auto"
                width={1024}
                height={1536}
              />
            </div>

            {/* Sticker — 0% comissão */}
            <div
              className="absolute -top-4 -right-4 lg:-top-6 lg:right-4 w-32 h-32 lg:w-36 lg:h-36 rounded-full bg-ink text-background grid place-items-center text-center shadow-brutal-lg z-20"
              style={{ transform: "rotate(12deg)" }}
            >
              <div>
                <div className="font-display text-5xl lg:text-6xl leading-none">0%</div>
                <div className="text-[10px] font-bold uppercase tracking-widest mt-1 text-brand-amber">comissão</div>
              </div>
            </div>

            {/* Sticker — Pix 2s */}
            <div
              className="absolute bottom-12 right-0 lg:-right-4 px-4 py-3 rounded-2xl bg-brand-amber text-ink shadow-brutal z-20 border-2 border-ink"
              style={{ transform: "rotate(-4deg)" }}
            >
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 fill-current" strokeWidth={2} />
                <div>
                  <div className="font-display text-sm leading-none">PIX EM 2s</div>
                  <div className="text-[9px] font-bold uppercase tracking-wider opacity-80">cai direto na conta</div>
                </div>
              </div>
            </div>

            {/* Mini quote — overlapping bottom */}
            <div
              className="absolute -bottom-4 left-[42%] lg:left-[50%] w-[260px] p-4 rounded-2xl bg-background border-2 border-ink shadow-brutal z-30"
              style={{ transform: "rotate(2deg)" }}
            >
              <div className="flex gap-0.5 text-brand-orange mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3 h-3 fill-current" />
                ))}
              </div>
              <p className="font-display text-sm leading-tight text-ink">
                "Saí do iFood e dobrei o lucro em 2 meses."
              </p>
              <div className="mt-2 flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gradient-sunset" />
                <div className="text-[10px] font-bold text-ink/80">RAFAEL · BELLA PIZZA</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MARQUEE strip — full-bleed, brutal */}
      <div className="relative border-y-[3px] border-ink bg-ink text-background py-5 overflow-hidden">
        <div className="flex gap-12 animate-marquee whitespace-nowrap font-display text-2xl md:text-3xl uppercase">
          {[
            "Cardápio Digital",
            "★",
            "Pedidos em Tempo Real",
            "★",
            "Pix Instantâneo",
            "★",
            "Sem Comissão",
            "★",
            "Sua Marca",
            "★",
            "Relatórios Inteligentes",
            "★",
            "WhatsApp Integrado",
            "★",
          ]
            .concat([
              "Cardápio Digital",
              "★",
              "Pedidos em Tempo Real",
              "★",
              "Pix Instantâneo",
              "★",
              "Sem Comissão",
              "★",
              "Sua Marca",
              "★",
              "Relatórios Inteligentes",
              "★",
              "WhatsApp Integrado",
              "★",
            ])
            .map((item, i) => (
              <span
                key={i}
                className={item === "★" ? "text-brand-orange" : ""}
              >
                {item}
              </span>
            ))}
        </div>
      </div>
    </section>
  );
}
