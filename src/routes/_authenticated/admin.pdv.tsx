import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Minus, Trash2, ShoppingCart, Search } from "lucide-react";
import { FeatureGate } from "@/components/FeatureGate";
import { PageContainer } from "@/components/ds";

export const Route = createFileRoute("/_authenticated/admin/pdv")({
  component: PdvGated,
  head: () => ({ meta: [{ title: "PDV Manual — Comandex" }] }),
});

function PdvGated() {
  return (
    <FeatureGate feature="manual_pdv">
      <PdvPage />
    </FeatureGate>
  );
}

type Product = {
  id: string;
  name: string;
  price: number;
  promo_price: number | null;
  category_id: string | null;
  image_url: string | null;
  is_available: boolean;
};
type Category = { id: string; name: string; position: number | null };
type CartLine = { product_id: string; name: string; unit_price: number; quantity: number; notes: string };

function PdvPage() {
  const { restaurantId } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState<string>("all");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [customer, setCustomer] = useState({ name: "", phone: "" });
  const [type, setType] = useState<"pickup" | "delivery" | "dine_in">("pickup");
  const [payment, setPayment] = useState<"cash" | "pix" | "credit_card" | "debit_card">("cash");
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!restaurantId) return;
    (async () => {
      const [p, c] = await Promise.all([
        supabase.from("products").select("id,name,price,promo_price,category_id,image_url,is_available").eq("restaurant_id", restaurantId).eq("is_available", true).order("name"),
        supabase.from("categories").select("id,name,position").eq("restaurant_id", restaurantId).order("position"),
      ]);
      setProducts((p.data as Product[]) || []);
      setCategories((c.data as Category[]) || []);
    })();
  }, [restaurantId]);

  const filtered = useMemo(() => {
    return products.filter(p =>
      (activeCat === "all" || p.category_id === activeCat) &&
      (search === "" || p.name.toLowerCase().includes(search.toLowerCase()))
    );
  }, [products, activeCat, search]);

  const addToCart = (p: Product) => {
    const price = Number(p.promo_price ?? p.price);
    setCart(prev => {
      const i = prev.findIndex(l => l.product_id === p.id);
      if (i >= 0) {
        const copy = [...prev];
        copy[i] = { ...copy[i], quantity: copy[i].quantity + 1 };
        return copy;
      }
      return [...prev, { product_id: p.id, name: p.name, unit_price: price, quantity: 1, notes: "" }];
    });
  };
  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev.flatMap(l => {
      if (l.product_id !== id) return [l];
      const q = l.quantity + delta;
      return q <= 0 ? [] : [{ ...l, quantity: q }];
    }));
  };
  const removeLine = (id: string) => setCart(prev => prev.filter(l => l.product_id !== id));

  // Buscar cliente já existente desta loja pelo telefone
  const lookupCustomer = async () => {
    if (!restaurantId) return;
    const digits = customer.phone.replace(/\D/g, "");
    if (digits.length < 8) return toast.error("Digite o telefone primeiro");
    const { data } = await supabase
      .from("customers")
      .select("name,phone")
      .eq("restaurant_id", restaurantId)
      .ilike("phone", `%${digits}%`)
      .order("last_order_at", { ascending: false, nullsFirst: false })
      .limit(1);
    const c = (data ?? [])[0];
    if (!c) return toast.info("Cliente novo nesta loja");
    setCustomer({ name: c.name, phone: c.phone });
    toast.success(`Cliente encontrado: ${c.name}`);
  };

  const subtotal = cart.reduce((s, l) => s + l.unit_price * l.quantity, 0);
  const total = Math.max(0, subtotal + (type === "delivery" ? Number(deliveryFee) : 0) - Number(discount));

  const submit = async () => {
    if (!restaurantId) return;
    if (cart.length === 0) return toast.error("Adicione produtos");
    if (!customer.name.trim() || !customer.phone.trim()) return toast.error("Informe nome e telefone do cliente");
    setSaving(true);
    try {
      const { data: order, error } = await supabase.from("orders").insert({
        restaurant_id: restaurantId,
        customer_name: customer.name.trim(),
        customer_phone: customer.phone.trim(),
        type,
        payment,
        status: "confirmed",
        payment_status: payment === "cash" ? "pending" : "paid",
        subtotal,
        delivery_fee: type === "delivery" ? Number(deliveryFee) : 0,
        discount: Number(discount),
        total,
        notes: notes || null,
        source: "manual",
      }).select("id,order_number").single();
      if (error) throw error;

      const items = cart.map(l => ({
        order_id: order.id,
        product_id: l.product_id,
        product_name: l.name,
        quantity: l.quantity,
        unit_price: l.unit_price,
        subtotal: l.unit_price * l.quantity,
        notes: l.notes || null,
      }));
      const { error: itemsErr } = await supabase.from("order_items").insert(items);
      if (itemsErr) throw itemsErr;

      toast.success(`Pedido #${order.order_number} criado!`);
      setCart([]); setCustomer({ name: "", phone: "" }); setDeliveryFee(0); setDiscount(0); setNotes("");
    } catch (e: any) {
      const msg = e?.message || "";
      if (msg.includes("plan_limit_reached")) {
        toast.error("Você atingiu o limite mensal de pedidos do seu plano. Faça upgrade em Configurações.");
      } else {
        toast.error(msg || "Erro ao salvar pedido");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 md:p-6 grid lg:grid-cols-[1fr_400px] gap-4 max-w-[1600px] mx-auto">
      {/* Produtos */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <ShoppingCart className="h-6 w-6 text-brand-orange" />
          <h1 className="text-2xl font-display uppercase tracking-tight">PDV Manual</h1>
        </div>

        <div className="relative mb-3">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink/50" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar produto..." className="pl-9 border-2 border-ink" />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 mb-3">
          <button onClick={() => setActiveCat("all")} className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold uppercase border-2 border-ink ${activeCat === "all" ? "bg-ink text-background" : "bg-background"}`}>Todos</button>
          {categories.map(c => (
            <button key={c.id} onClick={() => setActiveCat(c.id)} className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold uppercase border-2 border-ink ${activeCat === c.id ? "bg-ink text-background" : "bg-background"}`}>{c.name}</button>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
          {filtered.map(p => {
            const price = Number(p.promo_price ?? p.price);
            return (
              <button key={p.id} onClick={() => addToCart(p)} className="text-left rounded-2xl border-2 border-ink bg-background shadow-brutal hover:-translate-y-0.5 transition p-3">
                {p.image_url && <img src={p.image_url} alt={p.name} className="w-full aspect-square object-cover rounded-xl mb-2 border-2 border-ink" />}
                <div className="font-bold text-sm leading-tight line-clamp-2">{p.name}</div>
                <div className="mt-1 text-brand-orange font-display">R$ {price.toFixed(2)}</div>
              </button>
            );
          })}
          {filtered.length === 0 && <div className="col-span-full text-ink/50 text-center py-12">Nenhum produto</div>}
        </div>
      </div>

      {/* Carrinho */}
      <aside className="lg:sticky lg:top-4 lg:self-start border-2 border-ink rounded-2xl bg-background shadow-brutal-lg p-4">
        <h2 className="font-display uppercase text-lg mb-3">Pedido</h2>

        <div className="space-y-2 mb-4 max-h-72 overflow-y-auto">
          {cart.length === 0 && <div className="text-ink/50 text-sm py-6 text-center border-2 border-dashed border-ink/20 rounded-xl">Toque nos produtos para adicionar</div>}
          {cart.map(l => (
            <div key={l.product_id} className="flex items-center gap-2 p-2 border-2 border-ink/10 rounded-xl">
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm truncate">{l.name}</div>
                <div className="text-xs text-ink/60">R$ {l.unit_price.toFixed(2)}</div>
              </div>
              <div className="flex items-center gap-1">
                <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateQty(l.product_id, -1)}><Minus className="h-3 w-3" /></Button>
                <span className="w-6 text-center font-bold text-sm">{l.quantity}</span>
                <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateQty(l.product_id, +1)}><Plus className="h-3 w-3" /></Button>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => removeLine(l.product_id)}><Trash2 className="h-3 w-3" /></Button>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-2 mb-3">
          <div>
            <Label>Cliente</Label>
            <Input value={customer.name} onChange={e => setCustomer(c => ({ ...c, name: e.target.value }))} placeholder="Nome" className="border-2 border-ink" />
          </div>
          <div>
            <Label>Telefone / WhatsApp</Label>
            <div className="flex gap-2">
              <Input value={customer.phone} onChange={e => setCustomer(c => ({ ...c, phone: e.target.value }))} placeholder="(27) 9..." className="border-2 border-ink" onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); lookupCustomer(); } }} />
              <Button type="button" variant="outline" size="icon" className="shrink-0 border-2 border-ink" onClick={lookupCustomer} title="Buscar cliente"><Search className="h-4 w-4" /></Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Tipo</Label>
              <Select value={type} onValueChange={(v) => setType(v as any)}>
                <SelectTrigger className="border-2 border-ink"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pickup">Retirada</SelectItem>
                  <SelectItem value="delivery">Entrega</SelectItem>
                  <SelectItem value="dine_in">Mesa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Pagamento</Label>
              <Select value={payment} onValueChange={(v) => setPayment(v as any)}>
                <SelectTrigger className="border-2 border-ink"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Dinheiro</SelectItem>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="credit_card">Crédito</SelectItem>
                  <SelectItem value="debit_card">Débito</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {type === "delivery" && (
            <div>
              <Label>Taxa entrega (R$)</Label>
              <Input type="number" step="0.01" value={deliveryFee} onChange={e => setDeliveryFee(Number(e.target.value))} className="border-2 border-ink" />
            </div>
          )}
          <div>
            <Label>Desconto (R$)</Label>
            <Input type="number" step="0.01" value={discount} onChange={e => setDiscount(Number(e.target.value))} className="border-2 border-ink" />
          </div>
          <div>
            <Label>Observações</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="border-2 border-ink" />
          </div>
        </div>

        <div className="space-y-1 text-sm border-t-2 border-ink pt-3">
          <div className="flex justify-between"><span>Subtotal</span><span>R$ {subtotal.toFixed(2)}</span></div>
          {type === "delivery" && <div className="flex justify-between"><span>Entrega</span><span>R$ {Number(deliveryFee).toFixed(2)}</span></div>}
          {discount > 0 && <div className="flex justify-between text-destructive"><span>Desconto</span><span>- R$ {Number(discount).toFixed(2)}</span></div>}
          <div className="flex justify-between font-display text-xl pt-1"><span>Total</span><span>R$ {total.toFixed(2)}</span></div>
        </div>

        <Button onClick={submit} disabled={saving || cart.length === 0} className="w-full mt-4 bg-ink text-background hover:bg-ink/90 font-bold shadow-brutal h-12 text-base">
          {saving ? "Salvando..." : "Criar pedido manual"}
        </Button>
      </aside>
    </div>
  );
}
