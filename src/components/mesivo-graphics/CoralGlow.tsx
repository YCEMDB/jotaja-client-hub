import { useId } from "react";

type CoralGlowProps = {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
};

/** CoralGlow — brilho coral decorativo (blob radial). Estático, decorativo. */
export function CoralGlow({ size = 480, className, style }: CoralGlowProps) {
  const gid = useId();
  return (
    <svg
      aria-hidden="true"
      role="presentation"
      width={size}
      height={size}
      viewBox="0 0 480 480"
      className={className}
      style={style}
    >
      <defs>
        <radialGradient id={`${gid}-r`} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="var(--copper)" stopOpacity="0.05" />
          <stop offset="0.6" stopColor="var(--sage)" stopOpacity="0.02" />
          <stop offset="1" stopColor="transparent" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="240" cy="240" r="240" fill={`url(#${gid}-r)`} />
    </svg>
  );
}
