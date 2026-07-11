import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { createProduct } from "@/lib/menu";
import { translateMenuError } from "@/lib/menu-errors";
import { useMenuCapabilities, validateMenuReason } from "@/hooks/useMenuCapabilities";
import { ReasonField } from "@/components/stock/ReasonField";

type Cat = { id: string; name: string };

export function ProductCreateDialog({
  open, onOpenChange, restaurantId, categories, onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  restaurantId: string;
  categories: Cat[];
  onSaved: () => void;
}) {
  const caps = useMenuCapabilities();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [price, setPrice] = useState("");
  const [promoPrice, setPromoPrice] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [reason, setReason] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const requiresReason = caps.requiresReasonForWrites;

  useEffect(() => {
    if (open) {
      setName(""); setDescription(""); setPrice(""); setPromoPrice("");
      setCategoryId(categories[0]?.id ?? ""); setImageUrl(null); setReason("");
    }
  }, [open, categories]);

  const uploadImage = async (file: File) => {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${restaurantId}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("product-images").upload(path, file);
      if (error) throw error;
      const { data } = supabase.storage.from("product-images").getPublicUrl(path);
      setImageUrl(data.publicUrl);
    } catch (e) {
      toast.error(translateMenuError(e));
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!name.trim()) return toast.error("Nome obrigatório");
    const p = Number(price);
    if (!price || isNaN(p) || p < 0) return toast.error("Preço inválido");
    let promo: number | null = null;
    if (promoPrice.trim()) {
      promo = Number(promoPrice);
      if (isNaN(promo) || promo < 0 || promo >= p) return toast.error("Preço promocional inválido");
    }
    if (requiresReason) {
      const err = validateMenuReason(reason);
      if (err) return toast.error(err);
    }
    setSaving(true);
    try {
      await createProduct({
        restaurantId,
        name,
        price: p,
        promoPrice: promo,
        categoryId: categoryId || null,
        description,
        imageUrl,
        isAvailable: true,
        reason: requiresReason ? reason : null,
      });
      toast.success("Produto criado");
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
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Novo produto</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <div className="flex gap-4 items-start">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="h-24 w-24 rounded-md bg-muted grid place-items-center overflow-hidden border-2 border-dashed shrink-0"
            >
              {imageUrl ? (
                <img src={imageUrl} alt="" className="h-full w-full object-cover" />
              ) : uploading ? (
                <span className="text-xs">Enviando…</span>
              ) : (
                <Upload className="h-5 w-5 text-muted-foreground" />
              )}
            </button>
            <input
              ref={fileRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(f); }}
            />
            <div className="flex-1 space-y-3">
              <div>
                <Label>Nome *</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <Label>Categoria</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div>
            <Label>Descrição</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Preço inicial *</Label>
              <Input type="number" step="0.01" min="0" value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>
            <div>
              <Label>Preço promocional</Label>
              <Input type="number" step="0.01" min="0" value={promoPrice} onChange={(e) => setPromoPrice(e.target.value)} placeholder="Opcional" />
            </div>
          </div>
          {requiresReason && (
            <ReasonField
              value={reason}
              onChange={setReason}
              required
              hint="Criação de produto é ação administrativa — motivo registrado no log."
            />
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={save} disabled={saving || uploading}>{saving ? "Salvando…" : "Criar produto"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
