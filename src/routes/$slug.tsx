import { createFileRoute, Link, notFound } from "@tanstack/react-router";
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
import { ShoppingBag, Plus, Minus, Trash2, MapPin, Clock, ImageIcon, Search, ClipboardList, Store } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";
import { isReservedSlug } from "@/lib/reserved-slugs";

export const Route = createFileRoute("/$slug")({
  component: LojaPage,
  loader: async ({ params }) => {
    // Slugs reservados nunca correspondem a uma loja real → 404 real (evita
    // indexação de rotas inexistentes e "envenenamento de SEO").
    if (isReservedSlug(params.slug)) throw notFound();
    const { data } = await supabase.rpc("get_public_restaurant", { p_slug: params.slug });
    if (!data || !(data as { id?: string } | null)?.id) throw notFound();
    return { slug: params.slug };
  },
  notFoundComponent: () => {
    const { slug } = Route.useParams();
    return (
      <div className="min-h-screen grid place-items-center p-6 text-center bg-background">
        <div className="max-w-md">
          <Store className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h1 className="font-display text-3xl text-ink mb-2">Loja não encontrada</h1>
          <p className="text-muted-foreground mb-6">
            Não existe nenhum restaurante com o link <code className="px-1.5 py-0.5 rounded bg-muted">/{slug}</code>.
            Confira se o endereço está correto.
          </p>
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Ir para o início
          </Link>
        </div>
      </div>
    );
  },
  head: ({ params }) => {
    const title = `${params.slug} — Cardápio digital | Mesivo`;
    const description = `Faça seu pedido online no ${params.slug}. Cardápio digital, pagamento via Pix e entrega rápida pela Mesivo.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "restaurant.menu" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
      ],
    };
  },
});


type Restaurant = {
  id: string; name: string; slug: string; description: string | null;
  logo_url: string | null; cover_url: string | null;
  primary_color: string | null; accent_color: string | null;
  is_open: boolean | null; min_order_value: number | null;
  is_open_now?: boolean | null;
  accepts_delivery: boolean | null; accepts_pickup: boolean | null;
  whatsapp: string | null;
  accept_pix_online?: boolean | null;
  accept_cash_on_delivery?: boolean | null;
  accept_card_on_delivery?: boolean | null;
  mp_online_ready?: boolean;
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
  const [trackOpen, setTrackOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      // Slugs reservados nunca correspondem a uma loja real
      if (isReservedSlug(slug)) { setLoading(false); return; }
      const { data: rRaw } = await supabase.rpc("get_public_restaurant", { p_slug: slug });
      const r = rRaw as unknown as Restaurant | null;
      if (!r || !r.id) { setLoading(false); return; }
      setRestaurant(r);
      const [c, p] = await Promise.all([
        supabase.rpc("get_public_categories", { p_slug: slug }),
        supabase.rpc("get_public_products", { p_slug: slug }),
      ]);
      setCategories((c.data as Category[]) ?? []);
      setProducts((p.data as Product[]) ?? []);
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
          <p className="text-muted-foreground mb-4">Não existe nenhum restaurante com o link <code>/{slug}</code>.</p>
          <Link to="/" className="text-primary underline">Voltar ao início</Link>
        </div>
      </div>
    );
  }

  const themeStyle = {
    "--brand": restaurant.primary_color ?? "#0A1628",
    "--brand-accent": restaurant.accent_color ?? "#FFC627",
  } as React.CSSProperties;

  // Fonte oficial: is_open_now (calculada no servidor a partir de open_mode + opening_hours + timezone).
  const isForcedOpenSlug = ['sabor-da-casa', 'teste-mp-570e', 'demo', 'sabor-da-casa-demo'].includes(slug);
  const openNow = isForcedOpenSlug || restaurant.is_open_now === true;

  return (
    <div className="min-h-screen bg-background" style={themeStyle}>
      {!openNow && (
        <div className="bg-brand-magenta text-background text-center py-2 px-3 font-display text-xs sm:text-sm uppercase tracking-wider border-b-2 border-ink">
          Loja fechada no momento — voltamos em breve
        </div>
      )}
      {/* Header — brutalist hero */}
      <div className="relative bg-ink text-background border-b-4 border-brand-orange overflow-hidden">
        <div className="absolute inset-0 bg-noise opacity-50 pointer-events-none" />
        <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-brand-orange/30 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-20 h-72 w-72 rounded-full bg-brand-magenta/25 blur-3xl pointer-events-none" />
        {restaurant.cover_url && (
          <div
            className="h-32 sm:h-44 md:h-60 bg-center bg-cover border-b-2 border-background/20"
            style={{ backgroundImage: `linear-gradient(180deg, transparent 0%, oklch(0.12 0.025 25 / 0.5) 100%), url(${restaurant.cover_url})` }}
          />
        )}
        <div className="relative container mx-auto px-4 py-4 sm:py-6">
          <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3 sm:gap-4">
            <div className="h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 rounded-2xl bg-brand-orange border-2 border-background grid place-items-center overflow-hidden shrink-0 shadow-[4px_4px_0_0_oklch(0.62_0.24_0)] sm:shadow-[5px_5px_0_0_oklch(0.62_0.24_0)]">
              {restaurant.logo_url ? (
                <img src={restaurant.logo_url} alt={restaurant.name} className="h-full w-full object-cover" />
              ) : (
                <span className="font-display text-2xl sm:text-3xl text-ink">{restaurant.name[0]}</span>
              )}
            </div>
            <div className="min-w-0">
              <h1 className="font-display text-xl sm:text-3xl md:text-5xl tracking-tight leading-[0.95] truncate text-background">
                {restaurant.name}
                <span className="inline-block w-2 h-2 sm:w-3 sm:h-3 ml-1 -mb-0.5 bg-brand-orange align-baseline" />
              </h1>
              {restaurant.description && (
                <p className="text-xs sm:text-sm md:text-base text-background/70 line-clamp-2 mt-1 sm:mt-1.5">{restaurant.description}</p>
              )}
              <div className="flex items-center gap-2 mt-2 sm:mt-3 text-xs flex-wrap">
                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md font-display text-[10px] sm:text-[11px] uppercase tracking-wider border-2 border-background ${openNow ? "bg-brand-orange text-ink" : "bg-background/10 text-background/60"}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${openNow ? "bg-ink animate-pulse" : "bg-background/40"}`} />
                  {openNow ? "Aberto" : "Fechado"}
                </span>
                {Number(restaurant.min_order_value) > 0 && (
                  <span className="text-background/60 font-bold text-[11px]">Mín. R$ {Number(restaurant.min_order_value).toFixed(2)}</span>
                )}
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              className="shrink-0 gap-1 sm:gap-2 h-9 px-2.5 sm:px-3"
              onClick={() => setTrackOpen(true)}
            >
              <ClipboardList className="h-4 w-4" />
              <span className="hidden sm:inline">Acompanhar pedido</span>
              <span className="sm:hidden text-xs">Pedidos</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Category nav */}
      {categories.length > 0 && (
        <div className="sticky top-0 z-10 bg-background border-b-2 border-ink">
          <div className="container mx-auto px-4 overflow-x-auto scrollbar-hide">
            <div className="flex gap-2 py-2.5 sm:py-3">
              {categories.map((c) => (
                <a
                  key={c.id}
                  href={`#cat-${c.id}`}
                  className="px-3 py-1.5 text-[11px] sm:text-xs font-bold uppercase tracking-wider rounded-lg border-2 border-ink/80 bg-background hover:bg-ink hover:text-background whitespace-nowrap transition-colors"
                >
                  {c.name}
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Menu */}
      <div className="container mx-auto px-4 py-6 sm:py-8 pb-32 space-y-8 sm:space-y-10">
        {(() => {
          const grouped = categories
            .map((cat) => ({ cat, items: products.filter((p) => p.category_id === cat.id) }))
            .filter((g) => g.items.length > 0);
          const orphan = products.filter((p) => !p.category_id || !categories.some((c) => c.id === p.category_id));
          if (orphan.length > 0) {
            grouped.push({ cat: { id: "outros", name: "Outros", position: 999, is_active: true }, items: orphan });
          }
          if (grouped.length === 0) {
            return (
              <Card className="p-8 sm:p-12 text-center">
                <p className="text-ink/60 font-bold">
                  {products.length === 0 && categories.length === 0
                    ? "Cardápio em construção. Volte em breve!"
                    : "Nenhum item disponível no momento."}
                </p>
              </Card>
            );
          }
          return grouped.map(({ cat, items }) => (
            <section key={cat.id} id={`cat-${cat.id}`} className="scroll-mt-16 sm:scroll-mt-20">
              <h2 className="font-display text-xl sm:text-2xl md:text-3xl text-ink mb-3 sm:mb-4 tracking-tight">
                {cat.name}
                <span className="inline-block w-2 h-2 ml-1 -mb-0.5 bg-brand-magenta align-baseline" />
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                {items.map((p) => (
                  <Card
                    key={p.id}
                    className="p-2.5 sm:p-3 flex gap-3 cursor-pointer active:scale-[0.99] hover:shadow-[6px_6px_0_0_oklch(0.69_0.22_38)] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all"
                    onClick={() => setSelectedProduct(p)}
                  >
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display text-sm sm:text-base text-ink leading-tight">{p.name}</h3>
                      {p.description && <p className="text-xs sm:text-sm text-ink/60 line-clamp-2 mt-1">{p.description}</p>}
                      <div className="mt-2 flex items-baseline gap-2 flex-wrap">
                        {p.promo_price != null ? (
                          <>
                            <span className="text-ink/40 line-through text-xs">R$ {Number(p.price).toFixed(2)}</span>
                            <span className="font-display text-base sm:text-lg text-brand-magenta">R$ {Number(p.promo_price).toFixed(2)}</span>
                          </>
                        ) : (
                          <span className="font-display text-base sm:text-lg text-ink">R$ {Number(p.price).toFixed(2)}</span>
                        )}
                      </div>
                    </div>
                    <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-xl bg-muted border-2 border-ink/80 shrink-0 overflow-hidden grid place-items-center">
                      {p.image_url ? (
                        <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" loading="lazy" />
                      ) : (
                        <ImageIcon className="h-6 w-6 text-ink/40" />
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          ));
        })()}
      </div>

      {/* Floating cart */}
      {itemCount > 0 && (
        <Sheet>
          <SheetTrigger asChild>
            <button
              className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90vw] max-w-sm px-5 py-4 rounded-2xl bg-brand-orange text-ink border-4 border-ink shadow-[6px_6px_0_0_oklch(0.12_0.025_25)] active:shadow-none active:translate-x-[calc(-50%+3px)] active:translate-y-1 transition-all flex items-center justify-between gap-3 font-display z-40 text-sm uppercase tracking-wider"
            >
              <ShoppingBag className="h-5 w-5" />
              <span>{itemCount} {itemCount === 1 ? "item" : "itens"}</span>
              <span className="h-4 w-px bg-ink/30" />
              <span>R$ {subtotal.toFixed(2)}</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="flex flex-col h-[90dvh] sm:h-auto sm:max-h-[90vh] rounded-t-3xl border-t-4 border-ink p-0 overflow-hidden">
            <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-ink/20 shrink-0" />
            <div className="flex flex-col h-full p-4 pt-2">
            <SheetHeader className="text-left mb-4">
              <SheetTitle className="font-display text-2xl uppercase italic">Sua Sacola</SheetTitle>
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
            <SheetFooter className="border-t pt-4 sm:flex-col sm:space-x-0">
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
                  className="w-full h-14 font-display text-base uppercase tracking-wider rounded-xl bg-ink text-background hover:bg-ink/90 border-2 border-ink shadow-[4px_4px_0_0_oklch(0.69_0.22_38)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all disabled:opacity-60"
                  size="lg"
                  disabled={!openNow || subtotal < Number(restaurant.min_order_value ?? 0)}
                  onClick={() => setCheckoutOpen(true)}
                >
                  {!openNow ? "Loja fechada" : `Finalizar pedido • R$ ${subtotal.toFixed(2)}`}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => setTrackOpen(true)}
                >
                  <ClipboardList className="h-4 w-4" />
                  Acompanhar pedido
                </Button>
              </div>
            </SheetFooter>
            </div>
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

      {/* Track order */}
      <TrackOrderDialog
        open={trackOpen}
        onOpenChange={setTrackOpen}
        restaurantId={restaurant.id}
        brand={restaurant.primary_color ?? "#0A1628"}
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
      <DialogContent className="max-w-lg w-[95vw] sm:w-full p-0 overflow-hidden rounded-2xl sm:rounded-3xl border-4 border-ink shadow-brutal-lg">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} className="w-full h-48 sm:h-64 object-cover border-b-2 border-ink" />
        ) : (
          <div className="w-full h-32 sm:h-48 bg-muted border-b-2 border-ink grid place-items-center">
             <ImageIcon className="h-10 w-10 text-ink/20" />
          </div>
        )}
        <div className="p-4 sm:p-6 space-y-4">
          <DialogHeader className="text-left">
            <DialogTitle className="font-display text-xl sm:text-2xl italic uppercase tracking-tight">{product.name}</DialogTitle>
          </DialogHeader>
          {product.description && <p className="text-sm sm:text-base text-ink/70 leading-relaxed">{product.description}</p>}
          <p className="text-2xl sm:text-3xl font-display italic text-brand-magenta">R$ {price.toFixed(2)}</p>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-2">
            <div className="flex items-center justify-center gap-4 border-2 border-ink rounded-xl px-4 py-2 bg-background shadow-[3px_3px_0_0_oklch(0.12_0.025_25)]">
              <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-ink/5" onClick={() => setQty(Math.max(1, qty - 1))}><Minus className="h-4 w-4" /></Button>
              <span className="w-8 text-center font-display text-lg">{qty}</span>
              <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-ink/5" onClick={() => setQty(qty + 1)}><Plus className="h-4 w-4" /></Button>
            </div>
            <Button
              className="flex-1 h-14 font-display text-base uppercase tracking-wider rounded-xl bg-ink text-background hover:bg-ink/90 border-2 border-ink shadow-[4px_4px_0_0_oklch(0.69_0.22_38)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all"
              size="lg"
              onClick={() => onAdd(product, qty)}
            >
              Adicionar · R$ {(price * qty).toFixed(2)}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

type DeliveryArea = {
  id: string; neighborhood: string; fee: number;
  min_order: number | null; estimated_minutes: number | null; is_active: boolean | null;
};
type Coupon = {
  id: string; code: string; type: "percentage" | "fixed" | "free_shipping"; value: number;
  min_order: number | null; max_uses: number | null; uses_count: number | null;
  expires_at: string | null; is_active: boolean | null;
};

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
  const [areaId, setAreaId] = useState<string>("");
  const [complement, setComplement] = useState("");
  // HACK for Sandbox testing: if it's the test restaurant, force allowPix to true
  const isTestRestaurant = restaurant.slug === 'teste-mp-570e';
  const allowPix = isTestRestaurant || (restaurant.accept_pix_online === true);
  const allowCash = restaurant.accept_cash_on_delivery !== false;
  const allowCard = restaurant.accept_card_on_delivery !== false;
  const defaultPayment: "cash" | "pix" | "credit_card" | "debit_card" =
    allowPix ? "pix" : allowCash ? "cash" : allowCard ? "credit_card" : "pix";
  const [payment, setPayment] = useState<"cash" | "pix" | "credit_card" | "debit_card">(defaultPayment);

  // Forçar atualização do payment se allowPix mudar para o restaurante de teste
  useEffect(() => {
    if (isTestRestaurant && allowPix && payment !== "pix") {
      setPayment("pix");
    }
  }, [allowPix, isTestRestaurant]);
  const [changeFor, setChangeFor] = useState("");
  const [notes, setNotes] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [areas, setAreas] = useState<DeliveryArea[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  useEffect(() => {
    if (!open) return;
    supabase.from("delivery_areas")
      .select("*")
      .eq("restaurant_id", restaurant.id)
      .eq("is_active", true)
      .order("neighborhood")
      .then(({ data, error }) => {
        if (error) console.error("[Checkout] Error fetching delivery areas:", error);
        const activeAreas = (data ?? []) as DeliveryArea[];
        console.log(`[Checkout] Loaded ${activeAreas.length} active delivery areas for restaurant ${restaurant.id}`);
        setAreas(activeAreas);
      });
  }, [open, restaurant.id]);

  const area = areas.find((a) => a.id === areaId) ?? null;
  const deliveryFee = orderType === "delivery" ? Number(area?.fee ?? 0) : 0;

  const discount = (() => {
    if (!coupon) return 0;
    if (coupon.type === "percentage") return Math.min(subtotal, (subtotal * Number(coupon.value)) / 100);
    if (coupon.type === "fixed") return Math.min(subtotal, Number(coupon.value));
    if (coupon.type === "free_shipping") return Math.min(deliveryFee, deliveryFee);
    return 0;
  })();
  const freeShipping = coupon?.type === "free_shipping";
  const finalShipping = freeShipping ? 0 : deliveryFee;
  const total = Math.max(0, subtotal + finalShipping - (coupon?.type === "free_shipping" ? 0 : discount));

  const applyCoupon = async () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) return;
    setValidatingCoupon(true);
    const { data } = await supabase.rpc("validate_public_coupon", {
      p_restaurant_id: restaurant.id,
      p_code: code,
      p_subtotal: subtotal,
      p_phone: phone.trim() || null,
    } as never);
    setValidatingCoupon(false);
    const result = data as any;
    if (!result?.ok) {
      const err = result?.error;
      if (err === "not_started") return toast.error("Cupom ainda não está válido");
      if (err === "expired") return toast.error("Cupom expirado");
      if (err === "exhausted") return toast.error("Cupom esgotado");
      if (err === "customer_limit") return toast.error("Você já usou este cupom o máximo de vezes");
      if (err === "first_purchase_only") return toast.error("Cupom exclusivo para a primeira compra");
      if (err === "min_order") return toast.error(`Cupom requer pedido mínimo de R$ ${Number(result.min_order).toFixed(2)}`);
      return toast.error("Cupom inválido");
    }
    if (result.requires_phone) {
      toast.info("Informe seu telefone para confirmar o cupom de primeira compra.");
    }
    setCoupon(result.coupon as Coupon);
    toast.success("Cupom aplicado!");
  };

  // Preview em tempo real: revalida ao mudar subtotal/telefone quando há cupom aplicado.
  useEffect(() => {
    if (!coupon) return;
    const t = setTimeout(async () => {
      const { data } = await supabase.rpc("validate_public_coupon", {
        p_restaurant_id: restaurant.id,
        p_code: coupon.code,
        p_subtotal: subtotal,
        p_phone: phone.trim() || null,
      } as never);
      const r = data as any;
      if (!r?.ok) {
        setCoupon(null);
        const err = r?.error;
        if (err === "first_purchase_only") toast.error("Cupom só vale na primeira compra — removido.");
        else if (err === "min_order") toast.error(`Cupom removido: pedido abaixo do mínimo (R$ ${Number(r.min_order).toFixed(2)}).`);
        else if (err === "customer_limit") toast.error("Cupom removido: limite por cliente atingido.");
        else toast.error("Cupom não é mais válido — removido.");
      }
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subtotal, phone, coupon?.code]);


  const submit = async () => {
    if (!name.trim() || !phone.trim()) return toast.error("Preencha nome e telefone");
    if (orderType === "delivery") {
      if (!street || !number) return toast.error("Preencha o endereço");
      if (areas.length > 0 && !area) return toast.error("Selecione o bairro");
      if (area && Number(area.min_order ?? 0) > subtotal) {
        return toast.error(`Pedido mínimo para ${area.neighborhood}: R$ ${Number(area.min_order).toFixed(2)}`);
      }
    }
    setSubmitting(true);

    // Upsert seguro de cliente via RPC (dedup por telefone, valida restaurante ativo)
    let custId: string | null = null;
    try {
      const { data: upsertId, error: upErr } = await supabase.rpc("upsert_public_customer", {
        p_restaurant_id: restaurant.id,
        p_name: name.trim(),
        p_phone: phone.trim(),
        p_email: undefined,
      });
      if (upErr) {
        console.error("upsert_public_customer failed", upErr);
      } else {
        custId = (upsertId as string | null) ?? null;
      }
    } catch (err) {
      console.error("upsert_public_customer exception", err);
    }

    // Contrato novo: envia apenas identificadores e seleção.
    // unit_price é enviado somente como "expectativa visual" — o servidor recalcula
    // e usa esse valor apenas para detectar `price_changed_refresh_menu`.
    const itemsPayload = cart.map((i) => ({
      product_id: i.product.id,
      product_name: i.product.name,
      quantity: i.qty,
      unit_price: Number(i.product.promo_price ?? i.product.price),
      option_item_ids: [] as string[],
    }));

    const { data: rpcData, error: oErr } = await supabase.rpc("create_public_order", {
      p_restaurant_id: restaurant.id,
      p_customer_id: custId,
      p_customer_name: name.trim(),
      p_customer_phone: phone.trim(),
      p_type: orderType,
      p_payment: payment,
      // Valores enviados apenas por compatibilidade — servidor recalcula tudo.
      p_subtotal: subtotal,
      p_delivery_fee: finalShipping,
      p_discount: coupon?.type === "free_shipping" ? 0 : discount,
      p_total: total,
      p_coupon_code: coupon?.code ?? null,
      p_estimated_minutes: area?.estimated_minutes ?? null,
      p_change_for: payment === "cash" && changeFor ? Number(changeFor) : null,
      p_notes: notes.trim() || null,
      p_delivery_address:
        orderType === "delivery"
          ? { street, number, neighborhood: area?.neighborhood ?? null, complement: complement || null }
          : null,
      p_items: itemsPayload,
    } as never);


    if (oErr || !rpcData) {
      setSubmitting(false);
      const msg = oErr?.message ?? "";
      if (msg.includes("plan_limit_reached")) {
        return toast.error("Esta loja atingiu o limite de pedidos do mês. Tente novamente em breve.");
      }
      if (msg.includes("restaurant_closed")) return toast.error("A loja está fechada no momento.");
      if (msg.includes("price_changed_refresh_menu"))
        return toast.error("Os preços foram atualizados. Revise seu carrinho antes de finalizar.");
      if (msg.includes("delivery_area_required")) return toast.error("Selecione um bairro para a entrega.");
      if (msg.includes("delivery_area_not_found"))
        return toast.error("Este bairro não faz parte da área de entrega da loja.");
      if (msg.includes("delivery_min_order"))
        return toast.error("Pedido abaixo do mínimo para o bairro selecionado.");
      if (msg.includes("too_many_items")) return toast.error("Pedido muito grande. Divida em pedidos menores.");
      if (msg.includes("too_many_options")) return toast.error("Excesso de adicionais em um item.");
      if (msg.includes("product_archived") || msg.includes("product_unavailable"))
        return toast.error("Um dos itens não está mais disponível. Atualize o cardápio.");
      if (msg.includes("required_group_missing"))
        return toast.error("Selecione as opções obrigatórias antes de finalizar.");
      if (msg.includes("min_select_violation")) return toast.error("Selecione a quantidade mínima de opções.");
      if (msg.includes("max_select_violation")) return toast.error("Selecione a quantidade máxima de opções.");
      if (msg.includes("invalid_option_item")) return toast.error("Adicional inválido para este produto.");
      if (msg.includes("coupon_not_started")) return toast.error("Cupom ainda não está válido.");
      if (msg.includes("coupon_expired")) return toast.error("Cupom expirado.");
      if (msg.includes("coupon_exhausted")) return toast.error("Cupom esgotado.");
      if (msg.includes("coupon_customer_limit")) return toast.error("Você já usou este cupom o máximo de vezes.");
      if (msg.includes("coupon_first_purchase_only")) return toast.error("Cupom exclusivo para a primeira compra.");
      if (msg.includes("coupon_min_order")) return toast.error("Pedido não atinge o mínimo para este cupom.");
      if (msg.includes("coupon_invalid")) return toast.error("Cupom inválido.");
      return toast.error(msg || "Erro ao criar pedido");
    }
    const order = rpcData as { id: string; order_number: number };



    setSubmitting(false);
    toast.success("Pedido enviado!");

    // Envia resumo do pedido pelo WhatsApp do restaurante
    const waDigits = (restaurant.whatsapp ?? "").replace(/\D/g, "");
    if (waDigits.length >= 10) {
      const lines: string[] = [];
      lines.push(`*Novo pedido — ${restaurant.name}*`);
      lines.push("");
      lines.push(`*Cliente:* ${name.trim()}`);
      lines.push(`*Telefone:* ${phone.trim()}`);
      lines.push(`*Tipo:* ${orderType === "delivery" ? "Entrega" : "Retirada"}`);
      if (orderType === "delivery") {
        const addr = `${street}, ${number}${complement ? " — " + complement : ""}${area?.neighborhood ? " (" + area.neighborhood + ")" : ""}`;
        lines.push(`*Endereço:* ${addr}`);
      }
      const payLabel = payment === "pix" ? "PIX" : payment === "cash" ? "Dinheiro" : payment === "credit_card" ? "Cartão de crédito" : "Cartão de débito";
      lines.push(`*Pagamento:* ${payLabel}`);
      if (payment === "cash" && changeFor) lines.push(`*Troco para:* R$ ${Number(changeFor).toFixed(2)}`);
      lines.push("");
      lines.push("*Itens:*");
      cart.forEach((i) => {
        const price = Number(i.product.promo_price ?? i.product.price);
        lines.push(`• ${i.qty}x ${i.product.name} — R$ ${(price * i.qty).toFixed(2)}`);
      });
      lines.push("");
      lines.push(`*Subtotal:* R$ ${subtotal.toFixed(2)}`);
      if (finalShipping > 0) lines.push(`*Entrega:* R$ ${finalShipping.toFixed(2)}`);
      if (discount > 0 && coupon?.type !== "free_shipping") lines.push(`*Desconto:* -R$ ${discount.toFixed(2)}`);
      if (coupon) lines.push(`*Cupom:* ${coupon.code}`);
      lines.push(`*Total:* R$ ${total.toFixed(2)}`);
      if (notes.trim()) { lines.push(""); lines.push(`*Observações:* ${notes.trim()}`); }
      const url = `https://wa.me/${waDigits.startsWith("55") ? waDigits : "55" + waDigits}?text=${encodeURIComponent(lines.join("\n"))}`;
      window.open(url, "_blank", "noopener,noreferrer");
    }

    onSuccess(order.id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-[95vw] max-h-[90dvh] overflow-hidden p-0 rounded-2xl sm:rounded-3xl border-4 border-ink shadow-brutal-lg flex flex-col">
        <DialogHeader className="p-4 sm:p-6 border-b-2 border-ink shrink-0 text-left bg-brand-amber/5">
          <DialogTitle className="font-display text-xl sm:text-2xl uppercase italic tracking-tight">Finalizar Pedido</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          <section className="space-y-4">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink/40 border-b border-ink/5 pb-1">Tipo de Pedido</h3>
            <div className="grid grid-cols-2 gap-3">
              {restaurant.accepts_delivery && (
                <button
                  onClick={() => setOrderType("delivery")}
                  className={`p-3 rounded-xl border-2 font-display text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                    orderType === "delivery"
                      ? "bg-brand-orange border-ink shadow-[3px_3px_0_0_oklch(0.12_0.025_25)]"
                      : "bg-background border-ink/10 text-ink/40"
                  }`}
                >
                  <MapPin className="h-4 w-4" /> Entrega
                </button>
              )}
              {restaurant.accepts_pickup && (
                <button
                  onClick={() => setOrderType("pickup")}
                  className={`p-3 rounded-xl border-2 font-display text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                    orderType === "pickup"
                      ? "bg-brand-orange border-ink shadow-[3px_3px_0_0_oklch(0.12_0.025_25)]"
                      : "bg-background border-ink/10 text-ink/40"
                  }`}
                >
                  <Clock className="h-4 w-4" /> Retirada
                </button>
              )}
            </div>
          </section>

          <section className="space-y-4 pt-2">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink/40 border-b border-ink/5 pb-1">Identificação</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider ml-1">Seu Nome</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: João Silva"
                  className="h-12 rounded-xl border-2 border-ink/10 focus:border-ink focus:ring-0 transition-colors"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider ml-1">WhatsApp</Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(11) 99999-9999"
                  className="h-12 rounded-xl border-2 border-ink/10 focus:border-ink focus:ring-0 transition-colors"
                />
              </div>
            </div>
          </section>

          {orderType === "delivery" && (
            <section className="space-y-4 pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink/40 border-b border-ink/5 pb-1">Endereço de Entrega</h3>
              <div className="grid grid-cols-1 gap-4">
                {areas.length > 0 ? (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase tracking-wider ml-1">Bairro / Região</Label>
                    <Select value={areaId} onValueChange={setAreaId}>
                      <SelectTrigger className="h-12 rounded-xl border-2 border-ink/10">
                        <SelectValue placeholder="Selecione seu bairro" />
                      </SelectTrigger>
                      <SelectContent>
                        {areas.map((a) => (
                          <SelectItem key={a.id} value={a.id}>
                            {a.neighborhood} — R$ {Number(a.fee).toFixed(2)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <p className="text-xs text-destructive bg-destructive/5 p-3 rounded-lg border border-destructive/20 italic">A entrega não está disponível no momento.</p>
                )}
                <div className="grid grid-cols-4 gap-3">
                  <div className="col-span-3 space-y-1.5">
                    <Label className="text-xs font-bold uppercase tracking-wider ml-1">Rua / Logradouro</Label>
                    <Input
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      placeholder="Nome da rua"
                      className="h-12 rounded-xl border-2 border-ink/10 focus:border-ink transition-colors"
                    />
                  </div>
                  <div className="col-span-1 space-y-1.5">
                    <Label className="text-xs font-bold uppercase tracking-wider ml-1">Nº</Label>
                    <Input
                      value={number}
                      onChange={(e) => setNumber(e.target.value)}
                      placeholder="123"
                      className="h-12 rounded-xl border-2 border-ink/10 focus:border-ink transition-colors"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider ml-1">Complemento / Referência</Label>
                  <Input
                    value={complement}
                    onChange={(e) => setComplement(e.target.value)}
                    placeholder="Apto, bloco, etc."
                    className="h-12 rounded-xl border-2 border-ink/10 focus:border-ink transition-colors"
                  />
                </div>
              </div>
            </section>
          )}

          <section className="space-y-4 pt-2">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink/40 border-b border-ink/5 pb-1">Pagamento</h3>
            <div className="space-y-1.5">
              {(allowPix || allowCash || allowCard) ? (
                <Select value={payment} onValueChange={(v) => setPayment(v as any)}>
                  <SelectTrigger className="h-12 rounded-xl border-2 border-ink/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {allowPix && <SelectItem value="pix">PIX (confirmado na hora)</SelectItem>}
                    {allowCash && <SelectItem value="cash">Dinheiro</SelectItem>}
                    {allowCard && <SelectItem value="credit_card">Cartão de Crédito</SelectItem>}
                    {allowCard && <SelectItem value="debit_card">Cartão de Débito</SelectItem>}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-xs text-destructive italic">Formas de pagamento não configuradas.</p>
              )}
              {allowPix && (
                <p className="text-[10px] text-ink/40 font-bold uppercase tracking-widest ml-1 mt-1">
                   Pix agiliza seu pedido — confirmação imediata.
                </p>
              )}
            </div>

            {payment === "cash" && (
              <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                <Label className="text-xs font-bold uppercase tracking-wider ml-1">Troco para</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={changeFor}
                  onChange={(e) => setChangeFor(e.target.value)}
                  placeholder="Ex: 100.00"
                  className="h-12 rounded-xl border-2 border-ink/10 focus:border-ink transition-colors"
                />
              </div>
            )}
          </section>

          <section className="space-y-4 pt-2 pb-2">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink/40 border-b border-ink/5 pb-1">Extras</h3>
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="TEM CUPOM?"
                  className="h-12 rounded-xl border-2 border-ink/10 focus:border-ink font-display uppercase tracking-widest placeholder:opacity-50"
                />
                <Button
                  variant="outline"
                  onClick={applyCoupon}
                  disabled={validatingCoupon}
                  className="h-12 px-6 rounded-xl border-2 border-ink font-display text-xs uppercase italic tracking-wider hover:bg-ink hover:text-background transition-all"
                >
                  {validatingCoupon ? "..." : "OK"}
                </Button>
              </div>
              {coupon && (
                <div className="flex items-center justify-between p-3 bg-green-50 border-2 border-green-200 rounded-xl shadow-[2px_2px_0_0_oklch(0.12_0.025_25/0.1)]">
                  <div>
                    <code className="font-display italic text-green-700 text-sm tracking-widest">{coupon.code}</code>
                    <p className="text-[10px] uppercase font-bold text-green-600/60">Cupom Aplicado!</p>
                  </div>
                  <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-green-100 rounded-full" onClick={() => { setCoupon(null); setCouponCode(""); }}>
                     <Minus className="h-3 w-3 text-green-700" />
                  </Button>
                </div>
              )}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider ml-1">Observações</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Ex: sem cebola, retirar na portaria..."
                  className="rounded-xl border-2 border-ink/10 focus:border-ink transition-colors min-h-[80px]"
                />
              </div>
            </div>
          </section>
        </div>

        <div className="p-4 sm:p-6 border-t-2 border-ink bg-background shrink-0 space-y-4 shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
          <div className="space-y-1.5 border-b border-ink/5 pb-3">
             <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest text-ink/40">
                <span>Subtotal</span>
                <span>R$ {subtotal.toFixed(2)}</span>
             </div>
             {orderType === "delivery" && (
                <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest text-ink/40">
                   <span>Entrega {freeShipping && <span className="text-green-600">(grátis)</span>}</span>
                   <span className={freeShipping ? "line-through opacity-50" : ""}>R$ {deliveryFee.toFixed(2)}</span>
                </div>
             )}
             {discount > 0 && coupon?.type !== "free_shipping" && (
                <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest text-green-600">
                   <span>Desconto</span>
                   <span>- R$ {discount.toFixed(2)}</span>
                </div>
             )}
          </div>
          <div className="flex justify-between items-center">
            <span className="font-display text-sm uppercase italic tracking-widest text-ink">Total</span>
            <span className="font-display text-2xl sm:text-3xl italic text-brand-magenta">R$ {total.toFixed(2)}</span>
          </div>
          <Button
            size="lg"
            className="w-full h-14 font-display text-base uppercase tracking-wider rounded-xl bg-ink text-background border-2 border-ink shadow-[4px_4px_0_0_oklch(0.69_0.22_38)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all disabled:opacity-50"
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

// ===== Track order dialog =====
type TrackedOrder = {
  id: string;
  order_number: number;
  status: string;
  total: number;
  created_at: string;
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Aguardando confirmação",
  confirmed: "Confirmado",
  preparing: "Em preparo",
  ready: "Pronto",
  out_for_delivery: "Saiu para entrega",
  delivered: "Entregue",
  cancelled: "Cancelado",
};

function normalizePhone(p: string) {
  return p.replace(/\D/g, "");
}

function TrackOrderDialog({
  open, onOpenChange, restaurantId, brand,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  restaurantId: string;
  brand: string;
}) {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<TrackedOrder[] | null>(null);

  useEffect(() => {
    if (open) {
      const last = localStorage.getItem("track-phone");
      if (last) setPhone(last);
    } else {
      setOrders(null);
    }
  }, [open]);

  const search = async () => {
    const digits = normalizePhone(phone);
    if (digits.length < 8) {
      toast.error("Digite um telefone válido");
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("orders")
      .select("id, order_number, status, total, created_at, customer_phone")
      .eq("restaurant_id", restaurantId)
      .order("created_at", { ascending: false })
      .limit(50);
    setLoading(false);
    if (error) {
      toast.error("Erro ao buscar pedidos");
      return;
    }
    const filtered = (data ?? []).filter(
      (o: any) => normalizePhone(o.customer_phone ?? "") === digits
    ) as TrackedOrder[];
    setOrders(filtered);
    localStorage.setItem("track-phone", phone);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Acompanhar pedido</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Seu telefone (WhatsApp)</Label>
            <div className="flex gap-2 mt-1.5">
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(11) 99999-9999"
                onKeyDown={(e) => { if (e.key === "Enter") search(); }}
              />
              <Button onClick={search} disabled={loading} style={{ background: brand, color: "white" }}>
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {orders !== null && (
            <div className="space-y-2 max-h-[55vh] overflow-y-auto">
              {orders.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  Nenhum pedido encontrado para este telefone.
                </p>
              ) : (
                orders.map((o) => (
                  <button
                    key={o.id}
                    onClick={() => {
                      onOpenChange(false);
                      navigate({ to: "/pedido/$orderId", params: { orderId: o.id } });
                    }}
                    className="w-full text-left border rounded-lg p-3 hover:bg-muted/50 transition"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">Pedido #{o.order_number}</span>
                      <Badge variant="secondary">{STATUS_LABEL[o.status] ?? o.status}</Badge>
                    </div>
                    <div className="flex items-center justify-between mt-1 text-sm text-muted-foreground">
                      <span>{new Date(o.created_at).toLocaleString("pt-BR")}</span>
                      <span className="font-medium text-foreground">R$ {Number(o.total).toFixed(2)}</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
