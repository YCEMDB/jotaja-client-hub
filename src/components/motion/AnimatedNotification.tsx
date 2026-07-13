import { AnimatePresence, motion, useInView } from "motion/react";
import { useReducedMotionSafe } from "./useReducedMotionSafe";
import { useEffect, useRef, useState } from "react";
import { dur, easeOut } from "./motion-tokens";

export type NotificationItem = {
  id: string;
  icon?: React.ReactNode;
  title: string;
  description?: string;
  accent?: "orange" | "magenta" | "violet" | "amber" | "ink";
};

/**
 * AnimatedNotification — sequência de notificações ao lado do mockup.
 *
 * - Máximo de 1–2 visíveis simultaneamente.
 * - Container tem altura reservada — chegada de uma notificação NÃO altera
 *   a altura do Hero (sem layout shift).
 * - Pausa quando sai da viewport (nada de timers girando invisível).
 * - Reduced motion: mostra a primeira notificação estática; sem loop.
 */
export function AnimatedNotification({
  items,
  interval = 3200,
  className,
  maxVisible = 2,
}: {
  items: NotificationItem[];
  interval?: number;
  className?: string;
  maxVisible?: 1 | 2;
}) {
  const reduce = useReducedMotionSafe();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.3 });
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (reduce || !inView || items.length === 0) return;
    const t = window.setInterval(() => {
      setIndex((i) => (i + 1) % items.length);
    }, interval);
    return () => window.clearInterval(t);
  }, [reduce, inView, interval, items.length]);

  const visible: NotificationItem[] = reduce
    ? items.slice(0, 1)
    : maxVisible === 1
      ? [items[index] ?? items[0]]
      : [
          items[index] ?? items[0],
          items[(index - 1 + items.length) % items.length] ?? items[0],
        ].filter(Boolean);

  return (
    <div
      ref={ref}
      className={className}
      aria-live="polite"
      aria-atomic="true"
      style={{ position: "relative" }}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        {visible.map((n, slot) => (
          <motion.div
            key={n.id + ":" + slot}
            layout
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.98 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.98 }}
            transition={{
              duration: reduce ? dur.reduced : dur.quick,
              ease: reduce ? "linear" : easeOut,
            }}
            data-accent={n.accent ?? "orange"}
            className="notification-card"
          >
            {n.icon ? <span className="notification-icon">{n.icon}</span> : null}
            <div>
              <div className="notification-title">{n.title}</div>
              {n.description ? <div className="notification-desc">{n.description}</div> : null}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
