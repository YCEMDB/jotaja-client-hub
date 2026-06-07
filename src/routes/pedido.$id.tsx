import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { CheckCircle2, Clock, ChefHat, Bike, PackageCheck, XCircle } from "lucide-react";

export const Route = createFileRoute("/pedido/$id")({
  component: PedidoStatus,
  head: () => ({
    meta: [
      { title: "Status do pedido — ComandaHub" },
      { name: "description", content: "Acompanhe em tempo real o status do seu pedido." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

const STEPS = [
  { key: "pending", label: "Recebido", icon: Clock },
  { key: "confirmed", label: "Confirmado", icon: CheckCircle2 },
  { key: "preparing", label: "Em preparo", icon: ChefHat },
  { key: "ready", label: "Pronto", icon: PackageCheck },
  { key: "out_for_delivery", label: "Saiu p/ entrega", icon: Bike },
  { key: "delivered", label: "Entregue", icon: CheckCircle2 },
] as const;

type Order = {
  id: string;
  order_number: number;
  status: string;
  type: string;
  payment: string;
  customer_name: string;
  subtotal: number;
  delivery_fee: number;
  discount: number;
  total: number;
  notes: string | null;
  delivery_address: any;
  restaurant_id: string;
};

type OrderItem = { id: string; product_name: string; quantity: number; subtotal: number };
type Restaurant = { name: string; slug: string; whatsapp: string | null; primary_color: string | null };

function PedidoStatus() {
  const { id } = Route.useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data } = await supabase.rpc("get_public_order", { p_id: id });
    const payload = data as any;
    if (!payload?.order) { setLoading(false); return; }
    setOrder(payload.order as Order);
    setItems((payload.items ?? []) as OrderItem[]);
    setRestaurant((payload.restaurant ?? null) as Restaurant | null);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // Poll every 5s for status updates (public access goes through the RPC)
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [id]);

  if (loading) return <div className="min-h-screen grid place-items-center">Carregando…</div>;
  if (!order) return <div className="min-h-screen grid place-items-center">Pedido não encontrado.</div>;

  const cancelled = order.status === "cancelled";
  const currentStepIdx = STEPS.findIndex((s) => s.key === order.status);
  const brand = restaurant?.primary_color ?? "#0A1628";

  return (
    <div className="min-h-screen bg-muted/20">
      <div className="text-white py-6 px-4" style={{ background: brand }}>
        <div className="container mx-auto max-w-2xl">
          <p className="text-sm opacity-80">{restaurant?.name}</p>
          <h1 className="text-2xl font-bold">Pedido #{order.order_number}</h1>
        </div>
      </div>

      <div className="container mx-auto max-w-2xl px-4 py-6 space-y-4">
        {cancelled ? (
          <Card className="p-6 text-center">
            <XCircle className="h-12 w-12 text-destructive mx-auto mb-2" />
            <h2 className="font-bold text-lg">Pedido cancelado</h2>
            <p className="text-sm text-muted-foreground">Entre em contato com o restaurante se precisar.</p>
          </Card>
        ) : (
          <Card className="p-6">
            <h2 className="font-semibold mb-4">Acompanhe seu pedido</h2>
            <div className="space-y-3">
              {STEPS.filter((s) => order.type === "delivery" || s.key !== "out_for_delivery").map((step, idx) => {
                const Icon = step.icon;
                const reached = idx <= currentStepIdx;
                const current = idx === currentStepIdx;
                return (
                  <div key={step.key} className="flex items-center gap-3">
                    <div
                      className={`h-9 w-9 rounded-full grid place-items-center shrink-0 ${reached ? "text-white" : "bg-muted text-muted-foreground"}`}
                      style={reached ? { background: brand } : undefined}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm ${reached ? "font-semibold" : "text-muted-foreground"}`}>{step.label}</p>
                      {current && <p className="text-xs text-muted-foreground">Em andamento…</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        <Card className="p-6">
          <h2 className="font-semibold mb-3">Itens</h2>
          <div className="space-y-2 text-sm">
            {items.map((it) => (
              <div key={it.id} className="flex justify-between">
                <span>{it.quantity}× {it.product_name}</span>
                <span>R$ {Number(it.subtotal).toFixed(2)}</span>
              </div>
            ))}
            <div className="border-t pt-2 mt-2 space-y-1">
              <div className="flex justify-between"><span>Subtotal</span><span>R$ {Number(order.subtotal).toFixed(2)}</span></div>
              {Number(order.delivery_fee) > 0 && (
                <div className="flex justify-between"><span>Entrega</span><span>R$ {Number(order.delivery_fee).toFixed(2)}</span></div>
              )}
              <div className="flex justify-between font-bold text-base pt-1"><span>Total</span><span>R$ {Number(order.total).toFixed(2)}</span></div>
            </div>
          </div>
        </Card>

        {order.delivery_address && (
          <Card className="p-6">
            <h2 className="font-semibold mb-2">Endereço de entrega</h2>
            <p className="text-sm text-muted-foreground">
              {order.delivery_address.street}, {order.delivery_address.number}
              {order.delivery_address.complement && ` — ${order.delivery_address.complement}`}
              <br />
              {order.delivery_address.neighborhood}
            </p>
          </Card>
        )}

        {restaurant?.slug && (
          <div className="text-center">
            <Link to="/$slug" params={{ slug: restaurant.slug }} className="text-sm text-muted-foreground underline">
              Voltar ao cardápio
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
