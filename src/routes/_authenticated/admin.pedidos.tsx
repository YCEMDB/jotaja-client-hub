import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Clock, MapPin, Phone, CreditCard, ChevronRight } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/pedidos")({
  component: PedidosPage,
  head: () => ({ meta: [{ title: "Pedidos — Comanda" }] }),
});

type OrderStatus = "pending" | "confirmed" | "preparing" | "ready" | "delivering" | "delivered" | "cancelled";

type Order = {
  id: string;
  order_number: number;
  status: OrderStatus;
  type: string;
  payment: string;
  customer_name: string;
  customer_phone: string;
  delivery_address: any;
  subtotal: number;
  discount: number;
  delivery_fee: number;
  total: number;
  notes: string | null;
  created_at: string;
};

type OrderItem = {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  notes: string | null;
  options: any;
};

const COLUMNS: { key: OrderStatus; label: string; color: string }[] = [
  { key: "pending", label: "Novos", color: "bg-amber-500" },
  { key: "confirmed", label: "Confirmados", color: "bg-blue-500" },
  { key: "preparing", label: "Em preparo", color: "bg-orange-500" },
  { key: "ready", label: "Prontos", color: "bg-purple-500" },
  { key: "delivering", label: "Saiu p/ entrega", color: "bg-cyan-500" },
  { key: "delivered", label: "Entregues", color: "bg-green-500" },
];

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  pending: "confirmed",
  confirmed: "preparing",
  preparing: "ready",
  ready: "delivering",
  delivering: "delivered",
};

function PedidosPage() {
  const { restaurantId } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selected, setSelected] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);

  const load = async () => {
    if (!restaurantId) return;
    const since = new Date();
    since.setHours(since.getHours() - 24);
    const { data } = await supabase
      .from("orders")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .gte("created_at", since.toISOString())
      .order("created_at", { ascending: false });
    setOrders((data ?? []) as Order[]);
  };

  useEffect(() => {
    load();
    if (!restaurantId) return;
    const ch = supabase
      .channel("orders-kanban")
      .on("postgres_changes",
        { event: "*", schema: "public", table: "orders", filter: `restaurant_id=eq.${restaurantId}` },
        () => load(),
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [restaurantId]);

  const openOrder = async (o: Order) => {
    setSelected(o);
    const { data } = await supabase.from("order_items").select("*").eq("order_id", o.id);
    setItems((data ?? []) as OrderItem[]);
  };

  const advance = async (o: Order) => {
    const next = NEXT_STATUS[o.status];
    if (!next) return;
    const { error } = await supabase.from("orders").update({ status: next }).eq("id", o.id);
    if (error) return toast.error(error.message);
    toast.success(`Pedido #${o.order_number} → ${COLUMNS.find(c => c.key === next)?.label}`);
    if (selected?.id === o.id) setSelected({ ...o, status: next });
  };

  const cancel = async (o: Order) => {
    if (!confirm(`Cancelar pedido #${o.order_number}?`)) return;
    await supabase.from("orders").update({ status: "cancelled" as OrderStatus }).eq("id", o.id);
    setSelected(null);
  };

  if (!restaurantId) return <div className="p-8">Configure seu restaurante primeiro.</div>;

  return (
    <div className="p-6 h-screen flex flex-col">
      <div className="mb-4 shrink-0">
        <h1 className="text-3xl font-bold">Pedidos</h1>
        <p className="text-muted-foreground">Acompanhe os pedidos em tempo real (últimas 24h)</p>
      </div>

      <div className="flex-1 overflow-x-auto">
        <div className="grid grid-cols-6 gap-3 min-w-[1200px] h-full">
          {COLUMNS.map((col) => {
            const colOrders = orders.filter((o) => o.status === col.key);
            return (
              <div key={col.key} className="flex flex-col bg-muted/40 rounded-lg overflow-hidden">
                <div className={`${col.color} text-white px-3 py-2 flex items-center justify-between`}>
                  <span className="font-semibold text-sm">{col.label}</span>
                  <Badge variant="secondary" className="text-xs">{colOrders.length}</Badge>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                  {colOrders.map((o) => (
                    <Card key={o.id} className="p-3 cursor-pointer hover:shadow-md transition" onClick={() => openOrder(o)}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold">#{o.order_number}</span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />{timeAgo(o.created_at)}
                        </span>
                      </div>
                      <p className="text-sm font-medium truncate">{o.customer_name}</p>
                      <p className="text-xs text-muted-foreground truncate">{o.type} · {o.payment}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="font-semibold">R$ {Number(o.total).toFixed(2)}</span>
                        {NEXT_STATUS[o.status] && (
                          <Button size="sm" variant="ghost" className="h-7 px-2" onClick={(e) => { e.stopPropagation(); advance(o); }}>
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </Card>
                  ))}
                  {colOrders.length === 0 && (
                    <p className="text-xs text-center text-muted-foreground py-4">Vazio</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-lg">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>Pedido #{selected.order_number}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="text-sm space-y-1">
                  <p className="font-medium">{selected.customer_name}</p>
                  <p className="flex items-center gap-2 text-muted-foreground"><Phone className="h-3.5 w-3.5" />{selected.customer_phone}</p>
                  {selected.delivery_address && (
                    <p className="flex items-start gap-2 text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 mt-0.5" />
                      <span>
                        {selected.delivery_address.street}, {selected.delivery_address.number}
                        {selected.delivery_address.neighborhood && ` — ${selected.delivery_address.neighborhood}`}
                      </span>
                    </p>
                  )}
                  <p className="flex items-center gap-2 text-muted-foreground"><CreditCard className="h-3.5 w-3.5" />{selected.payment}</p>
                </div>

                <div className="border-t pt-3 space-y-2">
                  {items.map((it) => (
                    <div key={it.id} className="flex justify-between text-sm">
                      <span>{it.quantity}× {it.product_name}</span>
                      <span>R$ {Number(it.subtotal).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-3 text-sm space-y-1">
                  <div className="flex justify-between"><span>Subtotal</span><span>R$ {Number(selected.subtotal).toFixed(2)}</span></div>
                  {Number(selected.delivery_fee) > 0 && (
                    <div className="flex justify-between"><span>Entrega</span><span>R$ {Number(selected.delivery_fee).toFixed(2)}</span></div>
                  )}
                  {Number(selected.discount) > 0 && (
                    <div className="flex justify-between text-green-600"><span>Desconto</span><span>- R$ {Number(selected.discount).toFixed(2)}</span></div>
                  )}
                  <div className="flex justify-between font-bold text-base pt-1"><span>Total</span><span>R$ {Number(selected.total).toFixed(2)}</span></div>
                </div>

                {selected.notes && (
                  <div className="bg-muted p-3 rounded text-sm">
                    <p className="font-medium mb-1">Observações:</p>
                    <p className="text-muted-foreground">{selected.notes}</p>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" className="flex-1" onClick={() => cancel(selected)}>Cancelar</Button>
                  {NEXT_STATUS[selected.status] && (
                    <Button className="flex-1" onClick={() => advance(selected)}>
                      Avançar → {COLUMNS.find(c => c.key === NEXT_STATUS[selected.status])?.label}
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "agora";
  if (m < 60) return `${m}min`;
  const h = Math.floor(m / 60);
  return `${h}h`;
}
