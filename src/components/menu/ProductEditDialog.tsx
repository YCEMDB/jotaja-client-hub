import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { updateProductOperational } from "@/lib/menu";
import { translateMenuError } from "@/lib/menu-errors";
import { useMenuCapabilities, validateMenuReason } from "@/hooks/useMenuCapabilities";
import { ReasonField } from "@/components/stock/ReasonField";

type Cat = { id: string; name: string };
type Product = {
  id: string; name: string; description: string | null;
  category_id: string | null; image_url: string | null;
};

/**
 * Edição operacional — nunca envia preço, promoção, disponibilidade ou arquivamento.
 * Esses fluxos têm diálogos próprios.
 */
export function ProductEditDialog({
  open, onOpenChange, restaurantId, editing, categories, onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  restaurantId: string;
  editing: Product | null;
  categories: Cat[];
  onSaved: () => void;
}) {
  const caps = useMenuCapabilities();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [clearImage, setClearImage] = useState(false);
  const [reason, setReason] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const requiresReason = caps.requiresReasonForWrites;

  useEffect(() => {
    if (open && editing) {
      setName(editing.name);
      setDescription(editing.description ?? "");
      setCategoryId(editing.category_id ?? "");
      setImageUrl(editing.image_url);
      setClearImage(false);
      setReason("");
    }
  }, [open, editing]);

  const uploadImage = async (file: File) => {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${restaurantId}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("product-images").upload(path, file);
      if (error) throw error;
      const { data } = supabase.storage.from("product-images").getPublicUrl(path);
      setImageUrl(data.publicUrl);
      setClearImage(false);
    } catch (e) {
      toast.error(translateMenuError(e));
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!editing) return;
    if (!name.trim()) return toast.error("Nome obrigatório");
    if (requiresReason) {
      const err = validateMenuReason(reason);
      if (err) return toast.error(err);
    }
    setSaving(true);
    try {
      await updateProductOperational({
        id: editing.id,
        name,
        description,
        categoryId: categoryId || null,
        imageUrl: clearImage ? null : imageUrl,
        clearImage,
        reason: requiresReason ? reason : null,
      });
      toast.success("Produto atualizado");
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
          <DialogTitle>Editar produto</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <p className="text-xs text-ink/60 border-l-2 border-brand-orange pl-2">
            Este formulário altera apenas dados operacionais. Para preço, use “Alterar preço”. Para publicar/despublicar, use o interruptor. Para remover, use “Arquivar”.
          </p>
          <div className="flex gap-4 items-start">
            <div className="relative">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="h-24 w-24 rounded-md bg-muted grid place-items-center overflow-hidden border-2 border-dashed shrink-0"
              >
                {!clearImage && imageUrl ? (
                  <img src={imageUrl} alt="" className="h-full w-full object-cover" />
                ) : uploading ? (
                  <span className="text-xs">Enviando…</span>
                ) : (
                  <Upload className="h-5 w-5 text-muted-foreground" />
                )}
              </button>
              {!clearImage && imageUrl && (
                <button
                  type="button"
                  onClick={() => { setClearImage(true); setImageUrl(null); }}
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-white border grid place-items-center"
                  title="Remover imagem"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
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
                  <SelectTrigger><SelectValue placeholder="Sem categoria" /></SelectTrigger>
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
          {requiresReason && (
            <ReasonField value={reason} onChange={setReason} required />
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={save} disabled={saving || uploading}>{saving ? "Salvando…" : "Salvar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
