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
          <stop offset="0" stopColor="#FF6B35" stopOpacity="0.55" />
          <stop offset="0.5" stopColor="#FFB82E" stopOpacity="0.25" />
          <stop offset="1" stopColor="#FFB82E" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="240" cy="240" r="240" fill={`url(#${gid}-r)`} />
    </svg>
  );
}
