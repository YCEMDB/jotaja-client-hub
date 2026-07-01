/**
 * Sprint 2.3 — Hooks derivados para separar responsabilidades do useAuth.
 * Preservam compatibilidade: continuam usando o AuthProvider.
 */
import { useAuth } from "./useAuth";

export function useCurrentUser() {
  const { user, session, loading } = useAuth();
  return { user, session, loading };
}

export function useCurrentRestaurant() {
  const { restaurantId, restaurants, selectRestaurant, metaLoading } = useAuth();
  const current = restaurants.find((r) => r.id === restaurantId) ?? null;
  return { restaurantId, restaurant: current, restaurants, selectRestaurant, loading: metaLoading };
}

export function usePermissions() {
  const { roles, isSuperAdmin, restaurantId, restaurants } = useAuth();
  const isOwnerOfCurrent = !!restaurantId && restaurants.some((r) => r.id === restaurantId);
  return {
    roles,
    isSuperAdmin,
    isOwner: isOwnerOfCurrent,
    can: (role: "super_admin" | "owner" | "employee") =>
      isSuperAdmin || roles.includes(role) || (role === "owner" && isOwnerOfCurrent),
  };
}

export function useCurrentPlan() {
  const { restaurants, restaurantId } = useAuth();
  const r = restaurants.find((x) => x.id === restaurantId);
  return {
    plan: (r?.plan ?? "starter") as "starter" | "pro" | "business",
    trialEndsAt: r?.trial_ends_at ?? null,
    subscriptionEndsAt: r?.subscription_ends_at ?? null,
  };
}
