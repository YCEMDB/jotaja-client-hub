import type { LucideIcon, ReactNode } from "react";
import type { LucideIcon as LucideIconType } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: LucideIconType;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "grid place-items-center text-center py-16 px-6",
        "bg-card border-2 border-dashed border-ink/20 rounded-2xl",
        className,
      )}
    >
      {Icon && (
        <div className="h-14 w-14 grid place-items-center rounded-2xl bg-brand-orange/10 border-2 border-brand-orange/40 mb-4">
          <Icon className="h-7 w-7 text-brand-orange" />
        </div>
      )}
      <h3 className="font-display text-2xl text-ink mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-ink/60 max-w-md mb-5">{description}</p>
      )}
      {action}
    </div>
  );
}
