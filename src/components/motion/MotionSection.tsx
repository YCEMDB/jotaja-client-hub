import { motion } from "motion/react";
import { useReducedMotionSafe } from "./useReducedMotionSafe";
import type { ReactNode } from "react";
import { dur, easeOut, shift } from "./motion-tokens";

/**
 * MotionSection — wrapper padrão para uma seção da landing.
 *
 * Dispara uma única animação de entrada quando o bloco atinge a viewport.
 * Substitui múltiplos IntersectionObservers pequenos por um por seção.
 */
export function MotionSection({
  children,
  className,
  id,
  amount = 0.15,
  as: _as = "section",
  "aria-label": ariaLabel,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
  amount?: number;
  as?: "section" | "div";
  "aria-label"?: string;
}) {
  const reduce = useReducedMotionSafe();
  const MotionTag = _as === "section" ? motion.section : motion.div;
  return (
    <MotionTag
      id={id}
      aria-label={ariaLabel}
      className={className}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: shift.sm }}
      whileInView={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount }}
      transition={{
        duration: reduce ? dur.reduced : dur.section,
        ease: reduce ? "linear" : easeOut,
      }}
    >
      {children}
    </MotionTag>
  );
}
