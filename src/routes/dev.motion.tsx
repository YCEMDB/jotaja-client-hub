import { createFileRoute } from "@tanstack/react-router";
import { Bell, CheckCircle2, Clock, Package, Utensils } from "lucide-react";
import {
  AnimatedNotification,
  MagneticButton,
  Marquee,
  MotionMockup,
  MotionMockupLayer,
  MotionReveal,
  MotionSection,
  MotionStagger,
  MotionStaggerItem,
  MotionText,
  ScrollProgress,
  type NotificationItem,
} from "@/components/motion";

export const Route = createFileRoute("/dev/motion")({
  head: () => ({
    meta: [
      { title: "Motion Playground — Mesivo" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: MotionPlayground,
});

const NOTIFICATIONS: NotificationItem[] = [
  {
    id: "new-order",
    icon: <Bell className="h-4 w-4" />,
    title: "Novo pedido recebido",
    description: "Mesa 08 · 2 itens",
    accent: "orange",
  },
  {
    id: "in-prep",
    icon: <Utensils className="h-4 w-4" />,
    title: "Pedido em preparo",
    description: "Cozinha · #1042",
    accent: "amber",
  },
  {
    id: "ready",
    icon: <Package className="h-4 w-4" />,
    title: "Pedido pronto",
    description: "Retirada · #1042",
    accent: "violet",
  },
  {
    id: "closed",
    icon: <CheckCircle2 className="h-4 w-4" />,
    title: "Mesa 08 fechada",
    description: "R$ 84,00 · dinheiro",
    accent: "magenta",
  },
];

const CHIPS = [
  "Salão",
  "Mesas",
  "Balcão",
  "Retirada",
  "Delivery",
  "Cardápio digital",
];

function MotionPlayground() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <ScrollProgress />

      {/* HERO PLAYGROUND ---------------------------------------------- */}
      <section className="container max-w-6xl mx-auto py-16 md:py-24">
        <MotionReveal variant="fade" as="div" className="mb-4">
          <span className="chip-brand">Motion playground</span>
        </MotionReveal>

        <MotionText
          as="h1"
          className="font-display text-5xl md:text-7xl leading-[0.95] tracking-tight text-ink"
          ariaLabel="Controle o salão. Acelere cada pedido."
          lines={[
            "CONTROLE O SALÃO.",
            <span key="l2">
              ACELERE CADA{" "}
              <span className="text-gradient-sunset">PEDIDO</span>.
            </span>,
          ]}
        />

        <MotionReveal
          variant="fade"
          delay={0.7}
          className="mt-6 max-w-xl text-lg text-muted-foreground"
        >
          Fluxo, entrada de pedidos e continuidade da operação em uma linguagem
          de movimento única. Esta página valida os primitivos antes da
          aplicação na landing.
        </MotionReveal>

        <MotionStagger delay={0.85} className="mt-8 flex flex-wrap gap-3">
          <MotionStaggerItem>
            <MagneticButton
              className="inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground px-6 py-3 font-display text-sm shadow-brutal border-2 border-ink"
              type="button"
            >
              Começar gratuitamente
            </MagneticButton>
          </MotionStaggerItem>
          <MotionStaggerItem>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-md bg-card text-foreground px-6 py-3 font-display text-sm border-2 border-ink shadow-brutal"
            >
              Ver demonstração
            </button>
          </MotionStaggerItem>
        </MotionStagger>

        {/* Mockup + notificações --------------------------------------- */}
        <div className="mt-14 grid gap-10 lg:grid-cols-[1.5fr_1fr] items-start">
          <MotionMockup
            ariaLabel="Prévia do painel Mesivo"
            className="relative rounded-2xl border-2 border-ink bg-card shadow-brutal-lg overflow-hidden"
          >
            <div className="flex items-center gap-2 px-4 py-3 border-b-2 border-ink bg-muted">
              <span className="h-3 w-3 rounded-full bg-destructive" />
              <span className="h-3 w-3 rounded-full bg-warning" />
              <span className="h-3 w-3 rounded-full bg-success" />
              <span className="ml-3 text-xs font-mono text-muted-foreground">
                mesivo.app / operacoes
              </span>
            </div>
            <div className="grid grid-cols-[180px_1fr] min-h-[280px]">
              <MotionMockupLayer depth={1} delay={0.15} className="bg-muted p-4 border-r-2 border-ink">
                <div className="space-y-2">
                  {["Pedidos", "Mesas", "Cardápio", "Caixa", "Relatórios"].map(
                    (s) => (
                      <div
                        key={s}
                        className="rounded-md px-3 py-2 text-sm bg-card border border-border font-medium"
                      >
                        {s}
                      </div>
                    ),
                  )}
                </div>
              </MotionMockupLayer>
              <MotionMockupLayer depth={2} delay={0.3} className="p-4 space-y-3">
                {[
                  { n: "#1042", t: "Mesa 08 · 2 itens", s: "Em preparo" },
                  { n: "#1043", t: "Delivery · 3 itens", s: "Pendente" },
                  { n: "#1044", t: "Balcão · 1 item", s: "Pronto" },
                ].map((r) => (
                  <div
                    key={r.n}
                    className="flex items-center justify-between rounded-lg border-2 border-ink bg-background px-3 py-2"
                  >
                    <div>
                      <div className="font-display text-sm">{r.n}</div>
                      <div className="text-xs text-muted-foreground">{r.t}</div>
                    </div>
                    <span className="text-xs font-semibold text-brand-orange">
                      {r.s}
                    </span>
                  </div>
                ))}
              </MotionMockupLayer>
            </div>
          </MotionMockup>

          {/* Reserva altura fixa — evita layout shift ao chegar notificação */}
          <div className="min-h-[240px]">
            <AnimatedNotification items={NOTIFICATIONS} maxVisible={2} />
          </div>
        </div>
      </section>

      {/* MARQUEE ------------------------------------------------------- */}
      <MotionSection
        aria-label="Operações Mesivo"
        className="border-y-2 border-ink bg-ink text-white py-4"
      >
        <Marquee ariaLabel="Salão, mesas, balcão, retirada, delivery e cardápio digital">
          {CHIPS.map((c) => (
            <span
              key={c}
              className="inline-flex items-center gap-3 font-display text-lg tracking-wide"
            >
              <span className="text-brand-orange">◆</span>
              {c}
            </span>
          ))}
        </Marquee>
      </MotionSection>

      {/* STAGGER GRID -------------------------------------------------- */}
      <MotionSection className="container max-w-6xl mx-auto py-20">
        <MotionReveal variant="mask" as="header" className="mb-8">
          <h2 className="font-display text-4xl md:text-5xl text-ink">
            Elementos em <span className="text-gradient-sunset">stagger</span>
          </h2>
          <p className="mt-3 text-muted-foreground max-w-xl">
            Um único observer por seção controla a entrada dos filhos em
            cascata coordenada.
          </p>
        </MotionReveal>

        <MotionStagger className="grid gap-6 md:grid-cols-3">
          {[
            { t: "Pedidos", d: "Recebe, distribui e acompanha em tempo real." },
            { t: "Mesas", d: "Sessões, comandas e transferências fluidas." },
            { t: "Cardápio", d: "Produtos, categorias e adicionais organizados." },
            { t: "Caixa", d: "Fechamentos e conferência sem retrabalho." },
            { t: "Delivery", d: "Rotas, entregadores e SLA sob controle." },
            { t: "Relatórios", d: "Números claros para decisões rápidas." },
          ].map((f) => (
            <MotionStaggerItem key={f.t}>
              <article className="card-brand p-6 lift-on-hover">
                <div className="flex items-center gap-3 mb-2">
                  <Clock className="h-5 w-5 text-brand-orange" />
                  <h3 className="font-display text-xl">{f.t}</h3>
                </div>
                <p className="text-sm text-muted-foreground">{f.d}</p>
              </article>
            </MotionStaggerItem>
          ))}
        </MotionStagger>
      </MotionSection>

      {/* REVEAL VARIANTS ---------------------------------------------- */}
      <MotionSection className="container max-w-6xl mx-auto pb-24">
        <h2 className="font-display text-3xl mb-6 text-ink">
          Variantes de reveal
        </h2>
        <div className="grid gap-4 md:grid-cols-5">
          {(["fade", "up", "mask", "clip-x", "clip-y"] as const).map((v) => (
            <MotionReveal
              key={v}
              variant={v}
              className="card-brand p-4 text-center font-display"
            >
              {v}
            </MotionReveal>
          ))}
        </div>
      </MotionSection>

      <footer className="py-10 text-center text-xs text-muted-foreground">
        Motion Playground — validação da Onda 1. Página interna, sem indexação.
      </footer>
    </div>
  );
}
