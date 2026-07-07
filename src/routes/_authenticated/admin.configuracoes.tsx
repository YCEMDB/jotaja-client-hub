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
import { Plus, Trash2, Upload, Copy, Check, Printer, MapPin, Eye, EyeOff, ShieldCheck, ShieldAlert, Loader2, Link as LinkIcon, Unplug, Settings2 } from "lucide-react";
import { AdminPageLayout } from "@/components/ds";
import { Badge } from "@/components/ui/badge";
import { useServerFn } from "@tanstack/react-start";
import { verifyMercadoPago } from "@/lib/payments.functions";
import { FeatureGate } from "@/components/FeatureGate";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/admin/configuracoes")({
  component: ConfigPage,
  head: () => ({ meta: [{ title: "Configurações — Comandex" }] }),
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

  if (!restaurantId) return <AdminPageLayout title="Configurações"><p className="text-ink/60">Configure seu restaurante primeiro.</p></AdminPageLayout>;
  if (loading || !r) return <AdminPageLayout title="Configurações"><p className="text-ink/60">Carregando…</p></AdminPageLayout>;

  return (
    <AdminPageLayout
      title="Configurações"
      subtitle="Personalize sua loja e regras de entrega"
      kicker="Ajustes"
      icon={Settings2}
      accent="violet"
      maxWidth="4xl"
    >
      <StoreLinkCard slug={r.slug} />

      <Tabs defaultValue="geral">

        <TabsList className="mb-4 flex-wrap h-auto">
          <TabsTrigger value="geral">Geral</TabsTrigger>
          <TabsTrigger value="aparencia">Aparência</TabsTrigger>
          <TabsTrigger value="horarios">Horários</TabsTrigger>
          <TabsTrigger value="entrega">Áreas de entrega</TabsTrigger>
          <TabsTrigger value="retirada">Retirada</TabsTrigger>
          <TabsTrigger value="impressao">Impressão</TabsTrigger>
          <TabsTrigger value="pagamentos">Pagamentos</TabsTrigger>
        </TabsList>

        <TabsContent value="geral"><GeralTab r={r} onSaved={load} /></TabsContent>
        <TabsContent value="aparencia"><AparenciaTab r={r} restaurantId={restaurantId} onSaved={load} /></TabsContent>
        <TabsContent value="horarios"><HorariosTab r={r} onSaved={load} /></TabsContent>
        <TabsContent value="entrega"><AreasTab areas={areas} restaurantId={restaurantId} onSaved={load} /></TabsContent>
        <TabsContent value="retirada"><RetiradaTab r={r} onSaved={load} /></TabsContent>
        <TabsContent value="impressao"><FeatureGate feature="auto_print"><ImpressaoTab r={r} onSaved={load} /></FeatureGate></TabsContent>
        <TabsContent value="pagamentos"><FeatureGate feature="online_payment"><PagamentosTab r={r} onSaved={load} /></FeatureGate></TabsContent>
      </Tabs>
    </AdminPageLayout>
  );
}

