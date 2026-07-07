import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionProps {
  children: ReactNode;
  className?: string;
  /** apply the standard card chrome (border + radius + bg). Off = pure spacing block. */
  chrome?: boolean;
}

/**
 * Standard content block inside an AdminPageLayout. Use for grouped forms,
 * tables, or lists. When chrome=true it matches the brutalist card language
 * used across the app.
 */
export function Section({ children, className, chrome = true }: SectionProps) {
  return (
    <section
      className={cn(
        chrome && "bg-card border-2 border-ink rounded-2xl p-5 md:p-6 shadow-[5px_5px_0_0_oklch(0.15_0.02_30)]",
        className,
      )}
    >
      {children}
    </section>
  );
}

interface SectionHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

export function SectionHeader({ title, description, actions, className }: SectionHeaderProps) {
  return (
    <div className={cn("mb-4 flex items-start justify-between gap-4 flex-wrap", className)}>
      <div className="min-w-0">
        <h2 className="font-display text-lg md:text-xl text-ink leading-tight">{title}</h2>
        {description && <p className="mt-1 text-sm text-ink/60">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap shrink-0">{actions}</div>}
    </div>
  );
}

interface SectionContentProps {
  children: ReactNode;
  className?: string;
}

export function SectionContent({ children, className }: SectionContentProps) {
  return <div className={cn("space-y-4", className)}>{children}</div>;
}
