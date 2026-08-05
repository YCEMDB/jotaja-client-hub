import { MesivoMark } from "@/components/mesivo-graphics/MesivoMark";

type LogoProps = {
  className?: string;
  /** Show only the geometric mark (no wordmark) */
  markOnly?: boolean;
  /** Larger mark size for hero/auth contexts */
  size?: "sm" | "md" | "lg";
};

/**
 * Mesivo logo lockup — Utiliza o MesivoMark (Nexus Brutalista) + wordmark.
 */
export function Logo({ className = "", markOnly = false, size = "md" }: LogoProps) {
  const markPixelSize =
    size === "sm" ? 32 : size === "lg" ? 64 : 44;
  
  const wordSize =
    size === "sm"
      ? "text-[1.15rem]"
      : size === "lg"
        ? "text-[1.9rem] md:text-[2.2rem]"
        : "text-[1.45rem] md:text-[1.65rem]";

  return (
    <span
      className={`logo-lockup inline-flex items-center gap-3 select-none ${className}`}
      aria-label="Mesivo"
    >
      <MesivoMark 
        size={markPixelSize} 
        className="shrink-0 transition-transform duration-500 ease-out group-hover:-rotate-6 group-hover:scale-105 logo-mark-animated"
        decorative
      />

      {!markOnly && (
        <span
          className={`logo-wordmark font-display ${wordSize} leading-none tracking-tight text-ink uppercase`}
          style={{ letterSpacing: "-0.02em" }}
        >
          mesivo
        </span>
      )}
    </span>
  );
}
