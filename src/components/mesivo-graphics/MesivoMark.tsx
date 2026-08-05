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
      {/* Traço Superior: A Ordem (Curto, esquerda) */}
      <rect x="4" y="8" width="10" height="3" rx="1.5" fill={color} />
      
      {/* Traço Central: O Movimento (Longo, deslocado direita) */}
      <rect x="8" y="14.5" width="20" height="3" rx="1.5" fill={color} />
      
      {/* Traço Inferior: A Entrega (Médio, alinhado ao fim) */}
      <rect x="14" y="21" width="14" height="3" rx="1.5" fill={color} />
    </svg>
  );
}
