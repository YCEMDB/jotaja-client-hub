import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

import { ShoppingBag, DollarSign, Users, TrendingUp } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, PieChart, Pie, Cell, Legend } from "recharts";
import { PlanUsageBanner } from "@/components/PlanUsageBanner";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: Dashboard,
  head: () => ({ meta: [{ title: "Painel — Comandex" }] }),
});

interface OrderRow {
  id: string;
  total: number;
  status: string;
  type: string;
  payment: string;
  created_at: string;
  customer_id: string | null;
}

const COLORS = ["#ff6b35", "#e84393", "#7c5cff", "#f7931e", "#10b981", "#1a1a1a"];
const ACCENTS = ["bg-brand-orange", "bg-brand-magenta", "bg-brand-violet", "bg-brand-amber"] as const;

function Dashboard() {
  const { restaurantId } = useAuth();
  const [range, setRange] = useState<"today" | "7d" | "30d">("7d");
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [customersCount, setCustomersCount] = useState(0);

  useEffect(() => {
    if (!restaurantId) return;
    const days = range === "today" ? 1 : range === "7d" ? 7 : 30;
    const from = new Date();
    from.setHours(0, 0, 0, 0);
    from.setDate(from.getDate() - (days - 1));

    (async () => {
      const [{ data: o }, { count }] = await Promise.all([
        supabase
          .from("orders")
          .select("id,total,status,type,payment,created_at,customer_id")
          .eq("restaurant_id", restaurantId)
          .gte("created_at", from.toISOString())
          .order("created_at", { ascending: true }),
        supabase.from("customers").select("*", { count: "exact", head: true }).eq("restaurant_id", restaurantId),
      ]);
      setOrders((o as OrderRow[]) ?? []);
      setCustomersCount(count ?? 0);
    })();
  }, [restaurantId, range]);

  const validOrders = orders.filter((o) => o.status !== "cancelled");
  const revenue = validOrders.reduce((s, o) => s + Number(o.total), 0);
  const avgTicket = validOrders.length ? revenue / validOrders.length : 0;

  const cards = [
    { label: "Pedidos", value: validOrders.length.toString(), icon: ShoppingBag, color: "text-blue-600" },
    { label: "Faturamento", value: `R$ ${revenue.toFixed(2)}`, icon: DollarSign, color: "text-green-600" },
    { label: "Clientes totais", value: customersCount.toString(), icon: Users, color: "text-purple-600" },
    { label: "Ticket médio", value: `R$ ${avgTicket.toFixed(2)}`, icon: TrendingUp, color: "text-amber-600" },
  ];

  // Daily series
  const byDay = new Map<string, { date: string; pedidos: number; receita: number }>();
  validOrders.forEach((o) => {
    const d = new Date(o.created_at);
    const key = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
    const cur = byDay.get(key) ?? { date: key, pedidos: 0, receita: 0 };
    cur.pedidos += 1;
    cur.receita += Number(o.total);
    byDay.set(key, cur);
  });
  const series = Array.from(byDay.values());

  // Payment breakdown
  const byPayment = new Map<string, number>();
  validOrders.forEach((o) => byPayment.set(o.payment, (byPayment.get(o.payment) ?? 0) + 1));
  const paymentData = Array.from(byPayment.entries()).map(([name, value]) => ({ name, value }));

  // Type
  const byType = new Map<string, number>();
  validOrders.forEach((o) => byType.set(o.type, (byType.get(o.type) ?? 0) + 1));
  const typeData = Array.from(byType.entries()).map(([name, value]) => ({ name, value }));

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
        <div>
          <div className="inline-flex items-center gap-2 mb-3">
            <span className="h-2 w-2 rounded-full bg-brand-magenta animate-pulse" />
            <span className="text-[11px] uppercase tracking-[0.18em] font-bold text-ink/70">Visão geral</span>
          </div>
          <h1 className="font-display text-5xl text-ink leading-[0.92] tracking-tight">
            Painel<span className="inline-block w-3 h-3 ml-1 -mb-0.5 bg-brand-magenta align-baseline" />
          </h1>
          <p className="mt-2 text-sm text-ink/60">Suas métricas em tempo real</p>
        </div>
        <Tabs value={range} onValueChange={(v) => setRange(v as typeof range)}>
          <TabsList className="bg-ink p-1 h-auto rounded-xl border-2 border-ink shadow-[3px_3px_0_0_oklch(0.69_0.22_38)]">
            <TabsTrigger value="today" className="data-[state=active]:bg-brand-orange data-[state=active]:text-ink data-[state=active]:shadow-none rounded-lg font-bold uppercase tracking-wide text-background text-xs px-3">Hoje</TabsTrigger>
            <TabsTrigger value="7d" className="data-[state=active]:bg-brand-orange data-[state=active]:text-ink data-[state=active]:shadow-none rounded-lg font-bold uppercase tracking-wide text-background text-xs px-3">7 dias</TabsTrigger>
            <TabsTrigger value="30d" className="data-[state=active]:bg-brand-orange data-[state=active]:text-ink data-[state=active]:shadow-none rounded-lg font-bold uppercase tracking-wide text-background text-xs px-3">30 dias</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="mb-6">
        <PlanUsageBanner restaurantId={restaurantId} />
      </div>

      {/* Bento KPI grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {cards.map((c, i) => {
          const accent = ACCENTS[i % ACCENTS.length];
          return (
            <div
              key={c.label}
              className="relative bg-card border-2 border-ink rounded-2xl p-6 shadow-[5px_5px_0_0_oklch(0.15_0.02_30)] hover:shadow-[7px_7px_0_0_oklch(0.69_0.22_38)] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all overflow-hidden"
            >
              <div className={`absolute top-0 left-0 right-0 h-1.5 ${accent}`} />
              <div className="flex items-center justify-between mb-3 mt-1">
                <span className="text-[10px] uppercase tracking-[0.18em] font-bold text-ink/60">{c.label}</span>
                <div className={`h-9 w-9 grid place-items-center rounded-lg ${accent} border-2 border-ink`}>
                  <c.icon className="h-4 w-4 text-ink" />
                </div>
              </div>
              <div className="font-display text-4xl text-ink leading-none tracking-tight">{c.value}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <div className="bg-card border-2 border-ink rounded-2xl p-6 shadow-[5px_5px_0_0_oklch(0.15_0.02_30)] lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-xl text-ink">Receita por dia</h3>
            <span className="text-[10px] uppercase tracking-[0.18em] font-bold text-brand-orange">↗ ao vivo</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" strokeOpacity={0.1} />
                <XAxis dataKey="date" fontSize={11} stroke="#1a1a1a" />
                <YAxis fontSize={11} stroke="#1a1a1a" />
                <Tooltip
                  contentStyle={{ background: "#1a1a1a", border: "2px solid #ff6b35", borderRadius: "8px", color: "#fff", fontWeight: 700 }}
                  formatter={(v: number) => `R$ ${v.toFixed(2)}`}
                />
                <Line type="monotone" dataKey="receita" stroke="#ff6b35" strokeWidth={3} dot={{ r: 4, fill: "#1a1a1a", strokeWidth: 2, stroke: "#ff6b35" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card border-2 border-ink rounded-2xl p-6 shadow-[5px_5px_0_0_oklch(0.15_0.02_30)]">
          <h3 className="font-display text-xl text-ink mb-4">Tipo de pedido</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={typeData} dataKey="value" nameKey="name" outerRadius={70} stroke="#1a1a1a" strokeWidth={2} label>
                  {typeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "#1a1a1a", border: "2px solid #e84393", borderRadius: "8px", color: "#fff", fontWeight: 700 }} />
                <Legend wrapperStyle={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card border-2 border-ink rounded-2xl p-6 shadow-[5px_5px_0_0_oklch(0.15_0.02_30)]">
          <h3 className="font-display text-xl text-ink mb-4">Pedidos por dia</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={series}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" strokeOpacity={0.1} />
                <XAxis dataKey="date" fontSize={11} stroke="#1a1a1a" />
                <YAxis fontSize={11} stroke="#1a1a1a" allowDecimals={false} />
                <Tooltip contentStyle={{ background: "#1a1a1a", border: "2px solid #7c5cff", borderRadius: "8px", color: "#fff", fontWeight: 700 }} />
                <Bar dataKey="pedidos" fill="#7c5cff" radius={[8, 8, 0, 0]} stroke="#1a1a1a" strokeWidth={2} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card border-2 border-ink rounded-2xl p-6 shadow-[5px_5px_0_0_oklch(0.15_0.02_30)]">
          <h3 className="font-display text-xl text-ink mb-4">Formas de pagamento</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={paymentData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" strokeOpacity={0.1} />
                <XAxis type="number" fontSize={11} stroke="#1a1a1a" allowDecimals={false} />
                <YAxis dataKey="name" type="category" fontSize={11} stroke="#1a1a1a" width={80} />
                <Tooltip contentStyle={{ background: "#1a1a1a", border: "2px solid #f7931e", borderRadius: "8px", color: "#fff", fontWeight: 700 }} />
                <Bar dataKey="value" fill="#f7931e" radius={[0, 8, 8, 0]} stroke="#1a1a1a" strokeWidth={2} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
