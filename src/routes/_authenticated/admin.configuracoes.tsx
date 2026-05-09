import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/configuracoes")({
  component: ConfigPage,
  head: () => ({ meta: [{ title: "Configurações — Comanda" }] }),
});

const DAYS = [
  { key: "mon", label: "Segunda" },
  { key: "tue", label: "Terça" },
  { key: "wed", label: "Quarta" },
  { key: "thu", label: "Quinta" },
  { key: "fri", label: "Sexta" },
  { key: "sat", label: "Sábado" },
  { key: "sun", label: "Domingo" },
] as const;

type Restaurant = any;
type DeliveryArea = {
  id: string; neighborhood: string; city: string | null;
  fee: number; min_order: number | null; estimated_minutes: number | null; is_active: boolean | null;
};

function ConfigPage() {
  const { restaurantId } = useAuth();
  const [r, setR] = useState<Restaurant | null>(null);
  const [areas, setAreas] = useState<DeliveryArea[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!restaurantId) return;
    setLoading(true);
    const [rr, aa] = await Promise.all([
      supabase.from("restaurants").select("*").eq("id", restaurantId).maybeSingle(),
      supabase.from("delivery_areas").select("*").eq("restaurant_id", restaurantId).order("neighborhood"),
    ]);
    setR(rr.data);
    setAreas((aa.data ?? []) as DeliveryArea[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, [restaurantId]);

  if (!restaurantId) return <div className="p-8">Configure seu restaurante primeiro.</div>;
  if (loading || !r) return <div className="p-8 text-muted-foreground">Carregando…</div>;

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-2">Configurações</h1>
      <p className="text-muted-foreground mb-6">Personalize sua loja e regras de entrega</p>

      <Tabs defaultValue="geral">
        <TabsList className="mb-4">
          <TabsTrigger value="geral">Geral</TabsTrigger>
          <TabsTrigger value="aparencia">Aparência</TabsTrigger>
          <TabsTrigger value="horarios">Horários</TabsTrigger>
          <TabsTrigger value="entrega">Áreas de entrega</TabsTrigger>
          <TabsTrigger value="pagamentos">Pagamentos</TabsTrigger>
        </TabsList>

        <TabsContent value="geral"><GeralTab r={r} onSaved={load} /></TabsContent>
        <TabsContent value="aparencia"><AparenciaTab r={r} restaurantId={restaurantId} onSaved={load} /></TabsContent>
        <TabsContent value="horarios"><HorariosTab r={r} onSaved={load} /></TabsContent>
        <TabsContent value="entrega"><AreasTab areas={areas} restaurantId={restaurantId} onSaved={load} /></TabsContent>
        <TabsContent value="pagamentos"><PagamentosTab r={r} onSaved={load} /></TabsContent>
      </Tabs>
    </div>
  );
}

function GeralTab({ r, onSaved }: { r: Restaurant; onSaved: () => void }) {
  const [name, setName] = useState(r.name);
  const [description, setDescription] = useState(r.description ?? "");
  const [whatsapp, setWhatsapp] = useState(r.whatsapp ?? "");
  const [phone, setPhone] = useState(r.phone ?? "");
  const [email, setEmail] = useState(r.email ?? "");
  const [isOpen, setIsOpen] = useState(!!r.is_open);
  const [acceptsDelivery, setAcceptsDelivery] = useState(!!r.accepts_delivery);
  const [acceptsPickup, setAcceptsPickup] = useState(!!r.accepts_pickup);
  const [minOrder, setMinOrder] = useState(String(r.min_order_value ?? 0));
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("restaurants").update({
      name, description: description || null, whatsapp: whatsapp || null,
      phone: phone || null, email: email || null, is_open: isOpen,
      accepts_delivery: acceptsDelivery, accepts_pickup: acceptsPickup,
      min_order_value: Number(minOrder) || 0,
    }).eq("id", r.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Configurações salvas");
    onSaved();
  };

  return (
    <Card className="p-6 space-y-4">
      <div><Label>Nome do restaurante</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
      <div><Label>Descrição</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} /></div>
      <div className="grid grid-cols-3 gap-3">
        <div><Label>WhatsApp</Label><Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} /></div>
        <div><Label>Telefone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
        <div><Label>E-mail</Label><Input value={email} onChange={(e) => setEmail(e.target.value)} /></div>
      </div>
      <div><Label>Pedido mínimo (R$)</Label><Input type="number" step="0.01" value={minOrder} onChange={(e) => setMinOrder(e.target.value)} /></div>

      <div className="space-y-3 pt-3 border-t">
        <Toggle label="Loja aberta agora" value={isOpen} onChange={setIsOpen} />
        <Toggle label="Aceita entrega" value={acceptsDelivery} onChange={setAcceptsDelivery} />
        <Toggle label="Aceita retirada no local" value={acceptsPickup} onChange={setAcceptsPickup} />
      </div>

      <Button onClick={save} disabled={saving}>{saving ? "Salvando…" : "Salvar"}</Button>
    </Card>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      <Label>{label}</Label>
      <Switch checked={value} onCheckedChange={onChange} />
    </div>
  );
}

