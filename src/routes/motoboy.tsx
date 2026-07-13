import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Bike, LogOut, MapPin, Phone, Navigation, CheckCircle2, XCircle, Loader2, Package,
  Circle, DollarSign, Clock, AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { paymentLabel, orderStatusLabel } from "@/lib/labels";

export const Route = createFileRoute("/motoboy")({
  component: MotoboyApp,
  head: () => ({
    meta: [
      { title: "Motoboy — Mesivo" },
      { name: "description", content: "App do motoboy Mesivo — pedidos, rotas e ganhos." },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#ff6b35" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

// ============================================================
// Types
// ============================================================

type DriverStatus = "offline" | "available" | "busy";

interface DriverInfo {
  id: string;
  name: string;
  phone: string | null;
  vehicle: string | null;
  license_plate: string | null;
  status: DriverStatus;
  fee_per_delivery: number | null;
  commission_percent: number | null;
}

interface DriverRestaurant {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
}

interface DriverOrder {
  id: string;
  order_number: number;
  customer_name: string;
  customer_phone: string;
  status: string;
  payment: string;
  total: number;
  delivery_fee: number;
  delivery_address: any;
  notes: string | null;
  created_at: string;
  driver_assigned_at: string | null;
  driver_accepted_at: string | null;
  driver_picked_up_at: string | null;
  driver_delivered_at: string | null;
  driver_commission_amount: number | null;
}

interface DriverPayload {
  driver: DriverInfo | null;
  restaurant?: DriverRestaurant;
  orders: DriverOrder[];
  history: DriverOrder[];
}

// ============================================================
// Root
// ============================================================

function MotoboyApp() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!ready) {
    return (
      <div className="min-h-screen grid place-items-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-brand-orange" />
      </div>
    );
  }

  return session ? <DriverShell /> : <DriverLogin />;
}

// ============================================================
// Login
// ============================================================

function DriverLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (error) setError(error.message);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-orange via-brand-magenta to-brand-violet grid place-items-center p-4">
      <div className="w-full max-w-sm bg-card border-2 border-ink rounded-2xl shadow-[6px_6px_0_0_oklch(0.15_0.02_30)] p-6">
        <div className="grid place-items-center mb-4">
          <div className="h-14 w-14 rounded-2xl bg-brand-orange border-2 border-ink grid place-items-center shadow-[3px_3px_0_0_oklch(0.15_0.02_30)]">
            <Bike className="h-7 w-7 text-ink" />
          </div>
        </div>
        <h1 className="font-display text-2xl text-center text-ink">App do Motoboy</h1>
        <p className="text-xs text-center text-ink/60 mb-5">Entre com o email cadastrado pelo restaurante.</p>

        <form onSubmit={submit} className="space-y-3">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="pw">Senha</Label>
            <Input
              id="pw"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1"
            />
          </div>
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-lg p-2 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          <Button type="submit" disabled={loading} className="w-full h-11">
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Entrar
          </Button>
        </form>

        <p className="mt-4 text-[11px] text-center text-ink/50">
          Não é motoboy? <a href="/auth" className="underline">Ir para login do restaurante</a>.
        </p>
      </div>
    </div>
  );
}

// ============================================================
// Main shell (after login)
// ============================================================

function DriverShell() {
  const [data, setData] = useState<DriverPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const reload = useCallback(async () => {
    const { data: r, error } = await supabase.rpc("get_driver_assigned_orders");
    if (error) {
      setError(error.message);
    } else {
      setData((r as unknown as DriverPayload) ?? { driver: null, orders: [], history: [] });
      setError(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => { reload(); }, [reload, tick]);

  // Realtime: pedidos deste motoboy (via driver_id) + próprio registro
  useEffect(() => {
    if (!data?.driver?.id) return;
    const driverId = data.driver.id;
    const channel = supabase
      .channel(`driver-${driverId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "orders", filter: `driver_id=eq.${driverId}` }, () => setTick((t) => t + 1))
      .on("postgres_changes", { event: "*", schema: "public", table: "delivery_drivers", filter: `id=eq.${driverId}` }, () => setTick((t) => t + 1))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [data?.driver?.id]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-brand-orange" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <FullscreenMessage title="Erro" description={error ?? "Não foi possível carregar."} onSignOut={signOut} />
    );
  }

  if (!data.driver) {
    return (
      <FullscreenMessage
        title="Conta não vinculada"
        description="Sua conta ainda não foi vinculada a um cadastro de motoboy. Peça ao restaurante para vincular seu email."
        onSignOut={signOut}
      />
    );
  }

  return (
    <DriverPanel
      driver={data.driver}
      restaurant={data.restaurant ?? null}
      orders={data.orders ?? []}
      history={data.history ?? []}
      onReload={() => setTick((t) => t + 1)}
      onSignOut={signOut}
    />
  );
}

// ============================================================
// Panel
// ============================================================

function DriverPanel({
  driver, restaurant, orders, history, onReload, onSignOut,
}: {
  driver: DriverInfo;
  restaurant: DriverRestaurant | null;
  orders: DriverOrder[];
  history: DriverOrder[];
  onReload: () => void;
  onSignOut: () => void;
}) {
  const [rejecting, setRejecting] = useState<DriverOrder | null>(null);
  const [tab, setTab] = useState<"active" | "history" | "earnings">("active");
  const [geoOn, setGeoOn] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("motoboy_geo") === "on";
  });

  const inRoute = useMemo(() => orders.some((o) => o.status === "out_for_delivery"), [orders]);

  useGeolocation(geoOn && (driver.status !== "offline" || inRoute), inRoute ? orders.find((o) => o.status === "out_for_delivery")?.id ?? null : null);

  const toggleGeo = () => {
    const next = !geoOn;
    if (next && typeof navigator !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        () => {
          setGeoOn(true);
          localStorage.setItem("motoboy_geo", "on");
          toast.success("Localização ativada");
        },
        (err) => toast.error(err.message || "Permissão negada"),
        { enableHighAccuracy: true, timeout: 10000 },
      );
    } else {
      setGeoOn(false);
      localStorage.setItem("motoboy_geo", "off");
      toast("Localização desativada");
    }
  };

  const setStatus = async (s: DriverStatus) => {
    const { error } = await supabase.rpc("set_driver_status", { p_driver_id: driver.id, p_status: s });
    if (error) toast.error(error.message);
    else { toast.success(`Status: ${s === "available" ? "disponível" : s === "busy" ? "ocupado" : "offline"}`); onReload(); }
  };

  const accept = async (o: DriverOrder) => {
    const { error } = await supabase.rpc("driver_accept_order", { p_order_id: o.id });
    if (error) toast.error(error.message); else { toast.success(`Pedido #${o.order_number} aceito`); onReload(); }
  };

  const pickup = async (o: DriverOrder) => {
    const { error } = await supabase.rpc("driver_pickup_order", { p_order_id: o.id });
    if (error) toast.error(error.message);
    else {
      toast.success(`Saiu para entrega #${o.order_number}`);
      if (!geoOn) toast.info("Ative a localização para melhor rastreamento");
      onReload();
    }
  };

  const complete = async (o: DriverOrder) => {
    if (!confirm(`Confirmar entrega do pedido #${o.order_number}?`)) return;
    const { error } = await supabase.rpc("driver_complete_delivery", { p_order_id: o.id });
    if (error) toast.error(error.message); else { toast.success(`Entrega #${o.order_number} concluída!`); onReload(); }
  };

  const totalEarned = useMemo(
    () => history.reduce((sum, o) => sum + (Number(o.driver_commission_amount) || 0), 0),
    [history],
  );

  const todayEarned = useMemo(() => {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    return history
      .filter((o) => o.driver_delivered_at && new Date(o.driver_delivered_at) >= start)
      .reduce((s, o) => s + (Number(o.driver_commission_amount) || 0), 0);
  }, [history]);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-card border-b-2 border-ink px-4 py-3 shadow-[0_3px_0_0_oklch(0.15_0.02_30)]">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 shrink-0 rounded-xl bg-brand-orange border-2 border-ink grid place-items-center">
            <Bike className="h-5 w-5 text-ink" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-display text-lg leading-none truncate">{driver.name}</div>
            <div className="text-[11px] text-ink/60 truncate">{restaurant?.name ?? ""}</div>
          </div>
          <Button variant="ghost" size="icon" onClick={onSignOut} aria-label="Sair">
            <LogOut className="h-5 w-5" />
          </Button>
        </div>

        {/* Status pills */}
        <div className="mt-3 grid grid-cols-3 gap-1.5">
          {(["available", "busy", "offline"] as DriverStatus[]).map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={cn(
                "border-2 border-ink rounded-lg py-2 text-xs font-bold uppercase tracking-wide transition-all",
                driver.status === s
                  ? s === "available" ? "bg-emerald-500 text-ink shadow-[2px_2px_0_0_oklch(0.15_0.02_30)]"
                    : s === "busy" ? "bg-brand-amber text-ink shadow-[2px_2px_0_0_oklch(0.15_0.02_30)]"
                      : "bg-ink/70 text-background shadow-[2px_2px_0_0_oklch(0.15_0.02_30)]"
                  : "bg-background text-ink/60 hover:bg-ink/5",
              )}
            >
              {s === "available" ? "Disponível" : s === "busy" ? "Ocupado" : "Offline"}
            </button>
          ))}
        </div>

        {/* Geo opt-in */}
        <button
          onClick={toggleGeo}
          className={cn(
            "mt-2 w-full flex items-center gap-2 justify-center border-2 border-ink rounded-lg py-2 text-xs font-bold",
            geoOn ? "bg-brand-violet/15 text-brand-violet" : "bg-background text-ink/60",
          )}
        >
          <Navigation className="h-3.5 w-3.5" />
          {geoOn ? "Localização ligada · enviando a cada 30s" : "Ativar localização"}
        </button>
      </header>

      {/* Tabs */}
      <div className="px-4 pt-3">
        <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="active">
              Pedidos {orders.length > 0 && <Badge className="ml-1.5 h-4 px-1.5 text-[10px]">{orders.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="history">Histórico</TabsTrigger>
            <TabsTrigger value="earnings">Ganhos</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-4 space-y-3">
            {orders.length === 0 ? (
              <EmptyBlock icon={Package} title="Nenhum pedido atribuído" description="Você verá aqui os pedidos assim que o restaurante te despachar." />
            ) : (
              orders.map((o) => (
                <DriverOrderCard
                  key={o.id}
                  o={o}
                  onAccept={() => accept(o)}
                  onReject={() => setRejecting(o)}
                  onPickup={() => pickup(o)}
                  onComplete={() => complete(o)}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="history" className="mt-4 space-y-2">
            {history.length === 0 ? (
              <EmptyBlock icon={CheckCircle2} title="Sem histórico" description="Suas últimas entregas aparecerão aqui." />
            ) : (
              history.map((o) => <HistoryRow key={o.id} o={o} />)
            )}
          </TabsContent>

          <TabsContent value="earnings" className="mt-4 space-y-3">
            <EarningsPanel driver={driver} today={todayEarned} total={totalEarned} count={history.length} />
          </TabsContent>
        </Tabs>
      </div>

      <RejectDialog
        order={rejecting}
        onClose={() => setRejecting(null)}
        onDone={() => { setRejecting(null); onReload(); }}
      />
    </div>
  );
}

// ============================================================
// Order card (active)
// ============================================================

function DriverOrderCard({
  o, onAccept, onReject, onPickup, onComplete,
}: {
  o: DriverOrder;
  onAccept: () => void;
  onReject: () => void;
  onPickup: () => void;
  onComplete: () => void;
}) {
  const addr = o.delivery_address as any;
  const addrLines: string[] = [];
  if (addr && typeof addr === "object") {
    const l1 = [addr.street, addr.number].filter(Boolean).join(", ");
    if (l1) addrLines.push(l1);
    if (addr.complement) addrLines.push(addr.complement);
    const l2 = [addr.neighborhood, addr.city].filter(Boolean).join(" · ");
    if (l2) addrLines.push(l2);
    if (addr.reference) addrLines.push(`Ref: ${addr.reference}`);
  }

  const canAccept = !o.driver_accepted_at && o.status !== "out_for_delivery";
  const canPickup = !!o.driver_accepted_at && !o.driver_picked_up_at && (o.status === "ready" || o.status === "preparing");
  const canComplete = o.status === "out_for_delivery";

  const mapsUrl = addrLines.length > 0
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addrLines.join(", "))}`
    : null;

  return (
    <div className="bg-card border-2 border-ink rounded-2xl shadow-[3px_3px_0_0_oklch(0.15_0.02_30)] overflow-hidden">
      <div className="p-3 flex items-center justify-between gap-2 border-b-2 border-ink bg-gradient-to-r from-brand-orange/10 to-transparent">
        <div className="font-display text-2xl leading-none">#{o.order_number}</div>
        <Badge className="bg-brand-orange/20 text-brand-orange border-brand-orange/40">
          {orderStatusLabel(o.status)}
        </Badge>
      </div>

      <div className="p-3 space-y-3">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-ink/50 font-bold">Cliente</div>
          <div className="font-bold">{o.customer_name}</div>
          <a href={`tel:${o.customer_phone}`} className="text-sm text-brand-orange underline inline-flex items-center gap-1">
            <Phone className="h-3.5 w-3.5" /> {o.customer_phone}
          </a>
        </div>

        {addrLines.length > 0 && (
          <div>
            <div className="text-[11px] uppercase tracking-wider text-ink/50 font-bold flex items-center gap-1">
              <MapPin className="h-3 w-3" /> Endereço
            </div>
            <div className="text-sm">{addrLines.map((l, i) => <div key={i}>{l}</div>)}</div>
            {mapsUrl && (
              <a href={mapsUrl} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs text-brand-violet font-bold underline">
                <Navigation className="h-3 w-3" /> Abrir no mapa
              </a>
            )}
          </div>
        )}

        <div className="flex items-center justify-between gap-2 text-sm border-t border-ink/10 pt-2">
          <div className="text-ink/60">
            <div className="text-[11px] uppercase tracking-wider font-bold">Pagamento</div>
            <div>{paymentLabel(o.payment)}</div>
          </div>
          <div className="text-right">
            <div className="text-[11px] uppercase tracking-wider font-bold text-ink/60">Total</div>
            <div className="font-display text-lg">R$ {o.total.toFixed(2)}</div>
          </div>
        </div>

        {o.notes && (
          <div className="text-xs bg-brand-amber/15 border-l-4 border-brand-amber p-2 rounded">
            <strong>Obs:</strong> {o.notes}
          </div>
        )}
      </div>

      <div className="p-3 pt-0 grid grid-cols-2 gap-2">
        {canAccept && (
          <>
            <Button variant="outline" onClick={onReject} className="border-destructive/40 text-destructive">
              <XCircle className="h-4 w-4 mr-1" /> Recusar
            </Button>
            <Button onClick={onAccept} className="bg-emerald-500 hover:bg-emerald-600">
              <CheckCircle2 className="h-4 w-4 mr-1" /> Aceitar
            </Button>
          </>
        )}
        {canPickup && !canAccept && (
          <Button onClick={onPickup} className="col-span-2 h-11 bg-brand-orange">
            <Bike className="h-4 w-4 mr-2" /> Retirar e iniciar rota
          </Button>
        )}
        {canComplete && (
          <Button onClick={onComplete} className="col-span-2 h-11 bg-emerald-500 hover:bg-emerald-600">
            <CheckCircle2 className="h-4 w-4 mr-2" /> Finalizar entrega
          </Button>
        )}
        {!canAccept && !canPickup && !canComplete && (
          <div className="col-span-2 text-center text-xs text-ink/50 py-2">Aguardando cozinha finalizar preparo…</div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Reject dialog
// ============================================================

function RejectDialog({ order, onClose, onDone }: { order: DriverOrder | null; onClose: () => void; onDone: () => void }) {
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (order) setReason(""); }, [order]);

  const submit = async () => {
    if (!order) return;
    setSaving(true);
    const { error } = await supabase.rpc("driver_reject_order", { p_order_id: order.id, p_reason: reason.trim() || undefined });
    setSaving(false);
    if (error) toast.error(error.message);
    else { toast.success("Pedido recusado"); onDone(); }
  };

  return (
    <Dialog open={!!order} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Recusar pedido #{order?.order_number}</DialogTitle>
          <DialogDescription>Informe um motivo (opcional). O pedido volta para o admin re-atribuir.</DialogDescription>
        </DialogHeader>
        <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ex.: longe demais, moto avariada…" rows={3} />
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button onClick={submit} disabled={saving} className="bg-destructive hover:bg-destructive/90">
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Recusar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// History + Earnings
// ============================================================

function HistoryRow({ o }: { o: DriverOrder }) {
  const when = o.driver_delivered_at ? new Date(o.driver_delivered_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—";
  return (
    <div className="bg-card border-2 border-ink rounded-xl p-3 flex items-center gap-3">
      <div className="h-9 w-9 shrink-0 rounded-lg bg-emerald-500/15 border-2 border-emerald-500/40 grid place-items-center">
        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-bold truncate">#{o.order_number} · {o.customer_name}</div>
        <div className="text-[11px] text-ink/60">{when}</div>
      </div>
      <div className="text-right">
        <div className="text-[10px] uppercase text-ink/50 font-bold">Comissão</div>
        <div className="font-display text-base">R$ {(Number(o.driver_commission_amount) || 0).toFixed(2)}</div>
      </div>
    </div>
  );
}

function EarningsPanel({ driver, today, total, count }: { driver: DriverInfo; today: number; total: number; count: number }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <StatTile label="Hoje" value={`R$ ${today.toFixed(2)}`} icon={DollarSign} accent="bg-emerald-500" />
        <StatTile label="Últimas 20" value={`R$ ${total.toFixed(2)}`} icon={DollarSign} accent="bg-brand-orange" />
      </div>
      <div className="bg-card border-2 border-ink rounded-2xl p-4">
        <div className="text-[11px] uppercase tracking-wider text-ink/60 font-bold mb-2">Como você ganha</div>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span>Taxa fixa por entrega</span>
            <strong>R$ {Number(driver.fee_per_delivery ?? 0).toFixed(2)}</strong>
          </div>
          <div className="flex justify-between">
            <span>% sobre taxa de entrega</span>
            <strong>{Number(driver.commission_percent ?? 0).toFixed(0)}%</strong>
          </div>
          <div className="flex justify-between pt-2 border-t border-ink/10">
            <span>Entregas registradas</span>
            <strong>{count}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatTile({ label, value, icon: Icon, accent }: { label: string; value: string; icon: any; accent: string }) {
  return (
    <div className="bg-card border-2 border-ink rounded-2xl p-3 relative overflow-hidden shadow-[3px_3px_0_0_oklch(0.15_0.02_30)]">
      <div className={cn("absolute top-0 left-0 right-0 h-1", accent)} />
      <div className="flex items-center gap-2 mt-1">
        <Icon className="h-4 w-4 text-ink/60" />
        <span className="text-[10px] uppercase tracking-wider font-bold text-ink/60">{label}</span>
      </div>
      <div className="font-display text-xl mt-1">{value}</div>
    </div>
  );
}

function EmptyBlock({ icon: Icon, title, description }: { icon: any; title: string; description: string }) {
  return (
    <div className="bg-card border-2 border-dashed border-ink/20 rounded-2xl p-8 text-center">
      <div className="h-12 w-12 mx-auto rounded-2xl bg-ink/5 grid place-items-center mb-2">
        <Icon className="h-6 w-6 text-ink/40" />
      </div>
      <div className="font-display text-lg">{title}</div>
      <div className="text-sm text-ink/60 mt-1">{description}</div>
    </div>
  );
}

function FullscreenMessage({ title, description, onSignOut }: { title: string; description: string; onSignOut: () => void }) {
  return (
    <div className="min-h-screen grid place-items-center bg-background p-4">
      <div className="max-w-sm w-full bg-card border-2 border-ink rounded-2xl p-6 text-center shadow-[4px_4px_0_0_oklch(0.15_0.02_30)]">
        <div className="h-12 w-12 mx-auto mb-3 rounded-2xl bg-brand-amber/20 border-2 border-brand-amber grid place-items-center">
          <Circle className="h-6 w-6 text-brand-amber fill-brand-amber" />
        </div>
        <h1 className="font-display text-2xl">{title}</h1>
        <p className="text-sm text-ink/60 mt-2">{description}</p>
        <Button variant="outline" className="mt-4 w-full" onClick={onSignOut}>
          <LogOut className="h-4 w-4 mr-2" /> Sair
        </Button>
      </div>
    </div>
  );
}

// ============================================================
// Geolocation hook — envia a cada 30s quando ativo
// ============================================================

function useGeolocation(enabled: boolean, activeOrderId: string | null) {
  const lastSent = useRef<number>(0);

  useEffect(() => {
    if (!enabled) return;
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) return;

    const send = (pos: GeolocationPosition) => {
      const now = Date.now();
      if (now - lastSent.current < 25_000) return;
      lastSent.current = now;
      supabase.rpc("update_driver_location", {
        p_latitude: pos.coords.latitude,
        p_longitude: pos.coords.longitude,
        p_accuracy: pos.coords.accuracy ?? undefined,
        p_speed: pos.coords.speed ?? undefined,
        p_heading: pos.coords.heading ?? undefined,
        p_order_id: activeOrderId ?? undefined,
      });
    };

    // watchPosition streams updates; we throttle inside send
    const watchId = navigator.geolocation.watchPosition(send, () => {}, {
      enableHighAccuracy: true,
      maximumAge: 15_000,
      timeout: 30_000,
    });

    // Also fire immediately + a safety interval
    navigator.geolocation.getCurrentPosition(send, () => {}, { enableHighAccuracy: true });
    const interval = setInterval(() => {
      navigator.geolocation.getCurrentPosition(send, () => {}, { enableHighAccuracy: true });
    }, 30_000);

    return () => {
      navigator.geolocation.clearWatch(watchId);
      clearInterval(interval);
    };
  }, [enabled, activeOrderId]);
}

