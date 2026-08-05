import { ArrowRight, Check, Bell, CheckCircle2, Utensils, Package, Bike } from "lucide-react";
import { useEffect, useRef } from "react";
import { motion, useMotionValue, useSpring, useInView } from "motion/react";
import { useReducedMotionSafe } from "@/components/motion/useReducedMotionSafe";
import { Button } from "@/components/ui/button";
import { LeadFormDialog } from "./LeadFormDialog";
import { MesivoMark } from "@/components/mesivo-graphics/MesivoMark";
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

// Sequência operacional real do Mesivo — sem promessa de confirmação
// automática de pagamento, que não existe no produto neste momento.
const NOTIFICATIONS: NotificationItem[] = [
  {
    id: "new-order",
    icon: <Bell className="w-3.5 h-3.5" />,
    title: "Novo pedido recebido",
    description: "Mesa 08 · 2 itens",
    accent: "orange",
  },
  {
    id: "confirmed",
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    title: "Pedido confirmado",
    description: "Mesa 08 · #142",
    accent: "amber",
  },
  {
    id: "in-prep",
    icon: <Utensils className="w-3.5 h-3.5" />,
    title: "Pedido em preparo",
    description: "Cozinha · #142",
    accent: "orange",
  },
  {
    id: "ready",
    icon: <Package className="w-3.5 h-3.5" />,
    title: "Pedido pronto",
    description: "Retirada · #142",
    accent: "amber",
  },
  {
    id: "delivered",
    icon: <Bike className="w-3.5 h-3.5" />,
    title: "Pedido entregue",
    description: "Entrega · #142",
    accent: "ink",
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
          className="flex justify-center mb-10"
        >
          <span className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full border border-ink/10 bg-background/40 backdrop-blur-md text-[10px] font-bold uppercase tracking-[0.22em] text-ink/60 shadow-sm ring-1 ring-inset ring-white/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-orange opacity-40" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-orange" />
            </span>
            A inteligência operacional definitiva
          </span>
        </MotionReveal>

        {/* HERO MAIN */}
        <div className="grid grid-cols-12 gap-6 lg:gap-12 items-center">
          {/* LEFT — headline */}
          <div className="col-span-12 lg:col-span-7">
            <MotionText
              as="h1"
              className="font-display text-ink uppercase leading-[0.82] tracking-[-0.05em] text-[clamp(2.75rem,8.5vw,6.8rem)] drop-shadow-[0_2px_2px_rgba(0,0,0,0.05)]"
              ariaLabel="Gestão que liberta o seu restaurante."
              lines={[
                "Gestão que",
                <span key="l2">
                  liberta o <span className="text-gradient-sunset drop-shadow-sm">seu negócio.</span>
                </span>
              ]}
            />

            <MotionReveal
              variant="fade"
              delay={heroSequence.subtitle}
              amount={0.3}
              className="mt-8 max-w-xl text-lg md:text-xl text-ink/70 leading-relaxed font-medium"
            >
              Uma plataforma de alta performance para unificar sua operação, eliminar fricções e maximizar lucros. Do PDV ao Cardápio Inteligente.
            </MotionReveal>

            <MotionReveal
              variant="fade"
              delay={heroSequence.buttons}
              amount={0.3}
              className="mt-10 flex flex-col sm:flex-row items-start sm:items-center gap-5"
            >
              <LeadFormDialog
                trigger={
                  <MagneticButton
                    strength={4}
                    className="group relative inline-flex items-center justify-center rounded-2xl bg-ink text-background hover:bg-ink/95 font-bold px-10 h-16 text-base shadow-brutal transition-all uppercase tracking-wider overflow-hidden"
                  >
                    <span className="relative z-10 flex items-center">
                      Começar agora
                      <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" strokeWidth={3} />
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  </MagneticButton>
                }
              />
              <Button
                size="lg"
                variant="outline"
                className="rounded-2xl font-bold px-8 h-16 text-base border-2 border-ink/15 hover:border-ink/30 hover:bg-ink/5 transition-all active:scale-[0.98]"
                asChild
              >
                <a href="#funcionalidades">Explorar Ecossistema</a>
              </Button>
            </MotionReveal>

            <MotionReveal
              variant="fade"
              delay={heroSequence.buttons + 0.1}
              amount={0.3}
              className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-[11px] text-ink/50 font-bold uppercase tracking-widest"
            >
              {["Trial de 14 dias", "Setup em minutos", "Sem fidelidade"].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-4 h-4 rounded-full bg-brand-orange/10">
                    <Check className="w-2.5 h-2.5 text-brand-orange" strokeWidth={4} />
                  </div>
                  <span>{item}</span>
                </div>
              ))}
            </MotionReveal>
          </div>

          {/* RIGHT — mockup do painel + notificações */}
          <div className="col-span-12 lg:col-span-5 relative lg:pl-4">
            <ProductMockup />
          </div>
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
  const reduce = useReducedMotionSafe();
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
      // Deslocamento máximo ~10px — parallax quase imperceptível.
      mx.set(nx * 10);
      my.set(ny * 10);
    };
    el.addEventListener("mousemove", onMove);
    return () => el.removeEventListener("mousemove", onMove);
  }, [reduce, fine, mx, my]);

  const loop = !reduce && inView;

  return (
    <div ref={ref} aria-hidden="true" className="absolute inset-0 pointer-events-none select-none">
      {/* Base gradients */}
      <div className="absolute inset-0 bg-gradient-radial" />
      <div className="absolute inset-0 bg-gradient-mesh opacity-80" />
      
      {/* Heavy Paper Texture Overlay */}
      <div className="absolute inset-0 opacity-[0.4] mix-blend-multiply pointer-events-none" 
           style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />
      
      {/* Grain / Film Texture */}
      <div className="absolute inset-0 bg-noise opacity-40 mix-blend-overlay" />
      
      {/* Technical Grid with mask */}
      <div className="absolute inset-0 opacity-[0.08] bg-grid" />

      {/* Static "Scratches" / Distressed Texture */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
           style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 1000 1000' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='f'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.01' numOctaves='5'/%3E%3CfeDisplacementMap in='SourceGraphic' scale='20'/%3E%3C/filter%3E%3Cpath d='M0 0l1000 1000M1000 0L0 1000' stroke='black' stroke-width='2' filter='url(%23f)' opacity='0.5'/%3E%3C/svg%3E")` }} />

      {/* Blob 1 — laranja-coral (#FF6534 aprox.) */}
      <motion.div
        style={{ x: fine && !reduce ? sx : 0, y: fine && !reduce ? sy : 0 }}
        animate={
          loop ? { scale: [1, 1.06, 1], opacity: [0.55, 0.75, 0.55] } : { scale: 1, opacity: 0.55 }
        }
        transition={loop ? { duration: 9, ease: "easeInOut", repeat: Infinity } : { duration: 0 }}
        className="absolute -top-24 -right-24 w-[38rem] h-[38rem] rounded-full blur-[100px]"
      >
        <div
          className="w-full h-full rounded-full"
          style={{
            background:
              "radial-gradient(closest-side, oklch(0.72 0.22 40 / 0.55), transparent 70%)",
          }}
        />
      </motion.div>

      {/* Blob 2 — âmbar quente (#FFB020 aprox.) */}
      <motion.div
        style={{ x: fine && !reduce ? sx : 0, y: fine && !reduce ? sy : 0 }}
        animate={
          loop ? { scale: [1, 1.08, 1], opacity: [0.35, 0.5, 0.35] } : { scale: 1, opacity: 0.35 }
        }
        transition={
          loop ? { duration: 12, ease: "easeInOut", repeat: Infinity, delay: 0.6 } : { duration: 0 }
        }
        className="absolute -bottom-32 -left-24 w-[32rem] h-[32rem] rounded-full blur-[100px]"
      >
        <div
          className="w-full h-full rounded-full"
          style={{
            background:
              "radial-gradient(closest-side, oklch(0.82 0.17 75 / 0.45), transparent 70%)",
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
          <MesivoMark size={24} />
          <span className="font-display text-lg tracking-tight text-ink uppercase">mesivo</span>
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
            <div key={col.label} className="rounded-lg border border-ink/10 bg-background p-2">
              <div className="flex items-center gap-1.5 mb-2">
                <span className={`w-2 h-2 rounded-full ${col.color}`} />
                <span className="text-[10px] font-bold uppercase tracking-wider text-ink/70">
                  {col.label}
                </span>
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