function AparenciaTab({ r, restaurantId, onSaved }: { r: Restaurant; restaurantId: string; onSaved: () => void }) {
  const [logoUrl, setLogoUrl] = useState<string | null>(r.logo_url);
  const [coverUrl, setCoverUrl] = useState<string | null>(r.cover_url);
  const [primary, setPrimary] = useState(r.primary_color ?? "#0A1628");
  const [accent, setAccent] = useState(r.accent_color ?? "#FFC627");
  const [saving, setSaving] = useState(false);
  const logoRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);

  const upload = async (file: File, kind: "logo" | "cover") => {
    const ext = file.name.split(".").pop();
    const path = `${restaurantId}/${kind}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file);
    if (error) return toast.error(error.message);
    const { data } = supabase.storage.from("product-images").getPublicUrl(path);
    if (kind === "logo") setLogoUrl(data.publicUrl); else setCoverUrl(data.publicUrl);
  };

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("restaurants").update({
      logo_url: logoUrl, cover_url: coverUrl, primary_color: primary, accent_color: accent,
    }).eq("id", r.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Aparência atualizada");
    onSaved();
  };

  return (
    <Card className="p-6 space-y-6">
      <div>
        <Label>Logo</Label>
        <div className="flex items-center gap-4 mt-2">
          <button onClick={() => logoRef.current?.click()} className="h-24 w-24 rounded-xl bg-muted border-2 border-dashed grid place-items-center overflow-hidden">
            {logoUrl ? <img src={logoUrl} className="h-full w-full object-cover" /> : <Upload className="h-5 w-5 text-muted-foreground" />}
          </button>
          <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0], "logo")} />
          {logoUrl && <Button variant="ghost" size="sm" onClick={() => setLogoUrl(null)}>Remover</Button>}
        </div>
      </div>

      <div>
        <Label>Capa</Label>
        <button onClick={() => coverRef.current?.click()} className="mt-2 w-full h-32 rounded-xl bg-muted border-2 border-dashed grid place-items-center overflow-hidden">
          {coverUrl ? <img src={coverUrl} className="h-full w-full object-cover" /> : <Upload className="h-5 w-5 text-muted-foreground" />}
        </button>
        <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0], "cover")} />
        {coverUrl && <Button variant="ghost" size="sm" className="mt-2" onClick={() => setCoverUrl(null)}>Remover capa</Button>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Cor principal</Label>
          <div className="flex items-center gap-2 mt-1">
            <input type="color" value={primary} onChange={(e) => setPrimary(e.target.value)} className="h-10 w-14 rounded border cursor-pointer" />
            <Input value={primary} onChange={(e) => setPrimary(e.target.value)} />
          </div>
        </div>
        <div>
          <Label>Cor de destaque</Label>
          <div className="flex items-center gap-2 mt-1">
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="h-10 w-14 rounded border cursor-pointer" />
            <Input value={accent} onChange={(e) => setAccent(e.target.value)} />
          </div>
        </div>
      </div>

      <Button onClick={save} disabled={saving}>{saving ? "Salvando…" : "Salvar"}</Button>
    </Card>
  );
}

function HorariosTab({ r, onSaved }: { r: Restaurant; onSaved: () => void }) {
  const initial: Record<string, { open: string; close: string; closed: boolean }> = {};
  DAYS.forEach((d) => {
    const v = r.opening_hours?.[d.key];
    initial[d.key] = { open: v?.open ?? "18:00", close: v?.close ?? "23:00", closed: v?.closed ?? false };
  });
  const [hours, setHours] = useState(initial);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("restaurants").update({ opening_hours: hours }).eq("id", r.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Horários salvos");
    onSaved();
  };

  return (
    <Card className="p-6 space-y-3">
      {DAYS.map((d) => (
        <div key={d.key} className="flex items-center gap-3">
          <span className="w-24 text-sm font-medium">{d.label}</span>
          <Switch checked={!hours[d.key].closed} onCheckedChange={(v) => setHours({ ...hours, [d.key]: { ...hours[d.key], closed: !v } })} />
          {!hours[d.key].closed ? (
            <>
              <Input type="time" value={hours[d.key].open} onChange={(e) => setHours({ ...hours, [d.key]: { ...hours[d.key], open: e.target.value } })} className="w-32" />
              <span className="text-muted-foreground">às</span>
              <Input type="time" value={hours[d.key].close} onChange={(e) => setHours({ ...hours, [d.key]: { ...hours[d.key], close: e.target.value } })} className="w-32" />
            </>
          ) : (
            <span className="text-sm text-muted-foreground">Fechado</span>
          )}
        </div>
      ))}
      <Button onClick={save} disabled={saving} className="mt-4">{saving ? "Salvando…" : "Salvar horários"}</Button>
    </Card>
  );
}

function AreasTab({ areas, restaurantId, onSaved }: { areas: DeliveryArea[]; restaurantId: string; onSaved: () => void }) {
  const [neighborhood, setNeighborhood] = useState("");
  const [fee, setFee] = useState("");
  const [minOrder, setMinOrder] = useState("");
  const [minutes, setMinutes] = useState("");
  const [saving, setSaving] = useState(false);

  const add = async () => {
    if (!neighborhood.trim()) return toast.error("Bairro obrigatório");
    setSaving(true);
    const { error } = await supabase.from("delivery_areas").insert({
      restaurant_id: restaurantId,
      neighborhood: neighborhood.trim(),
      fee: Number(fee) || 0,
      min_order: Number(minOrder) || 0,
      estimated_minutes: Number(minutes) || 30,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    setNeighborhood(""); setFee(""); setMinOrder(""); setMinutes("");
    onSaved();
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir bairro?")) return;
    await supabase.from("delivery_areas").delete().eq("id", id);
    onSaved();
  };

  const toggle = async (a: DeliveryArea) => {
    await supabase.from("delivery_areas").update({ is_active: !a.is_active }).eq("id", a.id);
    onSaved();
  };

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <h3 className="font-semibold mb-3">Adicionar bairro</h3>
        <div className="grid grid-cols-12 gap-2 items-end">
          <div className="col-span-4"><Label>Bairro</Label><Input value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} /></div>
          <div className="col-span-2"><Label>Frete (R$)</Label><Input type="number" step="0.01" value={fee} onChange={(e) => setFee(e.target.value)} /></div>
          <div className="col-span-2"><Label>Mín. pedido</Label><Input type="number" step="0.01" value={minOrder} onChange={(e) => setMinOrder(e.target.value)} /></div>
          <div className="col-span-2"><Label>Tempo (min)</Label><Input type="number" value={minutes} onChange={(e) => setMinutes(e.target.value)} /></div>
          <div className="col-span-2"><Button onClick={add} disabled={saving} className="w-full"><Plus className="h-4 w-4 mr-1" />Adicionar</Button></div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold mb-3">Bairros atendidos ({areas.length})</h3>
        {areas.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum bairro cadastrado.</p>
        ) : (
          <div className="space-y-2">
            {areas.map((a) => (
              <div key={a.id} className="flex items-center gap-3 p-3 border rounded-lg">
                <div className="flex-1">
                  <p className="font-medium">{a.neighborhood}</p>
                  <p className="text-xs text-muted-foreground">
                    R$ {Number(a.fee).toFixed(2)} · mín R$ {Number(a.min_order).toFixed(2)} · {a.estimated_minutes ?? 30}min
                  </p>
                </div>
                <Switch checked={!!a.is_active} onCheckedChange={() => toggle(a)} />
                <Button size="icon" variant="ghost" onClick={() => remove(a.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
