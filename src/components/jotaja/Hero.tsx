import { ArrowRight, Check, Bell, CreditCard, Utensils, Package } from "lucide-react";
import { useEffect, useRef } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useInView,
} from "motion/react";
import { Button } from "@/components/ui/button";
import { LeadFormDialog } from "./LeadFormDialog";
import markUrl from "@/assets/mesivo-mark.svg";
import {
  AnimatedNotification,
  MagneticButton,
  MotionMockup,
  MotionMockupLayer,
  MotionReveal,
  MotionText,
  heroSequence,
  usePointerFine,
  type NotificationItem,
} from "@/components/motion";

const NOTIFICATIONS: NotificationItem[] = [
  {
    id: "new-order",
    icon: <Bell className="w-3.5 h-3.5" />,
    title: "Novo pedido recebido",
    description: "Mesa 08 · 2 itens",
    accent: "orange",
  },
  {
    id: "in-prep",
    icon: <Utensils className="w-3.5 h-3.5" />,
    title: "Pedido em preparo",
    description: "Cozinha · #142",
    accent: "amber",
  },
  {
    id: "ready",
    icon: <Package className="w-3.5 h-3.5" />,
    title: "Pedido pronto",
    description: "Retirada · #138",
    accent: "violet",
  },
  {
    id: "paid",
    icon: <CreditCard className="w-3.5 h-3.5" />,
    title: "Pagamento confirmado",
    description: "Pix · R$ 74,50",
    accent: "magenta",
  },
];

const OPERACOES = ["Salão", "Mesas", "Balcão", "Retirada", "Delivery", "Cardápio digital"];

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-background">
      <HeroBackground />

      <div className="container mx-auto px-6 pt-12 md:pt-20 pb-20 md:pb-28 relative">
        {/* Selo */}
        <MotionReveal
          variant="fade"
          delay={heroSequence.badge}
          amount={0.4}
          className="flex justify-center mb-8"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border-2 border-ink/15 bg-background/70 backdrop-blur text-[11px] font-bold uppercase tracking-[0.18em] text-ink/70">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-orange animate-pulse" />
            A plataforma completa para restaurantes
          </span>
        </MotionReveal>

        {/* HERO MAIN */}
        <div className="grid grid-cols-12 gap-6 lg:gap-10 items-center">
          {/* LEFT — headline */}
          <div className="col-span-12 lg:col-span-7">
            <MotionText
              as="h1"
              className="font-display text-ink uppercase leading-[0.85] tracking-[-0.055em] text-[clamp(2.5rem,8vw,6.5rem)]"
              ariaLabel="Controle o salão. Acelere cada pedido."
              lines={[
                "CONTROLE O SALÃO.",
                <span key="l2">
                  <span className="text-gradient-sunset">ACELERE</span> CADA PEDIDO.
                </span>,
              ]}
            />

            <MotionReveal
              variant="fade"
              delay={heroSequence.subtitle}
              amount={0.3}
              className="mt-8 max-w-xl text-lg md:text-xl text-ink/75 leading-relaxed"
            >
              Centralize pedidos, mesas, comandas, cardápio digital, caixa, cozinha,
              entregas e clientes em uma plataforma criada para a rotina real do seu
              restaurante.
            </MotionReveal>

            <MotionReveal
              variant="fade"
              delay={heroSequence.buttons}
              amount={0.3}
              className="mt-9 flex flex-col sm:flex-row items-start sm:items-center gap-4"
            >
              <LeadFormDialog
                trigger={
                  <MagneticButton
                    strength={4}
                    className="inline-flex items-center justify-center rounded-2xl bg-ink text-background hover:bg-ink/90 font-bold px-8 h-14 text-base shadow-brutal transition-colors uppercase tracking-wider"
                  >
                    Começar gratuitamente
                    <ArrowRight className="w-5 h-5 ml-2" strokeWidth={3} />
                  </MagneticButton>
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
            </MotionReveal>

            <MotionReveal
              variant="fade"
              delay={heroSequence.buttons + 0.1}
              amount={0.3}
              className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-ink/60 font-semibold"
            >
              {["14 dias grátis", "sem cartão de crédito", "cancele quando quiser"].map(
                (item) => (
                  <div key={item} className="flex items-center gap-1.5">
                    <Check
                      className="w-3.5 h-3.5 text-brand-orange"
                      strokeWidth={3}
                    />
                    <span>{item}</span>
                  </div>
                ),
              )}
            </MotionReveal>
          </div>

          {/* RIGHT — mockup do painel + notificações */}
          <div className="col-span-12 lg:col-span-5 relative">
            <ProductMockup />
          </div>
        </div>
      </div>

      {/* Faixa de operações */}
      <div className="relative border-y-[2px] border-ink/10 bg-ink text-background py-5 overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm md:text-base font-display uppercase tracking-wider">
            {OPERACOES.map((canal, i, arr) => (
              <span key={canal} className="flex items-center gap-6">
                <span>{canal}</span>
                {i < arr.length - 1 && <span className="text-brand-orange">·</span>}
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

/**
 * Fundo do Hero — grafite profundo com dois blobs sutis, grade técnica
 * discreta e reação parallax mínima ao cursor (apenas em pointer fine).
 * Anima apenas transform/opacity; pausa fora da viewport.
 */
function HeroBackground() {
  const reduce = useReducedMotion();
  const fine = usePointerFine();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.1 });

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 40, damping: 20, mass: 0.6 });
  const sy = useSpring(my, { stiffness: 40, damping: 20, mass: 0.6 });

  useEffect(() => {
    if (reduce || !fine) return;
    const el = ref.current;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / rect.width - 0.5;
      const ny = (e.clientY - rect.top) / rect.height - 0.5;
      mx.set(nx * 20);
      my.set(ny * 20);
    };
    el.addEventListener("mousemove", onMove);
    return () => el.removeEventListener("mousemove", onMove);
  }, [reduce, fine, mx, my]);

  const loop = !reduce && inView;

  return (
    <div ref={ref} aria-hidden="true" className="absolute inset-0 pointer-events-none">
      <div className="absolute inset-0 bg-gradient-radial" />
      <div className="absolute inset-0 bg-gradient-mesh opacity-70" />
      <div className="absolute inset-0 bg-noise opacity-50 mix-blend-overlay" />
      <div className="absolute inset-0 opacity-[0.06] bg-grid" />

      {/* Blob 1 — laranja-coral, parallax cursor */}
      <motion.div
        style={{ x: fine && !reduce ? sx : 0, y: fine && !reduce ? sy : 0 }}
        animate={
          loop
            ? { scale: [1, 1.06, 1], opacity: [0.55, 0.75, 0.55] }
            : { scale: 1, opacity: 0.55 }
        }
        transition={
          loop
            ? { duration: 9, ease: "easeInOut", repeat: Infinity }
            : { duration: 0 }
        }
        className="absolute -top-24 -right-24 w-[38rem] h-[38rem] rounded-full blur-3xl"
      >
        <div
          className="w-full h-full rounded-full"
          style={{
            background:
              "radial-gradient(closest-side, oklch(0.72 0.22 40 / 0.55), transparent 70%)",
          }}
        />
      </motion.div>

      {/* Blob 2 — magenta/violeta, pulso mais lento */}
      <motion.div
        style={{
          x: fine && !reduce ? sx.get() * -0.4 : 0,
          y: fine && !reduce ? sy.get() * -0.4 : 0,
        }}
        animate={
          loop
            ? { scale: [1, 1.08, 1], opacity: [0.35, 0.5, 0.35] }
            : { scale: 1, opacity: 0.35 }
        }
        transition={
          loop
            ? { duration: 12, ease: "easeInOut", repeat: Infinity, delay: 0.6 }
            : { duration: 0 }
        }
        className="absolute -bottom-32 -left-24 w-[32rem] h-[32rem] rounded-full blur-3xl"
      >
        <div
          className="w-full h-full rounded-full"
          style={{
            background:
              "radial-gradient(closest-side, oklch(0.55 0.22 320 / 0.45), transparent 70%)",
          }}
        />
      </motion.div>
    </div>
  );
}

