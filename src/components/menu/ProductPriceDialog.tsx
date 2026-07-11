import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import {
  setProductPrice, fetchProductPriceSnapshot,
} from "@/lib/menu";
import { translateMenuError, isPriceConflict } from "@/lib/menu-errors";
import { useMenuCapabilities, validateMenuReason } from "@/hooks/useMenuCapabilities";
import { ReasonField } from "@/components/stock/ReasonField";

type Product = { id: string; name: string; price: number; promo_price: number | null };

/**
 * Alteração de preço com concorrência otimista.
 * Sempre envia os valores atuais realmente carregados (sem substituir NULL por 0).
 */
export function ProductPriceDialog({
  open, onOpenChange, product, onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  product: Product | null;
  onSaved: () => void;
}) {
  const caps = useMenuCapabilities();
  const [current, setCurrent] = useState<{ price: number; promo: number | null } | null>(null);
  const [price, setPrice] = useState("");
  const [promo, setPromo] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [conflict, setConflict] = useState(false);
  const requiresReason = caps.requiresReasonForWrites;

  useEffect(() => {
    if (open && product) {
      const cur = { price: Number(product.price), promo: product.promo_price != null ? Number(product.promo_price) : null };
      setCurrent(cur);
      setPrice(cur.price.toFixed(2));
      setPromo(cur.promo != null ? cur.promo.toFixed(2) : "");
      setReason("");
      setConflict(false);
    }
  }, [open, product]);

  const reload = async () => {
    if (!product) return;
    try {
      const fresh = await fetchProductPriceSnapshot(product.id);
      if (!fresh) return;
      const cur = { price: Number(fresh.price), promo: fresh.promo_price != null ? Number(fresh.promo_price) : null };
      setCurrent(cur);
      setPrice(cur.price.toFixed(2));
      setPromo(cur.promo != null ? cur.promo.toFixed(2) : "");
      setConflict(false);
    } catch (e) {
      toast.error(translateMenuError(e));
    }
  };

  const save = async () => {
    if (!product || !current) return;
    const p = Number(price);
    if (!price || isNaN(p) || p < 0) return toast.error("Preço inválido");
    let newPromo: number | null = null;
    if (promo.trim()) {
      newPromo = Number(promo);
      if (isNaN(newPromo) || newPromo < 0 || newPromo >= p) return toast.error("Preço promocional inválido");
    }
    if (requiresReason) {
      const err = validateMenuReason(reason);
      if (err) return toast.error(err);
    }
    setSaving(true);
    try {
      await setProductPrice({
        id: product.id,
        price: p,
        promoPrice: newPromo,
        expectedCurrentPrice: current.price,
        expectedCurrentPromoPrice: current.promo,
        reason: requiresReason ? reason : null,
      });
      toast.success("Preço atualizado");
      onOpenChange(false);
      onSaved();
    } catch (e) {
      if (isPriceConflict(e)) {
        setConflict(true);
        toast.error(translateMenuError(e));
        await reload();
      } else {
        toast.error(translateMenuError(e));
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Alterar preço {product?.name ? `— ${product.name}` : ""}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {conflict && (
            <div className="flex gap-2 rounded-md border border-brand-magenta/40 bg-brand-magenta/5 p-3 text-sm">
              <AlertTriangle className="h-4 w-4 text-brand-magenta shrink-0 mt-0.5" />
              <div>
                Este preço foi alterado por outro usuário. Os valores foram atualizados; revise antes de salvar novamente.
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3 text-xs text-ink/60">
            <div>Preço atual carregado: <b>R$ {current?.price.toFixed(2) ?? "—"}</b></div>
            <div>Promoção atual carregada: <b>{current?.promo != null ? `R$ ${current.promo.toFixed(2)}` : "sem promoção"}</b></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Novo preço *</Label>
              <Input type="number" step="0.01" min="0" value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>
            <div>
              <Label>Nova promoção</Label>
              <Input
                type="number" step="0.01" min="0" value={promo}
                onChange={(e) => setPromo(e.target.value)}
                placeholder="Vazio = sem promoção"
              />
            </div>
          </div>
          {requiresReason && (
            <ReasonField value={reason} onChange={setReason} required />
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Salvando…" : "Salvar preço"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
