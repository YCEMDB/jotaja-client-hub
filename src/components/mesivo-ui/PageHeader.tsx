import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PageHeaderProps = {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
};

/** PageHeader — cabeçalho institucional/de conteúdo. Usa H1. */
export function PageHeader({ eyebrow, title, description, actions, className }: PageHeaderProps) {
  return (
    <header className={cn("mb-12 flex flex-col md:flex-row md:items-end justify-between gap-8", className)}>
      <div className="space-y-4 max-w-3xl">
        {eyebrow && (
          <span className="inline-block font-mono text-[10px] tracking-[0.2em] uppercase text-muted-foreground">
            {eyebrow}
          </span>
        )}
        <div>
          <h1 className="font-display text-5xl md:text-6xl tracking-tight leading-[0.9] text-foreground m-0">
            {title}
            <span className="inline-block w-2 h-2 ml-2 bg-copper rounded-full" />
          </h1>
          {description && (
            <p className="mt-6 text-lg text-muted-foreground font-sans max-w-xl leading-relaxed m-0">
              {description}
            </p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-4 shrink-0">
          {actions}
        </div>
      )}
    </header>
  );
}

type SectionHeaderProps = {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  className?: string;
};

/** SectionHeader — cabeçalho de seção (h2). */
export function SectionHeader({ eyebrow, title, description, className }: SectionHeaderProps) {
  return (
    <header className={cn("flex flex-col gap-2 mb-6", className)}>
      {eyebrow && (
        <span className="inline-block font-mono text-[10px] tracking-[0.2em] uppercase text-copper">
          {eyebrow}
        </span>
      )}
      <h2 className="font-display text-3xl md:text-4xl tracking-tight leading-tight text-foreground m-0">
        {title}
      </h2>
      {description && (
        <p className="mt-2 text-muted-foreground font-sans m-0 leading-relaxed max-w-2xl">
          {description}
        </p>
      )}
    </header>
  );
}