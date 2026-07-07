import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { createTable, updateTable, translateTableError, type TableMapRow } from "@/lib/tables";

export function TableFormDialog({
  restaurantId,
  table,
  open,
  onOpenChange,
  onSaved,
}: {
  restaurantId: string;
  table: TableMapRow | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSaved: () => void;
}) {
  const editing = !!table;
  const [number, setNumber] = useState("");
  const [name, setName] = useState("");
  const [area, setArea] = useState("");
  const [capacity, setCapacity] = useState("2");
  const [notes, setNotes] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setNumber(table?.number ? String(table.number) : "");
      setName(table?.name ?? "");
      setArea(table?.area ?? "");
      setCapacity(String(table?.capacity ?? 2));
      setNotes("");
      setIsActive(table?.is_active ?? true);
    }
  }, [open, table]);

  const submit = async () => {
    const n = Number(number);
    if (!n || n < 1) { toast.error("Número da mesa é obrigatório."); return; }
    const cap = Math.max(1, Number(capacity) || 1);
    setBusy(true);
    try {
      if (editing && table) {
        await updateTable(table.id, {
          number: n, name: name.trim() || null, area: area.trim() || null,
          capacity: cap, is_active: isActive,
        });
        toast.success("Mesa atualizada.");
      } else {
        await createTable(restaurantId, {
          number: n, name: name.trim() || null, area: area.trim() || null,
          capacity: cap, notes: notes.trim() || null,
        });
        toast.success("Mesa criada.");
      }
      onOpenChange(false);
      onSaved();
    } catch (e: any) {
      toast.error(translateTableError(e?.message ?? "Erro ao salvar mesa"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? `Editar mesa ${table?.number}` : "Nova mesa"}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="tn">Número *</Label>
            <Input id="tn" type="number" min={1} value={number} onChange={(e) => setNumber(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="tc">Capacidade</Label>
            <Input id="tc" type="number" min={1} value={capacity} onChange={(e) => setCapacity(e.target.value)} />
          </div>
          <div className="col-span-2">
            <Label htmlFor="tname">Apelido (opcional)</Label>
            <Input id="tname" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Varanda 01" />
          </div>
          <div className="col-span-2">
            <Label htmlFor="tarea">Área (opcional)</Label>
            <Input id="tarea" value={area} onChange={(e) => setArea(e.target.value)} placeholder="Ex: Salão, Varanda, VIP" />
          </div>
          {!editing && (
            <div className="col-span-2">
              <Label htmlFor="tnotes">Observações internas</Label>
              <Input id="tnotes" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          )}
          {editing && (
            <label className="col-span-2 flex items-center gap-2 text-sm mt-1">
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
              Mesa ativa (aparece para o atendimento)
            </label>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>Cancelar</Button>
          <Button onClick={submit} disabled={busy}>{busy ? "Salvando..." : editing ? "Salvar" : "Criar mesa"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
