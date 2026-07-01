import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2, Tag } from "lucide-react";
import { toast } from "sonner";
import { FeatureGate } from "@/components/FeatureGate";

export const Route = createFileRoute("/_authenticated/admin/cupons")({
  component: CuponsGated,
  head: () => ({ meta: [{ title: "Cupons — Comandex" }] }),
});

function CuponsGated() {
  return (
    <FeatureGate feature="coupons">
      <CuponsPage />
    </FeatureGate>
  );
}

type CouponType = "percentage" | "fixed" | "free_shipping";
type Coupon = {
  id: string; code: string; type: CouponType; value: number;
  min_order: number | null; max_uses: number | null; uses_count: number | null;
  expires_at: string | null; starts_at: string | null;
  max_uses_per_customer: number | null; is_active: boolean | null;
};

function CuponsPage() {
  const { restaurantId } = useAuth();
  const [list, setList] = useState<Coupon[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);

  const load = async () => {
    if (!restaurantId) return;
    const { data } = await supabase.from("coupons").select("*").eq("restaurant_id", restaurantId).order("created_at", { ascending: false });
    setList((data ?? []) as Coupon[]);
  };

  useEffect(() => { load(); }, [restaurantId]);

  const remove = async (id: string) => {
    if (!confirm("Excluir cupom?")) return;
    await supabase.from("coupons").delete().eq("id", id);
    load();
  };

  const toggle = async (c: Coupon) => {
    await supabase.from("coupons").update({ is_active: !c.is_active }).eq("id", c.id);
    load();
  };

  if (!restaurantId) return <div className="p-4 md:p-8">Configure seu restaurante primeiro.</div>;

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-4xl md:text-5xl text-ink tracking-tight leading-[0.95]">Cupons</h1>
          <p className="text-muted-foreground">Crie descontos para seus clientes</p>
        </div>
        <Button onClick={() => { setEditing(null); setOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" /> Novo cupom
        </Button>
      </div>

      {list.length === 0 ? (
        <Card className="p-12 text-center">
          <Tag className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <h3 className="font-semibold">Nenhum cupom criado</h3>
          <p className="text-sm text-muted-foreground mt-1">Crie cupons promocionais para atrair clientes.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {list.map((c) => {
            const expired = c.expires_at && new Date(c.expires_at) < new Date();
            const usedUp = c.max_uses && (c.uses_count ?? 0) >= c.max_uses;
            return (
              <Card key={c.id} className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <code className="font-mono font-bold text-lg">{c.code}</code>
                    <p className="text-sm text-muted-foreground mt-1">
                      {c.type === "percentage" && `${c.value}% off`}
                      {c.type === "fixed" && `R$ ${Number(c.value).toFixed(2)} off`}
                      {c.type === "free_shipping" && "Frete grátis"}
                    </p>
                  </div>
                  <Switch checked={!!c.is_active} onCheckedChange={() => toggle(c)} />
                </div>
                <div className="flex flex-wrap gap-1 mb-3">
                  {Number(c.min_order) > 0 && <Badge variant="outline">mín R$ {Number(c.min_order).toFixed(2)}</Badge>}
                  {c.max_uses && <Badge variant="outline">{c.uses_count ?? 0}/{c.max_uses} usos</Badge>}
                  {expired && <Badge variant="destructive">Expirado</Badge>}
                  {usedUp && <Badge variant="destructive">Esgotado</Badge>}
                </div>
                <div className="flex gap-1 justify-end">
                  <Button size="icon" variant="ghost" onClick={() => { setEditing(c); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => remove(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <CouponDialog open={open} onOpenChange={setOpen} editing={editing} restaurantId={restaurantId} onSaved={load} />
    </div>
  );
}

function CouponDialog({ open, onOpenChange, editing, restaurantId, onSaved }: {
  open: boolean; onOpenChange: (o: boolean) => void;
  editing: Coupon | null; restaurantId: string; onSaved: () => void;
}) {
  const [code, setCode] = useState("");
  const [type, setType] = useState<CouponType>("percentage");
  const [value, setValue] = useState("");
  const [minOrder, setMinOrder] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [maxUsesPerCustomer, setMaxUsesPerCustomer] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setCode(editing?.code ?? "");
      setType(editing?.type ?? "percentage");
      setValue(editing?.value != null ? String(editing.value) : "");
      setMinOrder(editing?.min_order != null ? String(editing.min_order) : "");
      setMaxUses(editing?.max_uses != null ? String(editing.max_uses) : "");
      setMaxUsesPerCustomer(editing?.max_uses_per_customer != null ? String(editing.max_uses_per_customer) : "");
      setStartsAt(editing?.starts_at ? editing.starts_at.slice(0, 16) : "");
      setExpiresAt(editing?.expires_at ? editing.expires_at.slice(0, 16) : "");
    }
  }, [open, editing]);

  const save = async () => {
    if (!code.trim()) return toast.error("Código obrigatório");
    if (type === "percentage") {
      const n = Number(value);
      if (!(n > 0 && n <= 100)) return toast.error("Percentual entre 1 e 100");
    }
    if (type === "fixed" && !(Number(value) > 0)) return toast.error("Valor de desconto inválido");
    if (startsAt && expiresAt && new Date(startsAt) >= new Date(expiresAt)) {
      return toast.error("Data de início deve ser antes da expiração");
    }
    setSaving(true);
    const payload = {
      restaurant_id: restaurantId,
      code: code.trim().toUpperCase(),
      type,
      value: type === "free_shipping" ? 0 : Number(value) || 0,
      min_order: Number(minOrder) || 0,
      max_uses: maxUses ? Number(maxUses) : null,
      max_uses_per_customer: maxUsesPerCustomer ? Number(maxUsesPerCustomer) : null,
      starts_at: startsAt ? new Date(startsAt).toISOString() : null,
      expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
    };
    const { error } = editing
      ? await supabase.from("coupons").update(payload).eq("id", editing.id)
      : await supabase.from("coupons").insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(editing ? "Cupom atualizado" : "Cupom criado");
    onOpenChange(false);
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{editing ? "Editar cupom" : "Novo cupom"}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Código *</Label>
            <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="BEMVINDO10" className="font-mono" />
          </div>
          <div>
            <Label>Tipo de desconto</Label>
            <Select value={type} onValueChange={(v) => setType(v as CouponType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="percentage">Percentual (%)</SelectItem>
                <SelectItem value="fixed">Valor fixo (R$)</SelectItem>
                <SelectItem value="free_shipping">Frete grátis</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {type !== "free_shipping" && (
            <div>
              <Label>Valor do desconto {type === "percentage" ? "(%)" : "(R$)"}</Label>
              <Input type="number" step="0.01" value={value} onChange={(e) => setValue(e.target.value)} />
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Pedido mín. (R$)</Label><Input type="number" step="0.01" value={minOrder} onChange={(e) => setMinOrder(e.target.value)} /></div>
            <div><Label>Limite de usos</Label><Input type="number" value={maxUses} onChange={(e) => setMaxUses(e.target.value)} placeholder="Ilimitado" /></div>
          </div>
          <div>
            <Label>Expira em</Label>
            <Input type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
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
