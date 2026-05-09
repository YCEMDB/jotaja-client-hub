import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { ShoppingBag, DollarSign, Users, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: Dashboard,
  head: () => ({ meta: [{ title: "Painel — Comanda" }] }),
});

function Dashboard() {
  const { restaurantId } = useAuth();
  const [stats, setStats] = useState({ orders: 0, revenue: 0, customers: 0, avgTicket: 0 });

  useEffect(() => {
    if (!restaurantId) return;
    (async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { data: orders } = await supabase
        .from("orders")
        .select("total")
        .eq("restaurant_id", restaurantId)
        .gte("created_at", today.toISOString());
      const { count: customers } = await supabase
        .from("customers")
        .select("*", { count: "exact", head: true })
        .eq("restaurant_id", restaurantId);
      const totalRevenue = orders?.reduce((s, o) => s + Number(o.total), 0) ?? 0;
      const ordersCount = orders?.length ?? 0;
      setStats({
        orders: ordersCount,
        revenue: totalRevenue,
        customers: customers ?? 0,
        avgTicket: ordersCount ? totalRevenue / ordersCount : 0,
      });
    })();
  }, [restaurantId]);

  const cards = [
    { label: "Pedidos hoje", value: stats.orders.toString(), icon: ShoppingBag, color: "text-blue-600" },
    { label: "Faturamento hoje", value: `R$ ${stats.revenue.toFixed(2)}`, icon: DollarSign, color: "text-green-600" },
    { label: "Clientes totais", value: stats.customers.toString(), icon: Users, color: "text-purple-600" },
    { label: "Ticket médio", value: `R$ ${stats.avgTicket.toFixed(2)}`, icon: TrendingUp, color: "text-amber-600" },
  ];

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-2">Painel</h1>
      <p className="text-muted-foreground mb-8">Visão geral do seu restaurante</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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

      <Card className="p-8 text-center">
        <h3 className="font-semibold text-lg mb-2">🚀 Próximos passos</h3>
        <p className="text-muted-foreground text-sm">
          Configure seu cardápio, áreas de entrega e cupons no menu lateral. <br />
          As demais telas (pedidos, cardápio, cupons, entregadores, clientes, configurações) estão prontas pra serem implementadas na próxima fase.
        </p>
      </Card>
    </div>
  );
}
