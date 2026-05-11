import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useServerFn } from "@tanstack/react-start";
import { createTenant, getGlobalMetrics } from "@/lib/super-admin.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { LogIn, Search, ShieldCheck, AlertTriangle, Plus, Copy, Check, Inbox, BarChart3, Building2 } from "lucide-react";
import { toast } from "sonner";
import {
  LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip as ReTooltip, CartesianGrid,
} from "recharts";

export const Route = createFileRoute("/_authenticated/admin/super")({
  component: SuperAdminPage,
  head: () => ({ meta: [{ title: "Super-Admin — ComandaHub" }] }),
});

type Plan = "trial" | "essential" | "professional";
type LeadStatus = "new" | "contacted" | "approved" | "rejected";

type Row = {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  plan: Plan;
  is_active: boolean;
  is_open: boolean;
  trial_ends_at: string | null;
  subscription_ends_at: string | null;
  admin_notes: string | null;
  created_at: string;
  owner_email?: string | null;
  owner_name?: string | null;
  orders_count?: number;
  revenue?: number;
};

type Lead = {
  id: string;
  name: string;
  restaurant_name: string;
  email: string;
  phone: string;
  status: LeadStatus;
  notes: string | null;
  restaurant_id: string | null;
  created_at: string;
};

const PLAN_LABEL: Record<Plan, string> = { trial: "Trial", essential: "Essential", professional: "Professional" };
const PLAN_COLOR: Record<Plan, string> = {
  trial: "bg-amber-500/15 text-amber-700 border-amber-300",
  essential: "bg-blue-500/15 text-blue-700 border-blue-300",
  professional: "bg-emerald-500/15 text-emerald-700 border-emerald-300",
};

const LEAD_LABEL: Record<LeadStatus, string> = {
  new: "Novo", contacted: "Contatado", approved: "Aprovado", rejected: "Recusado",
};
const LEAD_COLOR: Record<LeadStatus, string> = {
  new: "bg-amber-500/15 text-amber-700 border-amber-300",
  contacted: "bg-blue-500/15 text-blue-700 border-blue-300",
  approved: "bg-emerald-500/15 text-emerald-700 border-emerald-300",
  rejected: "bg-red-500/15 text-red-700 border-red-300",
};

function fmtMoney(v: number) { return `R$ ${Number(v).toFixed(2).replace(".", ",")}`; }
function fmtDate(s: string | null) { return s ? new Date(s).toLocaleDateString("pt-BR") : "—"; }
function fmtDateTime(s: string) { return new Date(s).toLocaleString("pt-BR"); }
function slugify(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
}

