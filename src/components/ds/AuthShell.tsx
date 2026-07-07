import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface AuthShellProps {
  title: string;
  subtitle?: string;
  kicker?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

/**
 * Layout compartilhado para páginas de autenticação (login, reset, convite).
 * Card centralizado com identidade visual Sunset Blaze.
 */
export function AuthShell({ title, subtitle, kicker, children, footer, className }: AuthShellProps) {
  return (
    <div className="min-h-screen grid place-items-center bg-background px-4 py-10 relative overflow-hidden">
      {/* mesh gradient blobs */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-brand-orange/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-brand-magenta/25 blur-3xl" />

      <div
        className={cn(
          "relative w-full max-w-md bg-card border-2 border-ink rounded-2xl p-6 md:p-8",
          "shadow-[6px_6px_0_0_oklch(0.15_0.02_30)]",
          className,
        )}
      >
        {kicker && (
          <div className="inline-flex items-center gap-2 mb-3">
            <span className="h-2 w-2 rounded-full bg-brand-orange" />
            <span className="text-[11px] uppercase tracking-[0.18em] font-bold text-ink/70">{kicker}</span>
          </div>
        )}
        <h1 className="font-display text-3xl md:text-4xl text-ink leading-[0.95] tracking-tight">
          {title}
          <span className="inline-block w-2.5 h-2.5 ml-1 -mb-0.5 align-baseline bg-brand-orange" />
        </h1>
        {subtitle && <p className="mt-2 text-sm text-ink/60">{subtitle}</p>}

        <div className="mt-6">{children}</div>

        {footer && <div className="mt-6 pt-4 border-t border-ink/10 text-sm text-ink/60 text-center">{footer}</div>}
      </div>
    </div>
  );
}
