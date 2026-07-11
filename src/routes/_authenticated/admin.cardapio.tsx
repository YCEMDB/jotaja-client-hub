import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Pencil, Plus, ImageIcon, Sparkles, Loader2, UtensilsCrossed,
  Archive, ArchiveRestore, DollarSign, Info,
} from "lucide-react";
import { AdminPageLayout } from "@/components/ds";
import { toast } from "sonner";
import { setProductAvailability } from "@/lib/menu";
import { translateMenuError } from "@/lib/menu-errors";
import { useMenuCapabilities } from "@/hooks/useMenuCapabilities";
import { CategoryFormDialog } from "@/components/menu/CategoryFormDialog";
import { ProductCreateDialog } from "@/components/menu/ProductCreateDialog";
import { ProductEditDialog } from "@/components/menu/ProductEditDialog";
import { ProductPriceDialog } from "@/components/menu/ProductPriceDialog";
import { ArchiveConfirmDialog } from "@/components/menu/ArchiveConfirmDialog";

export const Route = createFileRoute("/_authenticated/admin/cardapio")({
  component: CardapioPage,
  head: () => ({ meta: [{ title: "Cardápio — Comandex" }] }),
});

type Category = {
  id: string; name: string; description: string | null;
  position: number | null; is_active: boolean | null;
  archived_at: string | null;
};
type Product = {
  id: string; name: string; description: string | null; price: number;
  promo_price: number | null; image_url: string | null; category_id: string | null;
  is_available: boolean | null; position: number | null;
  archived_at: string | null;
};

type Tab = "ativos" | "arquivados";

