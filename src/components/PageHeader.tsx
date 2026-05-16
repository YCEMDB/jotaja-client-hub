import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  kicker?: string;
  actions?: ReactNode;
  accent?: "orange" | "magenta" | "violet" | "amber";
  className?: string;
}

const accentBg: Record<NonNullable<PageHeaderProps["accent"]>, string> = {
  orange: "bg-brand-orange",
  magenta: "bg-brand-magenta",
  violet: "bg-brand-violet",
  amber: "bg-brand-amber",
};

export function PageHeader({
  title,
  subtitle,
  kicker,
  actions,
  accent = "orange",
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("mb-8 flex items-end justify-between gap-6 flex-wrap", className)}>
      <div className="min-w-0">
        {kicker && (
          <div className="inline-flex items-center gap-2 mb-3">
            <span className={cn("h-2 w-2 rounded-full", accentBg[accent])} />
            <span className="text-[11px] uppercase tracking-[0.18em] font-bold text-ink/70">
              {kicker}
            </span>
          </div>
        )}
        <h1 className="font-display text-4xl md:text-5xl text-ink leading-[0.92] tracking-tight">
          {title}
          <span className={cn("inline-block w-3 h-3 ml-1 -mb-0.5 align-baseline", accentBg[accent])} />
        </h1>
        {subtitle && (
          <p className="mt-2 text-sm text-ink/60 max-w-xl">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}
