import markUrl from "@/assets/comandex-mark-3d.png";

type LogoProps = {
  className?: string;
  /** Show only the geometric mark (no wordmark) */
  markOnly?: boolean;
  /** Larger mark size for hero/auth contexts */
  size?: "sm" | "md" | "lg";
};

/**
 * Professional Comandex logo lockup — 3D mark + wordmark.
 */
export function Logo({ className = "", markOnly = false, size = "md" }: LogoProps) {
  const markSize =
    size === "sm" ? "h-8" : size === "lg" ? "h-14 md:h-16" : "h-10 md:h-11";
  const wordSize =
    size === "sm"
      ? "text-[1.05rem]"
      : size === "lg"
        ? "text-[1.75rem] md:text-[2rem]"
        : "text-[1.35rem] md:text-[1.55rem]";

  return (
    <span
      className={`logo-lockup inline-flex items-center gap-2.5 select-none ${className}`}
      aria-label="Comandex"
    >
      <img
        src={markUrl}
        alt=""
        aria-hidden="true"
        className={`logo-mark-3d ${markSize} w-auto shrink-0 object-contain drop-shadow-[0_6px_18px_rgba(255,107,53,0.35)] transition-transform duration-500 ease-out group-hover:-rotate-6 group-hover:scale-105`}
        draggable={false}
      />

      {!markOnly && (
        <span
          className={`logo-wordmark font-display ${wordSize} leading-none tracking-tight text-ink`}
        >
          coman<span className="text-brand-orange">dex</span>
        </span>
      )}
    </span>
  );
}

