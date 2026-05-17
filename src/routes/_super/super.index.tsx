import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getGlobalMetrics } from "@/lib/super-admin.functions";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, BarChart3 } from "lucide-react";
import {
  LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip as ReTooltip, CartesianGrid,
} from "recharts";
import { toast } from "sonner";

export const Route = createFileRoute("/_super/super/")({
  component: SuperOverview,
  head: () => ({ meta: [{ title: "Super-Admin — Visão geral" }] }),
});

function fmtMoney(v: number) { return `R$ ${Number(v).toFixed(2).replace(".", ",")}`; }
function fmtDate(s: string | null) { return s ? new Date(s).toLocaleDateString("pt-BR") : "—"; }

function SuperOverview() {
  const fetchMetrics = useServerFn(getGlobalMetrics);
  const [data, setData] = useState<Awaited<ReturnType<typeof getGlobalMetrics>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [storeFilter, setStoreFilter] = useState<string>("all");

  useEffect(() => {
    setLoading(true);
    fetchMetrics({ data: { restaurant_id: storeFilter === "all" ? null : storeFilter } })
      .then((r) => { setData(r); setLoading(false); })
      .catch((e) => { toast.error(e?.message ?? "Erro ao carregar métricas"); setLoading(false); });
  }, [storeFilter]);

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center gap-3 justify-between flex-wrap">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-8 w-8 text-brand-violet" />
          <div>
            <h1 className="font-display text-4xl md:text-5xl text-ink tracking-tight leading-[0.95]">Visão geral</h1>
            <p className="text-muted-foreground">Métricas globais da plataforma</p>
          </div>
        </div>
        <div className="min-w-[240px]">
          <Select value={storeFilter} onValueChange={setStoreFilter}>
            <SelectTrigger><SelectValue placeholder="Filtrar por loja" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as lojas</SelectItem>
              {(data?.restaurants ?? []).map((r) => (
                <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="p-4 md:p-8 text-center text-muted-foreground">Carregando métricas…</div>
      ) : !data ? (
        <div className="p-4 md:p-8 text-center text-muted-foreground">Sem dados.</div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4"><p className="text-xs text-muted-foreground">Lojas totais</p><p className="text-2xl font-bold">{data.totals.totalStores}</p></Card>
            <Card className="p-4"><p className="text-xs text-muted-foreground">Lojas ativas</p><p className="text-2xl font-bold">{data.totals.activeStores}</p></Card>
            <Card className="p-4"><p className="text-xs text-muted-foreground">Em trial</p><p className="text-2xl font-bold text-amber-600">{data.totals.trialStores}</p></Card>
            <Card className="p-4"><p className="text-xs text-muted-foreground">Pagantes</p><p className="text-2xl font-bold text-emerald-600">{data.totals.payingStores}</p></Card>
            <Card className="p-4"><p className="text-xs text-muted-foreground">MRR estimado</p><p className="text-2xl font-bold">{fmtMoney(data.totals.mrr)}</p></Card>
            <Card className="p-4"><p className="text-xs text-muted-foreground">Pedidos hoje</p><p className="text-2xl font-bold">{data.totals.ordersToday}</p></Card>
            <Card className="p-4"><p className="text-xs text-muted-foreground">Pedidos 7d</p><p className="text-2xl font-bold">{data.totals.ordersWeek}</p></Card>
            <Card className="p-4"><p className="text-xs text-muted-foreground">GMV mês</p><p className="text-2xl font-bold">{fmtMoney(data.totals.revenueMonth)}</p></Card>
          </div>

          <Card className="p-4">
            <p className="font-semibold mb-3">Pedidos por dia (últimos 30 dias)</p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.daily}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={(d) => d.slice(5)} fontSize={11} />
                  <YAxis fontSize={11} />
                  <ReTooltip />
                  <Line type="monotone" dataKey="orders" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <div className="grid md:grid-cols-2 gap-4">
            <Card className="p-4">
              <p className="font-semibold mb-3">Top 5 lojas — faturamento no mês</p>
              {data.topStores.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sem pedidos no mês.</p>
              ) : (
                <ul className="space-y-2">
                  {data.topStores.map((s, i) => (
                    <li key={s.id} className="flex items-center justify-between text-sm">
                      <span><span className="text-muted-foreground mr-2">#{i + 1}</span>{s.name}</span>
                      <span className="font-medium">{fmtMoney(s.revenue)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card className="p-4">
              <p className="font-semibold mb-3 flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-600" />Trials expirando em 7 dias</p>
              {data.expiringTrials.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum trial expirando em breve.</p>
              ) : (
                <ul className="space-y-2">
                  {data.expiringTrials.map((s) => (
                    <li key={s.id} className="flex items-center justify-between text-sm">
                      <Link to="/super/lojas" className="hover:underline">{s.name}</Link>
                      <span className="text-muted-foreground">{fmtDate(s.trial_ends_at)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
