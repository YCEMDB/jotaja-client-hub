import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  MOVEMENT_LABEL,
  registerMovement,
  type StockIngredient,
  type StockMovementType,
  type StockSupplier,
} from "@/lib/stock";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  ingredient: StockIngredient | null;
  suppliers: StockSupplier[];
  defaultType?: StockMovementType;
  onSuccess?: () => void;
}

const TYPES: StockMovementType[] = ["entry", "exit", "loss", "adjust"];

export function MovementDialog({ open, onOpenChange, ingredient, suppliers, defaultType = "entry", onSuccess }: Props) {
  const [type, setType] = useState<StockMovementType>(defaultType);
  const [quantity, setQuantity] = useState("");
  const [unitCost, setUnitCost] = useState("");
  const [supplierId, setSupplierId] = useState<string>("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setType(defaultType);
      setQuantity("");
      setUnitCost("");
      setSupplierId("");
      setReason("");
    }
  }, [open, defaultType]);

  const save = async () => {
    if (!ingredient) return;
    const qty = parseFloat(quantity.replace(",", "."));
    if (Number.isNaN(qty) || qty < 0) { toast.error("Quantidade inválida"); return; }
    if (type !== "adjust" && qty === 0) { toast.error("Quantidade inválida"); return; }
    setSaving(true);
    try {
      const res = await registerMovement({
        ingredient_id: ingredient.id,
        type,
        quantity: qty,
        unit_cost: unitCost ? parseFloat(unitCost.replace(",", ".")) : null,
        supplier_id: type === "entry" && supplierId ? supplierId : null,
        reason: reason || null,
      });
      if (res.noop) {
        toast.info("Ajuste sem alteração — saldo já era esse valor");
      } else {
        toast.success(`${MOVEMENT_LABEL[type]} registrada`);
      }
      onOpenChange(false);
      onSuccess?.();
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao registrar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar movimentação</DialogTitle>
        </DialogHeader>
        {ingredient && (
          <div className="space-y-4">
            <div className="rounded-lg border-2 border-ink/10 bg-muted/40 p-3">
              <p className="text-xs uppercase tracking-wider font-bold text-ink/50">Ingrediente</p>
              <p className="font-display text-lg text-ink">{ingredient.name}</p>
              <p className="text-xs text-ink/60">Atual: {Number(ingredient.current_qty).toLocaleString("pt-BR")}</p>
            </div>

            <div>
              <Label>Tipo</Label>
              <Select value={type} onValueChange={(v) => setType(v as StockMovementType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{MOVEMENT_LABEL[t]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {type === "adjust" && (
                <p className="text-xs text-ink/50 mt-1">Ajuste define o valor final absoluto do estoque.</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{type === "adjust" ? "Novo estoque" : "Quantidade"}</Label>
                <Input inputMode="decimal" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="0" />
              </div>
              <div>
                <Label>Custo unitário</Label>
                <Input inputMode="decimal" value={unitCost} onChange={(e) => setUnitCost(e.target.value)} placeholder="0,00" disabled={type !== "entry"} />
              </div>
            </div>

            {type === "entry" && (
              <div>
                <Label>Fornecedor (opcional)</Label>
                <Select value={supplierId} onValueChange={setSupplierId}>
                  <SelectTrigger><SelectValue placeholder="Selecionar…" /></SelectTrigger>
                  <SelectContent>
                    {suppliers.filter((s) => s.is_active).map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label>Motivo / observação</Label>
              <Textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ex.: compra semanal" />
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Salvando…" : "Registrar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
