import { motion, useReducedMotion } from "motion/react";
import type { CSSProperties, ElementType, ReactNode } from "react";
import { dur, easeOut, heroSequence, shift } from "./motion-tokens";

type Props = {
  /** Cada string vira uma linha revelada por máscara. */
  lines: ReactNode[];
  as?: "h1" | "h2" | "h3" | "p";
  className?: string;
  lineClassName?: string;
  delay?: number;
  step?: number;
  /**
   * Rótulo acessível concatenando as linhas. Se ausente, tenta gerar do
   * conteúdo textual das linhas — mas quando `lines` contém elementos
   * (spans com highlight, ícones), passe explicitamente.
   */
  ariaLabel?: string;
};

/**
 * MotionText — revelação por linhas com máscara vertical.
 *
 * Regras de acessibilidade:
 * - O heading permanece semântico (h1/h2/…), com aria-label completo.
 * - Cada linha visual é aria-hidden — leitores usam o aria-label do heading.
 * - Conteúdo textual está no HTML inicial (SSR-safe); a animação só afeta
 *   `transform` e a máscara. Reduced motion: fade curto sem translação.
 */
export function MotionText({
  lines,
  as = "h1",
  className,
  lineClassName,
  delay = heroSequence.title,
  step = heroSequence.titleLineStep,
  ariaLabel,
}: Props) {
  const reduce = useReducedMotion();
  const HeadingTag = as as ElementType;

  const label =
    ariaLabel ??
    lines
      .map((l) => (typeof l === "string" ? l : ""))
      .filter(Boolean)
      .join(" ");

  const lineStyle: CSSProperties = { display: "block", overflow: "hidden" };

  return (
    <HeadingTag className={className} aria-label={label}>
      {lines.map((line, i) => (
        <span key={i} style={lineStyle} aria-hidden="true">
          <motion.span
            style={{ display: "inline-block", willChange: "transform" }}
            className={lineClassName}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: "100%" }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, y: "0%" }}
            transition={{
              duration: reduce ? dur.reduced : dur.hero,
              ease: reduce ? "linear" : easeOut,
              delay: reduce ? 0 : delay + i * step,
            }}
          >
            {line}
          </motion.span>
        </span>
      ))}
      {/* Fallback textual invisível para copy/paste e crawlers */}
      <span className="sr-only">{label}</span>
    </HeadingTag>
  );
}

export const motionTextShift = shift;
