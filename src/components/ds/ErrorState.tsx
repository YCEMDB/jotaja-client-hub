import type { ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
  action?: ReactNode;
  className?: string;
}

export function ErrorState({
  title = "Ocorreu um erro",
  description = "Não foi possível carregar os dados. Tente novamente em instantes.",
  onRetry,
  retryLabel = "Tentar novamente",
  action,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "grid place-items-center text-center py-16 px-6",
        "bg-card border-2 border-dashed border-destructive/40 rounded-2xl",
        className,
      )}
    >
      <div className="h-14 w-14 grid place-items-center rounded-2xl bg-destructive/10 border-2 border-destructive/40 mb-4">
        <AlertTriangle className="h-7 w-7 text-destructive" />
      </div>
      <h3 className="font-display text-2xl text-ink mb-2">{title}</h3>
      <p className="text-sm text-ink/60 max-w-md mb-5">{description}</p>
      {action ?? (onRetry && (
        <Button variant="outline" onClick={onRetry}>{retryLabel}</Button>
      ))}
    </div>
  );
}
