import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Accent = "orange" | "magenta" | "violet" | "amber" | "green" | "blue";

const ACCENT_BG: Record<Accent, string> = {
  orange: "bg-brand-orange",
  magenta: "bg-brand-magenta",
  violet: "bg-brand-violet",
  amber: "bg-brand-amber",
  green: "bg-emerald-500",
  blue: "bg-sky-500",
};

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  accent?: Accent;
  delta?: { value: string; positive?: boolean };
  hint?: string;
  className?: string;
}

/**
 * KPI card with brutalist sunset styling. Consistent across admin + super-admin.
 */
export function StatCard({
  label,
  value,
  icon: Icon,
  accent = "orange",
  delta,
  hint,
  className,
}: StatCardProps) {
  const bar = ACCENT_BG[accent];
  return (
    <div
      className={cn(
        "relative bg-card border-2 border-ink rounded-2xl p-5 md:p-6",
        "shadow-[5px_5px_0_0_oklch(0.15_0.02_30)]",
        "hover:shadow-[7px_7px_0_0_oklch(0.69_0.22_38)] hover:-translate-x-0.5 hover:-translate-y-0.5",
        "transition-all overflow-hidden",
        className,
      )}
    >
      <div className={cn("absolute top-0 left-0 right-0 h-1.5", bar)} />
      <div className="flex items-start justify-between gap-3 mb-3 mt-1">
        <span className="text-[10px] uppercase tracking-[0.18em] font-bold text-ink/60 leading-tight">
          {label}
        </span>
        {Icon && (
          <div className={cn("h-9 w-9 grid place-items-center rounded-lg border-2 border-ink shrink-0", bar)}>
            <Icon className="h-4 w-4 text-ink" />
          </div>
        )}
      </div>
      <div className="font-display text-3xl md:text-4xl text-ink leading-none tracking-tight break-all">
        {value}
      </div>
      {(delta || hint) && (
        <div className="mt-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide">
          {delta && (
            <span
              className={cn(
                "px-1.5 py-0.5 rounded border",
                delta.positive
                  ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-700"
                  : "bg-destructive/10 border-destructive/40 text-destructive",
              )}
            >
              {delta.positive ? "↑" : "↓"} {delta.value}
            </span>
          )}
          {hint && <span className="text-ink/50 truncate">{hint}</span>}
        </div>
      )}
    </div>
  );
}
