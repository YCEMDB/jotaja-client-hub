// Sprint 4.3 — Painel de conversas
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, MessageCircleWarning, Timer, Send, Inbox, AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getConversationsDashboard } from "@/lib/communication/automation.functions";

type Metrics = {
  open_count: number; unanswered_count: number; avg_response_seconds: number;
  messages_sent_today: number; messages_received_today: number; failures_today: number;
};

function StatCard({ icon: Icon, label, value, hint }: { icon: any; label: string; value: string | number; hint?: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
            <p className="text-3xl font-black mt-1">{value}</p>
            {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
          </div>
          <Icon className="w-8 h-8 text-brand-orange opacity-70" />
        </div>
      </CardContent>
    </Card>
  );
}

export function PainelTab({ restaurantId }: { restaurantId: string }) {
  const dashFn = useServerFn(getConversationsDashboard);
  const [m, setM] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    try {
      const r = await dashFn({ data: { restaurant_id: restaurantId } });
      setM(r as Metrics);
    } finally { setLoading(false); }
  }
  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [restaurantId]);

  const avg = m?.avg_response_seconds ?? 0;
  const avgStr = avg < 60 ? `${Math.round(avg)}s` : avg < 3600 ? `${Math.round(avg/60)}min` : `${(avg/3600).toFixed(1)}h`;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold">Painel</h3>
        <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} /> Atualizar
        </Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard icon={MessageSquare}         label="Conversas abertas"   value={m?.open_count ?? "—"} />
        <StatCard icon={MessageCircleWarning}  label="Não respondidas"     value={m?.unanswered_count ?? "—"} />
        <StatCard icon={Timer}                 label="Tempo médio resposta" value={m ? avgStr : "—"} hint="Últimos 7 dias" />
        <StatCard icon={Send}                  label="Enviadas hoje"       value={m?.messages_sent_today ?? "—"} />
        <StatCard icon={Inbox}                 label="Recebidas hoje"      value={m?.messages_received_today ?? "—"} />
        <StatCard icon={AlertTriangle}         label="Falhas hoje"         value={m?.failures_today ?? "—"} />
      </div>
    </div>
  );
}
