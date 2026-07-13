import { motion, useReducedMotion, type Variants } from "motion/react";
import type { ElementType, ReactNode } from "react";
import { dur, easeOut, shift, stagger } from "./motion-tokens";

/**
 * MotionStagger — controla a entrada em cascata dos filhos.
 *
 * Um único IntersectionObserver por bloco (via whileInView do container),
 * herdado pelos MotionStaggerItem. Reduced motion desliga o stagger e
 * renderiza tudo imediatamente.
 */
export function MotionStagger({
  children,
  className,
  amount = 0.15,
  delay = 0,
  gap = stagger.base,
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  amount?: number;
  delay?: number;
  gap?: number;
  as?: "div" | "ul" | "ol" | "section";
}) {
  const reduce = useReducedMotion();
  const Comp = motion[as] as ElementType;

  if (reduce) {
    const Plain = as as ElementType;
    return <Plain className={className}>{children}</Plain>;
  }

  const containerVariants: Variants = {
    hidden: {},
    show: {
      transition: { staggerChildren: gap, delayChildren: delay },
    },
  };

  return (
    <Comp
      variants={containerVariants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount }}
      className={className}
    >
      {children}
    </Comp>
  );
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: shift.sm },
  show: { opacity: 1, y: 0, transition: { duration: dur.base, ease: easeOut } },
};

export function MotionStaggerItem({
  children,
  className,
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "li" | "article";
}) {
  const reduce = useReducedMotion();
  const Comp = motion[as] as ElementType;
  if (reduce) {
    const Plain = as as ElementType;
    return <Plain className={className}>{children}</Plain>;
  }
  return (
    <Comp variants={itemVariants} className={className}>
      {children}
    </Comp>
  );
}
