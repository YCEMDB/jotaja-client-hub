import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bike, Truck, Clock, CheckCircle2, MapPin, RefreshCw, Search, Users, Circle,
} from "lucide-react";

import { AdminPageLayout, DashboardGrid, StatCard, Section, LoadingState, ErrorState, FilterBar, SearchBar, EmptyState } from "@/components/ds";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FeatureGate } from "@/components/FeatureGate";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { paymentLabel, orderStatusLabel } from "@/lib/labels";
import {
  getDeliveryDashboard, listDeliveryDrivers, listDeliveryOrders, getDriverLastLocations,
  bucketOf, type DeliveryDashboard, type DeliveryDriver, type DeliveryOrder, type DeliveryBucket,
  type DriverLastLocation,
} from "@/lib/delivery";
import { DispatchDialog } from "@/components/delivery/DispatchDialog";
import { DeliveryReports } from "@/components/delivery/DeliveryReports";

export const Route = createFileRoute("/_authenticated/admin/entregas")({
  component: EntregasGated,
  head: () => ({ meta: [{ title: "Entregas — Mesivo" }] }),
});

function EntregasGated() {
  return (
    <FeatureGate feature="drivers">
      <EntregasPage />
    </FeatureGate>
  );
}

const STATUS_COLOR: Record<string, string> = {
  pending: "bg-ink/10 text-ink",
  confirmed: "bg-sky-500/15 text-sky-700",
  preparing: "bg-brand-amber/20 text-ink",
  ready: "bg-brand-violet/15 text-brand-violet",
  out_for_delivery: "bg-brand-orange/20 text-brand-orange",
  delivered: "bg-emerald-500/15 text-emerald-700",
  cancelled: "bg-destructive/15 text-destructive",
};

const DRIVER_DOT: Record<DeliveryDriver["status"], string> = {
  available: "text-emerald-500 fill-emerald-500",
  busy: "text-amber-500 fill-amber-500",
  offline: "text-ink/30 fill-ink/30",
};

const BUCKETS: { key: DeliveryBucket; label: string; accent: string }[] = [
  { key: "awaiting",  label: "Aguardando motoboy", accent: "bg-brand-amber" },
  { key: "assigned",  label: "Motoboy atribuído",  accent: "bg-brand-violet" },
  { key: "in_route",  label: "Em rota",            accent: "bg-brand-orange" },
  { key: "delivered", label: "Entregues hoje",     accent: "bg-emerald-500" },
];

