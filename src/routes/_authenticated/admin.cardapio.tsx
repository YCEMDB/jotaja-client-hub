import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Pencil, Trash2, Plus, Upload, ImageIcon, Sparkles, Loader2, UtensilsCrossed } from "lucide-react";
import { AdminPageLayout } from "@/components/ds";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/cardapio")({
  component: CardapioPage,
  head: () => ({ meta: [{ title: "Cardápio — Comandex" }] }),
});

type Category = { id: string; name: string; description: string | null; position: number | null; is_active: boolean | null };
type Product = {
  id: string; name: string; description: string | null; price: number;
  promo_price: number | null; image_url: string | null; category_id: string | null;
  is_available: boolean | null; position: number | null;
};

function CardapioPage() {
  const { restaurantId } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [catOpen, setCatOpen] = useState(false);
  const [editCat, setEditCat] = useState<Category | null>(null);
  const [prodOpen, setProdOpen] = useState(false);
  const [editProd, setEditProd] = useState<Product | null>(null);

  const load = async () => {
    if (!restaurantId) return;
    setLoading(true);
    const [c, p] = await Promise.all([
      supabase.from("categories").select("*").eq("restaurant_id", restaurantId).order("position"),
      supabase.from("products").select("*").eq("restaurant_id", restaurantId).order("position"),
    ]);
    setCategories(c.data ?? []);
    setProducts(p.data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [restaurantId]);

  const deleteCategory = async (id: string) => {
    if (!confirm("Excluir categoria? Os produtos ficarão sem categoria.")) return;
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Categoria excluída");
    load();
  };

  const deleteProduct = async (id: string) => {
    if (!confirm("Excluir produto?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Produto excluído");
    load();
  };

  const toggleProduct = async (p: Product) => {
    await supabase.from("products").update({ is_available: !p.is_available }).eq("id", p.id);
    load();
  };

  if (!restaurantId) return <AdminPageLayout title="Cardápio"><p className="text-ink/60">Configure seu restaurante primeiro.</p></AdminPageLayout>;

  return (
    <AdminPageLayout
      title="Cardápio"
      subtitle="Gerencie categorias e produtos"
      kicker="Operação"
      icon={UtensilsCrossed}
      accent="orange"
      actions={
        <>
          <AISuggestButton restaurantId={restaurantId} />
          <Button variant="outline" onClick={() => { setEditCat(null); setCatOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" /> Categoria
          </Button>
          <Button onClick={() => { setEditProd(null); setProdOpen(true); }} disabled={categories.length === 0}>
            <Plus className="h-4 w-4 mr-2" /> Produto
          </Button>
        </>
      }
    >

      {loading ? (
        <p className="text-muted-foreground">Carregando…</p>
      ) : categories.length === 0 ? (
        <Card className="p-12 text-center">
          <h3 className="text-lg font-semibold mb-2">Nenhuma categoria ainda</h3>
          <p className="text-muted-foreground mb-4">Crie uma categoria (ex: Pizzas, Bebidas) para começar.</p>
          <Button onClick={() => { setEditCat(null); setCatOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" /> Criar primeira categoria
          </Button>
        </Card>
      ) : (
        <div className="space-y-8">
          {categories.map((cat) => {
            const items = products.filter((p) => p.category_id === cat.id);
            return (
              <div key={cat.id}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-semibold">{cat.name}</h2>
                    <span className="text-sm text-muted-foreground">{items.length} item(s)</span>
                    {!cat.is_active && <span className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground">Inativa</span>}
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => { setEditCat(cat); setCatOpen(true); }}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => deleteCategory(cat.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {items.map((p) => (
                    <Card key={p.id} className="p-3 flex gap-3">
                      <div className="h-20 w-20 rounded-md bg-muted shrink-0 grid place-items-center overflow-hidden">
                        {p.image_url ? (
                          <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" />
                        ) : (
                          <ImageIcon className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="font-medium truncate">{p.name}</h3>
                            <p className="text-xs text-muted-foreground line-clamp-2">{p.description}</p>
                          </div>
                          <Switch checked={!!p.is_available} onCheckedChange={() => toggleProduct(p)} />
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <div className="text-sm">
                            {p.promo_price != null && (
                              <span className="text-muted-foreground line-through mr-1">R$ {Number(p.price).toFixed(2)}</span>
                            )}
                            <span className="font-semibold">R$ {Number(p.promo_price ?? p.price).toFixed(2)}</span>
                          </div>
                          <div className="flex gap-1">
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditProd(p); setProdOpen(true); }}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => deleteProduct(p.id)}>
                              <Trash2 className="h-3.5 w-3.5 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                  {items.length === 0 && (
                    <p className="text-sm text-muted-foreground col-span-full">Sem produtos nesta categoria.</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <CategoryDialog
        open={catOpen}
        onOpenChange={setCatOpen}
        editing={editCat}
        restaurantId={restaurantId}
        onSaved={load}
      />
      <ProductDialog
        open={prodOpen}
        onOpenChange={setProdOpen}
        editing={editProd}
        restaurantId={restaurantId}
        categories={categories}
        onSaved={load}
      />
    </AdminPageLayout>
  );
}

function CategoryDialog({
  open, onOpenChange, editing, restaurantId, onSaved,
}: {
  open: boolean; onOpenChange: (o: boolean) => void;
  editing: Category | null; restaurantId: string; onSaved: () => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName(editing?.name ?? "");
      setDescription(editing?.description ?? "");
      setIsActive(editing?.is_active ?? true);
    }
  }, [open, editing]);

  const save = async () => {
    if (!name.trim()) return toast.error("Nome obrigatório");
    setSaving(true);
    const payload = { name: name.trim(), description: description.trim() || null, is_active: isActive, restaurant_id: restaurantId };
    const { error } = editing
      ? await supabase.from("categories").update(payload).eq("id", editing.id)
      : await supabase.from("categories").insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(editing ? "Categoria atualizada" : "Categoria criada");
    onOpenChange(false);
    onSaved();
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
          <div className="flex items-center gap-2">
            <Switch checked={isActive} onCheckedChange={setIsActive} />
            <Label>Ativa</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Salvando…" : "Salvar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ProductDialog({
  open, onOpenChange, editing, restaurantId, categories, onSaved,
}: {
  open: boolean; onOpenChange: (o: boolean) => void;
  editing: Product | null; restaurantId: string; categories: Category[]; onSaved: () => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [promoPrice, setPromoPrice] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isAvailable, setIsAvailable] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setName(editing?.name ?? "");
      setDescription(editing?.description ?? "");
      setPrice(editing?.price ? String(editing.price) : "");
      setPromoPrice(editing?.promo_price != null ? String(editing.promo_price) : "");
      setCategoryId(editing?.category_id ?? categories[0]?.id ?? "");
      setImageUrl(editing?.image_url ?? null);
      setIsAvailable(editing?.is_available ?? true);
    }
  }, [open, editing, categories]);

  const uploadImage = async (file: File) => {
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${restaurantId}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file, { upsert: false });
    if (error) {
      toast.error(error.message);
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from("product-images").getPublicUrl(path);
    setImageUrl(data.publicUrl);
    setUploading(false);
  };

  const save = async () => {
    if (!name.trim()) return toast.error("Nome obrigatório");
    if (!price || isNaN(Number(price))) return toast.error("Preço inválido");
    setSaving(true);
    const payload = {
      name: name.trim(),
      description: description.trim() || null,
      price: Number(price),
      promo_price: promoPrice ? Number(promoPrice) : null,
      category_id: categoryId || null,
      image_url: imageUrl,
      is_available: isAvailable,
      restaurant_id: restaurantId,
    };
    const { error } = editing
      ? await supabase.from("products").update(payload).eq("id", editing.id)
      : await supabase.from("products").insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(editing ? "Produto atualizado" : "Produto criado");
    onOpenChange(false);
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{editing ? "Editar produto" : "Novo produto"}</DialogTitle>
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
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
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
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between">
              <Label>Descrição</Label>
              <AIDescriptionButton
                productName={name}
                price={price}
                onResult={setDescription}
              />
            </div>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Preço *</Label>
              <Input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>
            <div>
              <Label>Preço promocional</Label>
              <Input type="number" step="0.01" value={promoPrice} onChange={(e) => setPromoPrice(e.target.value)} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={isAvailable} onCheckedChange={setIsAvailable} />
            <Label>Disponível para venda</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={save} disabled={saving || uploading}>{saving ? "Salvando…" : "Salvar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AISuggestButton({ restaurantId }: { restaurantId: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState("");

  const generate = async () => {
    setLoading(true);
    setContent("");
    const { data: rest } = await supabase.from("restaurants").select("name,description").eq("id", restaurantId).maybeSingle();
    const { data, error } = await supabase.functions.invoke("ai-menu-suggestions", {
      body: { mode: "categories", context: { name: rest?.name ?? "", description: rest?.description ?? "" } },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    if ((data as any)?.error) return toast.error((data as any).error);
    setContent((data as any)?.content ?? "");
  };

  return (
    <>
      <Button variant="outline" onClick={() => { setOpen(true); generate(); }}>
        <Sparkles className="h-4 w-4 mr-2" /> Sugerir com IA
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-amber-500" /> Sugestões de cardápio</DialogTitle>
          </DialogHeader>
          <div className="min-h-[200px] max-h-[60vh] overflow-y-auto bg-muted/40 p-4 rounded-md text-sm whitespace-pre-wrap">
            {loading ? (
              <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Gerando sugestões…</div>
            ) : content || <span className="text-muted-foreground">Sem conteúdo</span>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={generate} disabled={loading}>Gerar novamente</Button>
            <Button onClick={() => setOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function AIDescriptionButton({ productName, price, onResult }: { productName: string; price: string; onResult: (s: string) => void }) {
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    if (!productName.trim()) return toast.error("Preencha o nome do produto primeiro");
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("ai-menu-suggestions", {
      body: { mode: "description", context: { name: productName, price } },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    if ((data as any)?.error) return toast.error((data as any).error);
    const text = ((data as any)?.content ?? "").trim();
    if (text) {
      onResult(text);
      toast.success("Descrição gerada");
    }
  };

  return (
    <Button type="button" variant="ghost" size="sm" onClick={generate} disabled={loading} className="h-7 text-xs">
      {loading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Sparkles className="h-3 w-3 mr-1 text-amber-500" />}
      Gerar com IA
    </Button>
  );
}
