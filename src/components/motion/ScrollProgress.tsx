import { motion, useReducedMotion, useScroll, useSpring } from "motion/react";

/**
 * ScrollProgress — barra fina laranja no topo, indicando progresso da
 * rolagem da página. Usada apenas no shell público da landing.
 *
 * - Baseada em MotionValue via useScroll — sem re-render por scroll.
 * - Removida sob reduced motion.
 * - Não deve ser usada no painel administrativo.
 */
export function ScrollProgress() {
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 140,
    damping: 24,
    mass: 0.3,
  });

  if (reduce) return null;

  return (
    <motion.div
      aria-hidden="true"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: 3,
        transformOrigin: "0% 50%",
        scaleX,
        background:
          "linear-gradient(90deg, oklch(0.78 0.17 65), oklch(0.69 0.22 38), oklch(0.62 0.24 0))",
        zIndex: 60,
        pointerEvents: "none",
      }}
    />
  );
}
