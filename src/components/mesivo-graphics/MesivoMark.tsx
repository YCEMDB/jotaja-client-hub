import { useId } from "react";

type MesivoMarkProps = {
  size?: number;
  className?: string;
  /** Se true, o gráfico é decorativo e recebe aria-hidden. */
  decorative?: boolean;
};

/**
 * MesivoMark — símbolo geométrico da marca (três blocos conectados:
 * pedido → produção → entrega). SVG puro, sem estado.
 */
export function MesivoMark({ size = 40, className, decorative = false }: MesivoMarkProps) {
  const gid = useId();
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      role={decorative ? "presentation" : "img"}
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : "Mesivo"}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient
          id={`${gid}-g`}
          x1="0"
          y1="0"
          x2="48"
          y2="48"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#FFB82E" />
          <stop offset="0.55" stopColor="#FF6B35" />
          <stop offset="1" stopColor="#F0522D" />
        </linearGradient>
      </defs>
      <rect x="4" y="12" width="14" height="24" rx="4" fill={`url(#${gid}-g)`} />
      <rect x="17" y="6" width="14" height="36" rx="4" fill="#34241D" />
      <rect x="30" y="12" width="14" height="24" rx="4" fill={`url(#${gid}-g)`} />
    </svg>
  );
}
