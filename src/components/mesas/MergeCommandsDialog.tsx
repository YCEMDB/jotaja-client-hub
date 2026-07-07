import { useCallback, useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Merge } from "lucide-react";
import { toast } from "sonner";
import { mergeCommands, translateTableError, type SessionDetail } from "@/lib/tables";

export function MergeCommandsDialog({
  commands, open, onOpenChange, onDone,
}: {
  commands: SessionDetail["commands"];
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onDone: () => void;
}) {
  const [source, setSource] = useState<string>("");
  const [target, setTarget] = useState<string>("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (open) { setSource(""); setTarget(""); } }, [open]);

  const openCmds = commands.filter(c => !c.closed_at);

  const submit = useCallback(async () => {
    if (!source || !target) return toast.error("Escolha origem e destino.");
    if (source === target) return toast.error("Origem e destino devem ser diferentes.");
    const src = openCmds.find(c => c.id === source);
    const tgt = openCmds.find(c => c.id === target);
    if (!confirm(`Juntar a comanda "${src?.label}" na comanda "${tgt?.label}"? A comanda "${src?.label}" será fechada.`)) return;
    try {
      setBusy(true);
      await mergeCommands(source, target);
      toast.success(`Comanda "${src?.label}" mesclada em "${tgt?.label}".`);
      onOpenChange(false); onDone();
    } catch (e: any) {
      toast.error(translateTableError(e?.message ?? "Erro"));
    } finally { setBusy(false); }
  }, [source, target, openCmds, onOpenChange, onDone]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Merge className="h-5 w-5" /> Juntar comandas</DialogTitle>
        </DialogHeader>
        {openCmds.length < 2 ? (
          <div className="rounded-xl border-2 border-dashed border-ink/15 p-6 text-center text-sm text-ink/60">
            É preciso ter pelo menos 2 comandas abertas para juntar.
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <Label>Origem (será fechada)</Label>
              <Select value={source} onValueChange={setSource}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {openCmds.map((c) => <SelectItem key={c.id} value={c.id}>{c.label}{c.holder_name ? ` · ${c.holder_name}` : ""}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Destino (recebe os pedidos)</Label>
              <Select value={target} onValueChange={setTarget}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {openCmds.filter(c => c.id !== source).map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.label}{c.holder_name ? ` · ${c.holder_name}` : ""}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>Cancelar</Button>
          <Button onClick={submit} disabled={busy || !source || !target || openCmds.length < 2}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Merge className="h-4 w-4 mr-1" />}
            Juntar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