function CardapioPage() {
  const { restaurantId } = useAuth();
  const caps = useMenuCapabilities();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("ativos");

  // Dialog state
  const [catFormOpen, setCatFormOpen] = useState(false);
  const [catEditing, setCatEditing] = useState<Category | null>(null);

  const [prodCreateOpen, setProdCreateOpen] = useState(false);
  const [prodEditOpen, setProdEditOpen] = useState(false);
  const [prodEditing, setProdEditing] = useState<Product | null>(null);

  const [priceOpen, setPriceOpen] = useState(false);
  const [priceProduct, setPriceProduct] = useState<Product | null>(null);

  const [archiveOpen, setArchiveOpen] = useState(false);
  const [archiveKind, setArchiveKind] = useState<"category" | "product">("product");
  const [archiveMode, setArchiveMode] = useState<"archive" | "restore">("archive");
  const [archiveTarget, setArchiveTarget] = useState<{ id: string; name: string } | null>(null);

  const load = async () => {
    if (!restaurantId) return;
    setLoading(true);
    const [c, p] = await Promise.all([
      supabase.from("categories").select("*").eq("restaurant_id", restaurantId).order("position"),
      supabase.from("products").select("*").eq("restaurant_id", restaurantId).order("position"),
    ]);
    setCategories((c.data as Category[] | null) ?? []);
    setProducts((p.data as Product[] | null) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [restaurantId]);

  const activeCategories = useMemo(() => categories.filter((c) => !c.archived_at), [categories]);
  const archivedCategories = useMemo(() => categories.filter((c) => !!c.archived_at), [categories]);
  const activeProducts = useMemo(() => products.filter((p) => !p.archived_at), [products]);
  const archivedProducts = useMemo(() => products.filter((p) => !!p.archived_at), [products]);

  const toggleAvailability = async (p: Product) => {
    try {
      await setProductAvailability({ id: p.id, isAvailable: !p.is_available });
      load();
    } catch (e) {
      toast.error(translateMenuError(e));
    }
  };

  const openArchive = (kind: "category" | "product", mode: "archive" | "restore", target: { id: string; name: string }) => {
    setArchiveKind(kind);
    setArchiveMode(mode);
    setArchiveTarget(target);
    setArchiveOpen(true);
  };

  if (!restaurantId) {
    return <AdminPageLayout title="Cardápio"><p className="text-ink/60">Configure seu restaurante primeiro.</p></AdminPageLayout>;
  }

  const readOnly = !caps.canWriteOperational;

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
          <Button
            variant="outline"
            onClick={() => { setCatEditing(null); setCatFormOpen(true); }}
            disabled={!caps.canWriteOperational}
            title={readOnly ? "Nível de acesso não permite" : undefined}
          >
            <Plus className="h-4 w-4 mr-2" /> Categoria
          </Button>
          <Button
            onClick={() => setProdCreateOpen(true)}
            disabled={!caps.canAdmin || activeCategories.length === 0}
            title={
              !caps.canAdmin
                ? "Criar produto exige nível administrativo"
                : activeCategories.length === 0
                  ? "Crie uma categoria ativa primeiro"
                  : undefined
            }
          >
            <Plus className="h-4 w-4 mr-2" /> Produto
          </Button>
        </>
      }
    >
      {caps.isSupport && (
        <div className="mb-4 flex gap-2 rounded-md border border-brand-orange/40 bg-brand-orange/5 p-3 text-sm">
          <Info className="h-4 w-4 text-brand-orange shrink-0 mt-0.5" />
          <div>
            Sessão de suporte assistido — nível <b>{caps.supportLevel}</b>. Toda escrita exige motivo próprio; ações administrativas exigem nível <b>administrative</b>.
          </div>
        </div>
      )}

      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)} className="mb-4">
        <TabsList>
          <TabsTrigger value="ativos">
            Ativos
            <span className="ml-2 text-xs text-ink/50">{activeCategories.length}c · {activeProducts.length}p</span>
          </TabsTrigger>
          <TabsTrigger value="arquivados">
            Arquivados
            <span className="ml-2 text-xs text-ink/50">{archivedCategories.length}c · {archivedProducts.length}p</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ativos" className="mt-4">
          {loading ? (
            <p className="text-muted-foreground">Carregando…</p>
          ) : activeCategories.length === 0 ? (
            <Card className="p-12 text-center">
              <h3 className="text-lg font-semibold mb-2">Nenhuma categoria ativa</h3>
              <p className="text-muted-foreground mb-4">Crie uma categoria (ex: Pizzas, Bebidas) para começar.</p>
              <Button
                disabled={!caps.canWriteOperational}
                onClick={() => { setCatEditing(null); setCatFormOpen(true); }}
              >
                <Plus className="h-4 w-4 mr-2" /> Criar primeira categoria
              </Button>
            </Card>
          ) : (
            <div className="space-y-8">
              {activeCategories.map((cat) => {
                const items = activeProducts.filter((p) => p.category_id === cat.id);
                return (
                  <div key={cat.id}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <h2 className="text-xl font-semibold">{cat.name}</h2>
                        <span className="text-sm text-muted-foreground">{items.length} item(s)</span>
                        {!cat.is_active && <Badge variant="secondary">Inativa</Badge>}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm" variant="ghost"
                          disabled={!caps.canWriteOperational}
                          onClick={() => { setCatEditing(cat); setCatFormOpen(true); }}
                        >
                          <Pencil className="h-4 w-4 mr-1" /> Editar
                        </Button>
                        <Button
                          size="sm" variant="ghost"
                          disabled={!caps.canAdmin}
                          onClick={() => openArchive("category", "archive", { id: cat.id, name: cat.name })}
                          title={!caps.canAdmin ? "Arquivar exige nível administrativo" : undefined}
                        >
                          <Archive className="h-4 w-4 mr-1" /> Arquivar
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {items.map((p) => (
                        <ProductCard
                          key={p.id} product={p} caps={caps}
                          onToggle={() => toggleAvailability(p)}
                          onEdit={() => { setProdEditing(p); setProdEditOpen(true); }}
                          onPrice={() => { setPriceProduct(p); setPriceOpen(true); }}
                          onArchive={() => openArchive("product", "archive", { id: p.id, name: p.name })}
                        />
                      ))}
                      {items.length === 0 && (
                        <p className="text-sm text-muted-foreground col-span-full">Sem produtos nesta categoria.</p>
                      )}
                    </div>
                  </div>
                );
              })}
              {activeProducts.some((p) => !p.category_id) && (
                <div>
                  <h2 className="text-xl font-semibold mb-3">Sem categoria</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {activeProducts.filter((p) => !p.category_id).map((p) => (
                      <ProductCard
                        key={p.id} product={p} caps={caps}
                        onToggle={() => toggleAvailability(p)}
                        onEdit={() => { setProdEditing(p); setProdEditOpen(true); }}
                        onPrice={() => { setPriceProduct(p); setPriceOpen(true); }}
                        onArchive={() => openArchive("product", "archive", { id: p.id, name: p.name })}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="arquivados" className="mt-4">
          <ArchivedList
            categories={archivedCategories}
            products={archivedProducts}
            canRestore={caps.canAdmin}
            onRestoreCategory={(c) => openArchive("category", "restore", { id: c.id, name: c.name })}
            onRestoreProduct={(p) => openArchive("product", "restore", { id: p.id, name: p.name })}
          />
        </TabsContent>
      </Tabs>

      <CategoryFormDialog
        open={catFormOpen}
        onOpenChange={setCatFormOpen}
        restaurantId={restaurantId}
        editing={catEditing ? { id: catEditing.id, name: catEditing.name, description: catEditing.description } : null}
        onSaved={load}
      />
      <ProductCreateDialog
        open={prodCreateOpen}
        onOpenChange={setProdCreateOpen}
        restaurantId={restaurantId}
        categories={activeCategories.map((c) => ({ id: c.id, name: c.name }))}
        onSaved={load}
      />
      <ProductEditDialog
        open={prodEditOpen}
        onOpenChange={setProdEditOpen}
        restaurantId={restaurantId}
        editing={prodEditing}
        categories={activeCategories.map((c) => ({ id: c.id, name: c.name }))}
        onSaved={load}
      />
      <ProductPriceDialog
        open={priceOpen}
        onOpenChange={setPriceOpen}
        product={priceProduct}
        onSaved={load}
      />
      <ArchiveConfirmDialog
        open={archiveOpen}
        onOpenChange={setArchiveOpen}
        kind={archiveKind}
        mode={archiveMode}
        id={archiveTarget?.id ?? null}
        name={archiveTarget?.name ?? ""}
        onDone={load}
      />
    </AdminPageLayout>
  );
}

function ProductCard({
  product: p, caps, onToggle, onEdit, onPrice, onArchive,
}: {
  product: Product;
  caps: ReturnType<typeof useMenuCapabilities>;
  onToggle: () => void;
  onEdit: () => void;
  onPrice: () => void;
  onArchive: () => void;
}) {
  return (
    <Card className="p-3 flex gap-3">
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
          <Switch
            checked={!!p.is_available}
            onCheckedChange={onToggle}
            disabled={!caps.canWriteOperational}
          />
        </div>
        <div className="flex items-center justify-between mt-2">
          <div className="text-sm">
            {p.promo_price != null && (
              <span className="text-muted-foreground line-through mr-1">R$ {Number(p.price).toFixed(2)}</span>
            )}
            <span className="font-semibold">R$ {Number(p.promo_price ?? p.price).toFixed(2)}</span>
          </div>
          <div className="flex gap-1">
            <Button
              size="icon" variant="ghost" className="h-7 w-7"
              disabled={!caps.canWriteOperational}
              onClick={onEdit}
              title="Editar informações"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="icon" variant="ghost" className="h-7 w-7"
              disabled={!caps.canAdmin}
              onClick={onPrice}
              title={!caps.canAdmin ? "Alterar preço exige nível administrativo" : "Alterar preço"}
            >
              <DollarSign className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="icon" variant="ghost" className="h-7 w-7"
              disabled={!caps.canAdmin}
              onClick={onArchive}
              title={!caps.canAdmin ? "Arquivar exige nível administrativo" : "Arquivar"}
            >
              <Archive className="h-3.5 w-3.5 text-destructive" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

function ArchivedList({
  categories, products, canRestore, onRestoreCategory, onRestoreProduct,
}: {
  categories: Category[];
  products: Product[];
  canRestore: boolean;
  onRestoreCategory: (c: Category) => void;
  onRestoreProduct: (p: Product) => void;
}) {
  if (categories.length === 0 && products.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum registro arquivado.</p>;
  }
  return (
    <div className="space-y-8">
      {categories.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Categorias arquivadas</h2>
          <div className="space-y-2">
            {categories.map((c) => (
              <Card key={c.id} className="p-3 flex items-center justify-between opacity-70">
                <div className="flex items-center gap-3">
                  <Badge variant="outline">Arquivada</Badge>
                  <span className="font-medium">{c.name}</span>
                </div>
                <Button
                  size="sm" variant="outline"
                  disabled={!canRestore}
                  onClick={() => onRestoreCategory(c)}
                  title={!canRestore ? "Restaurar exige nível administrativo" : undefined}
                >
                  <ArchiveRestore className="h-4 w-4 mr-1" /> Restaurar
                </Button>
              </Card>
            ))}
          </div>
        </div>
      )}
      {products.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Produtos arquivados</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {products.map((p) => (
              <Card key={p.id} className="p-3 flex gap-3 opacity-70">
                <div className="h-16 w-16 rounded-md bg-muted shrink-0 grid place-items-center overflow-hidden">
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" />
                  ) : (
                    <ImageIcon className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Arquivado</Badge>
                    <h3 className="font-medium truncate">{p.name}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground">R$ {Number(p.price).toFixed(2)}</p>
                  <div className="mt-2">
                    <Button
                      size="sm" variant="outline"
                      disabled={!canRestore}
                      onClick={() => onRestoreProduct(p)}
                      title={!canRestore ? "Restaurar exige nível administrativo" : "Restaurar (fica indisponível)"}
                    >
                      <ArchiveRestore className="h-4 w-4 mr-1" /> Restaurar
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
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
    if ((data as { error?: string })?.error) return toast.error((data as { error: string }).error);
    setContent((data as { content?: string })?.content ?? "");
  };

  return (
    <>
      <Button variant="outline" onClick={() => { setOpen(true); generate(); }}>
        <Sparkles className="h-4 w-4 mr-2" /> Sugerir com IA
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" /> Sugestões de cardápio
            </DialogTitle>
          </DialogHeader>
          <div className="min-h-[200px] max-h-[60vh] overflow-y-auto bg-muted/40 p-4 rounded-md text-sm whitespace-pre-wrap">
            {loading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Gerando sugestões…
              </div>
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
