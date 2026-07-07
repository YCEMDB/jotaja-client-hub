import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  AdminPageLayout, DashboardGrid, Section, SectionHeader, SectionContent,
  StatCard, LoadingState, ErrorState, FilterBar, SearchBar, EmptyState,
} from "@/components/ds";
import { FeatureGate } from "@/components/FeatureGate";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Wallet, ArrowDownLeft, ArrowUpRight, Tags, Layers, Plus, Pencil, X, Check,
  RefreshCw, AlertCircle, Calendar, Sparkles, Lock, Ban,
} from "lucide-react";
import { usePlanFeatures } from "@/hooks/usePlanFeatures";
import {
  cancelEntry, deleteCategory, deleteCostCenter, formatBRL, getDashboard,
  listCategories, listCostCenters, listEntries, upsertCategory, upsertCostCenter,
  STATUS_ACCENT, STATUS_LABEL, METHOD_LABEL,
  type EntryFilters, type FinanceCategory, type FinanceCostCenter, type FinanceDashboard,
  type FinanceDirection, type FinanceEntry, type FinanceStatus,
} from "@/lib/finance";
import { EntryDialog } from "@/components/finance/EntryDialog";
import { PayEntryDialog } from "@/components/finance/PayEntryDialog";

export const Route = createFileRoute("/_authenticated/admin/financeiro")({
  component: FinanceiroGated,
  head: () => ({ meta: [{ title: "Financeiro — Comandex" }] }),
});

function FinanceiroGated() {
  return (
    <FeatureGate feature={"finance_basic" as any}>
      <Financeiro />
    </FeatureGate>
  );
}

const todayISO = () => new Date().toISOString().slice(0, 10);
const daysAgoISO = (n: number) => {
  const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10);
};

