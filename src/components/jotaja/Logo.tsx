type LogoProps = {
  className?: string;
};

/**
 * Professional ComandaHub logo lockup.
 * - Geometric mark: stacked bars forming a "C" + accent dot (the "order ticket").
 * - Wordmark in Archivo Black.
 * - Refined entrance + restrained hover micro-interaction. No bouncing/floating.
 */
export function Logo({ className = "" }: LogoProps) {
  return (
    <span
      className={`logo-lockup inline-flex items-center gap-2.5 select-none ${className}`}
      aria-label="ComandaHub"
    >
      <svg
        viewBox="0 0 48 48"
        className="logo-mark h-9 md:h-10 w-auto shrink-0"
        aria-hidden="true"
      >
        {/* Rounded square plate */}
        <rect
          x="2"
          y="2"
          width="44"
          height="44"
          rx="11"
          className="logo-plate"
        />
        {/* Stylized "C" / receipt bars */}
        <g className="logo-bars">
          <rect x="12" y="13" width="20" height="4.5" rx="2.25" />
          <rect x="12" y="21.75" width="14" height="4.5" rx="2.25" />
          <rect x="12" y="30.5" width="20" height="4.5" rx="2.25" />
        </g>
        {/* Accent dot — the "hub" */}
        <circle cx="36" cy="24" r="3.25" className="logo-dot" />
      </svg>

      <span className="logo-wordmark font-display text-[1.35rem] md:text-[1.55rem] leading-none tracking-tight text-ink">
        comanda<span className="text-brand-orange">hub</span>
      </span>
    </span>
  );
}
