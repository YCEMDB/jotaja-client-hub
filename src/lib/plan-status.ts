// Helpers para status de plano/trial.
// Fonte da verdade da TIER = restaurants.plan_id (FK app_plans).
// Fonte da verdade do TRIAL = restaurants.trial_ends_at > now().
// A coluna legada restaurants.plan (enum trial/essential/professional) é mantida
// apenas por compatibilidade com o painel super-admin; nunca use-a para gate
// de features nem para detectar trial em código novo.

export type PlanTier = "starter" | "pro" | "business";

export function isTrialActive(r: { trial_ends_at?: string | null } | null | undefined): boolean {
  if (!r?.trial_ends_at) return false;
  const ends = new Date(r.trial_ends_at).getTime();
  return Number.isFinite(ends) && ends > Date.now();
}

export function planTierOf(r: { plan_id?: string | null } | null | undefined): PlanTier {
  const p = (r?.plan_id ?? "starter") as PlanTier;
  return p === "pro" || p === "business" ? p : "starter";
}

export const PLAN_PRICE_BRL: Record<PlanTier, number> = {
  starter: 97,
  pro: 199,
  business: 399,
};
