import type { ReactNode } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface FilterBarProps {
  children?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

/**
 * Sticky-safe filter row that lives above tables / lists. Left slot = filters,
 * right slot = primary actions.
 */
export function FilterBar({ children, actions, className }: FilterBarProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3",
        "bg-card border-2 border-ink rounded-2xl p-3 md:p-4",
        "shadow-[3px_3px_0_0_oklch(0.15_0.02_30)]",
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-2 min-w-0 flex-1">{children}</div>
      {actions && <div className="flex items-center gap-2 flex-wrap shrink-0">{actions}</div>}
    </div>
  );
}

interface SearchBarProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchBar({ value, onChange, placeholder = "Buscar…", className }: SearchBarProps) {
  return (
    <div className={cn("relative min-w-[220px] flex-1 max-w-md", className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink/50 pointer-events-none" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-9"
      />
    </div>
  );
}
