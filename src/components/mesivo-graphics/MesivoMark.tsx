import { useId } from "react";

type MesivoMarkProps = {
  size?: number;
  className?: string;
  /** Se true, o gráfico é decorativo e recebe aria-hidden. */
  decorative?: boolean;
  /** Cor do símbolo. Por padrão usa currentColor */
  color?: string;
};

/**
 * MesivoMark — "4 Quadrados Assimétricos"
 * Seguindo a nova identidade visual: Deep Forest e Copper.
 */
export function MesivoMark({
  size = 40,
  className,
  decorative = false,
  color = "var(--deep-forest, #173A34)",
}: MesivoMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      role={decorative ? "presentation" : "img"}
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : "Mesivo"}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Top Left Square (Deep Forest) */}
      <rect x="4" y="4" width="11" height="11" rx="2" fill={color} />
      
      {/* Top Right Square (Deep Forest) */}
      <rect x="17" y="4" width="11" height="11" rx="2" fill={color} />
      
      {/* Bottom Left Square (Deep Forest) */}
      <rect x="4" y="17" width="11" height="11" rx="2" fill={color} />

      {/* Bottom Right Square (Copper) */}
      <rect x="17" y="17" width="11" height="11" rx="2" fill="var(--copper, #D87A43)" />
    </svg>
  );
}
