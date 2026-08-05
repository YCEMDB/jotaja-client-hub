import { useId } from "react";

type MesivoMarkProps = {
  size?: number;
  className?: string;
  /** Se true, o gráfico é decorativo e recebe aria-hidden. */
  decorative?: boolean;
  /** Cor do símbolo. Por padrão usa var(--mesivo-primary) ou #2B2B2B */
  color?: string;
};

/**
 * MesivoMark — "Fluxo de Sincronia"
 * Três traços assimétricos que representam o fluxo operacional (Bastidores).
 */
export function MesivoMark({
  size = 40,
  className,
  decorative = false,
  color = "currentColor",
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
      {/* Top Left Square (Cream/Sage context) */}
      <rect x="4" y="4" width="11" height="11" rx="1.5" fill={color} fillOpacity="0.9" />
      
      {/* Top Right Square (Copper) */}
      <rect x="17" y="4" width="11" height="11" rx="1.5" fill="var(--copper, #D87A43)" />
      
      {/* Bottom Left Square (Primary) */}
      <rect x="4" y="17" width="11" height="11" rx="1.5" fill={color} />

      {/* Bottom Right Square (Primary) */}
      <rect x="17" y="17" width="11" height="11" rx="1.5" fill={color} />
    </svg>
  );
}
