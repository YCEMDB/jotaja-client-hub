import markUrl from "@/assets/mesivo-mark.svg";

type LogoProps = {
  className?: string;
  /** Show only the geometric mark (no wordmark) */
  markOnly?: boolean;
  /** Larger mark size for hero/auth contexts */
  size?: "sm" | "md" | "lg";
};

/**
 * Mesivo logo lockup — símbolo (M formado por três blocos conectados
 * representando pedido → produção → entrega) + wordmark.
 */
export function Logo({ className = "", markOnly = false, size = "md" }: LogoProps) {
  const markSize =
    size === "sm" ? "h-8" : size === "lg" ? "h-14 md:h-16" : "h-10 md:h-11";
  const wordSize =
    size === "sm"
      ? "text-[1.15rem]"
      : size === "lg"
        ? "text-[1.9rem] md:text-[2.2rem]"
        : "text-[1.45rem] md:text-[1.65rem]";

  return (
    <span
      className={`logo-lockup inline-flex items-center gap-2.5 select-none ${className}`}
      aria-label="Mesivo"
    >
      <img
        src={markUrl}
        alt=""
        aria-hidden="true"
        className={`logo-mark-3d ${markSize} w-auto shrink-0 object-contain drop-shadow-[0_6px_18px_rgba(255,101,52,0.3)] transition-transform duration-500 ease-out group-hover:-rotate-6 group-hover:scale-105`}
        draggable={false}
      />

      {!markOnly && (
        <span
          className={`logo-wordmark font-display ${wordSize} leading-none tracking-tight text-ink lowercase`}
          style={{ letterSpacing: "-0.02em" }}
        >
          mesivo
        </span>
      )}
    </span>
  );
}
