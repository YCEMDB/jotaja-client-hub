import { motion, type Variants, type HTMLMotionProps } from "motion/react";
import type { ReactNode } from "react";
import { useHydrated } from "@/components/motion/useHydrated";
import { useReducedMotionSafe } from "@/components/motion/useReducedMotionSafe";

const easeOut = [0.22, 1, 0.36, 1] as const;

/**
 * SSR-safe reveal wrapper.
 *
 * Motion's SSR emits inline `opacity`/`transform` styles for `initial`, but
 * on the client under Reduced Motion the same `motion.div` mounts without
 * those styles — a hydration mismatch. We hold `initial={false}` on the
 * first client render (structurally identical to the server output — no
 * inline animation styles either side) and only enable the entry animation
 * after hydration.
 */
export function Reveal({
  children,
  delay = 0,
  y = 16,
  className,
  as = "div",
  amount = 0.2,
  ...rest
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  as?: "div" | "section" | "li" | "article" | "header";
  amount?: number;
} & Omit<HTMLMotionProps<"div">, "children">) {
  const hydrated = useHydrated();
  const reduce = useReducedMotionSafe();
  const Comp = motion[as] as typeof motion.div;
  const animate = hydrated && !reduce;
  return (
    <Comp
      initial={animate ? { opacity: 0, y } : false}
      whileInView={animate ? { opacity: 1, y: 0 } : undefined}
      viewport={{ once: true, amount }}
      transition={{ duration: 0.55, ease: easeOut, delay }}
      className={className}
      {...rest}
    >
      {children}
    </Comp>
  );
}

const containerVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};
const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: easeOut } },
};

export function Stagger({
  children,
  className,
  amount = 0.15,
}: {
  children: ReactNode;
  className?: string;
  amount?: number;
}) {
  const hydrated = useHydrated();
  const reduce = useReducedMotionSafe();
  const animate = hydrated && !reduce;
  return (
    <motion.div
      variants={containerVariants}
      initial={animate ? "hidden" : false}
      whileInView={animate ? "show" : undefined}
      viewport={{ once: true, amount }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const hydrated = useHydrated();
  const reduce = useReducedMotionSafe();
  const animate = hydrated && !reduce;
  return (
    <motion.div
      variants={animate ? itemVariants : undefined}
      initial={animate ? undefined : false}
      className={className}
    >
      {children}
    </motion.div>
  );
}
