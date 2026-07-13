import { useEffect, useRef, type ReactNode } from "react";
import { usePointerFine } from "./usePointerFine";
import { useReducedMotionSafe } from "./useReducedMotionSafe";
import { useHydrated } from "./useHydrated";

/**
 * Marquee — faixa horizontal em loop contínuo.
 *
 * Regras:
 * - CSS puro (transform), sem re-render, sem timers JS para o movimento.
 * - Duplica o conteúdo apenas visualmente; a cópia recebe `aria-hidden`
 *   para leitores de tela não ouvirem o texto duas vezes.
 * - Pausa no hover apenas em desktop com ponteiro fino.
 * - Pausa quando o `<div>` sai da viewport (IntersectionObserver).
 * - Pausa quando `document.visibilityState !== "visible"`.
 * - Reduced motion: faixa estática, com rolagem horizontal manual
 *   permitida em telas pequenas.
 * - Toda leitura de `document` acontece após hidratação.
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
  const hydrated = useHydrated();
  const reduce = useReducedMotionSafe();
  const pointerFine = usePointerFine();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  // Pausa o loop quando fora da viewport ou aba oculta.
  useEffect(() => {
    if (!hydrated || reduce) return;
    const wrapper = wrapperRef.current;
    const track = trackRef.current;
    if (!wrapper || !track) return;

    let inView = false;
    let visible = document.visibilityState === "visible";

    const apply = () => {
      track.style.animationPlayState = inView && visible ? "running" : "paused";
    };

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) inView = e.isIntersecting;
        apply();
      },
      { threshold: 0.01 },
    );
    io.observe(wrapper);

    const onVis = () => {
      visible = document.visibilityState === "visible";
      apply();
    };
    document.addEventListener("visibilitychange", onVis);

    apply();
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [hydrated, reduce]);

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
      ref={wrapperRef}
      className={className}
      aria-label={ariaLabel}
      data-marquee
      style={{ overflow: "hidden", position: "relative" }}
    >
      <div
        ref={trackRef}
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
        <div style={{ display: "flex", gap: "2rem", paddingRight: "2rem" }}>{children}</div>
        <div aria-hidden="true" style={{ display: "flex", gap: "2rem", paddingRight: "2rem" }}>
          {children}
        </div>
      </div>
    </div>
  );
}
