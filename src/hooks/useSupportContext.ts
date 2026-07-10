import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type SupportLevel = "view_only" | "operational" | "administrative";

export type SupportContext = {
  active: boolean;
  level: SupportLevel | null;
  restaurantId: string | null;
  sessionId: string | null;
  reason: string | null;
  loading: boolean;
};

/**
 * Detecta sessão de suporte assistido ativa para o super_admin logado.
 * A UI usa apenas para experiência (mostrar/ocultar botões, exigir motivo).
 * O backend continua sendo a autoridade — RPCs validam nível e motivo.
 */
export function useSupportContext(): SupportContext {
  const [state, setState] = useState<SupportContext>({
    active: false,
    level: null,
    restaurantId: null,
    sessionId: null,
    reason: null,
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const { data, error } = await supabase.rpc("get_active_support_session" as never);
      if (cancelled) return;
      if (error || !data) {
        setState({ active: false, level: null, restaurantId: null, sessionId: null, reason: null, loading: false });
        return;
      }
      const d = data as unknown as {
        id: string; restaurant_id: string; access_level: SupportLevel; reason: string;
      };
      setState({
        active: true,
        level: d.access_level,
        restaurantId: d.restaurant_id,
        sessionId: d.id,
        reason: d.reason,
        loading: false,
      });
    };
    load();
    const int = setInterval(load, 60_000);
    return () => { cancelled = true; clearInterval(int); };
  }, []);

  return state;
}
