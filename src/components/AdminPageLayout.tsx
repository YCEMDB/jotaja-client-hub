import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

type Accent = "orange" | "magenta" | "violet" | "amber";

const accentBg: Record<Accent, string> = {
  orange: "bg-brand-orange",
  magenta: "bg-brand-magenta",
  violet: "bg-brand-violet",
  amber: "bg-brand-amber",
};

const accentText: Record<Accent, string> = {
  orange: "text-brand-orange",
  magenta: "text-brand-magenta",
  violet: "text-brand-violet",
  amber: "text-brand-amber",
};

interface AdminPageLayoutProps {
  title: string;
  subtitle?: string;
  kicker?: string;
  icon?: LucideIcon;
  actions?: ReactNode;
  accent?: Accent;
  maxWidth?: "3xl" | "4xl" | "5xl" | "6xl" | "7xl" | "full";
  children: ReactNode;
  className?: string;
}

const maxWidthMap: Record<NonNullable<AdminPageLayoutProps["maxWidth"]>, string> = {
  "3xl": "max-w-3xl",
  "4xl": "max-w-4xl",
  "5xl": "max-w-5xl",
  "6xl": "max-w-6xl",
  "7xl": "max-w-7xl",
  full: "max-w-none",
};

/**
 * Unified admin/super-admin page shell.
 * Handles container width, horizontal/vertical padding, and header spacing
 * so every page in the app follows the same grid.
 */
export function AdminPageLayout({
  title,
  subtitle,
  kicker,
  icon: Icon,
  actions,
  accent = "orange",
  maxWidth = "7xl",
  children,
  className,
}: AdminPageLayoutProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-4 sm:px-6 lg:px-8 xl:px-10 pt-8 md:pt-10 pb-12",
        maxWidthMap[maxWidth],
        className,
      )}
    >
      <header className="mb-8 flex items-end justify-between gap-6 flex-wrap">
        <div className="min-w-0 flex items-start gap-3">
          {Icon && (
            <div className="hidden sm:grid h-11 w-11 shrink-0 place-items-center rounded-xl border-2 border-ink/10 bg-background shadow-sm">
              <Icon className={cn("h-5 w-5", accentText[accent])} />
            </div>
          )}
          <div className="min-w-0">
            {kicker && (
              <div className="inline-flex items-center gap-2 mb-3">
                <span className={cn("h-2 w-2 rounded-full", accentBg[accent])} />
                <span className="text-[11px] uppercase tracking-[0.18em] font-bold text-ink/70">
                  {kicker}
                </span>
              </div>
            )}
            <h1 className="font-display text-3xl md:text-4xl lg:text-5xl text-ink leading-[0.95] tracking-tight">
              {title}
              <span className={cn("inline-block w-2.5 h-2.5 ml-1 -mb-0.5 align-baseline", accentBg[accent])} />
            </h1>
            {subtitle && (
              <p className="mt-3 text-sm text-ink/60 max-w-2xl">{subtitle}</p>
            )}
          </div>
        </div>
        {actions && (
          <div className="flex items-center gap-2 flex-wrap shrink-0">{actions}</div>
        )}
      </header>

      <div className="space-y-6">{children}</div>
    </div>
  );
}
