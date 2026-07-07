import { useCallback, useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import {
  Clock, Users, DollarSign, Plus, Check, X, ChevronRight,
  Receipt, ClipboardList, Activity, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import {
  getSessionDetail, openCommand, closeCommand, updateOrderStatus,
  translateTableError, NEXT_ORDER_STATUS, NEXT_ORDER_LABEL,
  type SessionDetail, type TableMapRow, type OrderStatus,
} from "@/lib/tables";
import { orderStatusLabel } from "@/lib/labels";

function fmtBRL(v: number) {
  return Number(v ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function fmtTime(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}
function fmtDateTime(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

const STATUS_TONE: Record<string, string> = {
  pending: "bg-brand-amber/15 text-brand-amber border-brand-amber/40",
  confirmed: "bg-brand-violet/15 text-brand-violet border-brand-violet/40",
  preparing: "bg-brand-orange/15 text-brand-orange border-brand-orange/40",
  ready: "bg-emerald-500/15 text-emerald-600 border-emerald-500/40",
  out_for_delivery: "bg-sky-500/15 text-sky-600 border-sky-500/40",
  delivered: "bg-emerald-500/15 text-emerald-700 border-emerald-500/40",
  cancelled: "bg-destructive/15 text-destructive border-destructive/40",
};

const EVENT_LABEL: Record<string, string> = {
  opened: "Mesa aberta",
  closed: "Mesa fechada",
  cancelled: "Sessão cancelada",
  blocked: "Mesa bloqueada",
  unblocked: "Mesa desbloqueada",
  command_opened: "Comanda criada",
  command_closed: "Comanda fechada",
  command_merged: "Comandas mescladas",
  order_added: "Pedido adicionado",
  order_removed: "Pedido removido",
  transferred: "Pedido transferido",
  merged: "Sessão mesclada",
  split: "Divisão registrada",
  forced_close: "Fechamento forçado",
};

export function SessionDetailDialog({
  table,
  open,
  onOpenChange,
  onChanged,
}: {
  table: TableMapRow | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onChanged: () => void;
}) {
  const sessionId = table?.session_id ?? null;
  const [detail, setDetail] = useState<SessionDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [newLabel, setNewLabel] = useState("");
  const [newHolder, setNewHolder] = useState("");

  const reload = useCallback(async () => {
    if (!sessionId) return;
    try {
      setLoading(true);
      const d = await getSessionDetail(sessionId);
      setDetail(d);
    } catch (e: any) {
      toast.error(translateTableError(e?.message ?? "Erro ao carregar sessão."));
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => { if (open && sessionId) reload(); }, [open, sessionId, reload]);

  // Realtime: comandas, pedidos e eventos desta sessão.
  useEffect(() => {
    if (!open || !sessionId) return;
    const ch = supabase
      .channel(`session-${sessionId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "table_commands", filter: `session_id=eq.${sessionId}` }, reload)
      .on("postgres_changes", { event: "*", schema: "public", table: "orders", filter: `table_session_id=eq.${sessionId}` }, reload)
      .on("postgres_changes", { event: "*", schema: "public", table: "table_session_events", filter: `session_id=eq.${sessionId}` }, reload)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [open, sessionId, reload]);

  const runOrderAction = async (orderId: string, next: OrderStatus, key: string, successMsg: string) => {
    try {
      setBusy(key);
      await updateOrderStatus(orderId, next);
      toast.success(successMsg);
      onChanged();
      await reload();
    } catch (e: any) {
      toast.error(e?.message ?? "Erro");
    } finally {
      setBusy(null);
    }
  };

  const advance = async (orderId: string, status: OrderStatus) => {
    // pending → confirmed → preparing em 1 clique (mesmo padrão de admin.pedidos).
    if (status === "pending") {
      try {
        setBusy(`adv-${orderId}`);
        await updateOrderStatus(orderId, "confirmed");
        await updateOrderStatus(orderId, "preparing");
        toast.success("Pedido em preparo");
        onChanged();
        await reload();
      } catch (e: any) {
        toast.error(e?.message ?? "Erro");
      } finally { setBusy(null); }
      return;
    }
    const next = NEXT_ORDER_STATUS[status];
    if (!next) return;
    await runOrderAction(orderId, next, `adv-${orderId}`, `Pedido → ${orderStatusLabel(next)}`);
  };

  const cancelOrder = async (orderId: string, num: number) => {
    if (!confirm(`Cancelar pedido #${num}?`)) return;
    await runOrderAction(orderId, "cancelled" as OrderStatus, `cancel-${orderId}`, "Pedido cancelado");
  };

  const createCommand = async () => {
    if (!sessionId) return;
    const label = newLabel.trim();
    if (label.length < 1) return toast.error("Informe um nome/número para a comanda.");
    try {
      setBusy("new-cmd");
      await openCommand(sessionId, label, newHolder.trim() || null);
      toast.success("Comanda criada");
      setNewLabel(""); setNewHolder("");
      onChanged();
      await reload();
    } catch (e: any) {
      toast.error(translateTableError(e?.message ?? "Erro"));
    } finally { setBusy(null); }
  };

  const closeCmd = async (id: string, label: string) => {
    if (!confirm(`Fechar comanda "${label}"?`)) return;
    try {
      setBusy(`cmd-${id}`);
      await closeCommand(id);
      toast.success("Comanda fechada");
      onChanged();
      await reload();
    } catch (e: any) {
      toast.error(translateTableError(e?.message ?? "Erro"));
    } finally { setBusy(null); }
  };

  if (!table) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 gap-0 max-h-[92vh] overflow-hidden flex flex-col">
        <DialogHeader className="p-5 border-b-2 border-ink/10">
          <DialogTitle className="flex items-baseline gap-2">
            <span className="text-2xl font-black">Mesa {table.number}</span>
            {table.name && <span className="text-sm font-normal text-ink/60">· {table.name}</span>}
          </DialogTitle>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink/70 pt-1">
            <span className="inline-flex items-center gap-1"><Users className="h-4 w-4" />{table.capacity} lugares</span>
            {detail?.session?.opened_at && (
              <span className="inline-flex items-center gap-1"><Clock className="h-4 w-4" />Aberta às {fmtTime(detail.session.opened_at)}</span>
            )}
            {detail?.totals && (
              <span className="inline-flex items-center gap-1 font-bold text-ink">
                <DollarSign className="h-4 w-4" />{fmtBRL(detail.totals.orders_total)} · {detail.totals.orders_count} pedido(s)
              </span>
            )}
            {detail?.session?.customer_name && <span>Cliente: {detail.session.customer_name}</span>}
          </div>
        </DialogHeader>

        {loading && !detail ? (
          <div className="flex-1 flex items-center justify-center p-10 text-ink/50">
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando sessão...
          </div>
        ) : !sessionId || !detail?.session ? (
          <div className="flex-1 flex items-center justify-center p-10 text-ink/60">
            Esta mesa não possui sessão aberta.
          </div>
        ) : (
          <Tabs defaultValue="orders" className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="mx-5 mt-4 w-fit">
              <TabsTrigger value="orders" className="gap-2">
                <Receipt className="h-4 w-4" /> Pedidos ({detail.orders.length})
              </TabsTrigger>
              <TabsTrigger value="commands" className="gap-2">
                <ClipboardList className="h-4 w-4" /> Comandas ({detail.commands.filter(c => !c.closed_at).length})
              </TabsTrigger>
              <TabsTrigger value="timeline" className="gap-2">
                <Activity className="h-4 w-4" /> Linha do tempo
              </TabsTrigger>
            </TabsList>

            {/* PEDIDOS */}
            <TabsContent value="orders" className="flex-1 overflow-hidden mt-0">
              <ScrollArea className="h-full">
                <div className="p-5 space-y-3">
                  {detail.orders.length === 0 ? (
                    <div className="rounded-xl border-2 border-dashed border-ink/15 p-8 text-center text-sm text-ink/60">
                      Nenhum pedido lançado nesta mesa ainda.
                    </div>
                  ) : detail.orders.map((o) => {
                    const cmd = detail.commands.find(c => c.id === o.command_id);
                    const isTerminal = o.status === "delivered" || o.status === "cancelled";
                    const nextLabel = NEXT_ORDER_LABEL[o.status] ?? (o.status === "pending" ? "Iniciar preparo" : null);
                    const advKey = `adv-${o.id}`;
                    const cancelKey = `cancel-${o.id}`;
                    return (
                      <div key={o.id} className="rounded-xl border-2 border-ink/10 bg-card overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-2 border-b border-ink/10 bg-ink/[.02]">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="font-black text-ink">#{o.order_number}</span>
                            <Badge variant="outline" className={cn("text-[10px] font-bold uppercase", STATUS_TONE[o.status])}>
                              {orderStatusLabel(o.status)}
                            </Badge>
                            {cmd && <span className="text-xs text-ink/60">Comanda: <b>{cmd.label}</b></span>}
                          </div>
                          <div className="text-xs text-ink/50">{fmtTime(o.created_at)}</div>
                        </div>
                        <div className="px-4 py-3 space-y-1">
                          {o.items.map((it) => (
                            <div key={it.id} className="flex justify-between text-sm">
                              <span className="text-ink/80"><b>{it.quantity}×</b> {it.name}</span>
                              <span className="text-ink/60">{fmtBRL(it.subtotal)}</span>
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center justify-between gap-2 px-4 py-2 border-t border-ink/10 bg-ink/[.02]">
                          <div className="text-sm font-bold">{fmtBRL(o.total)}</div>
                          <div className="flex gap-2">
                            {!isTerminal && (
                              <Button size="sm" variant="outline" onClick={() => cancelOrder(o.id, o.order_number)} disabled={busy === cancelKey}>
                                <X className="h-3.5 w-3.5 mr-1" /> Cancelar
                              </Button>
                            )}
                            {nextLabel && !isTerminal && (
                              <Button size="sm" onClick={() => advance(o.id, o.status)} disabled={busy === advKey}>
                                {busy === advKey ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <ChevronRight className="h-3.5 w-3.5 mr-1" />}
                                {nextLabel}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* COMANDAS */}
            <TabsContent value="commands" className="flex-1 overflow-hidden mt-0">
              <ScrollArea className="h-full">
                <div className="p-5 space-y-4">
                  <div className="rounded-xl border-2 border-ink/10 p-4 space-y-3 bg-card">
                    <div className="text-sm font-bold flex items-center gap-2"><Plus className="h-4 w-4" /> Nova comanda</div>
                    <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2">
                      <Input placeholder="Nome/número (ex: 1, João, Casal)" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} />
                      <Input placeholder="Responsável (opcional)" value={newHolder} onChange={(e) => setNewHolder(e.target.value)} />
                      <Button onClick={createCommand} disabled={busy === "new-cmd"}>
                        {busy === "new-cmd" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                        Criar
                      </Button>
                    </div>
                  </div>

                  {detail.commands.length === 0 ? (
                    <div className="rounded-xl border-2 border-dashed border-ink/15 p-8 text-center text-sm text-ink/60">
                      Nenhuma comanda nesta sessão. Pedidos ficam vinculados à mesa diretamente.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {detail.commands.map((c) => {
                        const cmdOrders = detail.orders.filter(o => o.command_id === c.id && o.status !== "cancelled");
                        const total = cmdOrders.reduce((s, o) => s + Number(o.total ?? 0), 0);
                        const isClosed = !!c.closed_at;
                        return (
                          <div key={c.id} className={cn("rounded-xl border-2 p-3 flex items-center justify-between gap-3",
                            isClosed ? "border-ink/10 bg-ink/[.02] opacity-70" : "border-ink/15 bg-card")}>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-black text-ink">{c.label}</span>
                                {isClosed && <Badge variant="outline" className="text-[10px]">Fechada</Badge>}
                              </div>
                              <div className="text-xs text-ink/60">
                                {c.holder_name ? `${c.holder_name} · ` : ""}{cmdOrders.length} pedido(s) · {fmtBRL(total)}
                              </div>
                            </div>
                            {!isClosed && (
                              <Button size="sm" variant="outline" onClick={() => closeCmd(c.id, c.label)} disabled={busy === `cmd-${c.id}`}>
                                {busy === `cmd-${c.id}` ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Check className="h-3.5 w-3.5 mr-1" />}
                                Fechar
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* TIMELINE */}
            <TabsContent value="timeline" className="flex-1 overflow-hidden mt-0">
              <ScrollArea className="h-full">
                <div className="p-5">
                  {detail.events.length === 0 ? (
                    <div className="rounded-xl border-2 border-dashed border-ink/15 p-8 text-center text-sm text-ink/60">
                      Sem eventos registrados.
                    </div>
                  ) : (
                    <ol className="relative border-l-2 border-ink/15 ml-3 space-y-4">
                      {detail.events.map((ev) => (
                        <li key={ev.id} className="pl-4 relative">
                          <span className="absolute -left-[7px] top-1.5 h-3 w-3 rounded-full bg-brand-orange border-2 border-background" />
                          <div className="text-sm font-bold text-ink">
                            {EVENT_LABEL[ev.kind] ?? ev.kind}
                          </div>
                          <div className="text-xs text-ink/60">{fmtDateTime(ev.created_at)}</div>
                          {ev.payload && Object.keys(ev.payload).length > 0 && (
                            <pre className="mt-1 text-[11px] text-ink/50 bg-ink/[.03] rounded p-2 overflow-x-auto">
                              {JSON.stringify(ev.payload, null, 0)}
                            </pre>
                          )}
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
