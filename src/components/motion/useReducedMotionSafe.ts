import { useReducedMotion } from "motion/react";
import { useHydrated } from "./useHydrated";

/**
 * SSR-safe wrapper around `useReducedMotion()`.
 *
 * Motion's built-in `useReducedMotion()` reads `matchMedia` at first client
 * render, which returns `true` immediately for users with the OS preference
 * enabled — while the server always rendered assuming `false`. Any component
 * that branches on the value (different variant, different tree, `return null`)
 * hydration-mismatches on those users.
 *
 * This hook returns `false` during SSR AND during the first client render,
 * matching the server output exactly. After the effect fires, the real
 * preference is honored — animations still respect Reduced Motion, they just
 * do so after hydration instead of during it.
 */
export function useReducedMotionSafe(): boolean {
  const hydrated = useHydrated();
  const reduce = useReducedMotion();
  return hydrated ? Boolean(reduce) : false;
}
