import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  getPublicTableSession,
  createPublicTableCommand,
  createPublicTableOrder,
  translatePublicTableError,
  type PublicTableSession,
} from "@/lib/tables";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter,
} from "@/components/ui/sheet";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ShoppingBag, Plus, Minus, Trash2, ImageIcon, Search, Clock3, Users, ClipboardList } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/mesa/$token")({
  component: MesaPage,
  head: () => ({
    meta: [
      { title: "Mesa — Mesivo" },
      { name: "robots", content: "noindex" },
      { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover" },
    ],
  }),
});

type Category = { id: string; name: string; position: number | null; is_active: boolean | null };
type Product = {
  id: string; name: string; description: string | null; price: number;
  promo_price: number | null; image_url: string | null; category_id: string | null;
  is_available: boolean | null;
};
type CartItem = { product: Product; qty: number; notes?: string };

const IDENTITY_KEY = (sessionId: string) => `mesa-identity-${sessionId}`;
const COMMAND_KEY = (sessionId: string) => `mesa-command-${sessionId}`;

function money(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function statusLabel(s: string) {
  switch (s) {
    case "pending": return "Recebido";
    case "confirmed": return "Confirmado";
    case "preparing": return "Preparo";
    case "ready": return "Pronto";
    case "delivered": return "Entregue";
    default: return s;
  }
}

function MesaPage() {
  const { token } = Route.useParams();
  const [loading, setLoading] = useState(true);
  const [snapshot, setSnapshot] = useState<PublicTableSession | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selected, setSelected] = useState<Product | null>(null);
  const [selectedNotes, setSelectedNotes] = useState("");
  const [selectedQty, setSelectedQty] = useState(1);
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [identityOpen, setIdentityOpen] = useState(false);
  const [commandDialogOpen, setCommandDialogOpen] = useState(false);
  const [newCommandLabel, setNewCommandLabel] = useState("");
  const [newCommandHolder, setNewCommandHolder] = useState("");

  // Identidade do cliente (nome+telefone) por sessão
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Comanda selecionada
  const [commandId, setCommandId] = useState<string | null>(null);

  const loadAll = async () => {
    const snap = await getPublicTableSession(token);
    setSnapshot(snap);
    if (snap?.table?.restaurant_slug) {
      const [c, p] = await Promise.all([
        supabase.rpc("get_public_categories", { p_slug: snap.table.restaurant_slug }),
        supabase.rpc("get_public_products", { p_slug: snap.table.restaurant_slug }),
      ]);
      setCategories((c.data as Category[]) ?? []);
      setProducts((p.data as Product[]) ?? []);
    }
    setLoading(false);
  };

  useEffect(() => { void loadAll(); }, [token]);

  // Restaura identidade e comanda persistidas por sessão
  useEffect(() => {
    if (!snapshot?.session?.id) return;
    try {
      const raw = localStorage.getItem(IDENTITY_KEY(snapshot.session.id));
      if (raw) {
        const p = JSON.parse(raw) as { name?: string; phone?: string };
        if (p.name) setName(p.name);
        if (p.phone) setPhone(p.phone);
      }
      const cmd = localStorage.getItem(COMMAND_KEY(snapshot.session.id));
      if (cmd) setCommandId(cmd);
    } catch { /* ignore */ }
  }, [snapshot?.session?.id]);

  // Realtime: recarrega quando sessão/pedidos mudam
  useEffect(() => {
    if (!snapshot?.session?.id) return;
    const sid = snapshot.session.id;
    const ch = supabase
      .channel(`mesa-${sid}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "table_sessions", filter: `id=eq.${sid}` }, () => { void loadAll(); })
      .on("postgres_changes", { event: "*", schema: "public", table: "orders", filter: `table_session_id=eq.${sid}` }, () => { void loadAll(); })
      .on("postgres_changes", { event: "*", schema: "public", table: "table_commands", filter: `session_id=eq.${sid}` }, () => { void loadAll(); })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapshot?.session?.id]);

  const filteredProducts = useMemo(() => {
    let list = products.filter((p) => p.is_available !== false);
    if (activeCat) list = list.filter((p) => p.category_id === activeCat);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q) || (p.description ?? "").toLowerCase().includes(q));
    }
    return list;
  }, [products, activeCat, search]);

  const subtotal = useMemo(
    () => cart.reduce((s, i) => s + Number(i.product.promo_price ?? i.product.price) * i.qty, 0),
    [cart],
  );
  const itemCount = cart.reduce((s, i) => s + i.qty, 0);

  const addToCart = (p: Product, qty = 1, itemNotes?: string) => {
    setCart((prev) => {
      const ex = prev.find((i) => i.product.id === p.id && (i.notes ?? "") === (itemNotes ?? ""));
      if (ex) return prev.map((i) => i === ex ? { ...i, qty: i.qty + qty } : i);
      return [...prev, { product: p, qty, notes: itemNotes }];
    });
    toast.success(`${p.name} adicionado`);
  };

  const updateQty = (idx: number, qty: number) => {
    if (qty <= 0) return setCart((prev) => prev.filter((_, i) => i !== idx));
    setCart((prev) => prev.map((i, k) => k === idx ? { ...i, qty } : i));
  };

  const saveIdentity = () => {
    if (!snapshot?.session?.id) return;
    if (name.trim().length < 2) return toast.error("Informe seu nome.");
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10) return toast.error("Informe um telefone válido com DDD.");
    localStorage.setItem(IDENTITY_KEY(snapshot.session.id),
      JSON.stringify({ name: name.trim(), phone: digits }));
    setIdentityOpen(false);
    toast.success("Identificado!");
  };

  const submitOrder = async () => {
    if (!snapshot?.session?.id) return;
    // Garante identificação
    const digits = phone.replace(/\D/g, "");
    if (name.trim().length < 2 || digits.length < 10) {
      setIdentityOpen(true);
      return toast.error("Identifique-se antes de enviar o pedido.");
    }
    if (cart.length === 0) return toast.error("Adicione ao menos um item.");
    setSubmitting(true);
    try {
      const res = await createPublicTableOrder({
        token,
        customerName: name.trim(),
        customerPhone: digits,
        commandId,
        notes: notes.trim() || null,
        items: cart.map((i) => ({
          product_id: i.product.id,
          product_name: i.product.name,
          quantity: i.qty,
          notes: i.notes ?? null,
        })),
      });
      // Persiste identidade
      localStorage.setItem(IDENTITY_KEY(snapshot.session.id),
        JSON.stringify({ name: name.trim(), phone: digits }));
      toast.success(`Pedido #${res.order_number} enviado!`);
      setCart([]);
      setNotes("");
      setCheckoutOpen(false);
      void loadAll();
    } catch (e: any) {
      toast.error(translatePublicTableError(e?.message ?? "Erro ao enviar pedido"));
    } finally {
      setSubmitting(false);
    }
  };

  const createCommand = async () => {
    if (!snapshot?.session?.id) return;
    const label = newCommandLabel.trim();
    if (label.length < 1) return toast.error("Informe o nome da comanda.");
    try {
      const id = await createPublicTableCommand(token, label, newCommandHolder.trim() || null);
      localStorage.setItem(COMMAND_KEY(snapshot.session.id), id);
      setCommandId(id);
      setNewCommandLabel("");
      setNewCommandHolder("");
      setCommandDialogOpen(false);
      toast.success("Comanda criada");
      void loadAll();
    } catch (e: any) {
      toast.error(translatePublicTableError(e?.message ?? "Erro ao criar comanda"));
    }
  };

  const pickCommand = (id: string | null) => {
    if (!snapshot?.session?.id) return;
    setCommandId(id);
    if (id) localStorage.setItem(COMMAND_KEY(snapshot.session.id), id);
    else localStorage.removeItem(COMMAND_KEY(snapshot.session.id));
  };

  if (loading) {
    return <div className="min-h-screen grid place-items-center text-muted-foreground">Carregando…</div>;
  }
  if (!snapshot) {
    return (
      <div className="min-h-screen grid place-items-center p-6 text-center">
        <div className="max-w-sm">
          <h1 className="text-2xl font-bold mb-2">QR inválido</h1>
          <p className="text-muted-foreground">Este QR Code não corresponde a nenhuma mesa ativa. Peça ajuda a um atendente.</p>
        </div>
      </div>
    );
  }

  const themeStyle = {
    "--brand": snapshot.table.primary_color ?? "#0A1628",
    "--brand-accent": snapshot.table.accent_color ?? "#FFC627",
  } as React.CSSProperties;

  // Mesa livre → aguardar garçom
  if (!snapshot.session) {
    return (
      <div className="min-h-screen grid place-items-center p-6 text-center" style={themeStyle}>
        <div className="max-w-md">
          {snapshot.table.logo_url ? (
            <img src={snapshot.table.logo_url} alt={snapshot.table.restaurant_name} className="h-16 w-16 mx-auto mb-4 rounded-full object-cover" />
          ) : null}
          <h1 className="text-2xl font-extrabold mb-1">{snapshot.table.restaurant_name}</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Mesa {snapshot.table.number}{snapshot.table.name ? ` — ${snapshot.table.name}` : ""}
          </p>
          <Card className="p-6">
            <Clock3 className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <h2 className="text-lg font-bold mb-2">Aguarde um garçom</h2>
            <p className="text-sm text-muted-foreground">
              A mesa ainda não foi aberta. Peça a um atendente para liberar o pedido pelo QR.
            </p>
          </Card>
        </div>
      </div>
    );
  }

  const identified = name.trim().length >= 2 && phone.replace(/\D/g, "").length >= 10;

  return (
    <div className="min-h-screen bg-background pb-24" style={themeStyle}>
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          {snapshot.table.logo_url ? (
            <img src={snapshot.table.logo_url} alt="" className="h-10 w-10 rounded-full object-cover" />
          ) : null}
          <div className="flex-1 min-w-0">
            <h1 className="font-extrabold truncate">{snapshot.table.restaurant_name}</h1>
            <p className="text-xs text-muted-foreground">
              Mesa {snapshot.table.number}{snapshot.table.name ? ` — ${snapshot.table.name}` : ""}
              {snapshot.session.party_size ? ` · ${snapshot.session.party_size} pessoas` : ""}
            </p>
          </div>
          <Badge variant="secondary" className="gap-1">
            <Users className="h-3 w-3" /> Aberta
          </Badge>
        </div>

        {/* Barra de identidade + comanda */}
        <div className="max-w-3xl mx-auto px-4 pb-3 flex flex-wrap gap-2 text-xs">
          <button
            onClick={() => setIdentityOpen(true)}
            className={`px-3 py-1.5 rounded-full border ${identified ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-amber-50 border-amber-200 text-amber-900"}`}
          >
            {identified ? `👤 ${name.split(" ")[0]}` : "Identificar-se"}
          </button>
          <Select value={commandId ?? "__none__"} onValueChange={(v) => pickCommand(v === "__none__" ? null : v)}>
            <SelectTrigger className="h-8 w-auto text-xs">
              <SelectValue placeholder="Comanda" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">Sem comanda</SelectItem>
              {snapshot.commands.filter((c) => !c.closed_at).map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.label}{c.holder_name ? ` — ${c.holder_name}` : ""}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setCommandDialogOpen(true)}>
            <Plus className="h-3 w-3 mr-1" /> Comanda
          </Button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 pt-4">
        {/* Pedidos já feitos nesta sessão */}
        {snapshot.orders.length > 0 && (
          <Card className="p-3 mb-4">
            <div className="flex items-center gap-2 mb-2 text-sm font-semibold">
              <ClipboardList className="h-4 w-4" /> Pedidos da mesa
            </div>
            <ul className="space-y-1.5 text-sm">
              {snapshot.orders.map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-2">
                  <span className="truncate">
                    <span className="font-medium">#{o.order_number}</span>
                    <span className="text-muted-foreground"> · {o.items.length} itens</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">{statusLabel(o.status)}</Badge>
                    <span className="font-mono">{money(Number(o.total))}</span>
                  </span>
                </li>
              ))}
              <li className="flex items-center justify-between pt-2 mt-2 border-t font-semibold">
                <span>Total acumulado</span>
                <span className="font-mono">
                  {money(snapshot.orders.reduce((s, o) => s + Number(o.total), 0))}
                </span>
              </li>
            </ul>
          </Card>
        )}

        {/* Busca + categorias */}
        <div className="mb-3 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar no cardápio…" className="pl-9" />
        </div>

        {categories.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2 mb-3 -mx-4 px-4">
            <button
              onClick={() => setActiveCat(null)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border ${activeCat === null ? "bg-foreground text-background" : "bg-background"}`}
            >Todos</button>
            {categories.filter((c) => c.is_active !== false).map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveCat(c.id)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border ${activeCat === c.id ? "bg-foreground text-background" : "bg-background"}`}
              >{c.name}</button>
            ))}
          </div>
        )}

        {/* Produtos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filteredProducts.map((p) => {
            const price = Number(p.promo_price ?? p.price);
            return (
              <button
                key={p.id}
                onClick={() => { setSelected(p); setSelectedQty(1); setSelectedNotes(""); }}
                className="text-left flex gap-3 p-3 border rounded-lg hover:bg-accent transition"
              >
                <div className="w-20 h-20 rounded-md bg-muted grid place-items-center overflow-hidden shrink-0">
                  {p.image_url
                    ? <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                    : <ImageIcon className="h-6 w-6 text-muted-foreground" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate">{p.name}</div>
                  {p.description && (
                    <div className="text-xs text-muted-foreground line-clamp-2">{p.description}</div>
                  )}
                  <div className="mt-1 font-mono text-sm">{money(price)}</div>
                </div>
              </button>
            );
          })}
          {filteredProducts.length === 0 && (
            <div className="col-span-full text-center text-sm text-muted-foreground py-10">
              Nenhum item disponível.
            </div>
          )}
        </div>
      </div>

      {/* Botão flutuante do carrinho */}
      <Sheet open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <SheetTrigger asChild>
          <button
            disabled={cart.length === 0}
            className="fixed bottom-4 left-1/2 -translate-x-1/2 z-20 bg-foreground text-background px-5 py-3 rounded-full shadow-lg disabled:opacity-50 flex items-center gap-3"
          >
            <ShoppingBag className="h-4 w-4" />
            <span className="font-semibold text-sm">
              {itemCount} {itemCount === 1 ? "item" : "itens"} · {money(subtotal)}
            </span>
          </button>
        </SheetTrigger>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Seu pedido</SheetTitle>
          </SheetHeader>
          <div className="py-4 space-y-3">
            {cart.map((i, idx) => (
              <div key={idx} className="flex items-center gap-3 border rounded-lg p-2">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{i.product.name}</div>
                  {i.notes && <div className="text-xs text-muted-foreground">Obs: {i.notes}</div>}
                  <div className="text-xs font-mono">{money(Number(i.product.promo_price ?? i.product.price))}</div>
                </div>
                <div className="flex items-center gap-1">
                  <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateQty(idx, i.qty - 1)}>
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-6 text-center text-sm">{i.qty}</span>
                  <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateQty(idx, i.qty + 1)}>
                    <Plus className="h-3 w-3" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => updateQty(idx, 0)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}

            <div>
              <Label htmlFor="mesa-notes" className="text-xs">Observações para a cozinha</Label>
              <Textarea id="mesa-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ex.: sem cebola, ponto da carne…" rows={2} />
            </div>

            <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-sm text-muted-foreground">Subtotal</span>
              <span className="font-bold font-mono">{money(subtotal)}</span>
            </div>

            {!identified && (
              <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded p-2">
                Toque em <b>Identificar-se</b> no topo para informar seu nome e telefone antes de enviar.
              </p>
            )}
          </div>
          <SheetFooter>
            <Button className="w-full" onClick={submitOrder} disabled={submitting || cart.length === 0}>
              {submitting ? "Enviando…" : "Enviar pedido"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Dialog: detalhe do produto */}
      <Dialog open={!!selected} onOpenChange={(o) => { if (!o) setSelected(null); }}>
        <DialogContent className="max-w-md">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{selected.name}</DialogTitle>
                {selected.description && (
                  <DialogDescription>{selected.description}</DialogDescription>
                )}
              </DialogHeader>
              <div className="space-y-3">
                <div className="font-mono text-lg">{money(Number(selected.promo_price ?? selected.price))}</div>
                <div>
                  <Label className="text-xs">Observações</Label>
                  <Textarea value={selectedNotes} onChange={(e) => setSelectedNotes(e.target.value)} rows={2} />
                </div>
                <div className="flex items-center gap-2">
                  <Button size="icon" variant="outline" onClick={() => setSelectedQty(Math.max(1, selectedQty - 1))}>
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-8 text-center">{selectedQty}</span>
                  <Button size="icon" variant="outline" onClick={() => setSelectedQty(selectedQty + 1)}>
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <DialogFooter>
                <Button className="w-full" onClick={() => {
                  addToCart(selected, selectedQty, selectedNotes.trim() || undefined);
                  setSelected(null);
                }}>
                  Adicionar {money(Number(selected.promo_price ?? selected.price) * selectedQty)}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog: identidade */}
      <Dialog open={identityOpen} onOpenChange={setIdentityOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Quem está pedindo?</DialogTitle>
            <DialogDescription>Precisamos do seu nome e WhatsApp para acompanhar seu pedido.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="mesa-name">Nome</Label>
              <Input id="mesa-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" />
            </div>
            <div>
              <Label htmlFor="mesa-phone">WhatsApp</Label>
              <Input id="mesa-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(11) 99999-9999" inputMode="tel" />
            </div>
          </div>
          <DialogFooter>
            <Button className="w-full" onClick={saveIdentity}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: nova comanda */}
      <Dialog open={commandDialogOpen} onOpenChange={setCommandDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Nova comanda</DialogTitle>
            <DialogDescription>Crie uma comanda para separar pedidos por pessoa ou grupo.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="cmd-label">Nome da comanda</Label>
              <Input id="cmd-label" value={newCommandLabel} onChange={(e) => setNewCommandLabel(e.target.value)} placeholder="Ex.: João, Bebidas, Casal 1" maxLength={60} />
            </div>
            <div>
              <Label htmlFor="cmd-holder">Responsável (opcional)</Label>
              <Input id="cmd-holder" value={newCommandHolder} onChange={(e) => setNewCommandHolder(e.target.value)} placeholder="Nome de quem paga" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCommandDialogOpen(false)}>Cancelar</Button>
            <Button onClick={createCommand}>Criar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
