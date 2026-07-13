"use client";

import { useId } from "react";
import { useReducedMotionSafe } from "@/components/motion/useReducedMotionSafe";

type FlowLineProps = {
  /** Comprimento em px. */
  length?: number;
  /** Orientação. */
  direction?: "horizontal" | "vertical";
  className?: string;
  /** Cor do traço. */
  color?: string;
};

/**
 * FlowLine — linha animada representando fluxo entre módulos.
 * Animação é opcional: desligada em reduced motion e antes da hidratação.
 */
export function FlowLine({
  length = 160,
  direction = "horizontal",
  className,
  color = "var(--mesivo-tomato)",
}: FlowLineProps) {
  const gid = useId();
  const reduced = useReducedMotionSafe();
  const horizontal = direction === "horizontal";
  const w = horizontal ? length : 4;
  const h = horizontal ? 4 : length;

  return (
    <svg
      aria-hidden="true"
      role="presentation"
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      className={className}
    >
      <defs>
        <linearGradient
          id={`${gid}-grad`}
          x1="0"
          y1="0"
          x2={horizontal ? w : 0}
          y2={horizontal ? 0 : h}
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor={color} stopOpacity="0.15" />
          <stop offset="0.5" stopColor={color} stopOpacity="1" />
          <stop offset="1" stopColor={color} stopOpacity="0.15" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width={w} height={h} rx="2" fill={`url(#${gid}-grad)`} />
      {!reduced && (
        <circle r="3" fill={color}>
          <animateMotion
            dur="2.4s"
            repeatCount="indefinite"
            path={horizontal ? `M 0 ${h / 2} L ${w} ${h / 2}` : `M ${w / 2} 0 L ${w / 2} ${h}`}
          />
        </circle>
      )}
    </svg>
  );
}