function GeralTab({ r, onSaved }: { r: Restaurant; onSaved: () => void }) {
  const [name, setName] = useState(r.name);
  const [description, setDescription] = useState(r.description ?? "");
  const [whatsapp, setWhatsapp] = useState(r.whatsapp ?? "");
  const [phone, setPhone] = useState(r.phone ?? "");
  const [email, setEmail] = useState(r.email ?? "");
  // is_open é legado/depreciado. Regra oficial vive em Horários (open_mode + opening_hours + timezone).
  const [acceptsDelivery, setAcceptsDelivery] = useState(!!r.accepts_delivery);
  const [acceptsPickup, setAcceptsPickup] = useState(!!r.accepts_pickup);
  const [minOrder, setMinOrder] = useState(String(r.min_order_value ?? 0));
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("restaurants").update({
      name, description: description || null, whatsapp: whatsapp || null,
      phone: phone || null, email: email || null,
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
        <p className="text-xs text-muted-foreground">
          Para abrir/fechar a loja, use a aba <strong>Horários</strong> (modos automático, forçar aberto ou forçar fechado).
        </p>
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
    <Card className="p-4 md:p-6 space-y-6">
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
  const [openMode, setOpenMode] = useState<string>(r.open_mode ?? "auto");
  const [tz, setTz] = useState<string>(r.timezone ?? "America/Sao_Paulo");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("restaurants")
      .update({ opening_hours: hours, open_mode: openMode, timezone: tz })
      .eq("id", r.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Horários salvos");
    onSaved();
  };

  const TZS = [
    "America/Sao_Paulo","America/Manaus","America/Belem","America/Fortaleza",
    "America/Recife","America/Bahia","America/Cuiaba","America/Campo_Grande",
    "America/Porto_Velho","America/Rio_Branco","America/Noronha",
  ];

  return (
    <Card className="p-6 space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label>Modo de funcionamento</Label>
          <select
            value={openMode}
            onChange={(e) => setOpenMode(e.target.value)}
            className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="auto">Automático (seguir horário)</option>
            <option value="force_open">Forçar aberto</option>
            <option value="force_closed">Forçar fechado</option>
          </select>
          <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
            <p><strong>Automático:</strong> abre e fecha sozinho conforme o calendário abaixo.</p>
            <p><strong>Forçar aberto:</strong> aceita pedidos mesmo fora do horário.</p>
            <p><strong>Forçar fechado:</strong> bloqueia pedidos independente do horário.</p>
          </div>
        </div>
        <div>
          <Label>Fuso horário</Label>
          <select
            value={tz}
            onChange={(e) => setTz(e.target.value)}
            className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            {TZS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      <div className="space-y-3 pt-2 border-t">
        {DAYS.map((d) => (
          <div key={d.key} className="flex items-center gap-3 flex-wrap">
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
      </div>
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
  const [catalog, setCatalog] = useState<Array<{ id: string; city: string; name: string }>>([]);
  const [importOpen, setImportOpen] = useState(false);
  const [importCity, setImportCity] = useState<"Vitória" | "Vila Velha">("Vitória");
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [defaultFee, setDefaultFee] = useState("8");
  const [defaultEta, setDefaultEta] = useState("40");

  const loadCatalog = async () => {
    const { data } = await supabase
      .from("delivery_neighborhoods")
      .select("id,city,name")
      .eq("state", "ES")
      .order("city")
      .order("name");
    setCatalog((data ?? []) as any);
  };

  useEffect(() => { loadCatalog(); }, []);

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

  const togglePick = (name: string) => {
    setPicked((s) => {
      const next = new Set(s);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const importPicked = async () => {
    if (picked.size === 0) return toast.error("Selecione pelo menos um bairro");
    const rows = Array.from(picked).map((name) => ({
      restaurant_id: restaurantId,
      neighborhood: name,
      city: importCity,
      fee: Number(defaultFee) || 0,
      estimated_minutes: Number(defaultEta) || 30,
      min_order: 0,
      is_active: true,
    }));
    const { error } = await supabase.from("delivery_areas").insert(rows);
    if (error) return toast.error(error.message);
    toast.success(`${picked.size} bairro(s) importado(s)! Ajuste a taxa de cada um se precisar.`);
    setPicked(new Set());
    setImportOpen(false);
    onSaved();
  };

  const catalogByCity = catalog.filter((c) => c.city === importCity);
  const existingNames = new Set(areas.map((a) => a.neighborhood.toLowerCase()));

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
          <div>
            <h3 className="font-semibold">Adicionar bairro</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Cadastre um por vez ou importe a lista pronta de Vitória/Vila Velha.</p>
          </div>
          <Button variant="outline" onClick={() => setImportOpen(true)}>
            <MapPin className="h-4 w-4 mr-1" /> Importar bairros prontos (ES)
          </Button>
        </div>
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
                  <p className="font-medium">{a.neighborhood}{a.city ? <span className="text-xs text-muted-foreground"> · {a.city}</span> : null}</p>
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

      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Importar bairros prontos (Espírito Santo)</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex gap-2 flex-wrap items-end">
              <div>
                <Label>Cidade</Label>
                <div className="flex gap-1 mt-1">
                  {(["Vitória","Vila Velha"] as const).map((c) => (
                    <Button key={c} size="sm" variant={importCity === c ? "default" : "outline"} onClick={() => { setImportCity(c); setPicked(new Set()); }}>
                      {c}
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <Label>Frete padrão (R$)</Label>
                <Input type="number" step="0.01" value={defaultFee} onChange={(e) => setDefaultFee(e.target.value)} className="w-28" />
              </div>
              <div>
                <Label>Tempo (min)</Label>
                <Input type="number" value={defaultEta} onChange={(e) => setDefaultEta(e.target.value)} className="w-24" />
              </div>
              <Button size="sm" variant="ghost" onClick={() => setPicked(new Set(catalogByCity.filter(c => !existingNames.has(c.name.toLowerCase())).map(c => c.name)))}>
                Marcar todos
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setPicked(new Set())}>Limpar</Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Bairros já cadastrados aparecem desabilitados. A taxa padrão acima é aplicada a todos — depois você ajusta individualmente.
            </p>
          </div>
          <div className="flex-1 overflow-y-auto border rounded-md p-3 grid grid-cols-2 sm:grid-cols-3 gap-1.5 mt-2">
            {catalogByCity.map((b) => {
              const already = existingNames.has(b.name.toLowerCase());
              const checked = picked.has(b.name);
              return (
                <label
                  key={b.id}
                  className={`flex items-center gap-2 text-xs p-1.5 rounded border cursor-pointer ${already ? "opacity-50 cursor-not-allowed bg-muted" : checked ? "bg-primary/10 border-primary" : "hover:bg-muted/50"}`}
                >
                  <input
                    type="checkbox"
                    disabled={already}
                    checked={checked}
                    onChange={() => togglePick(b.name)}
                  />
                  <span className="truncate">{b.name}</span>
                  {already && <span className="ml-auto text-[9px] uppercase tracking-wide">já</span>}
                </label>
              );
            })}
          </div>
          <div className="flex justify-between items-center pt-3 border-t">
            <span className="text-sm text-muted-foreground">{picked.size} selecionado(s)</span>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setImportOpen(false)}>Cancelar</Button>
              <Button onClick={importPicked} disabled={picked.size === 0}>Importar {picked.size > 0 ? `(${picked.size})` : ""}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PagamentosTab({ r, onSaved }: { r: Restaurant; onSaved: () => void }) {
  const [token, setToken] = useState("");
  const [savedToken, setSavedToken] = useState<string | null>(null);
  const [pubKey, setPubKey] = useState(r.mp_public_key ?? "");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showToken, setShowToken] = useState(false);
  const [testing, setTesting] = useState(false);
  const [account, setAccount] = useState<null | {
    environment: "production" | "sandbox";
    nickname: string | null;
    email: string | null;
  }>(null);
  const [copiedHook, setCopiedHook] = useState(false);

  const verify = useServerFn(verifyMercadoPago);
  const webhookUrl = typeof window !== "undefined" ? `${window.location.origin}/api/public/mercadopago-webhook` : "";

  const reload = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("restaurant_secrets")
      .select("mp_access_token")
      .eq("restaurant_id", r.id)
      .maybeSingle();
    const t = data?.mp_access_token ?? null;
    setSavedToken(t);
    setToken(t ?? "");
    setLoading(false);
  };

  useEffect(() => { reload(); }, [r.id]);

  // Auto-validar quando já existe token salvo
  useEffect(() => {
    if (savedToken) void runTest(true);
    else setAccount(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedToken]);

  const runTest = async (silent = false) => {
    setTesting(true);
    try {
      const res = await verify({ data: { restaurantId: r.id } });
      if (res.ok) {
        setAccount({
          environment: res.environment,
          nickname: res.account.nickname,
          email: res.account.email,
        });
        if (!silent) toast.success(`Conectado como ${res.account.nickname ?? res.account.email ?? "Mercado Pago"}`);
      } else {
        setAccount(null);
        if (!silent) toast.error(res.error);
      }
    } finally {
      setTesting(false);
    }
  };

  const save = async () => {
    setSaving(true);
    const trimmedToken = token.trim() || null;
    const [{ error: pubErr }, { error: secErr }] = await Promise.all([
      supabase.from("restaurants").update({
        mp_public_key: pubKey.trim() || null,
      }).eq("id", r.id),
      supabase.from("restaurant_secrets").upsert({
        restaurant_id: r.id,
        mp_access_token: trimmedToken,
        updated_at: new Date().toISOString(),
      }, { onConflict: "restaurant_id" }),
    ]);
    setSaving(false);
    const error = pubErr ?? secErr;
    if (error) return toast.error(error.message);
    toast.success("Credenciais salvas");
    setSavedToken(trimmedToken);
    onSaved();
    if (trimmedToken) void runTest();
  };

  const disconnect = async () => {
    if (!confirm("Remover a conexão com o Mercado Pago? Pedidos via PIX serão pausados.")) return;
    setSaving(true);
    const { error } = await supabase
      .from("restaurant_secrets")
      .upsert({ restaurant_id: r.id, mp_access_token: null, updated_at: new Date().toISOString() }, { onConflict: "restaurant_id" });
    setSaving(false);
    if (error) return toast.error(error.message);
    setToken("");
    setSavedToken(null);
    setAccount(null);
    toast.success("Mercado Pago desconectado");
    onSaved();
  };

  const copyWebhook = async () => {
    try {
      await navigator.clipboard.writeText(webhookUrl);
      setCopiedHook(true);
      toast.success("URL copiada!");
      setTimeout(() => setCopiedHook(false), 1800);
    } catch { toast.error("Não foi possível copiar"); }
  };

  const isConnected = !!savedToken && !!account;
  const isInvalid = !!savedToken && !account && !testing;
  const tokenChanged = (token.trim() || null) !== savedToken;

  return (
    <div className="space-y-5">
      <PaymentMethodsCard r={r} onSaved={onSaved} mpConnected={isConnected} />
    <Card className="p-6 space-y-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h3 className="font-semibold flex items-center gap-2">
            PIX via Mercado Pago
            {loading || testing ? (
              <Badge variant="secondary" className="gap-1"><Loader2 className="h-3 w-3 animate-spin" /> verificando</Badge>
            ) : isConnected ? (
              <Badge className="gap-1 bg-emerald-600 hover:bg-emerald-600 text-white">
                <ShieldCheck className="h-3 w-3" />
                {account.environment === "production" ? "Conectado" : "Conectado (Sandbox)"}
              </Badge>
            ) : isInvalid ? (
              <Badge variant="destructive" className="gap-1"><ShieldAlert className="h-3 w-3" /> token inválido</Badge>
            ) : (
              <Badge variant="outline">Não conectado</Badge>
            )}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Conecte sua conta do Mercado Pago para gerar QR Codes PIX automáticos. O dinheiro cai direto na sua conta.
          </p>
          {isConnected && (account.nickname || account.email) && (
            <p className="text-xs text-muted-foreground mt-1">
              Conta: <strong>{account.nickname ?? account.email}</strong>
              {account.email && account.nickname ? ` · ${account.email}` : ""}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {savedToken && (
            <Button size="sm" variant="outline" onClick={() => runTest()} disabled={testing}>
              {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              Testar conexão
            </Button>
          )}
          {savedToken && (
            <Button size="sm" variant="ghost" onClick={disconnect} disabled={saving} className="text-destructive hover:text-destructive">
              <Unplug className="h-4 w-4" /> Desconectar
            </Button>
          )}
        </div>
      </div>

      <div className="text-xs bg-muted/50 p-3 rounded-lg space-y-1">
        <p className="font-semibold flex items-center gap-1"><LinkIcon className="h-3 w-3" /> Como obter o Access Token:</p>
        <ol className="list-decimal list-inside space-y-0.5 text-muted-foreground">
          <li>Acesse o <a href="https://www.mercadopago.com.br/developers/panel/app" target="_blank" rel="noreferrer" className="underline">painel de desenvolvedores</a></li>
          <li>Crie uma aplicação do tipo <strong>Pagamentos online</strong></li>
          <li>Em <em>Credenciais de produção</em>, copie o <strong>Access Token</strong> (começa com <code>APP_USR-</code>)</li>
          <li>Para testar antes de ir ao ar, use o <strong>Access Token de teste</strong> (começa com <code>TEST-</code>)</li>
        </ol>
      </div>

      <div>
        <Label>Access Token</Label>
        <div className="flex gap-2">
          <Input
            type={showToken ? "text" : "password"}
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="APP_USR-... ou TEST-..."
            className="font-mono"
          />
          <Button
            type="button" variant="outline" size="icon"
            onClick={() => setShowToken((v) => !v)}
            aria-label={showToken ? "Ocultar token" : "Mostrar token"}
            title={showToken ? "Ocultar token" : "Mostrar token"}
          >
            {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
        {token.trim() && !/^(APP_USR|TEST)-/.test(token.trim()) && (
          <p className="text-xs text-amber-600 mt-1">⚠️ Tokens do Mercado Pago começam com <code>APP_USR-</code> (produção) ou <code>TEST-</code> (sandbox).</p>
        )}
      </div>

      <div>
        <Label>Public Key (opcional)</Label>
        <Input value={pubKey} onChange={(e) => setPubKey(e.target.value)} placeholder="APP_USR-..." className="font-mono" />
        <p className="text-xs text-muted-foreground mt-1">Usada apenas se você integrar o checkout transparente do MP no front.</p>
      </div>

      <div className="text-xs bg-amber-50 border border-amber-200 text-amber-900 p-3 rounded-lg space-y-2">
        <div>
          <strong>Webhook (obrigatório):</strong> cole a URL abaixo no painel do Mercado Pago em
          {" "}<em>Suas integrações → Webhooks</em>. Evento: <strong>payment</strong>.
        </div>
        <div className="flex gap-2 items-center">
          <code className="flex-1 bg-white px-2 py-1.5 rounded font-mono text-[11px] break-all">{webhookUrl}</code>
          <Button type="button" size="sm" variant="outline" onClick={copyWebhook}>
            {copiedHook ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div className="flex gap-2">
        <Button onClick={save} disabled={saving || (!tokenChanged && pubKey.trim() === (r.mp_public_key ?? ""))}>
          {saving ? "Salvando…" : "Salvar credenciais"}
        </Button>
        {tokenChanged && savedToken && (
          <Button variant="outline" onClick={() => { setToken(savedToken ?? ""); }} disabled={saving}>
            Cancelar
          </Button>
        )}
      </div>
    </Card>
    </div>
  );
}

function PaymentMethodsCard({ r, onSaved, mpConnected }: { r: Restaurant; onSaved: () => void; mpConnected: boolean }) {
  const [pix, setPix] = useState<boolean>(r.accept_pix_online !== false);
  const [cash, setCash] = useState<boolean>(r.accept_cash_on_delivery !== false);
  const [card, setCard] = useState<boolean>(r.accept_card_on_delivery !== false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setPix(r.accept_pix_online !== false);
    setCash(r.accept_cash_on_delivery !== false);
    setCard(r.accept_card_on_delivery !== false);
  }, [r.id]);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("restaurants").update({
      accept_pix_online: pix,
      accept_cash_on_delivery: cash,
      accept_card_on_delivery: card,
    } as any).eq("id", r.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Formas de pagamento atualizadas");
    onSaved();
  };

  const dirty =
    pix !== (r.accept_pix_online !== false) ||
    cash !== (r.accept_cash_on_delivery !== false) ||
    card !== (r.accept_card_on_delivery !== false);

  return (
    <Card className="p-6 space-y-4">
      <div>
        <h3 className="font-semibold">Formas de pagamento aceitas</h3>
        <p className="text-sm text-muted-foreground">Escolha quais opções aparecem para o cliente no checkout do cardápio.</p>
      </div>

      <div className="space-y-3">
        <label className="flex items-start justify-between gap-4 p-3 border rounded-lg cursor-pointer">
          <div>
            <p className="font-medium">PIX online (pagar agora)</p>
            <p className="text-xs text-muted-foreground">QR Code gerado automaticamente via Mercado Pago. Confirmação automática do pagamento.</p>
            {pix && !mpConnected && (
              <p className="text-xs text-amber-600 mt-1">⚠️ Mercado Pago não está conectado. Conecte abaixo para o PIX online funcionar.</p>
            )}
          </div>
          <Switch checked={pix} onCheckedChange={setPix} />
        </label>

        <label className="flex items-start justify-between gap-4 p-3 border rounded-lg cursor-pointer">
          <div>
            <p className="font-medium">Dinheiro (pagar na entrega/retirada)</p>
            <p className="text-xs text-muted-foreground">Cliente paga em espécie ao receber. Pode informar troco.</p>
          </div>
          <Switch checked={cash} onCheckedChange={setCash} />
        </label>

        <label className="flex items-start justify-between gap-4 p-3 border rounded-lg cursor-pointer">
          <div>
            <p className="font-medium">Cartão (pagar na entrega/retirada)</p>
            <p className="text-xs text-muted-foreground">Crédito ou débito na maquininha, ao receber o pedido.</p>
          </div>
          <Switch checked={card} onCheckedChange={setCard} />
        </label>
      </div>

      {!pix && !cash && !card && (
        <p className="text-xs text-destructive">Selecione pelo menos uma forma de pagamento.</p>
      )}

      <div>
        <Button onClick={save} disabled={saving || !dirty || (!pix && !cash && !card)}>
          {saving ? "Salvando…" : "Salvar formas de pagamento"}
        </Button>
      </div>
    </Card>
  );
}

function StoreLinkCard({ slug }: { slug: string | null }) {
  const [copied, setCopied] = useState(false);

  if (!slug) {
    return (
      <Card className="p-6 mb-6 bg-muted/40 border-dashed">
        <p className="text-sm text-muted-foreground">
          Defina o <strong>slug</strong> da sua loja na aba "Geral" abaixo para gerar o link público do cardápio.
        </p>
      </Card>
    );
  }

  const url = `https://comandahub.online/${slug}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&margin=10&data=${encodeURIComponent(url)}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copiado!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Não foi possível copiar");
    }
  };

  return (
    <Card className="p-6 mb-6 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
      <div className="flex items-start gap-4 flex-wrap">
        <div className="flex-1 min-w-[260px]">
          <h3 className="font-semibold text-lg mb-1">🔗 Link da sua loja</h3>
          <p className="text-sm text-muted-foreground mb-3">
            Compartilhe este link com seus clientes (WhatsApp, Instagram, QR code na mesa).
          </p>
          <div className="flex items-center gap-2 bg-background border rounded-md px-3 py-2 font-mono text-sm break-all">
            {url}
          </div>
        </div>
        <div className="flex flex-col gap-2 min-w-[160px]">
          <Button onClick={copy} variant={copied ? "secondary" : "default"}>
            {copied ? <><Check className="h-4 w-4 mr-2" />Copiado</> : <><Copy className="h-4 w-4 mr-2" />Copiar link</>}
          </Button>
          <Button variant="outline" asChild>
            <a href={qrUrl} download={`qrcode-${slug}.png`} target="_blank" rel="noopener noreferrer">
              Baixar QR Code
            </a>
          </Button>
        </div>
      </div>
    </Card>
  );
}

function RetiradaTab({ r, onSaved }: { r: Restaurant; onSaved: () => void }) {
  const [enabled, setEnabled] = useState(!!r.accepts_pickup);
  const [minutes, setMinutes] = useState(String(r.pickup_time_minutes ?? 20));
  const [instructions, setInstructions] = useState(r.pickup_instructions ?? "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("restaurants").update({
      accepts_pickup: enabled,
      pickup_time_minutes: Number(minutes) || 20,
      pickup_instructions: instructions.trim() || null,
    }).eq("id", r.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Configuração de retirada salva");
    onSaved();
  };

  const addr = [r.address_street, r.address_number, r.address_neighborhood, r.address_city]
    .filter(Boolean).join(", ");

  return (
    <Card className="p-6 space-y-5">
      <div className="flex items-start gap-3">
        <MapPin className="h-6 w-6 text-primary shrink-0 mt-1" />
        <div>
          <h3 className="font-semibold text-lg">Retirada no balcão</h3>
          <p className="text-sm text-muted-foreground">
            Permita que o cliente escolha retirar o pedido na loja em vez de receber em casa.
          </p>
        </div>
      </div>

      <Toggle label="Aceitar pedidos para retirada" value={enabled} onChange={setEnabled} />

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Tempo médio de preparo (min)</Label>
          <Input type="number" value={minutes} onChange={(e) => setMinutes(e.target.value)} />
          <p className="text-xs text-muted-foreground mt-1">Mostrado ao cliente no checkout.</p>
        </div>
      </div>

      <div>
        <Label>Instruções para o cliente (opcional)</Label>
        <Textarea
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          rows={3}
          placeholder="Ex.: Entre pela porta ao lado da garagem. Procure pela Ana no balcão."
        />
      </div>

      {addr && (
        <div className="text-xs bg-muted/50 p-3 rounded-lg">
          <strong>Endereço da loja (mostrado ao cliente):</strong>
          <p className="mt-1 text-muted-foreground">{addr}</p>
          <p className="mt-1 text-muted-foreground">
            Para alterar, vá em <strong>Geral</strong> → preencha endereço completo.
          </p>
        </div>
      )}

      <Button onClick={save} disabled={saving}>{saving ? "Salvando…" : "Salvar"}</Button>
    </Card>
  );
}

function ImpressaoTab({ r, onSaved }: { r: Restaurant; onSaved: () => void }) {
  const [enabled, setEnabled] = useState(!!r.auto_print_enabled);
  const [copies, setCopies] = useState(String(r.auto_print_copies ?? 1));
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("restaurants").update({
      auto_print_enabled: enabled,
      auto_print_copies: Math.min(3, Math.max(1, Number(copies) || 1)),
    }).eq("id", r.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    // Espelha no localStorage para a tela de pedidos pegar imediatamente
    if (typeof window !== "undefined") {
      localStorage.setItem("autoPrintOrders", enabled ? "1" : "0");
    }
    toast.success("Configuração de impressão salva");
    onSaved();
  };

  return (
    <div className="space-y-4">
      <Card className="p-6 space-y-5">
        <div className="flex items-start gap-3">
          <Printer className="h-6 w-6 text-primary shrink-0 mt-1" />
          <div>
            <h3 className="font-semibold text-lg">Impressão automática de pedidos</h3>
            <p className="text-sm text-muted-foreground">
              Toda vez que um pedido novo chegar, a tela de impressão abre sozinha com o cupom no formato 80mm.
            </p>
          </div>
        </div>

        <Toggle label="Imprimir pedidos novos automaticamente" value={enabled} onChange={setEnabled} />

        <div>
          <Label>Vias por pedido (1 a 3)</Label>
          <Input type="number" min={1} max={3} value={copies} onChange={(e) => setCopies(e.target.value)} className="w-24" />
        </div>

        <Button onClick={save} disabled={saving}>{saving ? "Salvando…" : "Salvar"}</Button>
      </Card>

      <Card className="p-6 space-y-3 text-sm">
        <h4 className="font-semibold">Como configurar o Chrome para imprimir sem confirmar (modo balcão)</h4>
        <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
          <li>Conecte a impressora térmica (80mm) ao computador e defina como <strong>impressora padrão</strong> do Windows/Mac.</li>
          <li>Crie um atalho do Chrome na área de trabalho.</li>
          <li>Clique com o botão direito → <strong>Propriedades</strong> → no campo <strong>Destino</strong>, adicione no final:</li>
        </ol>
        <KioskCommandBox />
        <ol className="list-decimal list-inside space-y-2 text-muted-foreground" start={4}>
          <li>Abra o Comandex por esse atalho. Pronto — os cupons saem direto sem janela de confirmação.</li>
          <li>Quando chegar pedido novo, o navegador imprime automaticamente na impressora padrão.</li>
        </ol>
        <div className="bg-amber-50 border border-amber-200 text-amber-900 p-3 rounded-lg text-xs">
          <strong>Importante:</strong> mantenha a aba <strong>Pedidos</strong> aberta durante o expediente. Se fechar, a impressão automática para.
        </div>
        <Button variant="outline" size="sm" onClick={() => {
          const w = window.open("", "_blank", "width=300,height=400");
          if (w) {
            w.document.write("<html><head><title>Teste de Impressão Comandex</title></head><body style='font-family:monospace;padding:20px;text-align:center'><h2>TESTE OK</h2><p>Se você está vendo esta janela, sua impressora está pronta.</p></body></html>");
            w.document.close();
            w.focus();
            w.print();
          }
        }}>
          <Printer className="h-4 w-4 mr-2" /> Testar impressão agora
        </Button>
      </Card>
    </div>
  );
}

function KioskCommandBox() {
  const cmd = "--kiosk-printing";
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center gap-2 bg-ink text-background font-mono text-sm p-3 rounded-md">
      <code className="flex-1">{cmd}</code>
      <Button size="sm" variant="secondary" onClick={() => {
        navigator.clipboard.writeText(cmd);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}>
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      </Button>
    </div>
  );
}

