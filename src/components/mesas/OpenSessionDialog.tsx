import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { openTableSession, translateTableError, type TableMapRow } from "@/lib/tables";

export function OpenSessionDialog({
  table,
  open,
  onOpenChange,
  onOpened,
}: {
  table: TableMapRow | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onOpened: () => void;
}) {
  const [partySize, setPartySize] = useState<string>("");
  const [customerName, setCustomerName] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  const reset = () => { setPartySize(""); setCustomerName(""); setNotes(""); };

  const submit = async () => {
    if (!table) return;
    setBusy(true);
    try {
      await openTableSession({
        tableId: table.id,
        partySize: partySize ? Number(partySize) : null,
        customerName: customerName.trim() || null,
        notes: notes.trim() || null,
      });
      toast.success(`Mesa ${table.number} aberta.`);
      reset();
      onOpenChange(false);
      onOpened();
    } catch (e: any) {
      toast.error(translateTableError(e?.message ?? "Erro ao abrir mesa"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Abrir mesa {table?.number}
            {table?.name && <span className="text-ink/50 text-sm ml-2">· {table.name}</span>}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="party">Nº de pessoas</Label>
            <Input id="party" type="number" min={1} value={partySize} onChange={(e) => setPartySize(e.target.value)} placeholder={String(table?.capacity ?? "")} />
          </div>
          <div>
            <Label htmlFor="customer">Nome do cliente (opcional)</Label>
            <Input id="customer" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Ex: João" />
          </div>
          <div>
            <Label htmlFor="notes">Observações (opcional)</Label>
            <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Aniversário, alergia, etc." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>Cancelar</Button>
          <Button onClick={submit} disabled={busy}>
            {busy ? "Abrindo..." : "Abrir mesa"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
