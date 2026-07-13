import { useEffect, useRef, useState } from "react";
import {
  Clock,
  CheckCircle2,
  UtensilsCrossed,
  Package,
  Bike,
  PackageCheck,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import {
  MotionSection,
  MotionText,
  MotionReveal,
  useHydrated,
  useReducedMotionSafe,
} from "@/components/motion";
import { motion, useInView } from "motion/react";

/**
 * ComoFunciona — Fluxo de Pedidos.
 *
 * Representa o ciclo oficial do pedido na Mesivo:
 *   Pendente → Confirmado → Em preparo → Pronto → Saiu para entrega → Entregue
 *
 * `Cancelado` aparece como ramificação alternativa que pode ocorrer a partir
 * de qualquer estado não-terminal — nunca como último passo.
 *
 * Comportamento:
 * - No desktop, linha horizontal desenhada com `pathLength` de 0 → 1.
 * - No mobile, cada etapa vira um card empilhado verticalmente (sem SVG).
 * - Indicador só percorre quando: hidratado + em viewport + aba visível +
 *   reduced motion desativado. Faz pausas entre repetições.
 * - Reduced motion: linha aparece completa, sem indicador, todas as etapas
 *   visíveis. A ramificação continua compreensível.
 * - Uma única animação principal (desenho da linha) + uma sequência
 *   secundária (indicador). Sem re-render por frame.
 */

type Step = {
  key: string;
  label: string;
  desc: string;
  icon: LucideIcon;
  tone: "amber" | "orange" | "ink" | "green";
};

const steps: Step[] = [
  { key: "pendente", label: "Pendente", desc: "Pedido recebido, aguardando confirmação.", icon: Clock, tone: "amber" },
  { key: "confirmado", label: "Confirmado", desc: "Restaurante confirmou e enviou para produção.", icon: CheckCircle2, tone: "orange" },
  { key: "preparo", label: "Em preparo", desc: "Cozinha está executando o pedido.", icon: UtensilsCrossed, tone: "orange" },
  { key: "pronto", label: "Pronto", desc: "Pronto para retirada ou saída para entrega.", icon: Package, tone: "amber" },
  { key: "saiu", label: "Saiu para entrega", desc: "A caminho do cliente.", icon: Bike, tone: "orange" },
  { key: "entregue", label: "Entregue", desc: "Ciclo do pedido concluído.", icon: PackageCheck, tone: "green" },
];

const toneClasses: Record<Step["tone"], { chip: string; ring: string; text: string }> = {
  amber: { chip: "bg-brand-amber", ring: "border-ink", text: "text-ink" },
  orange: { chip: "bg-brand-orange", ring: "border-ink", text: "text-ink" },
  ink: { chip: "bg-ink", ring: "border-ink", text: "text-background" },
  green: { chip: "bg-emerald-500", ring: "border-ink", text: "text-ink" },
};

export function ComoFunciona() {
  return (
    <MotionSection
      className="relative bg-secondary py-24 md:py-32 border-y-[3px] border-ink overflow-hidden"
      aria-label="Fluxo de pedidos"
    >
      <div className="absolute inset-0 bg-grid opacity-[0.05] pointer-events-none" />

      <div className="container mx-auto px-6 relative">
        <div className="max-w-3xl mb-16">
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="h-2 w-2 rounded-full bg-brand-orange" aria-hidden="true" />
            <span className="text-[11px] uppercase tracking-[0.2em] font-bold text-ink/60">
              03 — Fluxo do pedido
            </span>
          </div>
          <MotionText
            as="h2"
            className="font-display text-ink uppercase leading-[0.85] tracking-[-0.04em] text-[clamp(2.25rem,6vw,5rem)]"
            ariaLabel="Do pedido recebido à entrega concluída, sem improviso"
            lines={[
              <>Do pedido recebido</>,
              <>
                à <span className="text-gradient-sunset">entrega concluída</span>,
              </>,
              <>sem improviso.</>,
            ]}
          />
          <MotionReveal delay={0.15}>
            <p className="mt-6 text-lg text-ink/70 max-w-2xl leading-relaxed">
              Cada pedido percorre um caminho definido no painel. Cancelamentos
              ficam registrados como ramificação — nunca escondem o fluxo real.
            </p>
          </MotionReveal>
        </div>

        <FlowDesktop />
        <FlowMobile />

        <MotionReveal delay={0.1}>
          <div className="mt-10 flex flex-wrap items-center gap-3 text-xs md:text-sm text-ink/70">
            <span className="inline-flex items-center gap-2 rounded-full border-2 border-ink bg-background px-3 py-1.5 shadow-brutal">
              <span className="h-2 w-2 rounded-full bg-brand-orange" aria-hidden="true" />
              Fluxo principal
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border-2 border-ink bg-background px-3 py-1.5 shadow-brutal">
              <XCircle className="w-4 h-4 text-rose-600" aria-hidden="true" />
              Cancelado — ramificação a partir de qualquer estado não terminal
            </span>
          </div>
        </MotionReveal>
      </div>
    </MotionSection>
  );
}

/* ============================================================
   DESKTOP — linha horizontal com SVG e indicador
   ============================================================ */
function FlowDesktop() {
  const containerRef = useRef<HTMLDivElement>(null);
  const hydrated = useHydrated();
  const reduce = useReducedMotionSafe();
  const inView = useInView(containerRef, { amount: 0.35, once: false });

  const [tabVisible, setTabVisible] = useState(true);
  useEffect(() => {
    if (!hydrated) return;
    const onVis = () => setTabVisible(document.visibilityState === "visible");
    setTabVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [hydrated]);

  const shouldAnimate = hydrated && !reduce && inView && tabVisible;

  return (
    <div ref={containerRef} className="hidden md:block relative">
      <svg
        viewBox="0 0 1000 60"
        className="w-full h-16"
        aria-hidden="true"
        preserveAspectRatio="none"
      >
        <line
          x1="30"
          y1="30"
          x2="970"
          y2="30"
          stroke="var(--ink)" strokeOpacity="0.15"
          strokeWidth="2"
          strokeDasharray="6 6"
        />
        <motion.line
          x1="30"
          y1="30"
          x2="970"
          y2="30"
          stroke="var(--ink)"
          strokeWidth="3"
          strokeLinecap="round"
          initial={{ pathLength: reduce ? 1 : 0 }}
          animate={{ pathLength: shouldAnimate || reduce ? 1 : 0 }}
          transition={{ duration: reduce ? 0 : 1.2, ease: [0.22, 1, 0.36, 1] }}
        />
        {shouldAnimate && (
          <motion.circle
            r="6"
            cy="30"
            fill="var(--brand-orange)"
            stroke="var(--ink)"
            strokeWidth="2"
            initial={{ cx: 30 }}
            animate={{ cx: [30, 970, 970, 30, 30] }}
            transition={{
              duration: 12,
              times: [0, 0.45, 0.55, 0.95, 1],
              ease: "linear",
              repeat: Infinity,
              repeatDelay: 1.5,
            }}
          />
        )}
      </svg>

      <ol className="grid grid-cols-6 gap-3 -mt-6">
        {steps.map((step, i) => (
          <StepCard key={step.key} step={step} index={i} animate={shouldAnimate || reduce} />
        ))}
      </ol>

      {/* Ramificação Cancelado — sai do meio do fluxo */}
      <div className="mt-14 flex justify-center">
        <div className="flex flex-col items-center gap-3">
          <svg width="2" height="40" aria-hidden="true">
            <line x1="1" y1="0" x2="1" y2="40" stroke="var(--ink)" strokeOpacity="0.4" strokeWidth="2" strokeDasharray="4 4" />
          </svg>
          <div className="inline-flex items-center gap-3 rounded-2xl border-2 border-ink bg-background px-5 py-3 shadow-brutal">
            <span
              aria-hidden="true"
              className="w-9 h-9 grid place-items-center rounded-lg bg-rose-100 border-2 border-ink text-rose-700"
            >
              <XCircle className="w-5 h-5" strokeWidth={2.5} />
            </span>
            <div>
              <div className="font-display text-lg text-ink leading-none">Cancelado</div>
              <div className="text-xs text-ink/60 mt-1">
                Ramificação alternativa a partir de qualquer estado não terminal.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   MOBILE — coluna vertical, sem SVG
   ============================================================ */
function FlowMobile() {
  const reduce = useReducedMotionSafe();
  const hydrated = useHydrated();
  const animate = hydrated && !reduce;

  return (
    <ol className="md:hidden space-y-4">
      {steps.map((step, i) => (
        <motion.li
          key={step.key}
          initial={animate ? { opacity: 0, y: 12 } : false}
          whileInView={animate ? { opacity: 1, y: 0 } : undefined}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: i * 0.06 }}
          className="flex items-start gap-3"
        >
          <StepBadge step={step} />
          <div className="pt-1">
            <div className="font-display text-lg text-ink leading-none">{step.label}</div>
            <div className="text-sm text-ink/70 mt-1">{step.desc}</div>
          </div>
        </motion.li>
      ))}
      <li className="flex items-start gap-3 pt-4 border-t-2 border-dashed border-ink/25">
        <span
          aria-hidden="true"
          className="w-10 h-10 grid place-items-center rounded-lg bg-rose-100 border-2 border-ink text-rose-700 flex-shrink-0"
        >
          <XCircle className="w-5 h-5" strokeWidth={2.5} />
        </span>
        <div className="pt-1">
          <div className="font-display text-lg text-ink leading-none">Cancelado</div>
          <div className="text-sm text-ink/70 mt-1">
            Ramificação alternativa a partir de qualquer estado não terminal.
          </div>
        </div>
      </li>
    </ol>
  );
}

function StepCard({ step, index, animate }: { step: Step; index: number; animate: boolean }) {
  const Icon = step.icon;
  const tone = toneClasses[step.tone];
  return (
    <motion.li
      initial={animate ? { opacity: 0, y: 12 } : false}
      whileInView={animate ? { opacity: 1, y: 0 } : undefined}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.15 + index * 0.09 }}
      className="flex flex-col items-center text-center"
    >
      <StepBadge step={step} />
      <div className={`mt-3 font-display text-sm lg:text-base text-ink leading-tight`}>
        {step.label}
      </div>
      <div className="mt-1 text-[11px] lg:text-xs text-ink/60 leading-snug max-w-[16ch]">
        {step.desc}
      </div>
    </motion.li>
  );
}

function StepBadge({ step }: { step: Step }) {
  const Icon = step.icon;
  const tone = toneClasses[step.tone];
  return (
    <span
      aria-hidden="true"
      className={`w-11 h-11 md:w-12 md:h-12 grid place-items-center rounded-xl border-2 ${tone.ring} ${tone.chip} ${tone.text} shadow-brutal flex-shrink-0`}
    >
      <Icon className="w-5 h-5 md:w-6 md:h-6" strokeWidth={2.5} />
    </span>
  );
}