function formatTimeAgo(iso: string | null): string {
  if (!iso) return "—";
  const d = Date.now() - new Date(iso).getTime();
  const m = Math.floor(d / 60000);
  if (m < 1) return "agora";
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}min`;
}

function EntregasPage() {
  const { restaurantId } = useAuth();
  const [dashboard, setDashboard] = useState<DeliveryDashboard | null>(null);
  const [drivers, setDrivers] = useState<DeliveryDriver[]>([]);
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const [dispatchOrder, setDispatchOrder] = useState<DeliveryOrder | null>(null);
  const [dispatchOpen, setDispatchOpen] = useState(false);

  // Filtros
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [driverFilter, setDriverFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [view, setView] = useState<"kanban" | "list" | "map" | "reports">("kanban");

  const reload = useCallback(async () => {
    if (!restaurantId) return;
    try {
      setError(null);
      const [d, dr, os] = await Promise.all([
        getDeliveryDashboard(restaurantId),
        listDeliveryDrivers(restaurantId),
        listDeliveryOrders(restaurantId),
      ]);
      setDashboard(d);
      setDrivers(dr);
      setOrders(os);
    } catch (e: any) {
      setError(e?.message ?? "Erro ao carregar entregas.");
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => { reload(); }, [reload, tick]);

  // Realtime: pedidos delivery + motoboys + localizações
  useEffect(() => {
    if (!restaurantId) return;
    const channel = supabase
      .channel(`delivery-panel-${restaurantId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "orders", filter: `restaurant_id=eq.${restaurantId}` }, () => setTick((t) => t + 1))
      .on("postgres_changes", { event: "*", schema: "public", table: "delivery_drivers", filter: `restaurant_id=eq.${restaurantId}` }, () => setTick((t) => t + 1))
      .on("postgres_changes", { event: "*", schema: "public", table: "driver_locations", filter: `restaurant_id=eq.${restaurantId}` }, () => setTick((t) => t + 1))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [restaurantId]);

  // Relógio para tempos exibidos
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  const driverById = useMemo(() => {
    const m = new Map<string, DeliveryDriver>();
    drivers.forEach((d) => m.set(d.id, d));
    return m;
  }, [drivers]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      if (statusFilter !== "all" && o.status !== statusFilter) return false;
      if (driverFilter === "none" && o.driver_id) return false;
      if (driverFilter !== "all" && driverFilter !== "none" && o.driver_id !== driverFilter) return false;
      if (paymentFilter !== "all" && o.payment !== paymentFilter) return false;
      if (q) {
        const hay = `${o.order_number} ${o.customer_name} ${o.customer_phone}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [orders, search, statusFilter, driverFilter, paymentFilter]);

  const byBucket = useMemo(() => {
    const b: Record<DeliveryBucket, DeliveryOrder[]> = { awaiting: [], assigned: [], in_route: [], delivered: [] };
    for (const o of filtered) b[bucketOf(o)].push(o);
    return b;
  }, [filtered]);

  const openDispatch = (o: DeliveryOrder) => {
    setDispatchOrder(o);
    setDispatchOpen(true);
  };

  if (loading) {
    return (
      <AdminPageLayout kicker="Logística" title="Entregas" icon={Truck} accent="orange">
        <LoadingState />
      </AdminPageLayout>
    );
  }

  if (error) {
    return (
      <AdminPageLayout kicker="Logística" title="Entregas" icon={Truck} accent="orange">
        <ErrorState description={error} onRetry={() => setTick((t) => t + 1)} />
      </AdminPageLayout>
    );
  }

  const d = dashboard!;

  return (
    <AdminPageLayout
      kicker="Logística"
      title="Entregas"
      subtitle="Kanban de entregas em tempo real, dispatch e monitoramento de motoboys."
      icon={Truck}
      accent="orange"
      actions={
        <>
          <Button variant="outline" size="sm" onClick={() => setTick((t) => t + 1)}>
            <RefreshCw className="h-4 w-4 mr-2" /> Atualizar
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to="/admin/entregadores"><Users className="h-4 w-4 mr-2" /> Entregadores</Link>
          </Button>
        </>
      }
    >
      <DashboardGrid cols={4}>
        <StatCard label="Aguardando motoboy" value={d.awaiting_driver} icon={Clock} accent="amber" />
        <StatCard label="Em rota" value={d.in_route} icon={Bike} accent="orange" />
        <StatCard label="Entregues hoje" value={d.delivered_today} icon={CheckCircle2} accent="green" />
        <StatCard
          label="Motoboys"
          value={`${d.drivers_online}/${d.drivers_total}`}
          icon={Users}
          accent="violet"
          hint={`${d.drivers_available} livres · ${d.drivers_busy} ocupados`}
        />
      </DashboardGrid>

      <DashboardGrid cols={2}>
        <StatCard
          label="Tempo médio até retirada"
          value={d.avg_pickup_min != null ? `${d.avg_pickup_min} min` : "—"}
          icon={Clock}
          accent="magenta"
          hint="Do despacho até o motoboy retirar"
        />
        <StatCard
          label="Tempo médio de entrega"
          value={d.avg_delivery_min != null ? `${d.avg_delivery_min} min` : "—"}
          icon={MapPin}
          accent="blue"
          hint="Da retirada até a entrega"
        />
      </DashboardGrid>

      {/* Painel de motoboys */}
      <Section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-lg">Motoboys</h2>
          <span className="text-xs text-ink/50">{drivers.filter((x) => x.is_active).length} ativos</span>
        </div>
        {drivers.filter((x) => x.is_active).length === 0 ? (
          <p className="text-sm text-ink/60">Nenhum motoboy ativo. Cadastre em <Link to="/admin/entregadores" className="underline">Entregadores</Link>.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {drivers.filter((x) => x.is_active).map((dr) => (
              <div key={dr.id} className="flex items-center gap-2 border-2 border-ink rounded-full pl-2 pr-3 py-1 bg-card">
                <Circle className={cn("h-2.5 w-2.5", DRIVER_DOT[dr.status])} />
                <span className="text-sm font-bold">{dr.name}</span>
                {dr.status === "busy" && <Badge variant="outline" className="text-[10px]">em rota</Badge>}
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Filtros */}
      <FilterBar
        actions={
          <Tabs value={view} onValueChange={(v) => setView(v as any)}>
            <TabsList>
              <TabsTrigger value="kanban">Kanban</TabsTrigger>
              <TabsTrigger value="list">Lista</TabsTrigger>
              <TabsTrigger value="map">Mapa</TabsTrigger>
              <TabsTrigger value="reports">Relatórios</TabsTrigger>
            </TabsList>
          </Tabs>
        }
      >
        <SearchBar value={search} onChange={setSearch} placeholder="Buscar pedido, cliente ou telefone…" />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos status</SelectItem>
            <SelectItem value="pending">Novo</SelectItem>
            <SelectItem value="confirmed">Confirmado</SelectItem>
            <SelectItem value="preparing">Em preparo</SelectItem>
            <SelectItem value="ready">Pronto</SelectItem>
            <SelectItem value="out_for_delivery">Em rota</SelectItem>
            <SelectItem value="delivered">Entregue</SelectItem>
          </SelectContent>
        </Select>
        <Select value={driverFilter} onValueChange={setDriverFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Motoboy" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos motoboys</SelectItem>
            <SelectItem value="none">Sem motoboy</SelectItem>
            {drivers.map((dr) => <SelectItem key={dr.id} value={dr.id}>{dr.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={paymentFilter} onValueChange={setPaymentFilter}>
          <SelectTrigger className="w-[170px]"><SelectValue placeholder="Pagamento" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos pagamentos</SelectItem>
            <SelectItem value="cash">Dinheiro</SelectItem>
            <SelectItem value="pix">PIX</SelectItem>
            <SelectItem value="pix_online">PIX Online</SelectItem>
            <SelectItem value="card_on_delivery">Cartão na entrega</SelectItem>
            <SelectItem value="credit">Crédito</SelectItem>
            <SelectItem value="debit">Débito</SelectItem>
          </SelectContent>
        </Select>
      </FilterBar>

      {/* Views */}
      {view === "kanban" && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {BUCKETS.map((b) => (
            <div key={b.key} className="bg-card border-2 border-ink rounded-2xl shadow-[3px_3px_0_0_oklch(0.15_0.02_30)] overflow-hidden flex flex-col min-h-[280px]">
              <div className="flex items-center justify-between px-4 py-3 border-b-2 border-ink">
                <div className="flex items-center gap-2">
                  <span className={cn("h-2.5 w-2.5 rounded-full", b.accent)} />
                  <span className="font-display text-sm uppercase tracking-wider">{b.label}</span>
                </div>
                <Badge variant="outline" className="border-ink">{byBucket[b.key].length}</Badge>
              </div>
              <div className="p-3 space-y-2 flex-1 overflow-y-auto max-h-[70vh]">
                {byBucket[b.key].length === 0 ? (
                  <p className="text-xs text-ink/40 text-center py-6">—</p>
                ) : (
                  byBucket[b.key].map((o) => (
                    <OrderCard key={o.id} o={o} driver={o.driver_id ? driverById.get(o.driver_id) ?? null : null} onDispatch={() => openDispatch(o)} />
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {view === "list" && (
        <Section>
          {filtered.length === 0 ? (
            <EmptyState icon={Truck} title="Sem pedidos" description="Nenhum pedido de delivery corresponde aos filtros." />
          ) : (
            <div className="divide-y-2 divide-ink/10">
              {filtered.map((o) => {
                const dr = o.driver_id ? driverById.get(o.driver_id) : null;
                return (
                  <div key={o.id} className="py-3 flex items-center gap-3 flex-wrap">
                    <div className="font-display text-lg w-16">#{o.order_number}</div>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold truncate">{o.customer_name}</div>
                      <div className="text-xs text-ink/60 truncate">{o.customer_phone} · {paymentLabel(o.payment)}</div>
                    </div>
                    <Badge className={cn("text-xs", STATUS_COLOR[o.status] ?? "bg-ink/10 text-ink")}>
                      {orderStatusLabel(o.status)}
                    </Badge>
                    <div className="text-xs text-ink/60 min-w-[110px]">
                      {dr ? <><Bike className="inline h-3 w-3 mr-1" />{dr.name}</> : <span className="text-brand-amber font-bold">Sem motoboy</span>}
                    </div>
                    <div className="text-xs text-ink/50 min-w-[80px]">{formatTimeAgo(o.created_at)}</div>
                    <div className="font-bold text-sm">R$ {o.total.toFixed(2)}</div>
                    <Button size="sm" variant="outline" onClick={() => openDispatch(o)} disabled={o.status === "delivered" || o.status === "cancelled"}>
                      {o.driver_id ? "Trocar" : "Despachar"}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </Section>
      )}

      {view === "map" && (
        <DeliveryMapPanel restaurantId={restaurantId ?? ""} tick={tick} />
      )}

      {view === "reports" && restaurantId && (
        <DeliveryReports restaurantId={restaurantId} drivers={drivers} />
      )}

      <DispatchDialog
        open={dispatchOpen}
        onOpenChange={setDispatchOpen}
        order={dispatchOrder}
        drivers={drivers}
        onDone={() => setTick((t) => t + 1)}
      />
    </AdminPageLayout>
  );
}

interface OrderCardProps {
  o: DeliveryOrder;
  driver: DeliveryDriver | null;
  onDispatch: () => void;
}

function OrderCard({ o, driver, onDispatch }: OrderCardProps) {
  const addr = o.delivery_address as any;
  const addrStr = addr && typeof addr === "object"
    ? [addr.street, addr.number, addr.neighborhood].filter(Boolean).join(", ")
    : null;
  const done = o.status === "delivered" || o.status === "cancelled";
  return (
    <div className="border-2 border-ink rounded-xl bg-background p-3 shadow-[2px_2px_0_0_oklch(0.15_0.02_30)] hover:shadow-[4px_4px_0_0_oklch(0.15_0.02_30)] transition-shadow">
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="font-display text-lg leading-none">#{o.order_number}</div>
        <Badge className={cn("text-[10px]", STATUS_COLOR[o.status] ?? "bg-ink/10 text-ink")}>
          {orderStatusLabel(o.status)}
        </Badge>
      </div>
      <div className="text-sm font-bold truncate">{o.customer_name}</div>
      <div className="text-[11px] text-ink/60 truncate">{o.customer_phone}</div>
      {addrStr && <div className="text-[11px] text-ink/50 truncate mt-1"><MapPin className="inline h-3 w-3 mr-0.5" />{addrStr}</div>}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-ink/10 gap-2">
        <div className="text-[11px] text-ink/60">
          {driver ? (
            <span className="inline-flex items-center gap-1"><Bike className="h-3 w-3" /> {driver.name}</span>
          ) : (
            <span className="text-brand-amber font-bold">Sem motoboy</span>
          )}
        </div>
        <div className="text-xs font-bold">R$ {o.total.toFixed(2)}</div>
      </div>
      <div className="flex items-center justify-between mt-2 gap-2">
        <span className="text-[10px] text-ink/40">{paymentLabel(o.payment)} · {formatTimeAgo(o.created_at)}</span>
        <Button size="sm" variant={o.driver_id ? "outline" : "default"} className="h-7 text-xs px-2" onClick={onDispatch} disabled={done}>
          {o.driver_id ? "Trocar" : "Despachar"}
        </Button>
      </div>
    </div>
  );
}

function DeliveryMapPanel({ restaurantId, tick }: { restaurantId: string; tick: number }) {
  const [locations, setLocations] = useState<DriverLastLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!restaurantId) return;
    let alive = true;
    (async () => {
      try {
        setErr(null);
        const rows = await getDriverLastLocations(restaurantId);
        if (alive) setLocations(rows);
      } catch (e: any) {
        if (alive) setErr(e?.message ?? "Erro ao carregar posições.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [restaurantId, tick]);

  const withGps = locations.filter((l) => l.latitude != null && l.longitude != null);

  return (
    <Section>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display text-lg">Mapa de motoboys</h3>
        <span className="text-xs text-ink/50">
          {withGps.length}/{locations.length} com localização registrada
        </span>
      </div>

      <div className="grid md:grid-cols-[1fr_320px] gap-4">
        <div className="min-h-[420px] grid place-items-center border-2 border-dashed border-ink/20 rounded-xl bg-gradient-to-br from-brand-orange/5 to-brand-violet/5 p-6 text-center">
          <div className="max-w-md">
            <MapPin className="h-12 w-12 mx-auto mb-3 text-brand-orange" />
            <h4 className="font-display text-xl mb-2">Visualização em mapa</h4>
            <p className="text-sm text-ink/60">
              Integração com Google Maps / Mapbox será plugada nesta área.
              A infraestrutura de GPS já grava a última posição a cada 30 segundos
              enquanto o motoboy está em rota.
            </p>
          </div>
        </div>

        <div className="border-2 border-ink rounded-xl bg-card p-3 space-y-2 max-h-[520px] overflow-y-auto">
          <div className="font-display text-sm uppercase tracking-wider mb-1">Últimas posições</div>
          {loading && <p className="text-xs text-ink/60">Carregando…</p>}
          {err && <p className="text-xs text-destructive">{err}</p>}
          {!loading && !err && locations.length === 0 && (
            <p className="text-xs text-ink/50">Nenhum motoboy ativo.</p>
          )}
          {locations.map((l) => (
            <div key={l.id} className="border-2 border-ink/10 rounded-lg p-2 bg-background">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Circle className={cn("h-2.5 w-2.5", DRIVER_DOT[l.status])} />
                  <span className="font-bold text-sm truncate">{l.name}</span>
                </div>
                {l.active_orders > 0 && (
                  <Badge variant="outline" className="border-ink text-[10px]">
                    {l.active_orders} em rota
                  </Badge>
                )}
              </div>
              <div className="text-[11px] text-ink/60 mt-1">
                {l.latitude != null && l.longitude != null ? (
                  <>
                    <MapPin className="inline h-3 w-3 mr-0.5" />
                    {Number(l.latitude).toFixed(5)}, {Number(l.longitude).toFixed(5)}
                    <span className="text-ink/40"> · atualizado {formatTimeAgo(l.last_location_at)}</span>
                  </>
                ) : (
                  <span className="text-ink/40">Sem GPS registrado</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

