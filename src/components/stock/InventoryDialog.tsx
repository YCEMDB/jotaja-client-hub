import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { applyInventoryAdjustment, formatBRL, type StockIngredient } from "@/lib/stock";
import { translateStockError } from "@/lib/stock-errors";
import { useStockCapabilities, validateReason } from "@/hooks/useStockCapabilities";
import { ReasonField } from "@/components/stock/ReasonField";
import { toast } from "sonner";

export function InventoryDialog({ open, onOpenChange, ingredient, onSuccess }: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  ingredient: StockIngredient | null;
  onSuccess: () => void;
}) {
  const caps = useStockCapabilities();
  const [physical, setPhysical] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && ingredient) {
      setPhysical(String(ingredient.current_qty));
      setReason("");
    }
  }, [open, ingredient]);

  if (!ingredient) return null;

  const physicalNum = Number(physical.replace(",", "."));
  const delta = physicalNum - Number(ingredient.current_qty);
  const impact = delta * Number(ingredient.avg_cost);
  // Ajuste é sempre operação administrativa — motivo sempre obrigatório
  const reasonRequired = true;

  const save = async () => {
    if (!caps.canAdmin) {
      toast.error("Ajuste de inventário requer nível administrativo.");
      return;
    }
    if (!Number.isFinite(physicalNum) || physicalNum < 0) {
      toast.error("Informe uma quantidade física válida.");
      return;
    }
    const err = validateReason(reason);
    if (err) { toast.error(err); return; }

    setSaving(true);
    try {
      const id = await applyInventoryAdjustment(ingredient.id, physicalNum, reason.trim());
      toast.success(id == null ? "Sem diferença — nada ajustado." : "Inventário ajustado.");
      onOpenChange(false);
      onSuccess();
    } catch (e) {
      toast.error(translateStockError(e));
    } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Inventário físico — {ingredient.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {caps.isSupport && (
            <div className="rounded-lg border-2 border-brand-violet/40 bg-brand-violet/5 p-2 text-[11px] text-ink/70">
              Sessão de suporte ({caps.supportLevel}). Motivo próprio é obrigatório.
            </div>
          )}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-ink/60 uppercase font-bold">Sistema</p>
              <p className="font-display text-2xl">{Number(ingredient.current_qty).toLocaleString("pt-BR")}</p>
            </div>
            <div>
              <p className="text-xs text-ink/60 uppercase font-bold">Custo médio</p>
              <p className="font-display text-2xl">{formatBRL(ingredient.avg_cost)}</p>
            </div>
          </div>
          <div>
            <Label>Novo saldo do estoque (contagem física)</Label>
            <Input value={physical} onChange={(e) => setPhysical(e.target.value)} inputMode="decimal" />
            <p className="text-[11px] text-ink/50 mt-1">
              Este valor é o <strong>saldo final absoluto</strong>. A diferença vira uma movimentação de ajuste.
            </p>
          </div>
          <ReasonField
            value={reason}
            onChange={setReason}
            required={reasonRequired}
            placeholder="Ex.: contagem semanal 07/07"
          />
          {Number.isFinite(physicalNum) && (
            <div className={`rounded-xl border-2 border-ink p-3 ${delta === 0 ? "bg-muted/30" : delta > 0 ? "bg-emerald-500/10" : "bg-brand-magenta/10"}`}>
              <p className="text-xs uppercase font-bold text-ink/60">Ajuste</p>
              <p className="font-display text-lg">
                {delta > 0 ? "+" : ""}{delta.toLocaleString("pt-BR")} · {formatBRL(impact)}
              </p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={save} disabled={saving || !caps.canAdmin}>{saving ? "Salvando…" : "Aplicar ajuste"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
