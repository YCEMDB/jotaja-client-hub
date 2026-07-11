import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { formatBRL, getProductRecipe, setProductRecipe, type StockIngredient } from "@/lib/stock";
import { translateStockError } from "@/lib/stock-errors";
import { useStockCapabilities, validateReason } from "@/hooks/useStockCapabilities";
import { ReasonField } from "@/components/stock/ReasonField";

interface RecipeLine {
  ingredient_id: string;
  quantity: string;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  product: { id: string; name: string; price: number; promo_price: number | null } | null;
  ingredients: StockIngredient[];
  onSaved?: () => void;
}

export function RecipeDialog({ open, onOpenChange, product, ingredients, onSaved }: Props) {
  const caps = useStockCapabilities();
  const [lines, setLines] = useState<RecipeLine[]>([]);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const ingredientById = useMemo(
    () => Object.fromEntries(ingredients.map((i) => [i.id, i])),
    [ingredients],
  );

  useEffect(() => {
    if (!open || !product) return;
    setReason("");
    setLoading(true);
    getProductRecipe(product.id)
      .then((r) => {
        setLines(
          r.items.map((it) => ({ ingredient_id: it.ingredient_id, quantity: String(it.quantity) })),
        );
      })
      .catch((e) => toast.error(translateStockError(e)))
      .finally(() => setLoading(false));
  }, [open, product]);

  const totalCost = useMemo(() => {
    return lines.reduce((acc, l) => {
      const q = parseFloat(l.quantity.replace(",", ".")) || 0;
      const c = Number(ingredientById[l.ingredient_id]?.avg_cost ?? 0);
      return acc + q * c;
    }, 0);
  }, [lines, ingredientById]);

  const sellPrice = product ? Number(product.promo_price ?? product.price) : 0;
  const marginValue = sellPrice - totalCost;
  const marginPercent = sellPrice > 0 ? (marginValue / sellPrice) * 100 : null;

  const addLine = () => setLines((l) => [...l, { ingredient_id: "", quantity: "" }]);
  const removeLine = (idx: number) => setLines((l) => l.filter((_, i) => i !== idx));
  const updateLine = (idx: number, patch: Partial<RecipeLine>) =>
    setLines((l) => l.map((row, i) => (i === idx ? { ...row, ...patch } : row)));

  const save = async () => {
    if (!product) return;
    const items: Array<{ ingredient_id: string; quantity: number }> = [];
    for (const l of lines) {
      if (!l.ingredient_id) { toast.error("Selecione o ingrediente em todas as linhas"); return; }
      const q = parseFloat(l.quantity.replace(",", "."));
      if (!q || q <= 0) { toast.error("Quantidade inválida"); return; }
      items.push({ ingredient_id: l.ingredient_id, quantity: q });
    }
    // dedupe
    const seen = new Set<string>();
    for (const it of items) {
      if (seen.has(it.ingredient_id)) { toast.error("Ingredientes duplicados na ficha"); return; }
      seen.add(it.ingredient_id);
    }
    setSaving(true);
    try {
      await setProductRecipe(product.id, items);
      toast.success("Ficha técnica salva");
      onOpenChange(false);
      onSaved?.();
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao salvar ficha");
    } finally {
      setSaving(false);
    }
  };

  const activeIngs = useMemo(() => ingredients.filter((i) => i.is_active), [ingredients]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Ficha técnica — {product?.name ?? ""}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <p className="py-8 text-center text-sm text-ink/60">Carregando…</p>
        ) : (
          <div className="space-y-4">
            {activeIngs.length === 0 && (
              <div className="rounded-lg border-2 border-brand-magenta/40 bg-brand-magenta/5 p-3 text-sm text-ink/80">
                Cadastre ingredientes ativos antes de montar a ficha.
              </div>
            )}

            <div className="space-y-2">
              <div className="grid grid-cols-[1fr_140px_40px] gap-2 px-1 text-[10px] uppercase tracking-wider font-bold text-ink/50">
                <span>Ingrediente</span>
                <span>Quantidade</span>
                <span></span>
              </div>
              {lines.length === 0 && (
                <p className="text-sm text-ink/60 py-3">Nenhum ingrediente. Adicione linhas para montar a ficha.</p>
              )}
              {lines.map((l, idx) => {
                const ing = ingredientById[l.ingredient_id];
                const unit = ing?.unit_id ? ingredients.find((i) => i.id === l.ingredient_id) : null;
                const symbol = ing ? "" : "";
                const q = parseFloat(l.quantity.replace(",", ".")) || 0;
                const lineCost = q * Number(ing?.avg_cost ?? 0);
                return (
                  <div key={idx} className="grid grid-cols-[1fr_140px_40px] gap-2 items-start">
                    <div>
                      <Select value={l.ingredient_id} onValueChange={(v) => updateLine(idx, { ingredient_id: v })}>
                        <SelectTrigger><SelectValue placeholder="Selecionar…" /></SelectTrigger>
                        <SelectContent>
                          {activeIngs.map((i) => (
                            <SelectItem key={i.id} value={i.id}>
                              {i.name} · {formatBRL(i.avg_cost)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {ing && (
                        <p className="text-[11px] text-ink/50 mt-1 px-1">
                          Custo: {formatBRL(lineCost)} · estoque {Number(ing.current_qty).toLocaleString("pt-BR")}
                        </p>
                      )}
                    </div>
                    <Input
                      inputMode="decimal"
                      value={l.quantity}
                      onChange={(e) => updateLine(idx, { quantity: e.target.value })}
                      placeholder="0"
                    />
                    <Button size="icon" variant="ghost" onClick={() => removeLine(idx)} title="Remover">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
              <Button variant="outline" size="sm" onClick={addLine} disabled={activeIngs.length === 0}>
                <Plus className="h-4 w-4 mr-2" /> Adicionar ingrediente
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-3 rounded-xl border-2 border-ink bg-muted/40 p-3">
              <div>
                <p className="text-[10px] uppercase tracking-wider font-bold text-ink/50">Custo total</p>
                <p className="font-display text-xl text-ink">{formatBRL(totalCost)}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider font-bold text-ink/50">Preço de venda</p>
                <p className="font-display text-xl text-ink">{formatBRL(sellPrice)}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider font-bold text-ink/50">Margem</p>
                <p className={`font-display text-xl ${marginValue < 0 ? "text-brand-magenta" : "text-emerald-600"}`}>
                  {formatBRL(marginValue)}
                  {marginPercent != null && (
                    <span className="text-xs ml-1 text-ink/60">({marginPercent.toFixed(1)}%)</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
          <Button onClick={save} disabled={saving || loading}>{saving ? "Salvando…" : "Salvar ficha"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
