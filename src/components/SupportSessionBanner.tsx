import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ShieldAlert, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type ActiveSession = {
  id: string;
  restaurant_id: string;
  restaurant_name: string;
  reason: string;
  access_level: string;
  started_at: string;
  expires_at: string;
};

const LEVEL_LABEL: Record<string, string> = {
  view_only: "somente visualização",
  operational: "operacional",
  administrative: "administrativa",
};

export function SupportSessionBanner() {
  const [session, setSession] = useState<ActiveSession | null>(null);
  const [ending, setEnding] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const { data, error } = await supabase.rpc("get_active_support_session" as never);
      if (cancelled) return;
      if (error || !data) { setSession(null); return; }
      setSession(data as unknown as ActiveSession);
    };
    load();
    const int = setInterval(load, 60_000);
    const tickInt = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => { cancelled = true; clearInterval(int); clearInterval(tickInt); };
  }, []);

  if (!session) return null;

  const remainingMs = new Date(session.expires_at).getTime() - Date.now();
  if (remainingMs <= 0) return null;
  const mins = Math.max(0, Math.floor(remainingMs / 60000));
  void tick; // recompute countdown

  const endSession = async () => {
    setEnding(true);
    const { error } = await supabase.rpc("end_support_session" as never, { p_session_id: session.id } as never);
    setEnding(false);
    if (error) return toast.error("Falha ao encerrar: " + error.message);
    toast.success("Sessão de suporte encerrada");
    setSession(null);
    setTimeout(() => { window.location.href = "/super/lojas"; }, 400);
  };

  return (
    <div className="sticky top-0 z-50 bg-brand-violet text-background border-b-4 border-ink px-4 py-2.5 flex flex-wrap items-center gap-3">
      <ShieldAlert className="h-5 w-5 shrink-0" />
      <div className="flex-1 min-w-0 text-sm">
        <span className="font-bold">Modo de suporte</span>{" "}
        · Acessando <span className="font-bold">{session.restaurant_name}</span>{" "}
        · nível <span className="uppercase font-bold">{LEVEL_LABEL[session.access_level] ?? session.access_level}</span>
        <span className="opacity-80"> · todas as ações estão sendo registradas · expira em {mins} min</span>
      </div>
      <Button size="sm" variant="secondary" disabled={ending} onClick={endSession} className="gap-1">
        <X className="h-4 w-4" /> Encerrar
      </Button>
    </div>
  );
}