function Financeiro() {
  const { restaurantId } = useAuth();
  const { has } = usePlanFeatures();
  const canCostCenters = has("finance_advanced");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [dashboard, setDashboard] = useState<FinanceDashboard | null>(null);
  const [categories, setCategories] = useState<FinanceCategory[]>([]);
  const [costCenters, setCostCenters] = useState<FinanceCostCenter[]>([]);
  const [entries, setEntries] = useState<FinanceEntry[]>([]);

  // period
  const [from, setFrom] = useState(daysAgoISO(30));
  const [to, setTo] = useState(todayISO());

  // list filters
  const [statusFilter, setStatusFilter] = useState<FinanceStatus | "all">("all");
  const [search, setSearch] = useState("");

  // dialogs
  const [entryDialog, setEntryDialog] = useState<{ open: boolean; direction: FinanceDirection; editing: FinanceEntry | null }>({
    open: false, direction: "payable", editing: null,
  });
  const [payDialog, setPayDialog] = useState<{ open: boolean; entry: FinanceEntry | null }>({ open: false, entry: null });

  const [catDialog, setCatDialog] = useState<{ open: boolean; editing: FinanceCategory | null }>({ open: false, editing: null });
  const [ccDialog, setCcDialog] = useState<{ open: boolean; editing: FinanceCostCenter | null }>({ open: false, editing: null });

  const load = useCallback(async () => {
    if (!restaurantId) return;
    setError(null);
    try {
      const [dash, cats, ccs, ents] = await Promise.all([
        getDashboard(restaurantId, from, to),
        listCategories(restaurantId),
        canCostCenters ? listCostCenters(restaurantId) : Promise.resolve([]),
        listEntries(restaurantId, { from, to }),
      ]);
      setDashboard(dash);
      setCategories(cats);
      setCostCenters(ccs);
      setEntries(ents);
    } catch (e: any) {
      setError(e?.message ?? "Erro ao carregar financeiro");
    } finally {
      setLoading(false);
    }
  }, [restaurantId, from, to, canCostCenters]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!restaurantId) return;
    const ch = supabase
      .channel(`finance-${restaurantId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "finance_entries", filter: `restaurant_id=eq.${restaurantId}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [restaurantId, load]);

  const catById = useMemo(() => Object.fromEntries(categories.map((c) => [c.id, c])), [categories]);
  const ccById = useMemo(() => Object.fromEntries(costCenters.map((c) => [c.id, c])), [costCenters]);

  const filterEntries = (dir: FinanceDirection | "all") => {
    let list = entries;
    if (dir !== "all") list = list.filter((e) => e.direction === dir);
    if (statusFilter !== "all") list = list.filter((e) => e.status === statusFilter);
    const q = search.trim().toLowerCase();
    if (q) list = list.filter((e) =>
      e.description.toLowerCase().includes(q) ||
      (e.supplier ?? "").toLowerCase().includes(q) ||
      (e.customer ?? "").toLowerCase().includes(q) ||
      (e.document ?? "").toLowerCase().includes(q),
    );
    return list;
  };

  const doCancel = async (e: FinanceEntry) => {
    if (!confirm(`Cancelar lançamento "${e.description}"?`)) return;
    try { await cancelEntry(e.id); toast.success("Cancelado"); load(); }
    catch (err: any) { toast.error(err?.message ?? "Erro"); }
  };

  if (loading) {
    return (
      <AdminPageLayout kicker="Gestão" title="Financeiro" accent="violet" icon={Wallet}>
        <LoadingState label="Carregando financeiro…" />
      </AdminPageLayout>
    );
  }
  if (error) {
    return (
      <AdminPageLayout kicker="Gestão" title="Financeiro" accent="violet" icon={Wallet}>
        <ErrorState description={error} onRetry={load} />
      </AdminPageLayout>
    );
  }

  return (
    <AdminPageLayout
      kicker="Gestão"
      title="Financeiro"
      subtitle="Contas a pagar/receber, categorias e centros de custo — camada gerencial sobre o caixa operacional."
      accent="violet"
      icon={Wallet}
      actions={
        <div className="flex items-center gap-2">
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-[140px]" />
          <span className="text-ink/40">→</span>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-[140px]" />
          <Button variant="outline" size="sm" onClick={load}><RefreshCw className="h-4 w-4 mr-2" />Atualizar</Button>
        </div>
      }
    >
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="h-auto p-1 flex flex-wrap gap-1 bg-card border-2 border-ink rounded-xl">
          <TabsTrigger value="overview">Visão geral</TabsTrigger>
          <TabsTrigger value="payable">Contas a pagar</TabsTrigger>
          <TabsTrigger value="receivable">Contas a receber</TabsTrigger>
          <TabsTrigger value="categories">Categorias</TabsTrigger>
          <TabsTrigger value="cost_centers">Centros de custo</TabsTrigger>
        </TabsList>

        {/* OVERVIEW */}
        <TabsContent value="overview" className="space-y-6">
          <DashboardGrid cols={4}>
            <StatCard label="A pagar em aberto" value={formatBRL(dashboard?.payable_open ?? 0)} icon={ArrowUpRight} accent="magenta" />
            <StatCard label="A receber em aberto" value={formatBRL(dashboard?.receivable_open ?? 0)} icon={ArrowDownLeft} accent="violet" />
            <StatCard label="Pago no período" value={formatBRL(dashboard?.paid_period ?? 0)} icon={Check} accent="amber" />
            <StatCard label="Recebido no período" value={formatBRL(dashboard?.received_period ?? 0)} icon={Check} accent="orange" />
          </DashboardGrid>
          <DashboardGrid cols={4}>
            <StatCard label="Vencidos a pagar" value={formatBRL(dashboard?.payable_overdue ?? 0)} icon={AlertCircle} accent="magenta" />
            <StatCard label="Vencidos a receber" value={formatBRL(dashboard?.receivable_overdue ?? 0)} icon={AlertCircle} accent="magenta" />
            <StatCard label="Vencem hoje (pagar)" value={dashboard?.today_due_payable ?? 0} icon={Calendar} accent="violet" />
            <StatCard label="Vencem hoje (receber)" value={dashboard?.today_due_receivable ?? 0} icon={Calendar} accent="violet" />
          </DashboardGrid>

          <Section>
            <SectionHeader
              title="Próximos vencimentos"
              description="Lançamentos em aberto ou parciais no período selecionado."
            />
            <SectionContent>
              {entries.filter((e) => e.status === "pending" || e.status === "partial" || e.status === "overdue").length === 0 ? (
                <p className="text-sm text-ink/60">Nada em aberto no período. 🎉</p>
              ) : (
                <div className="divide-y divide-ink/10">
                  {entries
                    .filter((e) => e.status === "pending" || e.status === "partial" || e.status === "overdue")
                    .slice(0, 10)
                    .map((e) => (
                      <div key={e.id} className="py-3 flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <p className="font-bold text-ink truncate">{e.description}</p>
                          <p className="text-xs text-ink/60">
                            {e.direction === "payable" ? "Pagar" : "Receber"} · vence {new Date(e.due_date + "T12:00").toLocaleDateString("pt-BR")}
                            {e.category_id && catById[e.category_id] ? ` · ${catById[e.category_id].name}` : ""}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-ink">{formatBRL(Number(e.amount) - Number(e.amount_paid))}</span>
                          <Badge className={STATUS_ACCENT[e.status]}>{STATUS_LABEL[e.status]}</Badge>
                          <Button size="sm" onClick={() => setPayDialog({ open: true, entry: e })}>
                            <Check className="h-3.5 w-3.5 mr-1" /> {e.direction === "payable" ? "Pagar" : "Receber"}
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </SectionContent>
          </Section>
        </TabsContent>

        {/* PAYABLE */}
        <TabsContent value="payable" className="space-y-4">
          <EntriesTab
            direction="payable"
            entries={filterEntries("payable")}
            categories={categories}
            costCenters={costCenters}
            catById={catById}
            ccById={ccById}
            search={search}
            setSearch={setSearch}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            onNew={() => setEntryDialog({ open: true, direction: "payable", editing: null })}
            onEdit={(e) => setEntryDialog({ open: true, direction: "payable", editing: e })}
            onPay={(e) => setPayDialog({ open: true, entry: e })}
            onCancel={doCancel}
          />
        </TabsContent>

        {/* RECEIVABLE */}
        <TabsContent value="receivable" className="space-y-4">
          <EntriesTab
            direction="receivable"
            entries={filterEntries("receivable")}
            categories={categories}
            costCenters={costCenters}
            catById={catById}
            ccById={ccById}
            search={search}
            setSearch={setSearch}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            onNew={() => setEntryDialog({ open: true, direction: "receivable", editing: null })}
            onEdit={(e) => setEntryDialog({ open: true, direction: "receivable", editing: e })}
            onPay={(e) => setPayDialog({ open: true, entry: e })}
            onCancel={doCancel}
          />
        </TabsContent>

        {/* CATEGORIES */}
        <TabsContent value="categories" className="space-y-4">
          <FilterBar
            actions={
              <Button onClick={() => setCatDialog({ open: true, editing: null })}>
                <Plus className="h-4 w-4 mr-2" /> Nova categoria
              </Button>
            }
          >
            <p className="text-sm text-ink/60">Separe categorias de receita e despesa para relatórios mais claros.</p>
          </FilterBar>
          {categories.length === 0 ? (
            <EmptyState
              icon={Tags}
              title="Sem categorias"
              description="Crie categorias para classificar suas contas a pagar e receber."
              action={<Button onClick={() => setCatDialog({ open: true, editing: null })}><Plus className="h-4 w-4 mr-2" />Nova categoria</Button>}
            />
          ) : (
            <Section chrome={false} className="overflow-hidden border-2 border-ink rounded-2xl bg-card shadow-[5px_5px_0_0_oklch(0.15_0.02_30)]">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-left text-[11px] uppercase tracking-wider text-ink/60">
                    <tr>
                      <th className="px-4 py-3">Nome</th>
                      <th className="px-4 py-3">Tipo</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((c) => (
                      <tr key={c.id} className="border-t border-ink/10 hover:bg-muted/20">
                        <td className="px-4 py-3 font-bold text-ink">{c.name}</td>
                        <td className="px-4 py-3">
                          <Badge className={c.direction === "payable" ? "bg-brand-magenta/20 border-brand-magenta text-ink" : "bg-brand-violet/20 border-brand-violet text-ink"}>
                            {c.direction === "payable" ? "Despesa" : "Receita"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          {c.is_active ? <Badge className="bg-emerald-500/20 border-emerald-500 text-ink">Ativa</Badge> : <Badge variant="outline">Inativa</Badge>}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button size="sm" variant="ghost" onClick={() => setCatDialog({ open: true, editing: c })}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={async () => {
                            if (!confirm(`Excluir categoria "${c.name}"?`)) return;
                            try { await deleteCategory(c.id); toast.success("Excluída"); load(); }
                            catch (e: any) { toast.error(e?.message ?? "Erro"); }
                          }}>
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
          )}
        </TabsContent>

        {/* COST CENTERS */}
        <TabsContent value="cost_centers" className="space-y-4">
          {!canCostCenters ? (
            <EmptyState
              icon={Lock}
              title="Centros de custo — plano Business"
              description="Faça upgrade para organizar suas contas por centros de custo e habilitar DRE e conciliações."
              action={
                <Button asChild variant="gradient">
                  <Link to="/admin/configuracoes"><Sparkles className="h-4 w-4 mr-2" />Ver planos</Link>
                </Button>
              }
            />
          ) : (
            <>
              <FilterBar
                actions={
                  <Button onClick={() => setCcDialog({ open: true, editing: null })}>
                    <Plus className="h-4 w-4 mr-2" /> Novo centro de custo
                  </Button>
                }
              >
                <p className="text-sm text-ink/60">Agrupe despesas por área (cozinha, delivery, marketing…).</p>
              </FilterBar>
              {costCenters.length === 0 ? (
                <EmptyState
                  icon={Layers}
                  title="Sem centros de custo"
                  description="Crie centros para segmentar suas despesas."
                  action={<Button onClick={() => setCcDialog({ open: true, editing: null })}><Plus className="h-4 w-4 mr-2" />Novo</Button>}
                />
              ) : (
                <Section chrome={false} className="overflow-hidden border-2 border-ink rounded-2xl bg-card shadow-[5px_5px_0_0_oklch(0.15_0.02_30)]">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/40 text-left text-[11px] uppercase tracking-wider text-ink/60">
                        <tr>
                          <th className="px-4 py-3">Nome</th>
                          <th className="px-4 py-3">Descrição</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3 text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {costCenters.map((c) => (
                          <tr key={c.id} className="border-t border-ink/10 hover:bg-muted/20">
                            <td className="px-4 py-3 font-bold text-ink">{c.name}</td>
                            <td className="px-4 py-3 text-ink/70">{c.description ?? "—"}</td>
                            <td className="px-4 py-3">
                              {c.is_active ? <Badge className="bg-emerald-500/20 border-emerald-500 text-ink">Ativo</Badge> : <Badge variant="outline">Inativo</Badge>}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <Button size="sm" variant="ghost" onClick={() => setCcDialog({ open: true, editing: c })}>
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={async () => {
                                if (!confirm(`Excluir centro "${c.name}"?`)) return;
                                try { await deleteCostCenter(c.id); toast.success("Excluído"); load(); }
                                catch (e: any) { toast.error(e?.message ?? "Erro"); }
                              }}>
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Section>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

      {restaurantId && (
        <>
          <EntryDialog
            open={entryDialog.open}
            onOpenChange={(v) => setEntryDialog((s) => ({ ...s, open: v }))}
            restaurantId={restaurantId}
            direction={entryDialog.direction}
            editing={entryDialog.editing}
            categories={categories}
            costCenters={costCenters}
            canCostCenters={canCostCenters}
            onSaved={load}
          />
          <PayEntryDialog
            open={payDialog.open}
            onOpenChange={(v) => setPayDialog((s) => ({ ...s, open: v }))}
            entry={payDialog.entry}
            restaurantId={restaurantId}
            onPaid={load}
          />
          <CategoryDialog
            open={catDialog.open}
            onOpenChange={(v) => setCatDialog((s) => ({ ...s, open: v }))}
            restaurantId={restaurantId}
            editing={catDialog.editing}
            onSaved={load}
          />
          <CostCenterDialog
            open={ccDialog.open}
            onOpenChange={(v) => setCcDialog((s) => ({ ...s, open: v }))}
            restaurantId={restaurantId}
            editing={ccDialog.editing}
            onSaved={load}
          />
        </>
      )}
    </AdminPageLayout>
  );
}

// ---------- Sub-components ----------

interface EntriesTabProps {
  direction: FinanceDirection;
  entries: FinanceEntry[];
  categories: FinanceCategory[];
  costCenters: FinanceCostCenter[];
  catById: Record<string, FinanceCategory>;
  ccById: Record<string, FinanceCostCenter>;
  search: string;
  setSearch: (v: string) => void;
  statusFilter: FinanceStatus | "all";
  setStatusFilter: (v: FinanceStatus | "all") => void;
  onNew: () => void;
  onEdit: (e: FinanceEntry) => void;
  onPay: (e: FinanceEntry) => void;
  onCancel: (e: FinanceEntry) => void;
}

function EntriesTab(p: EntriesTabProps) {
  return (
    <>
      <FilterBar
        actions={
          <Button onClick={p.onNew}>
            <Plus className="h-4 w-4 mr-2" /> Novo lançamento
          </Button>
        }
      >
        <SearchBar value={p.search} onChange={p.setSearch} placeholder="Buscar descrição, fornecedor, cliente…" />
        <Select value={p.statusFilter} onValueChange={(v) => p.setStatusFilter(v as any)}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos status</SelectItem>
            <SelectItem value="pending">Em aberto</SelectItem>
            <SelectItem value="partial">Parcial</SelectItem>
            <SelectItem value="overdue">Vencido</SelectItem>
            <SelectItem value="paid">Quitado</SelectItem>
            <SelectItem value="cancelled">Cancelado</SelectItem>
          </SelectContent>
        </Select>
      </FilterBar>

      {p.entries.length === 0 ? (
        <EmptyState
          icon={p.direction === "payable" ? ArrowUpRight : ArrowDownLeft}
          title={p.direction === "payable" ? "Sem contas a pagar" : "Sem contas a receber"}
          description="Crie seu primeiro lançamento para começar."
          action={<Button onClick={p.onNew}><Plus className="h-4 w-4 mr-2" />Novo lançamento</Button>}
        />
      ) : (
        <Section chrome={false} className="overflow-hidden border-2 border-ink rounded-2xl bg-card shadow-[5px_5px_0_0_oklch(0.15_0.02_30)]">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left text-[11px] uppercase tracking-wider text-ink/60">
                <tr>
                  <th className="px-4 py-3">Descrição</th>
                  <th className="px-4 py-3">Categoria</th>
                  <th className="px-4 py-3">{p.direction === "payable" ? "Fornecedor" : "Cliente"}</th>
                  <th className="px-4 py-3">Vencimento</th>
                  <th className="px-4 py-3 text-right">Valor</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {p.entries.map((e) => {
                  const cat = e.category_id ? p.catById[e.category_id] : null;
                  const cc = e.cost_center_id ? p.ccById[e.cost_center_id] : null;
                  return (
                    <tr key={e.id} className="border-t border-ink/10 hover:bg-muted/20">
                      <td className="px-4 py-3">
                        <p className="font-bold text-ink">{e.description}</p>
                        <p className="text-[11px] text-ink/50">
                          {e.is_fixed ? "Fixa · " : ""}
                          {e.payment_method ? `${METHOD_LABEL[e.payment_method]}` : "Sem método"}
                          {cc ? ` · ${cc.name}` : ""}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-ink/70">{cat?.name ?? "—"}</td>
                      <td className="px-4 py-3 text-ink/70">
                        {(p.direction === "payable" ? e.supplier : e.customer) ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-ink/70">{new Date(e.due_date + "T12:00").toLocaleDateString("pt-BR")}</td>
                      <td className="px-4 py-3 text-right">
                        <p className="font-bold text-ink">{formatBRL(e.amount)}</p>
                        {Number(e.amount_paid) > 0 && Number(e.amount_paid) < Number(e.amount) && (
                          <p className="text-[11px] text-ink/50">Pago {formatBRL(e.amount_paid)}</p>
                        )}
                      </td>
                      <td className="px-4 py-3"><Badge className={STATUS_ACCENT[e.status]}>{STATUS_LABEL[e.status]}</Badge></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          {e.status !== "paid" && e.status !== "cancelled" && (
                            <Button size="sm" onClick={() => p.onPay(e)} title="Registrar pagamento/recebimento">
                              <Check className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" onClick={() => p.onEdit(e)} title="Editar">
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          {e.status !== "cancelled" && (
                            <Button size="sm" variant="ghost" onClick={() => p.onCancel(e)} title="Cancelar">
                              <Ban className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Section>
      )}
    </>
  );
}

function CategoryDialog({
  open, onOpenChange, restaurantId, editing, onSaved,
}: { open: boolean; onOpenChange: (v: boolean) => void; restaurantId: string; editing: FinanceCategory | null; onSaved: () => void }) {
  const [name, setName] = useState("");
  const [direction, setDirection] = useState<FinanceDirection>("payable");
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (editing) { setName(editing.name); setDirection(editing.direction); setIsActive(editing.is_active); }
    else { setName(""); setDirection("payable"); setIsActive(true); }
  }, [open, editing]);

  const save = async () => {
    const nm = name.trim();
    if (!nm) { toast.error("Informe um nome"); return; }
    if (nm.length > 80) { toast.error("Nome muito longo"); return; }
    setSaving(true);
    try {
      await upsertCategory({ id: editing?.id, restaurant_id: restaurantId, name: nm, direction, is_active: isActive });
      toast.success(editing ? "Categoria atualizada" : "Categoria criada");
      onOpenChange(false); onSaved();
    } catch (e: any) { toast.error(e?.message ?? "Erro"); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{editing ? "Editar categoria" : "Nova categoria"}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div><Label>Nome *</Label><Input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} /></div>
          <div>
            <Label>Tipo</Label>
            <Select value={direction} onValueChange={(v) => setDirection(v as FinanceDirection)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="payable">Despesa (a pagar)</SelectItem>
                <SelectItem value="receivable">Receita (a receber)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between rounded-lg border-2 border-ink/10 bg-muted/40 px-3 py-2">
            <div><p className="text-sm font-bold text-ink">Ativa</p><p className="text-xs text-ink/60">Somente ativas aparecem nos formulários.</p></div>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Salvando…" : "Salvar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CostCenterDialog({
  open, onOpenChange, restaurantId, editing, onSaved,
}: { open: boolean; onOpenChange: (v: boolean) => void; restaurantId: string; editing: FinanceCostCenter | null; onSaved: () => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (editing) { setName(editing.name); setDescription(editing.description ?? ""); setIsActive(editing.is_active); }
    else { setName(""); setDescription(""); setIsActive(true); }
  }, [open, editing]);

  const save = async () => {
    const nm = name.trim();
    if (!nm) { toast.error("Informe um nome"); return; }
    if (nm.length > 80) { toast.error("Nome muito longo"); return; }
    setSaving(true);
    try {
      await upsertCostCenter({ id: editing?.id, restaurant_id: restaurantId, name: nm, description: description || null, is_active: isActive });
      toast.success(editing ? "Centro atualizado" : "Centro criado");
      onOpenChange(false); onSaved();
    } catch (e: any) { toast.error(e?.message ?? "Erro"); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{editing ? "Editar centro de custo" : "Novo centro de custo"}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div><Label>Nome *</Label><Input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} /></div>
          <div><Label>Descrição</Label><Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={200} /></div>
          <div className="flex items-center justify-between rounded-lg border-2 border-ink/10 bg-muted/40 px-3 py-2">
            <div><p className="text-sm font-bold text-ink">Ativo</p></div>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Salvando…" : "Salvar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
