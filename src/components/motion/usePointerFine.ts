import { useEffect, useState } from "react";

/**
 * `true` apenas em dispositivos com apontador fino (mouse) e hover real.
 * Resolvido depois da hidratação — SSR sempre retorna `false`.
 */
export function usePointerFine(): boolean {
  const [fine, setFine] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(pointer: fine) and (hover: hover)");
    const update = () => setFine(mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);
  return fine;
}
