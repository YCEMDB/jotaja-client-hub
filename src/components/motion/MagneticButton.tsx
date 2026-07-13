import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "motion/react";
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { usePointerFine } from "./usePointerFine";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  /** Deslocamento máximo em px. Padrão 4 (limite 5). */
  strength?: number;
};

/**
 * MagneticButton — CTA principal com deslocamento magnético sutil.
 *
 * - Usa MotionValue + useSpring: NÃO causa re-render em cada mousemove.
 * - Só ativa em pointer fine (desktop) e quando não há reduced motion.
 * - Deslocamento máximo limitado a ~5 px.
 * - Uso restrito: CTAs principais do Hero e do CTA final. Não usar em
 *   botões de formulário, painel, menus ou botões pequenos.
 */
export const MagneticButton = forwardRef<HTMLButtonElement, Props>(
  function MagneticButton(
    { children, strength = 4, onMouseMove, onMouseLeave, style, ...rest },
    ref,
  ) {
    const reduce = useReducedMotion();
    const fine = usePointerFine();
    const enabled = !reduce && fine;

    const capped = Math.min(strength, 5);
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const sx = useSpring(x, { stiffness: 260, damping: 22, mass: 0.4 });
    const sy = useSpring(y, { stiffness: 260, damping: 22, mass: 0.4 });

    return (
      <motion.button
        ref={ref}
        style={enabled ? { x: sx, y: sy, ...style } : style}
        onMouseMove={(e) => {
          if (enabled) {
            const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
            const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
            const ny = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
            x.set(nx * capped);
            y.set(ny * capped);
          }
          onMouseMove?.(e);
        }}
        onMouseLeave={(e) => {
          if (enabled) {
            x.set(0);
            y.set(0);
          }
          onMouseLeave?.(e);
        }}
        {...rest}
      >
        {children}
      </motion.button>
    );
  },
);
