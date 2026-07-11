import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { createCategory, updateCategory } from "@/lib/menu";
import { translateMenuError } from "@/lib/menu-errors";
import { useMenuCapabilities, validateMenuReason } from "@/hooks/useMenuCapabilities";
import { ReasonField } from "@/components/stock/ReasonField";

type Editing = { id: string; name: string; description: string | null } | null;

export function CategoryFormDialog({
  open, onOpenChange, restaurantId, editing, onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  restaurantId: string;
  editing: Editing;
  onSaved: () => void;
}) {
  const caps = useMenuCapabilities();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const requiresReason = caps.requiresReasonForWrites;

  useEffect(() => {
    if (open) {
      setName(editing?.name ?? "");
      setDescription(editing?.description ?? "");
      setReason("");
    }
  }, [open, editing]);

  const save = async () => {
    if (!name.trim()) return toast.error("Nome obrigatório");
    if (requiresReason) {
      const err = validateMenuReason(reason);
      if (err) return toast.error(err);
    }
    setSaving(true);
    try {
      if (editing) {
        await updateCategory({
          id: editing.id,
          name,
          description,
          reason: requiresReason ? reason : null,
        });
      } else {
        await createCategory({
          restaurantId,
          name,
          description,
          reason: requiresReason ? reason : null,
        });
      }
      toast.success(editing ? "Categoria atualizada" : "Categoria criada");
      onOpenChange(false);
      onSaved();
    } catch (e) {
      toast.error(translateMenuError(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Editar categoria" : "Nova categoria"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Nome *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Pizzas" />
          </div>
          <div>
            <Label>Descrição</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>
          {requiresReason && (
            <ReasonField
              value={reason}
              onChange={setReason}
              required
              hint="Operando via sessão de suporte assistido."
            />
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Salvando…" : "Salvar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
