import { motion, useReducedMotion, type HTMLMotionProps } from "motion/react";
import type { ElementType, ReactNode } from "react";
import { dur, easeOut, shift } from "./motion-tokens";

export type MotionRevealVariant = "fade" | "up" | "mask" | "clip-x" | "clip-y";

type Props = {
  children: ReactNode;
  variant?: MotionRevealVariant;
  delay?: number;
  amount?: number;
  as?: "div" | "section" | "article" | "header" | "li" | "figure";
  className?: string;
} & Omit<HTMLMotionProps<"div">, "children">;

/**
 * MotionReveal — entrada única de bloco ao entrar na viewport.
 *
 * - Uma única animação (once: true) para evitar re-triggers.
 * - Reduced motion: fade curto (≈120 ms), sem translação.
 * - Conteúdo permanece semanticamente presente no HTML inicial (SSR-safe).
 */
export function MotionReveal({
  children,
  variant = "up",
  delay = 0,
  amount = 0.2,
  as = "div",
  className,
  ...rest
}: Props) {
  const reduce = useReducedMotion();
  const Comp = motion[as] as ElementType;

  if (reduce) {
    return (
      <Comp
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount }}
        transition={{ duration: dur.reduced, ease: "linear", delay }}
        className={className}
        {...rest}
      >
        {children}
      </Comp>
    );
  }

  const variants: Record<MotionRevealVariant, { hidden: any; show: any }> = {
    fade: {
      hidden: { opacity: 0 },
      show: { opacity: 1 },
    },
    up: {
      hidden: { opacity: 0, y: shift.md },
      show: { opacity: 1, y: 0 },
    },
    mask: {
      hidden: { opacity: 0, y: shift.sm, clipPath: "inset(0 0 100% 0)" },
      show: { opacity: 1, y: 0, clipPath: "inset(0 0 0% 0)" },
    },
    "clip-x": {
      hidden: { opacity: 0, clipPath: "inset(0 100% 0 0)" },
      show: { opacity: 1, clipPath: "inset(0 0% 0 0)" },
    },
    "clip-y": {
      hidden: { opacity: 0, clipPath: "inset(100% 0 0 0)" },
      show: { opacity: 1, clipPath: "inset(0% 0 0 0)" },
    },
  };

  const v = variants[variant];

  return (
    <Comp
      initial={v.hidden}
      whileInView={v.show}
      viewport={{ once: true, amount }}
      transition={{ duration: dur.section, ease: easeOut, delay }}
      className={className}
      {...rest}
    >
      {children}
    </Comp>
  );
}
