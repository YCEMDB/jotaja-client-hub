import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingStateProps {
  label?: string;
  className?: string;
  /** "inline" for a small spinner row; "block" for the standard centered card. */
  variant?: "inline" | "block";
}

export function LoadingState({ label = "Carregando…", className, variant = "block" }: LoadingStateProps) {
  if (variant === "inline") {
    return (
      <div className={cn("flex items-center gap-2 text-sm text-ink/60", className)}>
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>{label}</span>
      </div>
    );
  }
  return (
    <div
      className={cn(
        "grid place-items-center text-center py-16 px-6",
        "bg-card border-2 border-dashed border-ink/20 rounded-2xl",
        className,
      )}
    >
      <Loader2 className="h-6 w-6 animate-spin text-brand-orange mb-3" />
      <p className="text-sm text-ink/60">{label}</p>
    </div>
  );
}
