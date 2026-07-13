import { motion } from "motion/react";
import { useReducedMotionSafe } from "./useReducedMotionSafe";
import type { CSSProperties, ReactNode } from "react";
import { dur, easeOut, heroSequence } from "./motion-tokens";

/**
 * MotionMockup — container do mockup do sistema.
 *
 * - Entrada única com leve subida + perspectiva discreta.
 * - Camadas internas (janela, sidebar, cards, notificações) recebem
 *   pequenos deslocamentos coordenados para simular profundidade,
 *   sem parallax pesado nem filtros contínuos.
 * - Reduced motion: fade sem translação/perspectiva.
 */
export function MotionMockup({
  children,
  className,
  delay = heroSequence.mockup,
  ariaLabel,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  ariaLabel?: string;
}) {
  const reduce = useReducedMotionSafe();
  const style: CSSProperties = {
    perspective: reduce ? undefined : "1200px",
  };
  return (
    <motion.div
      role="img"
      aria-label={ariaLabel}
      className={className}
      style={style}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24, rotateX: 6, scale: 0.985 }}
      whileInView={reduce ? { opacity: 1 } : { opacity: 1, y: 0, rotateX: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{
        duration: reduce ? dur.reduced : 0.9,
        ease: reduce ? "linear" : easeOut,
        delay: reduce ? 0 : delay,
      }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Camada do mockup — entrada suave com pequeno deslocamento próprio.
 * Diferentes valores de `depth` (0–3) criam profundidade discreta.
 */
export function MotionMockupLayer({
  children,
  className,
  depth = 0,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  depth?: 0 | 1 | 2 | 3;
  delay?: number;
}) {
  const reduce = useReducedMotionSafe();
  const y = [12, 16, 20, 24][depth];
  return (
    <motion.div
      className={className}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y }}
      whileInView={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{
        duration: reduce ? dur.reduced : 0.7,
        ease: reduce ? "linear" : easeOut,
        delay: reduce ? 0 : delay,
      }}
    >
      {children}
    </motion.div>
  );
}
