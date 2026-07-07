import { useCallback, useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, ArrowRightLeft } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import {
  getTableMap, getSessionDetail, transferOrders, translateTableError,
  type SessionDetail, type TableMapRow,
} from "@/lib/tables";
import { orderStatusLabel } from "@/lib/labels";

function fmtBRL(v: number) { return Number(v ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }

export function TransferOrdersDialog({
  source, open, onOpenChange, onDone, preselectOrderIds,
}: {
  source: { sessionId: string; tableId: string; tableNumber: number; commands: SessionDetail["commands"]; orders: SessionDetail["orders"] } | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onDone: () => void;
  preselectOrderIds?: string[];
}) {
  const { restaurantId } = useAuth();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [tables, setTables] = useState<TableMapRow[]>([]);
  const [targetSession, setTargetSession] = useState<string>("");
  const [targetDetail, setTargetDetail] = useState<SessionDetail | null>(null);
  const [targetCommand, setTargetCommand] = useState<string>("none");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSelected(new Set(preselectOrderIds ?? []));
    setTargetSession(""); setTargetDetail(null); setTargetCommand("none");
    if (restaurantId) getTableMap(restaurantId).then(setTables).catch(() => {});
  }, [open, restaurantId, preselectOrderIds]);

  useEffect(() => {
    if (!targetSession) { setTargetDetail(null); return; }
    getSessionDetail(targetSession).then(setTargetDetail).catch(() => {});
  }, [targetSession]);

  const orders = source?.orders ?? [];
  const eligible = useMemo(() => orders.filter((o) => o.status !== "cancelled"), [orders]);
  const targetOptions = useMemo(
    () => tables.filter((t) => (t.ui_status === "open" || t.ui_status === "closing") && t.session_id && t.session_id !== source?.sessionId),
    [tables, source?.sessionId],
  );

  const toggle = (id: string) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const total = useMemo(() => orders.filter((o) => selected.has(o.id)).reduce((a, o) => a + Number(o.total ?? 0), 0), [orders, selected]);

  const submit = useCallback(async () => {
    if (!targetSession) return toast.error("Escolha a mesa de destino.");
    if (selected.size === 0) return toast.error("Selecione ao menos um pedido.");
    const tgt = tables.find(t => t.session_id === targetSession);
    if (!confirm(`Transferir ${selected.size} pedido(s) da mesa ${source?.tableNumber} para a mesa ${tgt?.number}?`)) return;
    try {
      setBusy(true);
      const n = await transferOrders(Array.from(selected), targetSession, targetCommand === "none" ? null : targetCommand);
      toast.success(`${n} pedido(s) transferidos para a mesa ${tgt?.number}.`);
      onOpenChange(false); onDone();
    } catch (e: any) {
      toast.error(translateTableError(e?.message ?? "Erro"));
    } finally { setBusy(false); }
  }, [targetSession, selected, tables, source?.tableNumber, targetCommand, onOpenChange, onDone]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><ArrowRightLeft className="h-5 w-5" /> Transferir pedidos</DialogTitle>
        </DialogHeader>

        <div className="rounded-xl border-2 border-ink/10 p-3 mb-3">
          <div className="text-xs uppercase font-bold tracking-wider text-ink/60 mb-1">Origem</div>
          <div className="text-sm">Mesa <b>{source?.tableNumber}</b> · {eligible.length} pedido(s) elegíveis</div>
        </div>

        <div className="space-y-2 mb-3">
          <Label>Selecione os pedidos</Label>
          <ScrollArea className="max-h-56 rounded-xl border-2 border-ink/10">
            <div className="divide-y divide-ink/5">
              {eligible.map((o) => {
                const cmd = source?.commands.find(c => c.id === o.command_id);
                return (
                  <label key={o.id} className="flex items-center gap-3 p-2 hover:bg-ink/[.03] cursor-pointer">
                    <Checkbox checked={selected.has(o.id)} onCheckedChange={() => toggle(o.id)} />
                    <div className="flex-1 min-w-0 text-sm">
                      <div className="flex items-center gap-2">
                        <b>#{o.order_number}</b>
                        <span className="text-xs text-ink/60">{orderStatusLabel(o.status)}</span>
                        {cmd && <span className="text-xs text-ink/60">· {cmd.label}</span>}
                      </div>
                      <div className="text-xs text-ink/50 truncate">{o.items.map(i => `${i.quantity}×${i.name}`).join(", ")}</div>
                    </div>
                    <div className="text-sm font-bold">{fmtBRL(Number(o.total ?? 0))}</div>
                  </label>
                );
              })}
              {eligible.length === 0 && <div className="p-4 text-sm text-ink/60 text-center">Nenhum pedido elegível.</div>}
            </div>
          </ScrollArea>
          {source?.commands && source.commands.filter(c => !c.closed_at).length > 0 && (
            <div className="text-xs text-ink/60">
              Dica: para transferir a comanda inteira, marque todos os pedidos vinculados a ela.
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <Label>Mesa destino</Label>
            <Select value={targetSession} onValueChange={setTargetSession}>
              <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>
                {targetOptions.map((t) => (
                  <SelectItem key={t.session_id!} value={t.session_id!}>Mesa {t.number}{t.name ? ` · ${t.name}` : ""}</SelectItem>
                ))}
                {targetOptions.length === 0 && <div className="p-2 text-sm text-ink/60">Nenhuma outra mesa aberta.</div>}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Comanda destino (opcional)</Label>
            <Select value={targetCommand} onValueChange={setTargetCommand} disabled={!targetDetail}>
              <SelectTrigger><SelectValue placeholder="Sem comanda" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— Sem comanda —</SelectItem>
                {(targetDetail?.commands ?? []).filter(c => !c.closed_at).map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="rounded-xl border-2 border-ink/10 p-3 text-sm flex justify-between mb-2">
          <span>{selected.size} pedido(s) selecionado(s)</span>
          <span className="font-bold">{fmtBRL(total)}</span>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>Cancelar</Button>
          <Button onClick={submit} disabled={busy || !targetSession || selected.size === 0}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <ArrowRightLeft className="h-4 w-4 mr-1" />}
            Transferir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