/** Mockup do painel Mesivo — HTML puro, com camadas em profundidade discreta. */
function ProductMockup() {
  return (
    <MotionMockup
      ariaLabel="Prévia do painel Mesivo"
      className="relative"
      delay={heroSequence.mockup}
    >
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
        <MotionMockupLayer
          depth={0}
          delay={heroSequence.mockup + 0.1}
          className="flex items-center gap-2 px-4 py-3 border-b border-ink/10 bg-background/60"
        >
          <img src={markUrl} alt="" className="h-6 w-auto" />
          <span className="font-display text-lg tracking-tight text-ink lowercase">
            mesivo
          </span>
          <span className="ml-auto text-[10px] font-bold text-ink/50 uppercase tracking-wider">
            Painel
          </span>
        </MotionMockupLayer>

        {/* Kanban */}
        <MotionMockupLayer
          depth={2}
          delay={heroSequence.mockup + 0.2}
          className="grid grid-cols-3 gap-2 p-3 bg-background/40"
        >
          {[
            { label: "Novos", count: 3, color: "bg-brand-amber" },
            { label: "Em preparo", color: "bg-brand-orange", count: 2 },
            { label: "Prontos", color: "bg-success", count: 1 },
          ].map((col, ci) => (
            <div
              key={col.label}
              className="rounded-lg border border-ink/10 bg-background p-2"
            >
              <div className="flex items-center gap-1.5 mb-2">
                <span className={`w-2 h-2 rounded-full ${col.color}`} />
                <span className="text-[10px] font-bold uppercase tracking-wider text-ink/70">
                  {col.label}
                </span>
                <span className="ml-auto text-[10px] font-bold text-ink/50">
                  {col.count}
                </span>
              </div>
              <div className="space-y-1.5">
                {Array.from({ length: col.count }).map((_, i) => (
                  <div
                    key={i}
                    className="rounded-md border border-ink/10 p-2 bg-secondary/30"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold text-ink">
                        #{100 + ci * 10 + i}
                      </span>
                      <span className="text-[9px] text-ink/50">{5 + i}min</span>
                    </div>
                    <div className="h-1 rounded bg-ink/10 w-3/4" />
                    <div className="h-1 rounded bg-ink/10 w-1/2 mt-1" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </MotionMockupLayer>
      </div>

      {/* Notificação demonstrativa fixa — desktop, altura pré-reservada */}
      <div className="hidden md:block absolute -top-4 -right-6 z-20 w-[240px] min-h-[56px]">
        <AnimatedNotification items={NOTIFICATIONS} maxVisible={1} />
      </div>
      {/* Mobile — uma notificação por vez, abaixo do mockup */}
      <div className="md:hidden mt-4 min-h-[56px]">
        <AnimatedNotification items={NOTIFICATIONS} maxVisible={1} />
      </div>
    </MotionMockup>
  );
}