function SuperAdminPage() {
  const { isSuperAdmin, loading, selectRestaurant } = useAuth();
  const [tab, setTab] = useState("stores");
  const [rows, setRows] = useState<Row[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Row | null>(null);
  const [busy, setBusy] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [createPrefill, setCreatePrefill] = useState<Partial<Lead> | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!isSuperAdmin) { throw redirect({ to: "/admin" }); }
    loadAll();
  }, [isSuperAdmin, loading]);

  const loadAll = async () => { await Promise.all([load(), loadLeads()]); };

  const load = async () => {
    const { data: rest } = await supabase
      .from("restaurants")
      .select("id,name,slug,owner_id,plan,is_active,is_open,trial_ends_at,subscription_ends_at,admin_notes,created_at")
      .order("created_at", { ascending: false });
    const list = (rest ?? []) as Row[];
    if (!list.length) { setRows([]); return; }
    const ownerIds = [...new Set(list.map((r) => r.owner_id))];
    const ids = list.map((r) => r.id);
    const [profilesRes, ordersRes] = await Promise.all([
      supabase.from("profiles").select("id,email,full_name").in("id", ownerIds),
      supabase.from("orders").select("restaurant_id,total,status").in("restaurant_id", ids),
    ]);
    const profileMap = new Map((profilesRes.data ?? []).map((p: any) => [p.id, p]));
    const statsMap = new Map<string, { count: number; revenue: number }>();
    (ordersRes.data ?? []).forEach((o: any) => {
      if (o.status === "cancelled") return;
      const cur = statsMap.get(o.restaurant_id) ?? { count: 0, revenue: 0 };
      cur.count += 1; cur.revenue += Number(o.total);
      statsMap.set(o.restaurant_id, cur);
    });
    setRows(list.map((r) => ({
      ...r,
      owner_email: (profileMap.get(r.owner_id) as any)?.email ?? null,
      owner_name: (profileMap.get(r.owner_id) as any)?.full_name ?? null,
      orders_count: statsMap.get(r.id)?.count ?? 0,
      revenue: statsMap.get(r.id)?.revenue ?? 0,
    })));
  };

  const loadLeads = async () => {
    const { data } = await supabase.from("signup_leads").select("*").order("created_at", { ascending: false });
    setLeads((data ?? []) as Lead[]);
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return rows;
    return rows.filter((r) =>
      r.name.toLowerCase().includes(q) ||
      r.slug.toLowerCase().includes(q) ||
      (r.owner_email ?? "").toLowerCase().includes(q),
    );
  }, [rows, search]);

  const stats = useMemo(() => {
    const total = rows.length;
    const active = rows.filter((r) => r.is_active).length;
    const trial = rows.filter((r) => r.plan === "trial").length;
    const paying = rows.filter((r) => r.plan !== "trial" && r.is_active).length;
    const totalRevenue = rows.reduce((s, r) => s + (r.revenue ?? 0), 0);
    return { total, active, trial, paying, totalRevenue };
  }, [rows]);

  const newLeadsCount = leads.filter((l) => l.status === "new").length;

  const enterRestaurant = (r: Row) => {
    selectRestaurant(r.id);
    toast.success(`Acessando ${r.name}`);
    setTimeout(() => { window.location.href = "/admin"; }, 200);
  };

  const save = async () => {
    if (!editing) return;
    setBusy(true);
    const { error } = await supabase.from("restaurants").update({
      plan: editing.plan,
      is_active: editing.is_active,
      trial_ends_at: editing.trial_ends_at,
      subscription_ends_at: editing.subscription_ends_at,
      admin_notes: editing.admin_notes,
    }).eq("id", editing.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Restaurante atualizado");
    setEditing(null);
    load();
  };

  const openCreateFromLead = (l: Lead) => {
    setCreatePrefill(l);
    setCreateOpen(true);
  };

  if (loading) return <div className="p-8">Carregando...</div>;
  if (!isSuperAdmin) return <div className="p-8 text-destructive">Acesso restrito.</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Super-Admin</h1>
            <p className="text-muted-foreground">Gestão de restaurantes, leads e métricas globais</p>
          </div>
        </div>
        <Button onClick={() => { setCreatePrefill(null); setCreateOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" /> Nova loja
        </Button>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList>
          <TabsTrigger value="stores"><Building2 className="h-4 w-4 mr-2" />Lojas</TabsTrigger>
          <TabsTrigger value="leads">
            <Inbox className="h-4 w-4 mr-2" />Leads
            {newLeadsCount > 0 && <Badge className="ml-2 bg-amber-500 hover:bg-amber-500">{newLeadsCount}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="metrics"><BarChart3 className="h-4 w-4 mr-2" />Métricas</TabsTrigger>
        </TabsList>

        <TabsContent value="stores" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card className="p-4"><p className="text-xs text-muted-foreground">Restaurantes</p><p className="text-2xl font-bold">{stats.total}</p></Card>
            <Card className="p-4"><p className="text-xs text-muted-foreground">Ativos</p><p className="text-2xl font-bold">{stats.active}</p></Card>
            <Card className="p-4"><p className="text-xs text-muted-foreground">Em trial</p><p className="text-2xl font-bold text-amber-600">{stats.trial}</p></Card>
            <Card className="p-4"><p className="text-xs text-muted-foreground">Pagantes</p><p className="text-2xl font-bold text-emerald-600">{stats.paying}</p></Card>
            <Card className="p-4"><p className="text-xs text-muted-foreground">GMV total</p><p className="text-2xl font-bold">{fmtMoney(stats.totalRevenue)}</p></Card>
          </div>

          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Buscar por nome, slug ou e-mail do dono..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>

          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr className="text-left">
                    <th className="p-3">Restaurante</th>
                    <th className="p-3">Dono</th>
                    <th className="p-3">Plano</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Trial até</th>
                    <th className="p-3">Assinatura até</th>
                    <th className="p-3 text-right">Pedidos</th>
                    <th className="p-3 text-right">GMV</th>
                    <th className="p-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => {
                    const trialExpired = r.plan === "trial" && r.trial_ends_at && new Date(r.trial_ends_at) < new Date();
                    return (
                      <tr key={r.id} className="border-t hover:bg-muted/50">
                        <td className="p-3"><div className="font-medium">{r.name}</div><div className="text-xs text-muted-foreground">/{r.slug}</div></td>
                        <td className="p-3 text-xs"><div>{r.owner_name ?? "—"}</div><div className="text-muted-foreground">{r.owner_email ?? "—"}</div></td>
                        <td className="p-3"><Badge variant="outline" className={PLAN_COLOR[r.plan]}>{PLAN_LABEL[r.plan]}</Badge></td>
                        <td className="p-3">{r.is_active ? <Badge variant="outline" className="border-green-300 text-green-700">Ativo</Badge> : <Badge variant="outline" className="border-red-300 text-red-700">Inativo</Badge>}</td>
                        <td className="p-3 text-xs"><span className={trialExpired ? "text-destructive flex items-center gap-1" : ""}>{trialExpired && <AlertTriangle className="h-3 w-3" />}{fmtDate(r.trial_ends_at)}</span></td>
                        <td className="p-3 text-xs">{fmtDate(r.subscription_ends_at)}</td>
                        <td className="p-3 text-right">{r.orders_count}</td>
                        <td className="p-3 text-right font-medium">{fmtMoney(r.revenue ?? 0)}</td>
                        <td className="p-3">
                          <div className="flex justify-end gap-1">
                            <Button size="sm" variant="ghost" title="Acessar painel" onClick={() => enterRestaurant(r)}><LogIn className="h-4 w-4" /></Button>
                            <Button size="sm" variant="outline" onClick={() => setEditing({ ...r })}>Gerenciar</Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {!filtered.length && (<tr><td colSpan={9} className="p-8 text-center text-muted-foreground">Nenhum restaurante encontrado</td></tr>)}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="leads" className="mt-4">
          <LeadsTab leads={leads} onChange={loadLeads} onApprove={openCreateFromLead} />
        </TabsContent>

        <TabsContent value="metrics" className="mt-4">
          <MetricsTab />
        </TabsContent>
      </Tabs>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {editing && (
            <>
              <DialogHeader><DialogTitle>{editing.name}</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label className="text-xs">Plano</Label>
                  <Select value={editing.plan} onValueChange={(v) => setEditing({ ...editing, plan: v as Plan })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="trial">Trial</SelectItem>
                      <SelectItem value="essential">Essential</SelectItem>
                      <SelectItem value="professional">Professional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between rounded border p-3">
                  <div><Label>Restaurante ativo</Label><p className="text-xs text-muted-foreground">Inativos não aparecem no marketplace público e o dono vê tela de bloqueio</p></div>
                  <Switch checked={editing.is_active} onCheckedChange={(v) => setEditing({ ...editing, is_active: v })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Fim do trial</Label>
                    <Input type="date" value={editing.trial_ends_at?.slice(0, 10) ?? ""} onChange={(e) => setEditing({ ...editing, trial_ends_at: e.target.value ? new Date(e.target.value).toISOString() : null })} />
                  </div>
                  <div>
                    <Label className="text-xs">Fim da assinatura</Label>
                    <Input type="date" value={editing.subscription_ends_at?.slice(0, 10) ?? ""} onChange={(e) => setEditing({ ...editing, subscription_ends_at: e.target.value ? new Date(e.target.value).toISOString() : null })} />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Anotações internas</Label>
                  <Textarea rows={3} value={editing.admin_notes ?? ""} onChange={(e) => setEditing({ ...editing, admin_notes: e.target.value })} placeholder="Visível apenas para super-admins" />
                </div>

                <PaymentsSection
                  restaurantId={editing.id}
                  currentPlan={editing.plan}
                  onRegistered={(newEnd) => {
                    setEditing((prev) => prev ? { ...prev, subscription_ends_at: newEnd, is_active: true } : prev);
                  }}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
                <Button onClick={save} disabled={busy}>{busy ? "Salvando..." : "Salvar"}</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <CreateTenantDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        prefill={createPrefill}
        onCreated={() => { loadAll(); setTab("stores"); }}
      />
    </div>
  );
}

/* ---------- Leads tab ---------- */

function LeadsTab({ leads, onChange, onApprove }: { leads: Lead[]; onChange: () => void; onApprove: (l: Lead) => void }) {
  const [filter, setFilter] = useState<LeadStatus | "all">("all");
  const [noteEditing, setNoteEditing] = useState<Lead | null>(null);
  const [noteText, setNoteText] = useState("");

  const list = filter === "all" ? leads : leads.filter((l) => l.status === filter);

  const setStatus = async (l: Lead, status: LeadStatus) => {
    const { error } = await supabase.from("signup_leads").update({ status }).eq("id", l.id);
    if (error) return toast.error(error.message);
    toast.success(`Lead marcado como ${LEAD_LABEL[status]}`);
    onChange();
  };

  const saveNote = async () => {
    if (!noteEditing) return;
    const { error } = await supabase.from("signup_leads").update({ notes: noteText }).eq("id", noteEditing.id);
    if (error) return toast.error(error.message);
    toast.success("Nota salva");
    setNoteEditing(null);
    onChange();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        {(["all", "new", "contacted", "approved", "rejected"] as const).map((s) => (
          <Button key={s} variant={filter === s ? "default" : "outline"} size="sm" onClick={() => setFilter(s)}>
            {s === "all" ? "Todos" : LEAD_LABEL[s]}
            <span className="ml-2 text-xs opacity-70">
              {s === "all" ? leads.length : leads.filter((l) => l.status === s).length}
            </span>
          </Button>
        ))}
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr className="text-left">
                <th className="p-3">Recebido</th>
                <th className="p-3">Restaurante</th>
                <th className="p-3">Contato</th>
                <th className="p-3">Status</th>
                <th className="p-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {list.map((l) => (
                <tr key={l.id} className="border-t align-top">
                  <td className="p-3 text-xs whitespace-nowrap">{fmtDateTime(l.created_at)}</td>
                  <td className="p-3">
                    <div className="font-medium">{l.restaurant_name}</div>
                    <div className="text-xs text-muted-foreground">{l.name}</div>
                  </td>
                  <td className="p-3 text-xs">
                    <div>{l.email}</div>
                    <div className="text-muted-foreground">{l.phone}</div>
                  </td>
                  <td className="p-3">
                    <Badge variant="outline" className={LEAD_COLOR[l.status]}>{LEAD_LABEL[l.status]}</Badge>
                    {l.notes && <p className="text-xs text-muted-foreground mt-1 max-w-xs">📝 {l.notes}</p>}
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      <Button size="sm" variant="default" onClick={() => onApprove(l)} disabled={l.status === "approved"}>
                        Aprovar e criar loja
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setStatus(l, "contacted")} disabled={l.status === "contacted"}>Contatado</Button>
                      <Button size="sm" variant="outline" onClick={() => setStatus(l, "rejected")} disabled={l.status === "rejected"}>Recusar</Button>
                      <Button size="sm" variant="ghost" onClick={() => { setNoteEditing(l); setNoteText(l.notes ?? ""); }}>Nota</Button>
                      <a href={`https://wa.me/55${l.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="ghost">WhatsApp</Button>
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
              {!list.length && (<tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Nenhum lead nessa categoria</td></tr>)}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={!!noteEditing} onOpenChange={(o) => !o && setNoteEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nota interna</DialogTitle></DialogHeader>
          <Textarea rows={4} value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Anotação visível apenas para super-admins" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoteEditing(null)}>Cancelar</Button>
            <Button onClick={saveNote}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ---------- Create tenant dialog ---------- */

function CreateTenantDialog({
  open, onOpenChange, prefill, onCreated,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  prefill: Partial<Lead> | null;
  onCreated: () => void;
}) {
  const createTenantFn = useServerFn(createTenant);
  const [form, setForm] = useState({
    restaurant_name: "",
    slug: "",
    phone: "",
    plan: "trial" as Plan,
    trial_days: 14,
    owner_full_name: "",
    owner_email: "",
    owner_phone: "",
  });
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ password: string | null; createdNew: boolean } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open) {
      setResult(null);
      setForm({
        restaurant_name: prefill?.restaurant_name ?? "",
        slug: slugify(prefill?.restaurant_name ?? ""),
        phone: prefill?.phone ?? "",
        plan: "trial",
        trial_days: 14,
        owner_full_name: prefill?.name ?? "",
        owner_email: prefill?.email ?? "",
        owner_phone: prefill?.phone ?? "",
      });
    }
  }, [open, prefill]);

  const submit = async () => {
    setBusy(true);
    try {
      const r = await createTenantFn({
        data: { ...form, lead_id: prefill?.id ?? null },
      });
      toast.success("Loja criada com sucesso!");
      setResult({ password: r.temporary_password, createdNew: r.created_new_user });
      onCreated();
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao criar loja");
    } finally {
      setBusy(false);
    }
  };

  const copy = (s: string) => {
    navigator.clipboard.writeText(s);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{result ? "Loja criada" : "Nova loja"}</DialogTitle>
        </DialogHeader>

        {result ? (
          <div className="space-y-3">
            <p className="text-sm">Loja criada com sucesso. {result.createdNew ? "Envie estas credenciais ao dono:" : "O dono já tinha conta — ele entra com a senha atual."}</p>
            {result.password && (
              <Card className="p-4 bg-muted/40">
                <p className="text-xs text-muted-foreground mb-1">E-mail</p>
                <p className="font-mono text-sm mb-3">{form.owner_email}</p>
                <p className="text-xs text-muted-foreground mb-1">Senha temporária</p>
                <div className="flex gap-2">
                  <code className="flex-1 px-3 py-2 bg-background rounded border font-mono text-sm">{result.password}</code>
                  <Button size="sm" variant="outline" onClick={() => copy(`E-mail: ${form.owner_email}\nSenha: ${result.password}`)}>
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-3">Copie agora — esta senha não será mostrada novamente.</p>
              </Card>
            )}
            <DialogFooter>
              <Button onClick={() => onOpenChange(false)}>Concluído</Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase">Loja</p>
              <Input placeholder="Nome do restaurante" value={form.restaurant_name}
                onChange={(e) => setForm({ ...form, restaurant_name: e.target.value, slug: slugify(e.target.value) })} />
              <Input placeholder="Slug (URL)" value={form.slug} onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })} />
              <Input placeholder="Telefone (opcional)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              <div className="grid grid-cols-2 gap-2">
                <Select value={form.plan} onValueChange={(v) => setForm({ ...form, plan: v as Plan })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="trial">Trial</SelectItem>
                    <SelectItem value="essential">Essential</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                  </SelectContent>
                </Select>
                <Input type="number" min={0} max={365} value={form.trial_days}
                  onChange={(e) => setForm({ ...form, trial_days: Number(e.target.value) || 0 })}
                  placeholder="Dias de trial" />
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase">Dono</p>
              <Input placeholder="Nome completo" value={form.owner_full_name} onChange={(e) => setForm({ ...form, owner_full_name: e.target.value })} />
              <Input type="email" placeholder="E-mail" value={form.owner_email} onChange={(e) => setForm({ ...form, owner_email: e.target.value })} />
              <Input placeholder="Telefone (opcional)" value={form.owner_phone} onChange={(e) => setForm({ ...form, owner_phone: e.target.value })} />
            </div>

            <p className="text-xs text-muted-foreground">
              Uma senha temporária será gerada e mostrada uma única vez para você enviar ao dono.
            </p>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button onClick={submit} disabled={busy || !form.restaurant_name || !form.slug || !form.owner_email || !form.owner_full_name}>
                {busy ? "Criando..." : "Criar loja"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ---------- Metrics tab ---------- */

function MetricsTab() {
  const fetchMetrics = useServerFn(getGlobalMetrics);
  const [data, setData] = useState<Awaited<ReturnType<typeof getGlobalMetrics>> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics().then((r) => { setData(r); setLoading(false); }).catch((e) => {
      toast.error(e?.message ?? "Erro ao carregar métricas");
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="p-8 text-center text-muted-foreground">Carregando métricas…</div>;
  if (!data) return <div className="p-8 text-center text-muted-foreground">Sem dados.</div>;

  const t = data.totals;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4"><p className="text-xs text-muted-foreground">Lojas totais</p><p className="text-2xl font-bold">{t.totalStores}</p></Card>
        <Card className="p-4"><p className="text-xs text-muted-foreground">Lojas ativas</p><p className="text-2xl font-bold">{t.activeStores}</p></Card>
        <Card className="p-4"><p className="text-xs text-muted-foreground">Em trial</p><p className="text-2xl font-bold text-amber-600">{t.trialStores}</p></Card>
        <Card className="p-4"><p className="text-xs text-muted-foreground">Pagantes</p><p className="text-2xl font-bold text-emerald-600">{t.payingStores}</p></Card>
        <Card className="p-4"><p className="text-xs text-muted-foreground">MRR estimado</p><p className="text-2xl font-bold">{fmtMoney(t.mrr)}</p></Card>
        <Card className="p-4"><p className="text-xs text-muted-foreground">Pedidos hoje</p><p className="text-2xl font-bold">{t.ordersToday}</p></Card>
        <Card className="p-4"><p className="text-xs text-muted-foreground">Pedidos 7d</p><p className="text-2xl font-bold">{t.ordersWeek}</p></Card>
        <Card className="p-4"><p className="text-xs text-muted-foreground">GMV mês</p><p className="text-2xl font-bold">{fmtMoney(t.revenueMonth)}</p></Card>
      </div>

      <Card className="p-4">
        <p className="font-semibold mb-3">Pedidos por dia (últimos 30 dias)</p>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.daily}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={(d) => d.slice(5)} fontSize={11} />
              <YAxis fontSize={11} />
              <ReTooltip />
              <Line type="monotone" dataKey="orders" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-4">
          <p className="font-semibold mb-3">Top 5 lojas — faturamento no mês</p>
          {data.topStores.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem pedidos no mês.</p>
          ) : (
            <ul className="space-y-2">
              {data.topStores.map((s, i) => (
                <li key={s.id} className="flex items-center justify-between text-sm">
                  <span><span className="text-muted-foreground mr-2">#{i + 1}</span>{s.name}</span>
                  <span className="font-medium">{fmtMoney(s.revenue)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-4">
          <p className="font-semibold mb-3 flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-600" />Trials expirando em 7 dias</p>
          {data.expiringTrials.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum trial expirando em breve.</p>
          ) : (
            <ul className="space-y-2">
              {data.expiringTrials.map((s) => (
                <li key={s.id} className="flex items-center justify-between text-sm">
                  <span>{s.name}</span>
                  <span className="text-muted-foreground">{fmtDate(s.trial_ends_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

/* ---------- Payments section ---------- */

type Payment = {
  id: string;
  amount: number;
  plan: string;
  period_start: string;
  period_end: string;
  paid_at: string;
  method: string | null;
  notes: string | null;
};

function PaymentsSection({
  restaurantId, currentPlan, onRegistered,
}: {
  restaurantId: string;
  currentPlan: Plan;
  onRegistered: (newSubscriptionEnd: string) => void;
}) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loadingP, setLoadingP] = useState(true);
  const [form, setForm] = useState({ amount: "", method: "pix", months: 1, notes: "" });
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoadingP(true);
    const { data } = await supabase
      .from("restaurant_payments")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .order("paid_at", { ascending: false });
    setPayments((data ?? []) as Payment[]);
    setLoadingP(false);
  };

  useEffect(() => { load(); }, [restaurantId]);

  const register = async () => {
    const amount = Number(form.amount.replace(",", "."));
    if (!amount || amount <= 0) return toast.error("Informe um valor válido");
    if (!form.months || form.months < 1) return toast.error("Informe quantos meses");
    setBusy(true);

    // Extend from current subscription_ends_at if in future, else from today
    const { data: rest } = await supabase
      .from("restaurants")
      .select("subscription_ends_at")
      .eq("id", restaurantId)
      .maybeSingle();

    const now = new Date();
    const startBase = rest?.subscription_ends_at && new Date(rest.subscription_ends_at) > now
      ? new Date(rest.subscription_ends_at)
      : now;
    const periodStart = new Date(startBase);
    const periodEnd = new Date(startBase);
    periodEnd.setMonth(periodEnd.getMonth() + form.months);

    const { error: insErr } = await supabase.from("restaurant_payments").insert({
      restaurant_id: restaurantId,
      amount,
      plan: currentPlan,
      period_start: periodStart.toISOString(),
      period_end: periodEnd.toISOString(),
      method: form.method,
      notes: form.notes || null,
    });
    if (insErr) { setBusy(false); return toast.error(insErr.message); }

    const { error: updErr } = await supabase
      .from("restaurants")
      .update({ subscription_ends_at: periodEnd.toISOString(), is_active: true })
      .eq("id", restaurantId);
    setBusy(false);
    if (updErr) return toast.error(updErr.message);

    toast.success(`Pagamento registrado. Assinatura válida até ${periodEnd.toLocaleDateString("pt-BR")}.`);
    setForm({ amount: "", method: "pix", months: 1, notes: "" });
    onRegistered(periodEnd.toISOString());
    load();
  };

  return (
    <div className="border-t pt-4 space-y-3">
      <p className="font-semibold text-sm">Pagamentos</p>

      <Card className="p-3 bg-muted/30 space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase">Registrar pagamento</p>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <Label className="text-xs">Valor (R$)</Label>
            <Input value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="99,00" />
          </div>
          <div>
            <Label className="text-xs">Meses</Label>
            <Input type="number" min={1} max={36} value={form.months} onChange={(e) => setForm({ ...form, months: Number(e.target.value) || 1 })} />
          </div>
          <div>
            <Label className="text-xs">Método</Label>
            <Select value={form.method} onValueChange={(v) => setForm({ ...form, method: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pix">PIX</SelectItem>
                <SelectItem value="boleto">Boleto</SelectItem>
                <SelectItem value="cartao">Cartão</SelectItem>
                <SelectItem value="transferencia">Transferência</SelectItem>
                <SelectItem value="outro">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Observações (opcional)" />
        <Button size="sm" onClick={register} disabled={busy} className="w-full">
          {busy ? "Registrando..." : "Registrar e estender assinatura"}
        </Button>
      </Card>

      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase mb-2">Histórico</p>
        {loadingP ? (
          <p className="text-xs text-muted-foreground">Carregando...</p>
        ) : payments.length === 0 ? (
          <p className="text-xs text-muted-foreground">Nenhum pagamento registrado.</p>
        ) : (
          <div className="border rounded overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-muted">
                <tr className="text-left">
                  <th className="p-2">Data</th>
                  <th className="p-2">Plano</th>
                  <th className="p-2">Período</th>
                  <th className="p-2">Método</th>
                  <th className="p-2 text-right">Valor</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-t">
                    <td className="p-2">{new Date(p.paid_at).toLocaleDateString("pt-BR")}</td>
                    <td className="p-2">{p.plan}</td>
                    <td className="p-2">{new Date(p.period_start).toLocaleDateString("pt-BR")} → {new Date(p.period_end).toLocaleDateString("pt-BR")}</td>
                    <td className="p-2">{p.method ?? "—"}</td>
                    <td className="p-2 text-right font-medium">{fmtMoney(p.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
