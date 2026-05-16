import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, Zap } from "lucide-react";

type Plan = { id: string; name: string; price_monthly: number; features: any };
type R = { plan_id: string | null; monthly_order_count: number; month_reset_at: string };

export function PlanUsageBanner({ restaurantId }: { restaurantId: string | null }) {
  const [data, setData] = useState<(R & { plan: Plan | null }) | null>(null);

  useEffect(() => {
    if (!restaurantId) return;
    (async () => {
      const { data: r } = await supabase
        .from("restaurants")
        .select("plan_id, monthly_order_count, month_reset_at")
        .eq("id", restaurantId)
        .single();
      if (!r) return;
      const { data: p } = await supabase
        .from("app_plans")
        .select("id,name,price_monthly,features")
        .eq("id", r.plan_id || "starter")
        .maybeSingle();
      setData({ ...(r as R), plan: (p as Plan) ?? null });
    })();
  }, [restaurantId]);

  if (!data?.plan) return null;
  const limit = data.plan.features?.max_orders_per_month ?? null;
  const used = data.monthly_order_count;
  const pct = limit ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  const near = limit && pct >= 80;
  const over = limit && used >= limit;

  return (
    <div className={`rounded-2xl border-2 border-ink p-4 shadow-brutal ${over ? "bg-destructive text-background" : near ? "bg-brand-amber" : "bg-background"}`}>
      <div className="flex items-start gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          {over ? <AlertTriangle className="h-5 w-5" /> : <Zap className="h-5 w-5 text-brand-orange" />}
          <div>
            <div className="font-display uppercase text-sm">Plano {data.plan.name}</div>
            <div className="text-xs opacity-80">
              {limit
                ? `${used} de ${limit} pedidos este mês`
                : `${used} pedidos este mês · ilimitado`}
            </div>
          </div>
        </div>
        {limit && (
          <div className="flex-1 min-w-[200px]">
            <div className="h-2 bg-ink/10 rounded-full overflow-hidden border border-ink/20">
              <div
                className={`h-full ${over ? "bg-ink" : near ? "bg-brand-orange" : "bg-brand-magenta"}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="text-[10px] mt-1 opacity-70">Reinicia em {new Date(data.month_reset_at).toLocaleDateString("pt-BR")}</div>
          </div>
        )}
        {(near || over) && (
          <Link
            to="/admin/configuracoes"
            className="px-3 py-2 rounded-lg bg-ink text-background text-xs font-bold uppercase tracking-wide hover:opacity-90"
          >
            Fazer upgrade
          </Link>
        )}
      </div>
    </div>
  );
}
