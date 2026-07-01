import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Clock, MapPin, Phone, CreditCard, ChevronRight, MessageCircle, Truck, Printer, Bell, BellOff, PrinterCheck, Package, XCircle, CheckCircle2, User, History } from "lucide-react";
import { toast } from "sonner";
import { printReceipt } from "@/lib/print-receipt";
import { ensureNotificationPermission, playOrderBeep, showOrderNotification } from "@/lib/order-notifications";

export const Route = createFileRoute("/_authenticated/admin/pedidos")({
  component: PedidosPage,
  head: () => ({ meta: [{ title: "Pedidos — Comandex" }] }),
});

type OrderStatus = "pending" | "confirmed" | "preparing" | "ready" | "out_for_delivery" | "delivered" | "cancelled";

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
  updated_at?: string;
  driver_id: string | null;
  payment_status: string;
};

type Driver = { id: string; name: string; phone: string | null };

type OrderItem = {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  notes: string | null;
  options: any;
};

type ColKey = "new" | "preparing" | "ready_delivery" | "ready_pickup" | "out" | "delivered" | "cancelled";

type ColumnDef = {
  key: ColKey;
  label: string;
  color: string;
  ring: string;
  match: (o: Order) => boolean;
  // se "dynamic" e count === 0, a coluna some
  dynamic?: boolean;
};

const COLUMNS: ColumnDef[] = [
  {
    key: "new",
    label: "Novos",
    color: "bg-brand-amber",
    ring: "shadow-[4px_4px_0_0_oklch(0.78_0.17_65)]",
    match: (o) => o.status === "pending" || o.status === "confirmed",
  },
  {
    key: "preparing",
    label: "Em preparo",
    color: "bg-brand-orange",
    ring: "shadow-[4px_4px_0_0_oklch(0.69_0.22_38)]",
    match: (o) => o.status === "preparing",
  },
  {
    key: "ready_delivery",
    label: "Prontos · Entrega",
    color: "bg-brand-magenta",
    ring: "shadow-[4px_4px_0_0_oklch(0.62_0.24_0)]",
    match: (o) => o.status === "ready" && o.type === "delivery",
  },
  {
    key: "ready_pickup",
    label: "Aguardando retirada",
    color: "bg-brand-violet",
    ring: "shadow-[4px_4px_0_0_oklch(0.5_0.22_290)]",
    match: (o) => o.status === "ready" && (o.type === "pickup" || o.type === "dine_in"),
    dynamic: true,
  },
  {
    key: "out",
    label: "Saiu p/ entrega",
    color: "bg-ink",
    ring: "shadow-[4px_4px_0_0_oklch(0.15_0.02_30)]",
    match: (o) => o.status === "out_for_delivery",
  },
  {
    key: "delivered",
    label: "Concluídos",
    color: "bg-success",
    ring: "shadow-[4px_4px_0_0_oklch(0.7_0.16_150)]",
    match: (o) => o.status === "delivered",
  },
  {
    key: "cancelled",
    label: "Cancelados",
    color: "bg-destructive",
    ring: "shadow-[4px_4px_0_0_oklch(0.55_0.22_25)]",
    match: (o) => o.status === "cancelled",
    dynamic: true,
  },
];

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  pending: "preparing",
  confirmed: "preparing",
  preparing: "ready",
  ready: "out_for_delivery", // será trocado em runtime para "delivered" se for pickup/dine_in
  out_for_delivery: "delivered",
};

const NEXT_LABEL: Partial<Record<OrderStatus, string>> = {
  pending: "Iniciar preparo",
  confirmed: "Iniciar preparo",
  preparing: "Marcar pronto",
  ready: "Despachar",
  out_for_delivery: "Marcar entregue",
};

