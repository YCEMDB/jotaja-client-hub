import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
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
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  RadioGroup, RadioGroupItem,
} from "@/components/ui/radio-group";
import { ShoppingBag, Plus, Minus, Trash2, MapPin, Clock, ImageIcon } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/loja/$slug")({
  component: LojaPage,
});

type Restaurant = {
  id: string; name: string; slug: string; description: string | null;
  logo_url: string | null; cover_url: string | null;
  primary_color: string | null; accent_color: string | null;
  is_open: boolean | null; min_order_value: number | null;
  accepts_delivery: boolean | null; accepts_pickup: boolean | null;
  whatsapp: string | null;
};
type Category = { id: string; name: string; position: number | null; is_active: boolean | null };
type Product = {
  id: string; name: string; description: string | null; price: number;
  promo_price: number | null; image_url: string | null; category_id: string | null;
  is_available: boolean | null;
};
type CartItem = { product: Product; qty: number; notes?: string };

function LojaPage() {
  const { slug } = Route.useParams();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: r } = await supabase
        .from("restaurants").select("*").eq("slug", slug).maybeSingle();
      if (!r) { setLoading(false); return; }
      setRestaurant(r as Restaurant);
      const [c, p] = await Promise.all([
        supabase.from("categories").select("*").eq("restaurant_id", r.id).eq("is_active", true).order("position"),
        supabase.from("products").select("*").eq("restaurant_id", r.id).eq("is_available", true).order("position"),
      ]);
      setCategories(c.data ?? []);
      setProducts(p.data ?? []);
      setLoading(false);
    })();
  }, [slug]);

  // restore cart from localStorage
  useEffect(() => {
    if (!restaurant) return;
    const raw = localStorage.getItem(`cart-${restaurant.id}`);
    if (raw) {
      try { setCart(JSON.parse(raw)); } catch {}
    }
  }, [restaurant]);

  useEffect(() => {
    if (!restaurant) return;
    localStorage.setItem(`cart-${restaurant.id}`, JSON.stringify(cart));
  }, [cart, restaurant]);

  const addToCart = (p: Product, qty = 1) => {
    setCart((prev) => {
      const ex = prev.find((i) => i.product.id === p.id);
      if (ex) return prev.map((i) => i.product.id === p.id ? { ...i, qty: i.qty + qty } : i);
      return [...prev, { product: p, qty }];
    });
    toast.success(`${p.name} adicionado`);
  };

  const updateQty = (id: string, qty: number) => {
    if (qty <= 0) return setCart((prev) => prev.filter((i) => i.product.id !== id));
    setCart((prev) => prev.map((i) => i.product.id === id ? { ...i, qty } : i));
  };

  const subtotal = useMemo(
    () => cart.reduce((s, i) => s + Number(i.product.promo_price ?? i.product.price) * i.qty, 0),
    [cart]
  );
  const itemCount = cart.reduce((s, i) => s + i.qty, 0);

  if (loading) {
    return <div className="min-h-screen grid place-items-center text-muted-foreground">Carregando…</div>;
  }
  if (!restaurant) {
    return (
      <div className="min-h-screen grid place-items-center p-6 text-center">
        <div>
          <h1 className="text-2xl font-bold mb-2">Loja não encontrada</h1>
          <p className="text-muted-foreground mb-4">O link <code>/loja/{slug}</code> não existe.</p>
          <Link to="/" className="text-primary underline">Voltar ao início</Link>
        </div>
      </div>
    );
  }

  const themeStyle = {
    "--brand": restaurant.primary_color ?? "#0A1628",
    "--brand-accent": restaurant.accent_color ?? "#FFC627",
  } as React.CSSProperties;

  return (
    <div className="min-h-screen bg-muted/20" style={themeStyle}>
      {/* Header */}
      <div className="text-white" style={{ background: "var(--brand)" }}>
        {restaurant.cover_url && (
          <div className="h-40 md:h-56 bg-center bg-cover" style={{ backgroundImage: `url(${restaurant.cover_url})` }} />
        )}
        <div className="container mx-auto px-4 py-6 flex items-center gap-4">
          <div className="h-16 w-16 md:h-20 md:w-20 rounded-xl bg-white/10 grid place-items-center overflow-hidden shrink-0">
            {restaurant.logo_url ? (
              <img src={restaurant.logo_url} alt={restaurant.name} className="h-full w-full object-cover" />
            ) : (
              <span className="text-2xl font-bold">{restaurant.name[0]}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold truncate">{restaurant.name}</h1>
            {restaurant.description && (
              <p className="text-sm opacity-80 line-clamp-2">{restaurant.description}</p>
            )}
            <div className="flex items-center gap-3 mt-2 text-xs">
              <Badge variant={restaurant.is_open ? "default" : "secondary"} style={restaurant.is_open ? { background: "var(--brand-accent)", color: "#000" } : undefined}>
                {restaurant.is_open ? "Aberto agora" : "Fechado"}
              </Badge>
              {Number(restaurant.min_order_value) > 0 && (
                <span className="opacity-80">Pedido mín. R$ {Number(restaurant.min_order_value).toFixed(2)}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Category nav */}
      {categories.length > 0 && (
        <div className="sticky top-0 z-10 bg-background border-b">
          <div className="container mx-auto px-4 overflow-x-auto">
            <div className="flex gap-1 py-2">
              {categories.map((c) => (
                <a key={c.id} href={`#cat-${c.id}`} className="px-3 py-1.5 text-sm rounded-full hover:bg-muted whitespace-nowrap">
                  {c.name}
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Menu */}
      <div className="container mx-auto px-4 py-6 pb-32 space-y-8">
        {categories.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">Cardápio em construção. Volte em breve!</p>
          </Card>
        ) : (
          categories.map((cat) => {
            const items = products.filter((p) => p.category_id === cat.id);
            if (items.length === 0) return null;
            return (
              <section key={cat.id} id={`cat-${cat.id}`}>
                <h2 className="text-xl font-bold mb-3">{cat.name}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {items.map((p) => (
                    <Card key={p.id} className="p-3 flex gap-3 cursor-pointer hover:shadow-md transition" onClick={() => setSelectedProduct(p)}>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold">{p.name}</h3>
                        {p.description && <p className="text-sm text-muted-foreground line-clamp-2">{p.description}</p>}
                        <div className="mt-2">
                          {p.promo_price != null ? (
                            <>
                              <span className="text-muted-foreground line-through text-xs mr-1">R$ {Number(p.price).toFixed(2)}</span>
                              <span className="font-bold" style={{ color: "var(--brand)" }}>R$ {Number(p.promo_price).toFixed(2)}</span>
                            </>
                          ) : (
                            <span className="font-bold" style={{ color: "var(--brand)" }}>R$ {Number(p.price).toFixed(2)}</span>
                          )}
                        </div>
                      </div>
                      <div className="h-24 w-24 rounded-lg bg-muted shrink-0 overflow-hidden grid place-items-center">
                        {p.image_url ? (
                          <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" />
                        ) : (
                          <ImageIcon className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </section>
            );
          })
        )}
      </div>

      {/* Floating cart */}
      {itemCount > 0 && (
        <Sheet>
          <SheetTrigger asChild>
            <button
              className="fixed bottom-4 left-1/2 -translate-x-1/2 px-5 py-3 rounded-full shadow-2xl flex items-center gap-3 font-semibold z-20"
              style={{ background: "var(--brand)", color: "white" }}
            >
              <ShoppingBag className="h-5 w-5" />
              <span>{itemCount} {itemCount === 1 ? "item" : "itens"}</span>
              <span className="opacity-70">·</span>
              <span>R$ {subtotal.toFixed(2)}</span>
            </button>
          </SheetTrigger>
          <SheetContent className="flex flex-col">
            <SheetHeader>
              <SheetTitle>Sacola</SheetTitle>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto space-y-3 py-4">
              {cart.map((i) => (
                <div key={i.product.id} className="flex gap-3 items-start">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{i.product.name}</p>
                    <p className="text-sm text-muted-foreground">R$ {Number(i.product.promo_price ?? i.product.price).toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-1 border rounded-full">
                    <Button size="icon" variant="ghost" className="h-7 w-7 rounded-full" onClick={() => updateQty(i.product.id, i.qty - 1)}>
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-6 text-center text-sm">{i.qty}</span>
                    <Button size="icon" variant="ghost" className="h-7 w-7 rounded-full" onClick={() => updateQty(i.product.id, i.qty + 1)}>
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => updateQty(i.product.id, 0)}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
            <SheetFooter className="border-t pt-4">
              <div className="w-full space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span className="font-semibold">R$ {subtotal.toFixed(2)}</span>
                </div>
                {Number(restaurant.min_order_value) > 0 && subtotal < Number(restaurant.min_order_value) && (
                  <p className="text-xs text-destructive">
                    Faltam R$ {(Number(restaurant.min_order_value) - subtotal).toFixed(2)} para o pedido mínimo
                  </p>
                )}
                <Button
                  className="w-full"
                  size="lg"
                  style={{ background: "var(--brand)" }}
                  disabled={!restaurant.is_open || subtotal < Number(restaurant.min_order_value ?? 0)}
                  onClick={() => setCheckoutOpen(true)}
                >
                  {!restaurant.is_open ? "Loja fechada" : "Finalizar pedido"}
                </Button>
              </div>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      )}

      {/* Product detail */}
      <ProductSheet
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAdd={(p, qty) => { addToCart(p, qty); setSelectedProduct(null); }}
        brand={restaurant.primary_color ?? "#0A1628"}
      />

      {/* Checkout */}
      <CheckoutDialog
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        restaurant={restaurant}
        cart={cart}
        subtotal={subtotal}
        onSuccess={(orderId) => {
          setCart([]);
          setCheckoutOpen(false);
          window.location.href = `/pedido/${orderId}`;
        }}
      />
    </div>
  );
}

function ProductSheet({ product, onClose, onAdd, brand }: {
  product: Product | null; onClose: () => void;
  onAdd: (p: Product, qty: number) => void; brand: string;
}) {
  const [qty, setQty] = useState(1);
  useEffect(() => { if (product) setQty(1); }, [product]);
  if (!product) return null;
  const price = Number(product.promo_price ?? product.price);
  return (
    <Dialog open={!!product} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg p-0 overflow-hidden">
        {product.image_url && (
          <img src={product.image_url} alt={product.name} className="w-full h-56 object-cover" />
        )}
        <div className="p-6 space-y-4">
          <DialogHeader>
            <DialogTitle>{product.name}</DialogTitle>
          </DialogHeader>
          {product.description && <p className="text-sm text-muted-foreground">{product.description}</p>}
          <p className="text-2xl font-bold" style={{ color: brand }}>R$ {price.toFixed(2)}</p>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 border rounded-full px-2">
              <Button size="icon" variant="ghost" onClick={() => setQty(Math.max(1, qty - 1))}><Minus className="h-4 w-4" /></Button>
              <span className="w-8 text-center font-semibold">{qty}</span>
              <Button size="icon" variant="ghost" onClick={() => setQty(qty + 1)}><Plus className="h-4 w-4" /></Button>
            </div>
            <Button className="flex-1" size="lg" style={{ background: brand }} onClick={() => onAdd(product, qty)}>
              Adicionar · R$ {(price * qty).toFixed(2)}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CheckoutDialog({
  open, onOpenChange, restaurant, cart, subtotal, onSuccess,
}: {
  open: boolean; onOpenChange: (o: boolean) => void;
  restaurant: Restaurant; cart: CartItem[]; subtotal: number;
  onSuccess: (orderId: string) => void;
}) {
  const [orderType, setOrderType] = useState<"delivery" | "pickup">(
    restaurant.accepts_delivery ? "delivery" : "pickup"
  );
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [complement, setComplement] = useState("");
  const [payment, setPayment] = useState<"cash" | "pix" | "credit_card" | "debit_card">("pix");
  const [changeFor, setChangeFor] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const total = subtotal; // delivery fee TBD per area in fase posterior

  const submit = async () => {
    if (!name.trim() || !phone.trim()) return toast.error("Preencha nome e telefone");
    if (orderType === "delivery" && (!street || !number || !neighborhood)) {
      return toast.error("Preencha o endereço de entrega");
    }
    setSubmitting(true);

    // 1) upsert customer (anonymous via RLS public_insert)
    const { data: cust } = await supabase
      .from("customers")
      .insert({
        restaurant_id: restaurant.id,
        name: name.trim(),
        phone: phone.trim(),
      })
      .select("id")
      .single();

    // 2) insert order
    const { data: order, error: oErr } = await supabase
      .from("orders")
      .insert({
        restaurant_id: restaurant.id,
        customer_id: cust?.id ?? null,
        customer_name: name.trim(),
        customer_phone: phone.trim(),
        type: orderType,
        payment,
        status: "pending",
        subtotal,
        delivery_fee: 0,
        discount: 0,
        total,
        change_for: payment === "cash" && changeFor ? Number(changeFor) : null,
        notes: notes.trim() || null,
        delivery_address: orderType === "delivery"
          ? { street, number, neighborhood, complement: complement || null }
          : null,
      })
      .select("id")
      .single();

    if (oErr || !order) {
      setSubmitting(false);
      return toast.error(oErr?.message ?? "Erro ao criar pedido");
    }

    // 3) insert items
    const itemsPayload = cart.map((i) => ({
      order_id: order.id,
      product_id: i.product.id,
      product_name: i.product.name,
      quantity: i.qty,
      unit_price: Number(i.product.promo_price ?? i.product.price),
      subtotal: Number(i.product.promo_price ?? i.product.price) * i.qty,
    }));
    const { error: iErr } = await supabase.from("order_items").insert(itemsPayload);
    if (iErr) {
      setSubmitting(false);
      return toast.error(iErr.message);
    }

    setSubmitting(false);
    toast.success("Pedido enviado!");
    onSuccess(order.id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Finalizar pedido</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Tipo */}
          <div>
            <Label>Como você quer receber?</Label>
            <RadioGroup value={orderType} onValueChange={(v) => setOrderType(v as any)} className="grid grid-cols-2 gap-2 mt-2">
              {restaurant.accepts_delivery && (
                <label className="border rounded-lg p-3 cursor-pointer flex items-center gap-2 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                  <RadioGroupItem value="delivery" />
                  <MapPin className="h-4 w-4" /> Entrega
                </label>
              )}
              {restaurant.accepts_pickup && (
                <label className="border rounded-lg p-3 cursor-pointer flex items-center gap-2 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                  <RadioGroupItem value="pickup" />
                  <Clock className="h-4 w-4" /> Retirada
                </label>
              )}
            </RadioGroup>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Nome *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <Label>WhatsApp *</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(11) 99999-9999" />
            </div>
          </div>

          {orderType === "delivery" && (
            <div className="space-y-2 p-3 bg-muted/40 rounded-lg">
              <p className="text-xs font-semibold text-muted-foreground">ENDEREÇO DE ENTREGA</p>
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2"><Label>Rua *</Label><Input value={street} onChange={(e) => setStreet(e.target.value)} /></div>
                <div><Label>Nº *</Label><Input value={number} onChange={(e) => setNumber(e.target.value)} /></div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label>Bairro *</Label><Input value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} /></div>
                <div><Label>Complemento</Label><Input value={complement} onChange={(e) => setComplement(e.target.value)} /></div>
              </div>
            </div>
          )}

          <div>
            <Label>Forma de pagamento</Label>
            <Select value={payment} onValueChange={(v) => setPayment(v as any)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pix">PIX</SelectItem>
                <SelectItem value="cash">Dinheiro</SelectItem>
                <SelectItem value="credit_card">Cartão de crédito (na entrega)</SelectItem>
                <SelectItem value="debit_card">Cartão de débito (na entrega)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {payment === "cash" && (
            <div>
              <Label>Troco para quanto?</Label>
              <Input type="number" step="0.01" value={changeFor} onChange={(e) => setChangeFor(e.target.value)} placeholder="Deixe em branco se não precisa" />
            </div>
          )}

          <div>
            <Label>Observações</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Ex: sem cebola" />
          </div>

          <div className="border-t pt-3 space-y-1 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span>R$ {subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between font-bold text-base"><span>Total</span><span>R$ {total.toFixed(2)}</span></div>
          </div>

          <Button
            size="lg"
            className="w-full"
            style={{ background: restaurant.primary_color ?? undefined }}
            disabled={submitting}
            onClick={submit}
          >
            {submitting ? "Enviando…" : "Confirmar pedido"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
