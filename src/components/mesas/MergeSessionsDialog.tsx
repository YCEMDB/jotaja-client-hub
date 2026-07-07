import { useCallback, useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Combine } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { getTableMap, mergeSessions, translateTableError, type TableMapRow } from "@/lib/tables";

export function MergeSessionsDialog({
  source, open, onOpenChange, onDone,
}: {
  source: { sessionId: string; tableNumber: number } | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onDone: () => void;
}) {
  const { restaurantId } = useAuth();
  const [tables, setTables] = useState<TableMapRow[]>([]);
  const [target, setTarget] = useState<string>("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open || !restaurantId) return;
    setTarget("");
    getTableMap(restaurantId).then(setTables).catch(() => {});
  }, [open, restaurantId]);

  const options = useMemo(
    () => tables.filter(t => t.ui_status === "open" && t.session_id && t.session_id !== source?.sessionId),
    [tables, source?.sessionId],
  );

  const submit = useCallback(async () => {
    if (!source?.sessionId || !target) return;
    const tgt = tables.find(t => t.session_id === target);
    if (!confirm(`Juntar mesa ${source.tableNumber} na mesa ${tgt?.number}? A mesa ${source.tableNumber} será encerrada como mesclada — pedidos e comandas migram, nada é apagado.`)) return;
    try {
      setBusy(true);
      await mergeSessions(source.sessionId, target);
      toast.success(`Mesas mescladas na mesa ${tgt?.number}.`);
      onOpenChange(false); onDone();
    } catch (e: any) {
      toast.error(translateTableError(e?.message ?? "Erro"));
    } finally { setBusy(false); }
  }, [source, target, tables, onOpenChange, onDone]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Combine className="h-5 w-5" /> Juntar mesas</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="rounded-xl border-2 border-ink/10 p-3 text-sm">
            Mesa <b>{source?.tableNumber}</b> será fechada como <b>mesclada</b> e todos os pedidos e comandas migram para a mesa de destino. Nada é apagado; a timeline registra o merge.
          </div>
          <div>
            <Label>Mesa destino</Label>
            <Select value={target} onValueChange={setTarget}>
              <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>
                {options.map((t) => (
                  <SelectItem key={t.session_id!} value={t.session_id!}>Mesa {t.number}{t.name ? ` · ${t.name}` : ""}</SelectItem>
                ))}
                {options.length === 0 && <div className="p-2 text-sm text-ink/60">Nenhuma outra mesa aberta.</div>}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>Cancelar</Button>
          <Button onClick={submit} disabled={busy || !target}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Combine className="h-4 w-4 mr-1" />}
            Juntar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
