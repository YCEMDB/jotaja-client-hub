import { useEffect, useState } from "react";

/**
 * Retorna `true` somente após a montagem no cliente.
 * Usar para gates que dependem de `window`/`matchMedia` sem quebrar SSR.
 */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}
