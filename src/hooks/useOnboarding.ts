import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  completeOnboarding,
  dismissOnboarding,
  fetchOnboardingStatus,
  resetOnboarding,
  setCurrentStep,
  startOnboarding,
  type OnboardingSnapshot,
  type OnboardingStepKey,
} from "@/lib/onboarding";

const KEY = (rid: string | null | undefined) => ["onboarding", rid] as const;

/**
 * Hook central do onboarding.
 * Devolve o snapshot derivado do banco (não do localStorage) e mutations tipadas.
 * localStorage pode ser usado apenas para preferências visuais (ex: card minimizado).
 */
export function useOnboarding(restaurantId: string | null | undefined) {
  const qc = useQueryClient();

  const query = useQuery<OnboardingSnapshot>({
    queryKey: KEY(restaurantId),
    enabled: !!restaurantId,
    staleTime: 30_000,
    queryFn: () => fetchOnboardingStatus(restaurantId!),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: KEY(restaurantId) });

  const start = useMutation({
    mutationFn: (reason?: string) => startOnboarding(restaurantId!, reason),
    onSuccess: invalidate,
  });

  const step = useMutation({
    mutationFn: (args: { step: OnboardingStepKey; reason?: string }) =>
      setCurrentStep(restaurantId!, args.step, args.reason),
    onSuccess: invalidate,
  });

  const dismiss = useMutation({
    mutationFn: (reason?: string) => dismissOnboarding(restaurantId!, reason),
    onSuccess: invalidate,
  });

  const complete = useMutation({
    mutationFn: (reason?: string) => completeOnboarding(restaurantId!, reason),
    onSuccess: invalidate,
  });

  const reset = useMutation({
    mutationFn: (reason: string) => resetOnboarding(restaurantId!, reason),
    onSuccess: invalidate,
  });

  return {
    snapshot: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    start,
    setStep: step,
    dismiss,
    complete,
    reset,
  };
}
