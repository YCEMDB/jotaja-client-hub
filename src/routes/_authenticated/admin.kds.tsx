import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePrintQueueConsumer } from "@/hooks/usePrintQueue";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Bell, BellOff, Search, Maximize2, Minimize2, Printer, Volume2, VolumeX,
  Clock, MapPin, Package, Truck, User,
} from "lucide-react";
import { toast } from "sonner";
import { translateError } from "@/lib/error-messages";
import { playOrderBeep } from "@/lib/order-notifications";
import { paymentLabel, orderTypeLabel } from "@/lib/labels";

export const Route = createFileRoute("/_authenticated/admin/kds")({
  component: KDSPage,
  head: () => ({ meta: [{ title: "KDS — Centro de Operações — Comandex" }] }),
  errorComponent: ({ error, reset }) => {
    const err = error as Error;
    return (
      <div className="min-h-screen bg-neutral-950 text-white p-6">
        <div className="max-w-3xl mx-auto space-y-4">
          <h1 className="text-2xl font-black">KDS — erro ao carregar</h1>
          <p className="text-neutral-400">{err?.message ?? "Erro desconhecido"}</p>
          <pre className="text-xs bg-neutral-900 border border-neutral-800 rounded p-3 overflow-auto whitespace-pre-wrap">
            {err?.stack ?? String(err)}
          </pre>
          <button
            onClick={() => reset()}
            className="px-4 py-2 bg-brand-orange text-white rounded font-bold"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  },
});

type KdsStatus = "pending" | "confirmed" | "preparing" | "ready" | "out_for_delivery";
type KdsOrder = {
  id: string;
  order_number: number;
  status: KdsStatus;
  type: string;
  payment: string;
  payment_status: string;
  customer_name: string;
  customer_phone: string;
  subtotal: number;
  delivery_fee: number;
  discount: number;
  total: number;
  notes: string | null;
  delivery_address: { neighborhood?: string; street?: string } | null;
  estimated_minutes: number | null;
  created_at: string;
  items: Array<{ id: string; product_name: string; quantity: number; notes: string | null; station_id: string | null }>;
};

type Station = { id: string; name: string; color: string };
type OpsSettings = {
  sound_enabled: boolean;
  sla_green_minutes: number;
  sla_yellow_minutes: number;
  sla_red_minutes: number;
};

const COLUMNS: { key: KdsStatus; label: string; next: KdsStatus | null }[] = [
  { key: "pending", label: "NOVOS", next: "confirmed" },
  { key: "confirmed", label: "CONFIRMADOS", next: "preparing" },
  { key: "preparing", label: "EM PREPARO", next: "ready" },
  { key: "ready", label: "PRONTOS", next: "out_for_delivery" },
  { key: "out_for_delivery", label: "SAIU P/ ENTREGA", next: null },
];

function minutesSince(iso: string) {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
}

function slaClass(mins: number, s: OpsSettings) {
  if (mins >= s.sla_red_minutes + 10) return "bg-red-600 text-white animate-pulse";
  if (mins >= s.sla_red_minutes) return "bg-red-600 text-white";
  if (mins >= s.sla_yellow_minutes) return "bg-amber-500 text-black";
  return "bg-emerald-600 text-white";
}

function KDSPage() {
  const { restaurantId } = useAuth();
  const [orders, setOrders] = useState<KdsOrder[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [stationFilter, setStationFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [ops, setOps] = useState<OpsSettings>({
    sound_enabled: true, sla_green_minutes: 10, sla_yellow_minutes: 20, sla_red_minutes: 30,
  });
  const [soundOn, setSoundOn] = useState(true);
  const [tick, setTick] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const prevIds = useRef<Set<string>>(new Set());

  usePrintQueueConsumer(restaurantId);

  const load = useCallback(async () => {
    if (!restaurantId) return;
    const { data, error } = await supabase.rpc("get_kds_orders", {
      p_restaurant_id: restaurantId,
      p_station_id: stationFilter === "all" ? undefined : stationFilter,
    });
    if (error) {
      console.error("[KDS] get_kds_orders error", error);
      toast.error(`KDS: ${error.message ?? translateError(error)}`);
      return;
    }
    const list = (data ?? []) as KdsOrder[];
    // Detectar novos pedidos para tocar som
    if (prevIds.current.size > 0 && soundOn && ops.sound_enabled) {
      const newOnes = list.filter((o) => !prevIds.current.has(o.id) && o.status === "pending");
      if (newOnes.length > 0) playOrderBeep();
    }
    prevIds.current = new Set(list.map((o) => o.id));
    setOrders(list);
  }, [restaurantId, stationFilter, soundOn, ops.sound_enabled]);

  // Config + estações
  useEffect(() => {
    if (!restaurantId) return;
    supabase.from("kitchen_stations").select("id,name,color").eq("restaurant_id", restaurantId)
      .eq("is_active", true).order("position").then(({ data }) => setStations((data ?? []) as Station[]));
    supabase.from("operations_settings").select("*").eq("restaurant_id", restaurantId).maybeSingle()
      .then(({ data }) => data && setOps(data as OpsSettings));
  }, [restaurantId]);

  // Load inicial + realtime
  useEffect(() => {
    load();
    if (!restaurantId) return;
    const ch = supabase
      .channel(`kds:${restaurantId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders", filter: `restaurant_id=eq.${restaurantId}` },
        () => load(),
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "order_status_history", filter: `restaurant_id=eq.${restaurantId}` },
        () => load(),
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [restaurantId, load]);

  // Cronômetro
  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 15000);
    return () => clearInterval(t);
  }, []);

  const advance = async (id: string, next: KdsStatus | null) => {
    if (!next) return;
    const { error } = await supabase.rpc("update_order_status", {
      p_order_id: id, p_new_status: next, p_source: "kds",
    });
    if (error) toast.error(translateError(error));
    else load();
  };

  const cancel = async (id: string) => {
    if (!confirm("Cancelar este pedido?")) return;
    const { error } = await supabase.rpc("update_order_status", {
      p_order_id: id, p_new_status: "cancelled", p_source: "kds", p_reason: "cancelado no KDS",
    });
    if (error) toast.error(translateError(error));
    else load();
  };

  const reprint = async (id: string) => {
    const { error } = await supabase.rpc("enqueue_print_job", { p_order_id: id, p_event: "reprint" });
    if (error) toast.error(translateError(error));
    else toast.success("Impressão adicionada à fila");
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      if (typeFilter !== "all" && o.type !== typeFilter) return false;
      if (paymentFilter !== "all" && o.payment !== paymentFilter) return false;
      if (q) {
        const hay = `${o.order_number} ${o.customer_name} ${o.customer_phone ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [orders, typeFilter, paymentFilter, search]);

  const byColumn = useMemo(() => {
    const map = new Map<KdsStatus, KdsOrder[]>();
    COLUMNS.forEach((c) => map.set(c.key, []));
    filtered.forEach((o) => {
      if (map.has(o.status)) map.get(o.status)!.push(o);
    });
    return map;
  }, [filtered]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().then(() => setFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen?.().then(() => setFullscreen(false)).catch(() => {});
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white px-4 sm:px-6 lg:px-8 xl:px-10 py-6">
      <header className="flex flex-wrap items-center gap-3 mb-4">
        <h1 className="text-2xl font-black tracking-tight mr-auto">CENTRO DE OPERAÇÕES</h1>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-2 top-2.5 text-neutral-500" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Pedido, cliente, telefone" className="pl-8 w-64 bg-neutral-900 border-neutral-800" />
        </div>
        <Select value={stationFilter} onValueChange={setStationFilter}>
          <SelectTrigger className="w-40 bg-neutral-900 border-neutral-800"><SelectValue placeholder="Estação" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas estações</SelectItem>
            {stations.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-36 bg-neutral-900 border-neutral-800"><SelectValue placeholder="Tipo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="delivery">Delivery</SelectItem>
            <SelectItem value="pickup">Retirada</SelectItem>
            <SelectItem value="dine_in">Mesa</SelectItem>
          </SelectContent>
        </Select>
        <Select value={paymentFilter} onValueChange={setPaymentFilter}>
          <SelectTrigger className="w-36 bg-neutral-900 border-neutral-800"><SelectValue placeholder="Pagamento" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pix">PIX</SelectItem>
            <SelectItem value="cash">Dinheiro</SelectItem>
            <SelectItem value="credit">Crédito</SelectItem>
            <SelectItem value="debit">Débito</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="ghost" size="icon" onClick={() => setSoundOn((v) => !v)}
          className="text-white hover:bg-neutral-800" title={soundOn ? "Silenciar" : "Ativar som"}>
          {soundOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
        </Button>
        <Button variant="ghost" size="icon" onClick={toggleFullscreen} className="text-white hover:bg-neutral-800">
          {fullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
        </Button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-3">
        {COLUMNS.map((col) => {
          const items = byColumn.get(col.key) ?? [];
          return (
            <div key={col.key} className="bg-neutral-900 rounded-lg border border-neutral-800 flex flex-col min-h-[70vh]">
              <div className="p-3 border-b border-neutral-800 flex items-center justify-between sticky top-0 bg-neutral-900 rounded-t-lg z-10">
                <h2 className="text-sm font-black tracking-wider">{col.label}</h2>
                <Badge className="bg-neutral-800 text-white">{items.length}</Badge>
              </div>
              <div className="p-2 space-y-2 overflow-y-auto flex-1">
                {items.map((o) => {
                  const mins = minutesSince(o.created_at);
                  const sla = slaClass(mins, ops);
                  return (
                    <div key={o.id} className="bg-neutral-950 border border-neutral-800 rounded-md p-3 hover:border-brand-orange/60 transition">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-black text-lg">#{o.order_number}</div>
                        <div className={`px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1 ${sla}`}>
                          <Clock className="w-3 h-3" />{mins}min
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-neutral-400 mb-1">
                        <User className="w-3 h-3" />{o.customer_name}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-neutral-500 mb-2">
                        {o.type === "delivery" ? <><Truck className="w-3 h-3" />{orderTypeLabel(o.type)}</>
                          : o.type === "pickup" ? <><Package className="w-3 h-3" />{orderTypeLabel(o.type)}</>
                          : <><MapPin className="w-3 h-3" />{orderTypeLabel(o.type)}</>}
                        <span>·</span>
                        <span>{paymentLabel(o.payment)}</span>
                        <span>·</span>
                        <span className="font-bold text-white">R$ {Number(o.total).toFixed(2)}</span>
                      </div>
                      <ul className="text-sm space-y-0.5 mb-2 max-h-40 overflow-y-auto">
                        {o.items.map((it) => (
                          <li key={it.id} className="flex gap-2">
                            <span className="text-brand-orange font-bold">{it.quantity}×</span>
                            <span className="flex-1">{it.product_name}</span>
                          </li>
                        ))}
                      </ul>
                      {o.notes && <div className="text-xs text-amber-400 mb-2 italic">"{o.notes}"</div>}
                      <div className="flex gap-1">
                        {col.next && (
                          <Button size="sm" className="flex-1 bg-brand-orange hover:bg-brand-orange/90 text-white h-8"
                            onClick={() => advance(o.id, col.next)}>
                            Avançar
                          </Button>
                        )}
                        <Button size="sm" variant="outline" onClick={() => reprint(o.id)}
                          className="h-8 border-neutral-700 hover:bg-neutral-800" title="Reimprimir">
                          <Printer className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => cancel(o.id)}
                          className="h-8 border-red-900 text-red-400 hover:bg-red-950">
                          ✕
                        </Button>
                      </div>
                    </div>
                  );
                })}
                {items.length === 0 && (
                  <div className="text-center text-neutral-600 py-8 text-sm">Vazio</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="text-xs text-neutral-600 mt-4 text-center">
        Atualização em tempo real · {orders.length} pedidos ativos · tick {tick}
      </div>
    </div>
  );
}
