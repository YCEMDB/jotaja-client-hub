import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  MOVEMENT_LABEL,
  registerMovement,
  type StockIngredient,
  type StockMovementType,
  type StockSupplier,
} from "@/lib/stock";
import { translateStockError } from "@/lib/stock-errors";
import { useStockCapabilities, validateReason } from "@/hooks/useStockCapabilities";
import { ReasonField } from "@/components/stock/ReasonField";

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
  const caps = useStockCapabilities();
  const [type, setType] = useState<StockMovementType>(defaultType);
  const [quantity, setQuantity] = useState("");
  const [unitCost, setUnitCost] = useState("");
  const [supplierId, setSupplierId] = useState<string>("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      // Se o suporte não permite ajuste, força para entry
      const initial = defaultType === "adjust" && !caps.canAdmin ? "entry" : defaultType;
      setType(initial);
      setQuantity("");
      setUnitCost("");
      setSupplierId("");
      setReason("");
    }
  }, [open, defaultType, caps.canAdmin]);

  const isAdjust = type === "adjust";
  const isAdminOp = type === "adjust" || type === "loss";
  // Motivo obrigatório: (a) sempre em suporte assistido; (b) sempre em adjust/loss (nativo);
  const reasonRequired = caps.requiresReasonForWrites || isAdminOp;

  const save = async () => {
    if (!ingredient) return;
    if (isAdjust && !caps.canAdmin) {
      toast.error("Ajuste de saldo requer nível administrativo.");
      return;
    }
    if (!caps.canWrite) {
      toast.error("Somente leitura no nível atual de suporte.");
      return;
    }
    const qty = parseFloat(quantity.replace(",", "."));
    if (!Number.isFinite(qty) || qty < 0) { toast.error("Quantidade inválida."); return; }
    if (!isAdjust && qty === 0) { toast.error("Quantidade deve ser maior que zero."); return; }

    if (reasonRequired) {
      const err = validateReason(reason);
      if (err) { toast.error(err); return; }
    }

    setSaving(true);
    try {
      const res = await registerMovement({
        ingredient_id: ingredient.id,
        type,
        quantity: qty,
        unit_cost: unitCost ? parseFloat(unitCost.replace(",", ".")) : null,
        supplier_id: type === "entry" && supplierId ? supplierId : null,
        reason: reason.trim() || null,
      });
      if (res.noop) {
        toast.info("Sem alteração — o saldo já era esse valor.");
      } else {
        toast.success(`${MOVEMENT_LABEL[type]} registrada.`);
      }
      onOpenChange(false);
      onSuccess?.();
    } catch (e) {
      toast.error(translateStockError(e));
    } finally {
      setSaving(false);
    }
  };

  const currentQty = Number(ingredient?.current_qty ?? 0);
  const previewQty = (() => {
    const q = parseFloat(quantity.replace(",", ".")) || 0;
    if (isAdjust) return q;
    if (type === "entry") return currentQty + q;
    return currentQty - q;
  })();

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
              <p className="text-xs text-ink/60">Saldo atual: {currentQty.toLocaleString("pt-BR")}</p>
            </div>

            {caps.isSupport && (
              <div className="rounded-lg border-2 border-brand-violet/40 bg-brand-violet/5 p-2 text-[11px] text-ink/70">
                Sessão de suporte ({caps.supportLevel}). Motivo próprio da operação é obrigatório.
              </div>
            )}

            <div>
              <Label>Tipo</Label>
              <Select value={type} onValueChange={(v) => setType(v as StockMovementType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TYPES.map((t) => {
                    const isAdminType = t === "adjust";
                    const disabled = isAdminType && !caps.canAdmin;
                    return (
                      <SelectItem key={t} value={t} disabled={disabled}>
                        {MOVEMENT_LABEL[t]}{disabled ? " (requer administrativo)" : ""}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              {isAdjust && (
                <p className="text-xs text-ink/60 mt-1">
                  Ajuste define o <strong>novo saldo final absoluto</strong> — não é uma soma nem subtração.
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{isAdjust ? "Novo saldo do estoque" : "Quantidade"}</Label>
                <Input
                  inputMode="decimal"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="0"
                />
                {quantity && (
                  <p className="text-[11px] text-ink/50 mt-1">
                    {isAdjust
                      ? `Saldo passará para ${previewQty.toLocaleString("pt-BR")}.`
                      : `Saldo previsto: ${previewQty.toLocaleString("pt-BR")}.`}
                  </p>
                )}
              </div>
              <div>
                <Label>Custo unitário</Label>
                <Input
                  inputMode="decimal"
                  value={unitCost}
                  onChange={(e) => setUnitCost(e.target.value)}
                  placeholder="0,00"
                  disabled={type !== "entry"}
                />
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

            <ReasonField
              value={reason}
              onChange={setReason}
              required={reasonRequired}
              placeholder={isAdjust ? "Ex.: correção pós-inventário" : "Ex.: compra semanal"}
              hint={
                isAdmin(type)
                  ? "Ajuste e Perda exigem motivo mesmo para o dono da loja."
                  : caps.isSupport
                    ? "Motivo específico da operação (não reutiliza o motivo da sessão)."
                    : undefined
              }
            />
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
          <Button onClick={save} disabled={saving || !caps.canWrite}>{saving ? "Salvando…" : "Registrar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function isAdmin(t: StockMovementType) {
  return t === "adjust" || t === "loss";
}
