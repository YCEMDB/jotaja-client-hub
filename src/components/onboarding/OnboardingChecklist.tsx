import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ChevronDown,
  ChevronUp,
  Check,
  Circle,
  Rocket,
  X,
  RefreshCw,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  STEP_DESCRIPTIONS,
  STEP_LABELS,
  STEP_ROUTES,
  translateOnboardingError,
  type OnboardingStepKey,
} from "@/lib/onboarding";
import { useOnboarding } from "@/hooks/useOnboarding";
import { toast } from "sonner";

const MINIMIZED_KEY = "cx.onboarding.minimized";

interface Props {
  restaurantId: string | null;
  /** Membro nativo com permissão administrativa (owner/manager). */
  canWrite: boolean;
}

/**
 * Checklist compacto de onboarding.
 *
 * - Só aparece quando existe restaurante e o onboarding NÃO está `completed`/`dismissed`.
 * - Progresso vem do backend (get_onboarding_status), nunca de localStorage.
 * - localStorage é usado apenas para lembrar se o card está minimizado.
 * - Não bloqueia nenhuma navegação; cada etapa é um link para a tela real.
 */
export function OnboardingChecklist({ restaurantId, canWrite }: Props) {
  const { snapshot, isLoading, start, dismiss, complete, reset } = useOnboarding(restaurantId);
  const [minimized, setMinimized] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(MINIMIZED_KEY) === "1";
  });

  const toggleMin = () => {
    setMinimized((v) => {
      const next = !v;
      if (typeof window !== "undefined") {
        window.localStorage.setItem(MINIMIZED_KEY, next ? "1" : "0");
      }
      return next;
    });
  };

  const visible = useMemo(() => {
    if (!snapshot) return false;
    if (snapshot.status === "completed") return false;
    if (snapshot.status === "dismissed") return false;
    return true;
  }, [snapshot]);

  if (!restaurantId || isLoading || !snapshot || !visible) return null;

  const next = snapshot.recommended_next_step;
  const nextLabel = next ? STEP_LABELS[next] : "";
  const nextRoute = next ? STEP_ROUTES[next] : undefined;

  return (
    <section
      aria-label="Checklist de configuração"
      className={cn(
        "relative overflow-hidden rounded-2xl border-2 border-ink bg-background",
        "shadow-brutal transition-all",
      )}
    >
      <header className="flex items-center justify-between gap-3 border-b-2 border-ink bg-brand-orange px-4 py-3">
        <div className="flex items-center gap-2 min-w-0">
          <Rocket className="h-5 w-5 shrink-0 text-ink" />
          <div className="min-w-0">
            <p className="font-display text-lg text-ink leading-tight truncate">
              Vamos preparar seu restaurante
            </p>
            <p className="text-xs uppercase tracking-wide text-ink/80 font-bold truncate">
              {snapshot.required_completed} de {snapshot.required_total} etapas concluídas ·{" "}
              {snapshot.progress_pct}%
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-ink hover:bg-ink/10"
            onClick={toggleMin}
            aria-label={minimized ? "Expandir" : "Recolher"}
          >
            {minimized ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </Button>
        </div>
      </header>

      <div className="px-4 pt-3">
        <Progress value={snapshot.progress_pct} className="h-2" />
      </div>

      {!minimized && (
        <div className="px-4 py-4 space-y-4">
          {next && nextRoute && (
            <div className="flex items-center justify-between gap-3 rounded-lg border-2 border-ink bg-brand-amber/10 px-3 py-2">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wide text-brand-orange">
                  Próximo passo
                </p>
                <p className="text-sm font-bold text-ink truncate">{nextLabel}</p>
              </div>
              <Button asChild size="sm" className="gap-1 bg-ink text-background hover:bg-ink/90">
                <Link to={nextRoute as never}>
                  Ir <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          )}

          <ol className="space-y-2">
            {snapshot.steps
              .filter((s) => s.key !== "done" && s.key !== "welcome")
              .map((s) => {
                const route = STEP_ROUTES[s.key as OnboardingStepKey];
                const label = STEP_LABELS[s.key as OnboardingStepKey];
                const desc = STEP_DESCRIPTIONS[s.key as OnboardingStepKey];
                return (
                  <li
                    key={s.key}
                    className={cn(
                      "flex items-start gap-3 rounded-lg border-2 px-3 py-2",
                      s.completed
                        ? "border-emerald-600/40 bg-emerald-50/40"
                        : "border-border bg-background",
                    )}
                  >
                    <div className="mt-0.5 shrink-0">
                      {s.completed ? (
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-background">
                          <Check className="h-4 w-4" />
                        </span>
                      ) : (
                        <Circle className="h-6 w-6 text-muted-foreground" strokeWidth={2} />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-bold text-sm text-ink truncate">{label}</p>
                        {!s.required && (
                          <Badge variant="outline" className="text-[10px] uppercase">
                            Opcional
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                    </div>
                    {route && !s.completed && (
                      <Button asChild size="sm" variant="outline" className="shrink-0 border-2 border-ink">
                        <Link to={route as never}>Abrir</Link>
                      </Button>
                    )}
                  </li>
                );
              })}
          </ol>

          <footer className="flex flex-wrap items-center justify-between gap-2 border-t-2 border-ink/10 pt-3">
            <div className="flex flex-wrap gap-2">
              {snapshot.status === "not_started" && canWrite && (
                <Button
                  size="sm"
                  onClick={async () => {
                    try {
                      await start.mutateAsync(undefined);
                    } catch (e) {
                      toast.error(translateOnboardingError(e));
                    }
                  }}
                  disabled={start.isPending}
                >
                  Começar
                </Button>
              )}
              {snapshot.is_ready_to_receive && canWrite && snapshot.status !== "completed" && (
                <Button
                  size="sm"
                  className="gap-1 bg-emerald-600 hover:bg-emerald-600/90 text-background"
                  onClick={async () => {
                    try {
                      await complete.mutateAsync(undefined);
                      toast.success("Onboarding concluído. Bom trabalho!");
                    } catch (e) {
                      toast.error(translateOnboardingError(e));
                    }
                  }}
                  disabled={complete.isPending}
                >
                  <Check className="h-4 w-4" /> Concluir tutorial
                </Button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {canWrite && snapshot.status === "completed" && (
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1"
                  onClick={async () => {
                    const reason = window.prompt("Descreva por que quer refazer o tutorial (mínimo 5 caracteres):");
                    if (!reason) return;
                    try {
                      await reset.mutateAsync(reason);
                    } catch (e) {
                      toast.error(translateOnboardingError(e));
                    }
                  }}
                  disabled={reset.isPending}
                >
                  <RefreshCw className="h-4 w-4" /> Refazer
                </Button>
              )}
              {canWrite && snapshot.status !== "completed" && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="gap-1 text-muted-foreground"
                  onClick={async () => {
                    try {
                      await dismiss.mutateAsync(undefined);
                    } catch (e) {
                      toast.error(translateOnboardingError(e));
                    }
                  }}
                  disabled={dismiss.isPending}
                >
                  <X className="h-4 w-4" /> Fazer depois
                </Button>
              )}
            </div>
          </footer>
        </div>
      )}
    </section>
  );
}
