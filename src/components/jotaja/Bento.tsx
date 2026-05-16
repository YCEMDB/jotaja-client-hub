import { Smartphone, ShoppingBag, CreditCard, Bike, Tag, BarChart3, Users, MessageSquare, Zap } from "lucide-react";
import heroKanban from "@/assets/hero-admin-kanban.png";
import heroMobile from "@/assets/hero-app-mobile.png";

/**
 * Bento grid that consolidates Vantagens + Funcionalidades.
 * Asymmetric, dense, no slide-y vibe — each card has different size/treatment.
 */
export function Bento() {
  return (
    <section id="funcionalidades" className="relative bg-background py-24 md:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-dots opacity-40 pointer-events-none" />
      <div className="container mx-auto px-6 relative">
        {/* Kicker + title */}
        <div className="max-w-3xl mb-14">
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="h-2 w-2 rounded-full bg-brand-orange" />
            <span className="text-[11px] uppercase tracking-[0.2em] font-bold text-ink/60">
              02 — Plataforma
            </span>
          </div>
          <h2 className="font-display text-ink uppercase leading-[0.85] tracking-[-0.04em] text-[clamp(2.25rem,6vw,5rem)]">
            Tudo integrado.
            <br />
            <span className="text-gradient-sunset">Nada de gambiarra.</span>
          </h2>
          <p className="mt-5 text-lg text-ink/70 max-w-xl leading-relaxed">
            Cardápio, pedidos, pagamento, entrega e CRM — em um único painel
            pensado pra operação real de restaurante.
          </p>
        </div>

        {/* Bento grid */}
        <div className="grid grid-cols-12 gap-4 md:gap-5 auto-rows-[140px] md:auto-rows-[160px]">
          {/* BIG — kanban screenshot */}
          <div className="col-span-12 lg:col-span-7 row-span-3 group relative rounded-2xl border-2 border-ink bg-card overflow-hidden shadow-brutal hover:shadow-brutal-lg hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all">
            <div className="absolute top-5 left-5 z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-ink text-background text-[10px] font-bold uppercase tracking-widest">
                <ShoppingBag className="w-3 h-3" />
                Pedidos em tempo real
              </div>
              <h3 className="font-display text-3xl md:text-4xl text-ink mt-3 max-w-xs leading-tight">
                Kanban que pulsa com sua cozinha.
              </h3>
            </div>
            <img
              src={heroKanban}
              alt="Painel kanban de pedidos"
              className="absolute bottom-0 right-0 w-[85%] md:w-[78%] translate-x-6 translate-y-8 group-hover:translate-y-6 transition-transform border-2 border-ink rounded-xl shadow-card-xl"
            />
          </div>

          {/* TALL — phone screenshot */}
          <div className="col-span-12 sm:col-span-6 lg:col-span-5 row-span-4 group relative rounded-2xl border-2 border-ink bg-gradient-sunset overflow-hidden shadow-brutal">
            <div className="absolute inset-0 bg-noise opacity-50" />
            <div className="relative h-full p-6 md:p-8 flex flex-col">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-ink/80 text-background text-[10px] font-bold uppercase tracking-widest w-fit">
                <Smartphone className="w-3 h-3" />
                Cardápio digital
              </div>
              <h3 className="font-display text-3xl md:text-4xl text-background mt-3 max-w-[14ch] leading-tight">
                Sua loja na palma do cliente.
              </h3>
              <p className="text-background/85 mt-2 text-sm max-w-[28ch]">
                Cores, logo, fotos. URL própria. QR Code pra mesa.
                Funciona offline-first.
              </p>
              <div className="relative flex-1 mt-4">
                <img
                  src={heroMobile}
                  alt="Cardápio digital no celular"
                  className="absolute -bottom-12 right-0 w-[70%] rounded-[2rem] border-[6px] border-ink shadow-brutal-lg rotate-[6deg] group-hover:rotate-[3deg] transition-transform"
                />
              </div>
            </div>
          </div>

          {/* Pix card */}
          <div className="col-span-6 lg:col-span-3 row-span-2 group relative rounded-2xl border-2 border-ink bg-brand-amber p-5 shadow-brutal hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all">
            <CreditCard className="w-8 h-8 text-ink" strokeWidth={2.5} />
            <div className="font-display text-4xl md:text-5xl text-ink mt-3 leading-none flex items-baseline gap-1">
              2<span className="text-xl">seg</span>
            </div>
            <p className="text-xs font-bold uppercase tracking-wider text-ink mt-2">
              Pix cai direto no caixa
            </p>
          </div>

          {/* Entregadores */}
          <div className="col-span-6 lg:col-span-4 row-span-2 group relative rounded-2xl border-2 border-ink bg-card p-5 shadow-brutal hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 grid place-items-center rounded-lg bg-brand-magenta text-background shrink-0">
                <Bike className="w-5 h-5" strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="font-display text-xl text-ink leading-tight">
                  Áreas + taxas por bairro
                </h3>
                <p className="text-xs text-ink/60 mt-1.5 leading-snug">
                  Atribua entregadores, calcule frete por CEP e acompanhe rota.
                </p>
              </div>
            </div>
          </div>

          {/* Cupons */}
          <div className="col-span-6 lg:col-span-3 row-span-2 group relative rounded-2xl border-2 border-ink bg-brand-violet text-background p-5 shadow-brutal hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all overflow-hidden">
            <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-background/10" />
            <Tag className="w-7 h-7 relative" strokeWidth={2.5} />
            <h3 className="font-display text-2xl mt-3 leading-tight relative">
              Cupons em<br />segundos
            </h3>
            <p className="text-[11px] uppercase tracking-widest font-bold opacity-70 mt-2 relative">
              % ou R$ fixo
            </p>
          </div>

          {/* Relatórios */}
          <div className="col-span-6 lg:col-span-4 row-span-2 group relative rounded-2xl border-2 border-ink bg-ink text-background p-5 shadow-brutal overflow-hidden hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all">
            <div className="absolute inset-0 bg-noise opacity-40" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="w-5 h-5 text-brand-orange" strokeWidth={2.5} />
                <span className="text-[10px] uppercase tracking-widest font-bold text-background/60">
                  Relatórios
                </span>
              </div>
              <div className="flex items-end gap-1.5 h-12 mt-2">
                {[40, 65, 50, 80, 70, 95, 100].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-t-sm bg-gradient-to-t from-brand-orange to-brand-amber"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
              <p className="font-display text-lg text-background mt-3 leading-tight">
                Vendas, ticket, picos
              </p>
            </div>
          </div>

          {/* Sem comissão — destaque */}
          <div className="col-span-12 lg:col-span-5 row-span-2 group relative rounded-2xl border-2 border-ink bg-background p-6 shadow-brutal hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all">
            <div className="flex items-center justify-between gap-4 h-full">
              <div>
                <div className="font-display text-[88px] md:text-[120px] leading-[0.85] tracking-tighter text-ink">
                  0%
                </div>
                <p className="text-sm text-ink/70 max-w-[24ch] mt-1">
                  De comissão por pedido. Cada R$ vai direto pra você — só uma mensalidade fixa.
                </p>
              </div>
              <div className="w-px self-stretch bg-ink/15" />
              <div className="font-display text-ink/30 text-[10px] uppercase tracking-[0.3em] [writing-mode:vertical-rl]">
                Vs. iFood 27%
              </div>
            </div>
          </div>

          {/* CRM */}
          <div className="col-span-6 lg:col-span-4 row-span-2 group relative rounded-2xl border-2 border-ink bg-card p-5 shadow-brutal hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all">
            <Users className="w-7 h-7 text-brand-orange" strokeWidth={2.5} />
            <h3 className="font-display text-xl text-ink mt-3 leading-tight">
              Base de clientes sua.
            </h3>
            <p className="text-xs text-ink/60 mt-1.5">
              Histórico, ticket médio e contato — sem ninguém no meio.
            </p>
          </div>

          {/* WhatsApp */}
          <div className="col-span-6 lg:col-span-3 row-span-2 group relative rounded-2xl border-2 border-ink bg-success text-success-foreground p-5 shadow-brutal hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all">
            <MessageSquare className="w-7 h-7" strokeWidth={2.5} fill="currentColor" />
            <h3 className="font-display text-xl mt-3 leading-tight">
              WhatsApp<br />integrado
            </h3>
            <p className="text-[11px] uppercase tracking-widest font-bold opacity-80 mt-2">
              Notif + suporte
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
