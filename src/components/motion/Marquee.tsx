import { useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { usePointerFine } from "./usePointerFine";

/**
 * Marquee — faixa horizontal em loop contínuo.
 *
 * - CSS puro (transform), sem re-render, sem timers JS.
 * - Duplica o conteúdo apenas visualmente; a cópia é aria-hidden para
 *   leitores de tela não escutarem o texto duas vezes.
 * - Pausa no hover apenas em desktop (pointer fine).
 * - Reduced motion: renderiza faixa estática, com scroll horizontal
 *   nativo se o conteúdo exceder a largura.
 */
export function Marquee({
  children,
  speed = 45,
  className,
  ariaLabel,
}: {
  children: ReactNode;
  /** Segundos para completar um ciclo. Valores maiores = mais lento. */
  speed?: number;
  className?: string;
  ariaLabel?: string;
}) {
  const reduce = useReducedMotion();
  const pointerFine = usePointerFine();

  if (reduce) {
    return (
      <div
        className={className}
        aria-label={ariaLabel}
        style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}
      >
        <div style={{ display: "inline-flex", gap: "2rem" }}>{children}</div>
      </div>
    );
  }

  return (
    <div
      className={className}
      aria-label={ariaLabel}
      data-marquee
      style={{ overflow: "hidden", position: "relative" }}
    >
      <div
        className="marquee-track"
        data-pause-on-hover={pointerFine ? "true" : "false"}
        style={
          {
            display: "flex",
            width: "max-content",
            animation: `mesivo-marquee ${speed}s linear infinite`,
            willChange: "transform",
          } as React.CSSProperties
        }
      >
        <div style={{ display: "flex", gap: "2rem", paddingRight: "2rem" }}>
          {children}
        </div>
        <div
          aria-hidden="true"
          style={{ display: "flex", gap: "2rem", paddingRight: "2rem" }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
