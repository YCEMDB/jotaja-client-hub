import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useServerFn } from "@tanstack/react-start";
import { resetTenant, deleteTenant, resetOwnerPassword } from "@/lib/super-admin.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { LogIn, Search, AlertTriangle, Plus, Building2, RotateCcw, Trash2, KeyRound, Check, X } from "lucide-react";
import { toast } from "sonner";
import { CreateTenantDialog } from "@/components/super/CreateTenantDialog";
import { PaymentsSection } from "@/components/super/PaymentsSection";
import { AdminPageLayout } from "@/components/AdminPageLayout";

export const Route = createFileRoute("/_super/super/lojas")({
  component: LojasPage,
  head: () => ({ meta: [{ title: "Super-Admin — Lojas" }] }),
});

type Plan = "trial" | "essential" | "professional";
type AppPlan = { id: string; name: string; price_monthly: number; features: Record<string, any> };
type Row = {
  id: string; name: string; slug: string; owner_id: string; plan: Plan; plan_id: string | null;
  is_active: boolean; is_open: boolean; trial_ends_at: string | null;
  subscription_ends_at: string | null; admin_notes: string | null; created_at: string;
  owner_email?: string | null; owner_name?: string | null;
  orders_count?: number; revenue?: number;
};

const PLAN_LABEL: Record<Plan, string> = { trial: "Trial", essential: "Essential", professional: "Professional" };
const PLAN_COLOR: Record<Plan, string> = {
  trial: "bg-amber-500/15 text-amber-700 border-amber-300",
  essential: "bg-blue-500/15 text-blue-700 border-blue-300",
  professional: "bg-emerald-500/15 text-emerald-700 border-emerald-300",
};

const FEATURE_ROWS: { key: string; label: string }[] = [
  { key: "max_orders_per_month", label: "Pedidos / mês" },
  { key: "max_users", label: "Usuários" },
  { key: "max_locations", label: "Unidades" },
  { key: "coupons", label: "Cupons promocionais" },
  { key: "drivers", label: "Gestão de entregadores" },
  { key: "manual_pdv", label: "PDV manual (balcão)" },
  { key: "online_payment", label: "Pagamento online" },
  { key: "auto_print", label: "Impressão automática" },
  { key: "advanced_reports", label: "Relatórios avançados" },
  { key: "priority_support", label: "Suporte prioritário" },
  { key: "multi_location", label: "Multi-unidades" },
  { key: "api_access", label: "Acesso à API" },
];

function fmtFeatureValue(v: any) {
  if (v === null || v === undefined) return "Ilimitado";
  if (typeof v === "boolean") return v;
  return String(v);
}

function fmtMoney(v: number) { return `R$ ${Number(v).toFixed(2).replace(".", ",")}`; }
function fmtDate(s: string | null) { return s ? new Date(s).toLocaleDateString("pt-BR") : "—"; }

