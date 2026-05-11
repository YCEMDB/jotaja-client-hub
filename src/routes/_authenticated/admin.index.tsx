import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { ShoppingBag, DollarSign, Users, TrendingUp } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, PieChart, Pie, Cell, Legend } from "recharts";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: Dashboard,
  head: () => ({ meta: [{ title: "Painel — ComandaHub" }] }),
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

const COLORS = ["#0A1628", "#FFC627", "#10b981", "#3b82f6", "#ef4444", "#8b5cf6"];

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
    <div className="p-8">
      <div className="flex items-end justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">Painel</h1>
          <p className="text-muted-foreground">Visão geral do seu restaurante</p>
        </div>
        <Tabs value={range} onValueChange={(v) => setRange(v as typeof range)}>
          <TabsList>
            <TabsTrigger value="today">Hoje</TabsTrigger>
            <TabsTrigger value="7d">7 dias</TabsTrigger>
            <TabsTrigger value="30d">30 dias</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {cards.map((c) => (
          <Card key={c.label} className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">{c.label}</span>
              <c.icon className={`h-5 w-5 ${c.color}`} />
            </div>
            <div className="text-2xl font-bold">{c.value}</div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <Card className="p-5 lg:col-span-2">
          <h3 className="font-semibold mb-4">Receita por dia</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip formatter={(v: number) => `R$ ${v.toFixed(2)}`} />
                <Line type="monotone" dataKey="receita" stroke="#FFC627" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold mb-4">Tipo de pedido</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={typeData} dataKey="value" nameKey="name" outerRadius={70} label>
                  {typeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <h3 className="font-semibold mb-4">Pedidos por dia</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={series}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" fontSize={12} />
                <YAxis fontSize={12} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="pedidos" fill="#0A1628" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold mb-4">Formas de pagamento</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={paymentData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" fontSize={12} allowDecimals={false} />
                <YAxis dataKey="name" type="category" fontSize={12} width={80} />
                <Tooltip />
                <Bar dataKey="value" fill="#FFC627" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}
