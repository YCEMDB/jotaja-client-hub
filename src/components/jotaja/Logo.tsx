type LogoProps = {
  className?: string;
  /** Show only the geometric mark (no wordmark) */
  markOnly?: boolean;
  /** Larger mark size for hero/auth contexts */
  size?: "sm" | "md" | "lg";
};

/**
 * Professional ComandaHub logo lockup.
 * - Geometric mark + wordmark in Archivo Black.
 * - Animations are CSS-driven and only run on instances inside `.animate-logo-in`.
 */
export function Logo({ className = "", markOnly = false, size = "md" }: LogoProps) {
  const markSize =
    size === "sm" ? "h-7" : size === "lg" ? "h-12 md:h-14" : "h-9 md:h-10";
  const wordSize =
    size === "sm"
      ? "text-[1.05rem]"
      : size === "lg"
        ? "text-[1.75rem] md:text-[2rem]"
        : "text-[1.35rem] md:text-[1.55rem]";

  return (
    <span
      className={`logo-lockup inline-flex items-center gap-2.5 select-none ${className}`}
      aria-label="ComandaHub"
    >
      <svg
        viewBox="0 0 48 48"
        className={`logo-mark ${markSize} w-auto shrink-0`}
        aria-hidden="true"
      >
        <rect x="2" y="2" width="44" height="44" rx="11" className="logo-plate" />
        <g className="logo-bars">
          <rect x="12" y="13" width="20" height="4.5" rx="2.25" />
          <rect x="12" y="21.75" width="14" height="4.5" rx="2.25" />
          <rect x="12" y="30.5" width="20" height="4.5" rx="2.25" />
        </g>
        <circle cx="36" cy="24" r="3.25" className="logo-dot" />
      </svg>

      {!markOnly && (
        <span
          className={`logo-wordmark font-display ${wordSize} leading-none tracking-tight text-ink`}
        >
          comanda<span className="text-brand-orange">hub</span>
        </span>
      )}
    </span>
  );
}