function LojasPage() {
  const { selectRestaurant } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Row | null>(null);
  const [busy, setBusy] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Row | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");
  const resetTenantFn = useServerFn(resetTenant);
  const deleteTenantFn = useServerFn(deleteTenant);
  const resetPwdFn = useServerFn(resetOwnerPassword);
  const [appPlans, setAppPlans] = useState<AppPlan[]>([]);

  useEffect(() => {
    load();
    supabase.from("app_plans").select("id,name,price_monthly,features").order("price_monthly")
      .then(({ data }) => setAppPlans((data as AppPlan[]) ?? []));
  }, []);

  const load = async () => {
    const { data: rest } = await supabase
      .from("restaurants")
      .select("id,name,slug,owner_id,plan,plan_id,is_active,is_open,trial_ends_at,subscription_ends_at,admin_notes,created_at")
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

  const enterRestaurant = (r: Row) => {
    selectRestaurant(r.id);
    toast.success(`Acessando ${r.name}`);
    setTimeout(() => { window.location.href = "/admin"; }, 200);
  };

  const save = async () => {
    if (!editing) return;
    setBusy(true);
    // Map plan_id to legacy plan enum for backwards compat
    const legacyPlan: Plan =
      editing.plan_id === "starter" ? "essential" :
      editing.plan_id === "pro" || editing.plan_id === "business" ? "professional" :
      editing.plan;
    const { error } = await supabase.from("restaurants").update({
      plan: legacyPlan,
      plan_id: editing.plan_id,
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

  return (
    <AdminPageLayout
      kicker="Super-admin"
      title="Lojas"
      subtitle="Gerencie planos, status e pagamentos de cada restaurante"
      accent="violet"
      icon={Building2}
      actions={
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Nova loja
        </Button>
      }
    >


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

      <Card className="overflow-x-auto">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
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
                    <td className="p-3"><div className="flex flex-col gap-1"><Badge variant="outline" className={PLAN_COLOR[r.plan]}>{PLAN_LABEL[r.plan]}</Badge><span className="text-[10px] uppercase font-bold text-muted-foreground">{r.plan_id ?? "starter"}</span></div></td>
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
              {!filtered.length && (<tr><td colSpan={9} className="p-4 md:p-8 text-center text-muted-foreground">Nenhum restaurante encontrado</td></tr>)}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {editing && (
            <>
              <DialogHeader><DialogTitle>{editing.name}</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label className="text-xs">Plano (status comercial)</Label>
                  <Select value={editing.plan} onValueChange={(v) => setEditing({ ...editing, plan: v as Plan })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="trial">Trial</SelectItem>
                      <SelectItem value="essential">Essential</SelectItem>
                      <SelectItem value="professional">Professional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="rounded-lg border-2 border-ink p-3 bg-gradient-to-br from-brand-orange/5 to-brand-magenta/5">
                  <Label className="text-xs font-bold uppercase">Plano de recursos (limites e features)</Label>
                  <Select
                    value={editing.plan_id ?? "starter"}
                    onValueChange={(v) => setEditing({ ...editing, plan_id: v })}
                  >
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {appPlans.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name} — R$ {Number(p.price_monthly).toFixed(0)}/mês
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {(() => {
                    const sel = appPlans.find((p) => p.id === (editing.plan_id ?? "starter"));
                    if (!sel) return null;
                    return (
                      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                        {FEATURE_ROWS.map((row) => {
                          const v = fmtFeatureValue(sel.features?.[row.key]);
                          const isBool = typeof v === "boolean";
                          return (
                            <div key={row.key} className="flex items-center justify-between gap-2 py-1 border-b border-dashed border-ink/10 last:border-0">
                              <span className="text-muted-foreground">{row.label}</span>
                              {isBool ? (
                                v
                                  ? <Check className="h-4 w-4 text-emerald-600" />
                                  : <X className="h-4 w-4 text-destructive/60" />
                              ) : (
                                <span className="font-mono font-semibold">{v as string}</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                  <p className="text-[11px] text-muted-foreground mt-2">
                    Define as features e limites efetivos do restaurante (cupons, PDV, pagamento online, etc).
                  </p>
                </div>
                <div className="flex items-center justify-between rounded border p-3">
                  <div><Label>Restaurante ativo</Label><p className="text-xs text-muted-foreground">Inativos não aparecem publicamente e o dono vê tela de bloqueio</p></div>
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

                <div className="border-2 border-destructive/40 rounded-lg p-4 space-y-3 bg-destructive/5">
                  <div>
                    <p className="font-bold text-destructive flex items-center gap-2"><AlertTriangle className="h-4 w-4" />Zona de perigo</p>
                    <p className="text-xs text-muted-foreground">Ações irreversíveis nesta loja</p>
                  </div>
                  <div className="grid sm:grid-cols-3 gap-2">
                    <Button variant="outline" size="sm" disabled={busy} onClick={async () => {
                      try {
                        const r = await resetPwdFn({ data: { restaurant_id: editing.id } });
                        toast.success(`Nova senha do dono: ${r.temporary_password}`, { duration: 15000 });
                      } catch (e: any) { toast.error(e?.message ?? "Erro"); }
                    }}>
                      <KeyRound className="h-4 w-4 mr-1" /> Resetar senha
                    </Button>
                    <Button variant="outline" size="sm" disabled={busy} onClick={async () => {
                      if (!confirm(`Apagar TODOS os pedidos e clientes de "${editing.name}"? Catálogo será mantido.`)) return;
                      setBusy(true);
                      try {
                        const r = await resetTenantFn({ data: { restaurant_id: editing.id } });
                        toast.success(`Reset OK — ${r.deleted_orders} pedidos apagados`);
                        load();
                      } catch (e: any) { toast.error(e?.message ?? "Erro"); }
                      finally { setBusy(false); }
                    }}>
                      <RotateCcw className="h-4 w-4 mr-1" /> Resetar dados
                    </Button>
                    <Button variant="destructive" size="sm" disabled={busy} onClick={() => { setConfirmDelete(editing); setDeleteConfirmName(""); }}>
                      <Trash2 className="h-4 w-4 mr-1" /> Excluir loja
                    </Button>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
                <Button onClick={save} disabled={busy}>{busy ? "Salvando..." : "Salvar"}</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!confirmDelete} onOpenChange={(o) => { if (!o) { setConfirmDelete(null); setDeleteConfirmName(""); } }}>
        <DialogContent className="max-w-md">
          {confirmDelete && (
            <>
              <DialogHeader>
                <DialogTitle className="text-destructive flex items-center gap-2"><AlertTriangle className="h-5 w-5" />Excluir restaurante</DialogTitle>
                <DialogDescription>
                  Esta ação é permanente. Todos os pedidos, produtos, categorias, cupons, clientes e configurações de <strong>{confirmDelete.name}</strong> serão apagados. O usuário dono <strong>não</strong> será removido.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2">
                <Label className="text-xs">Digite o nome exato para confirmar: <strong>{confirmDelete.name}</strong></Label>
                <Input value={deleteConfirmName} onChange={(e) => setDeleteConfirmName(e.target.value)} placeholder={confirmDelete.name} />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancelar</Button>
                <Button
                  variant="destructive"
                  disabled={busy || deleteConfirmName.trim() !== confirmDelete.name.trim()}
                  onClick={async () => {
                    setBusy(true);
                    try {
                      await deleteTenantFn({ data: { restaurant_id: confirmDelete.id, confirm_name: deleteConfirmName } });
                      toast.success("Restaurante excluído");
                      setConfirmDelete(null);
                      setEditing(null);
                      load();
                    } catch (e: any) { toast.error(e?.message ?? "Erro ao excluir"); }
                    finally { setBusy(false); }
                  }}
                >
                  Excluir definitivamente
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <CreateTenantDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        prefill={null}
        onCreated={() => load()}
      />
    </div>
  );
}