function PedidosPage() {
  const { restaurantId } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selected, setSelected] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [restaurant, setRestaurant] = useState<{ name: string; phone: string | null } | null>(null);
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [autoPrint, setAutoPrint] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("autoPrintOrders") === "1";
  });
  const knownIdsRef = useRef<Set<string>>(new Set());
  const initializedRef = useRef(false);
  const autoPrintRef = useRef(autoPrint);
  const restaurantRef = useRef(restaurant);
  useEffect(() => { autoPrintRef.current = autoPrint; }, [autoPrint]);
  useEffect(() => { restaurantRef.current = restaurant; }, [restaurant]);

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
    const list = (data ?? []) as Order[];
    if (initializedRef.current) {
      const newOnes = list.filter((o) => !knownIdsRef.current.has(o.id) && o.status === "pending");
      newOnes.forEach(async (o) => {
        playOrderBeep();
        showOrderNotification(o.order_number, o.customer_name, o.total);
        toast.success(`🔔 Novo pedido #${o.order_number} — ${o.customer_name}`);
        if (autoPrintRef.current) {
          const { data: its } = await supabase.from("order_items").select("*").eq("order_id", o.id);
          printReceipt({
            restaurantName: restaurantRef.current?.name ?? "Comandex",
            restaurantPhone: restaurantRef.current?.phone ?? null,
            order: o as any,
            items: (its ?? []) as any,
          });
        }
      });
    }
    knownIdsRef.current = new Set(list.map((o) => o.id));
    initializedRef.current = true;
    setOrders(list);
  };

  useEffect(() => {
    load();
    if (!restaurantId) return;
    (async () => {
      const { data: drv } = await supabase.from("delivery_drivers").select("id,name,phone").eq("restaurant_id", restaurantId).eq("is_active", true);
      setDrivers((drv ?? []) as Driver[]);
      const { data: rest } = await supabase.from("restaurants").select("name,phone").eq("id", restaurantId).maybeSingle();
      if (rest) setRestaurant(rest as any);
    })();
    setNotifEnabled(typeof Notification !== "undefined" && Notification.permission === "granted");
    // Polling a cada 5s — substitui Realtime (removido por segurança de canal)
    const iv = setInterval(load, 5000);
    return () => { clearInterval(iv); };
  }, [restaurantId]);

  const enableNotifications = async () => {
    // Tenta liberar áudio (gesto do usuário) mesmo se notificações falharem
    playOrderBeep();
    const result = await ensureNotificationPermission();
    if (result === "granted") {
      setNotifEnabled(true);
      toast.success("Notificações ativadas — você ouvirá um alerta a cada novo pedido");
      return;
    }
    setNotifEnabled(false);
    if (result === "iframe-blocked") {
      toast.error("Abra esta página em uma nova aba para ativar notificações do navegador (o preview embutido bloqueia). O som de alerta continua funcionando.", { duration: 8000 });
    } else if (result === "denied") {
      toast.error("Permissão negada. Habilite notificações nas configurações do navegador para este site.");
    } else if (result === "unsupported") {
      toast.error("Seu navegador não suporta notificações. O som de alerta continua funcionando.");
    } else {
      toast.error("Não foi possível ativar notificações. O som de alerta continua funcionando.");
    }
  };

  const openOrder = async (o: Order) => {
    setSelected(o);
    const { data } = await supabase.from("order_items").select("*").eq("order_id", o.id);
    setItems((data ?? []) as OrderItem[]);
  };

  const printOrder = async (o: Order) => {
    const { data } = await supabase.from("order_items").select("*").eq("order_id", o.id);
    printReceipt({
      restaurantName: restaurant?.name ?? "Comandex",
      restaurantPhone: restaurant?.phone ?? null,
      order: o as any,
      items: (data ?? []) as any,
    });
  };

  const advance = async (o: Order) => {
    let next = NEXT_STATUS[o.status];
    if (!next) return;
    if (o.status === "ready" && (o.type === "pickup" || o.type === "dine_in")) {
      next = "delivered";
    }
    const { error } = await supabase.rpc("update_order_status", {
      p_order_id: o.id,
      p_new_status: next,
      p_source: "panel",
      p_reason: undefined,
    });
    if (error) return toast.error(error.message);
    toast.success(`Pedido #${o.order_number} avançado`);
    if (selected?.id === o.id) setSelected({ ...o, status: next });
  };

  const cancel = async (o: Order) => {
    if (!confirm(`Cancelar pedido #${o.order_number}?`)) return;
    const { error } = await supabase.rpc("update_order_status", {
      p_order_id: o.id,
      p_new_status: "cancelled" as OrderStatus,
      p_source: "panel",
      p_reason: "cancelled_by_panel",
    });
    if (error) return toast.error(error.message);
    setSelected(null);
  };


  const markPaid = async (o: Order) => {
    const { error } = await supabase.from("orders")
      .update({ payment_status: "paid", paid_at: new Date().toISOString() })
      .eq("id", o.id);
    if (error) return toast.error(error.message);
    toast.success("Pagamento confirmado");
    if (selected?.id === o.id) setSelected({ ...o, payment_status: "paid" });
  };

  const assignDriver = async (driverId: string) => {
    if (!selected) return;
    const value = driverId === "none" ? null : driverId;
    const { error } = await supabase.from("orders").update({ driver_id: value }).eq("id", selected.id);
    if (error) return toast.error(error.message);
    setSelected({ ...selected, driver_id: value });
    toast.success(value ? "Entregador atribuído" : "Entregador removido");
  };

  const notifyWhatsApp = (o: Order) => {
    const statusMsg: Record<OrderStatus, string> = {
      pending: "recebemos seu pedido e estamos avaliando",
      confirmed: "seu pedido foi confirmado e já vai para a cozinha",
      preparing: "seu pedido está em preparo",
      ready: "seu pedido está pronto",
      out_for_delivery: "seu pedido saiu para entrega",
      delivered: "seu pedido foi entregue. Obrigado!",
      cancelled: "infelizmente seu pedido foi cancelado",
    };
    const text = `Olá ${o.customer_name}, ${statusMsg[o.status]}. Pedido #${o.order_number} — Total R$ ${Number(o.total).toFixed(2)}`;
    const phone = o.customer_phone.replace(/\D/g, "");
    const fullPhone = phone.startsWith("55") ? phone : `55${phone}`;
    window.open(`https://wa.me/${fullPhone}?text=${encodeURIComponent(text)}`, "_blank");
  };

  if (!restaurantId) return <div className="p-4 md:p-8">Configure seu restaurante primeiro.</div>;

  return (
    <div className="p-4 md:p-8 h-[calc(100vh-3.5rem)] md:h-screen flex flex-col">
      <div className="mb-6 shrink-0 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="inline-flex items-center gap-2 mb-3">
            <span className="h-2 w-2 rounded-full bg-brand-orange animate-pulse" />
            <span className="text-[11px] uppercase tracking-[0.18em] font-bold text-ink/70">Ao vivo · Últimas 24h</span>
          </div>
          <h1 className="font-display text-5xl text-ink leading-[0.92] tracking-tight">
            Pedidos<span className="inline-block w-3 h-3 ml-1 -mb-0.5 bg-brand-orange align-baseline" />
          </h1>
          <p className="mt-2 text-sm text-ink/60">{orders.length} pedidos · atualização em tempo real</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={autoPrint ? "secondary" : "outline"}
            size="sm"
            onClick={() => {
              const next = !autoPrint;
              setAutoPrint(next);
              localStorage.setItem("autoPrintOrders", next ? "1" : "0");
              if (next) {
                toast.success("Impressão automática ativada — permita pop-ups neste site");
              } else {
                toast.message("Impressão automática desativada");
              }
            }}
          >
            {autoPrint ? <><PrinterCheck className="h-4 w-4 mr-1" />Auto-print ON</> : <><Printer className="h-4 w-4 mr-1" />Auto-print OFF</>}
          </Button>
          <Button variant={notifEnabled ? "secondary" : "default"} size="sm" onClick={enableNotifications}>
            {notifEnabled ? <><Bell className="h-4 w-4 mr-1" />Alertas ON</> : <><BellOff className="h-4 w-4 mr-1" />Ativar alertas</>}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto pb-2">
        <div className="flex gap-4 h-full min-w-min">
          {COLUMNS.map((col) => {
            const colOrders = orders.filter(col.match);
            // colunas dinâmicas (Aguardando retirada, Cancelados) só aparecem se tiverem cards
            if (col.dynamic && colOrders.length === 0) return null;
            return (
              <div key={col.key} className={`flex flex-col bg-background border-2 border-ink rounded-2xl overflow-hidden ${col.ring} w-[280px] shrink-0`}>
                <div className={`${col.color} text-background px-3 py-2.5 flex items-center justify-between border-b-2 border-ink`}>
                  <span className="font-display text-sm uppercase tracking-wider">{col.label}</span>
                  <span className="font-display text-base bg-ink text-background px-2 py-0.5 rounded-md min-w-[28px] text-center">
                    {colOrders.length}
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5 bg-muted/30 min-h-[200px]">
                  {colOrders.map((o) => {
                    const driver = o.driver_id ? drivers.find((d) => d.id === o.driver_id) : null;
                    const isDelivered = o.status === "delivered";
                    const isOut = o.status === "out_for_delivery";
                    const isCancelled = o.status === "cancelled";
                    const duration = isDelivered && o.updated_at ? minutesBetween(o.created_at, o.updated_at) : null;
                    return (
                      <div
                        key={o.id}
                        className={`bg-card border-2 border-ink rounded-xl p-3 cursor-pointer shadow-[3px_3px_0_0_oklch(0.15_0.02_30)] hover:shadow-[5px_5px_0_0_oklch(0.69_0.22_38)] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all ${isCancelled ? "opacity-70" : ""}`}
                        onClick={() => openOrder(o)}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-display text-lg text-ink leading-none">#{o.order_number}</span>
                          <span className="text-[10px] text-ink/50 font-bold flex items-center gap-1 uppercase tracking-wide">
                            <Clock className="h-3 w-3" />{timeAgo(o.created_at)}
                          </span>
                        </div>
                        <p className="text-sm font-bold text-ink truncate">{o.customer_name}</p>
                        <p className="text-[10px] text-ink/60 truncate uppercase tracking-wide font-bold mt-0.5">
                          {typeLabel(o.type)} · {o.payment}
                        </p>

                        {/* Bloco entregador: aparece em "Saiu" e "Entregue" */}
                        {(isOut || isDelivered) && o.type === "delivery" && (
                          <div className="mt-2 flex items-center gap-1.5 bg-ink/5 border-2 border-dashed border-ink/20 rounded-md px-2 py-1">
                            {driver ? (
                              <>
                                <Truck className="h-3 w-3 text-brand-violet" />
                                <span className="text-[10px] font-bold uppercase tracking-wide text-ink truncate">{driver.name}</span>
                                {isDelivered && duration !== null && (
                                  <span className="ml-auto text-[10px] font-display bg-success text-ink px-1.5 rounded">{duration}min</span>
                                )}
                              </>
                            ) : (
                              <>
                                <User className="h-3 w-3 text-ink/40" />
                                <span className="text-[10px] font-bold uppercase tracking-wide text-ink/50">Sem entregador</span>
                              </>
                            )}
                          </div>
                        )}

                        {/* Pickup/dine_in concluído mostra apenas duração */}
                        {isDelivered && o.type !== "delivery" && duration !== null && (
                          <div className="mt-2 flex items-center gap-1.5 bg-success/20 border-2 border-dashed border-success rounded-md px-2 py-1">
                            <CheckCircle2 className="h-3 w-3 text-ink" />
                            <span className="text-[10px] font-bold uppercase tracking-wide text-ink">Concluído em {duration}min</span>
                          </div>
                        )}

                        {isCancelled && (
                          <div className="mt-2 flex items-center gap-1.5 bg-destructive/15 border-2 border-dashed border-destructive rounded-md px-2 py-1">
                            <XCircle className="h-3 w-3 text-destructive" />
                            <span className="text-[10px] font-bold uppercase tracking-wide text-destructive">Cancelado</span>
                          </div>
                        )}

                        <div className="flex items-center justify-between mt-2.5 pt-2 border-t-2 border-dashed border-ink/15">
                          <div className="flex items-center gap-1.5">
                            <span className="font-display text-base text-brand-magenta leading-none">R$ {Number(o.total).toFixed(2)}</span>
                            {o.payment === "pix" && (
                              <span className={`text-[9px] px-1.5 py-0.5 rounded font-display border border-ink/80 ${o.payment_status === "paid" ? "bg-success text-ink" : "bg-brand-amber text-ink"}`}>
                                {o.payment_status === "paid" ? "PAGO" : "AGUARD."}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-0.5">
                            <button
                              className="h-7 w-7 grid place-items-center rounded-md hover:bg-ink hover:text-background transition-colors text-ink/70"
                              title="Imprimir"
                              onClick={(e) => { e.stopPropagation(); printOrder(o); }}
                            >
                              <Printer className="h-3.5 w-3.5" />
                            </button>
                            {NEXT_STATUS[o.status] && !isCancelled && (
                              <button
                                className="h-7 px-2 grid place-items-center rounded-md bg-brand-orange text-background hover:bg-ink transition-colors font-display text-[10px] uppercase tracking-wide gap-1 flex"
                                onClick={(e) => { e.stopPropagation(); advance(o); }}
                                title={NEXT_LABEL[o.status]}
                              >
                                {NEXT_LABEL[o.status]} <ChevronRight className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {colOrders.length === 0 && !col.dynamic && (
                    <div className="flex flex-col items-center justify-center py-10 text-ink/30">
                      <Package className="h-8 w-8 mb-2" />
                      <p className="text-[11px] uppercase tracking-wider font-bold">vazio</p>
                    </div>
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
                  <p className="flex items-center gap-2 text-muted-foreground">
                    <CreditCard className="h-3.5 w-3.5" />{selected.payment}
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${selected.payment_status === "paid" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                      {selected.payment_status === "paid" ? "PAGO" : "AGUARDANDO"}
                    </span>
                    {selected.payment_status !== "paid" && (
                      <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => markPaid(selected)}>
                        Marcar pago
                      </Button>
                    )}
                  </p>
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

                {selected.type === "delivery" && (
                  <div className="border-t pt-3">
                    <Label className="text-xs flex items-center gap-1 mb-1.5"><Truck className="h-3.5 w-3.5" />Entregador</Label>
                    <Select value={selected.driver_id ?? "none"} onValueChange={assignDriver}>
                      <SelectTrigger><SelectValue placeholder="Atribuir entregador..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">— Sem entregador —</SelectItem>
                        {drivers.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => printOrder(selected)}>
                    <Printer className="h-4 w-4 mr-1" />Imprimir
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => notifyWhatsApp(selected)}>
                    <MessageCircle className="h-4 w-4 mr-1" />WhatsApp
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => cancel(selected)}>Cancelar</Button>
                  {NEXT_STATUS[selected.status] && (
                    <Button size="sm" className="flex-1" onClick={() => advance(selected)}>
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

function minutesBetween(startIso: string, endIso: string) {
  const diff = new Date(endIso).getTime() - new Date(startIso).getTime();
  return Math.max(1, Math.round(diff / 60000));
}

function typeLabel(t: string) {
  if (t === "delivery") return "Entrega";
  if (t === "pickup") return "Retirada";
  if (t === "dine_in") return "Mesa";
  return t;
}
