import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  AdminPageLayout,
  DashboardGrid,
  Section,
  SectionHeader,
  SectionContent,
  StatCard,
  LoadingState,
  ErrorState,
  FilterBar,
  SearchBar,
  EmptyState,
} from "@/components/ds";
import { FeatureGate } from "@/components/FeatureGate";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Boxes, Package, AlertTriangle, TrendingDown, Activity, Plus, Pencil, Trash2,
  ArrowDownUp, RefreshCw, Truck, Ruler, Search, ChefHat, Sparkles, Lock,
} from "lucide-react";
import {
  getStockOverview, listIngredients, listMovements, listSuppliers, listUnits,
  createIngredient, updateIngredient, upsertSupplier, deleteSupplier, upsertUnit, deleteUnit,
  formatBRL, MOVEMENT_LABEL, MOVEMENT_ACCENT, listProductsRecipeStatus,
  type StockIngredient, type StockMovement, type StockOverview, type StockSupplier, type StockUnit,
  type StockMovementType, type ProductRecipeStatus,
} from "@/lib/stock";
import { MovementDialog } from "@/components/stock/MovementDialog";
import { RecipeDialog } from "@/components/stock/RecipeDialog";
import { usePlanFeatures } from "@/hooks/usePlanFeatures";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/admin/estoque")({
  component: EstoqueGated,
  head: () => ({ meta: [{ title: "Estoque — Comandex" }] }),
});

function EstoqueGated() {
  return (
    <FeatureGate feature={"stock" as any}>
      <Estoque />
    </FeatureGate>
  );
}

type SortKey = "name" | "current_qty" | "avg_cost" | "value";

function Estoque() {
  const { restaurantId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [overview, setOverview] = useState<StockOverview | null>(null);
  const [ingredients, setIngredients] = useState<StockIngredient[]>([]);
  const [suppliers, setSuppliers] = useState<StockSupplier[]>([]);
  const [units, setUnits] = useState<StockUnit[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);

  // filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive" | "low">("all");
  const [sortBy, setSortBy] = useState<SortKey>("name");

  const [movSearch, setMovSearch] = useState("");
  const [movTypeFilter, setMovTypeFilter] = useState<"all" | StockMovementType>("all");

  // dialogs
  const [ingDialogOpen, setIngDialogOpen] = useState(false);
  const [editingIng, setEditingIng] = useState<StockIngredient | null>(null);

  const [supDialogOpen, setSupDialogOpen] = useState(false);
  const [editingSup, setEditingSup] = useState<StockSupplier | null>(null);

  const [unitDialogOpen, setUnitDialogOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<StockUnit | null>(null);

  const [movDialogOpen, setMovDialogOpen] = useState(false);
  const [movTarget, setMovTarget] = useState<StockIngredient | null>(null);
  const [movDefaultType, setMovDefaultType] = useState<StockMovementType>("entry");

  // Recipes / Ficha técnica
  const { has: hasFeature } = usePlanFeatures();
  const canRecipes = hasFeature("stock_recipes");
  const [recipeStatus, setRecipeStatus] = useState<ProductRecipeStatus[]>([]);
  const [recipeSearch, setRecipeSearch] = useState("");
  const [recipeFilter, setRecipeFilter] = useState<"all" | "missing" | "configured">("all");
  const [recipeSort, setRecipeSort] = useState<"name" | "margin_percent" | "margin_value" | "cost">("name");
  const [recipeDialogOpen, setRecipeDialogOpen] = useState(false);
  const [recipeTarget, setRecipeTarget] = useState<ProductRecipeStatus | null>(null);

  const load = useCallback(async () => {
    if (!restaurantId) return;
    setError(null);
    try {
      const [ov, ings, sups, uns, moves] = await Promise.all([
        getStockOverview(restaurantId),
        listIngredients(restaurantId),
        listSuppliers(restaurantId),
        listUnits(restaurantId),
        listMovements(restaurantId, 200),
      ]);
      setOverview(ov);
      setIngredients(ings);
      setSuppliers(sups);
      setUnits(uns);
      setMovements(moves);
    } catch (e: any) {
      setError(e?.message ?? "Erro ao carregar");
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  const loadRecipes = useCallback(async () => {
    if (!restaurantId || !canRecipes) return;
    try { setRecipeStatus(await listProductsRecipeStatus(restaurantId)); }
    catch (e: any) { toast.error(e?.message ?? "Erro ao carregar fichas"); }
  }, [restaurantId, canRecipes]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadRecipes(); }, [loadRecipes]);

  // Realtime
  useEffect(() => {
    if (!restaurantId) return;
    const channel = supabase
      .channel(`stock-${restaurantId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "stock_ingredients", filter: `restaurant_id=eq.${restaurantId}` }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "stock_movements", filter: `restaurant_id=eq.${restaurantId}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [restaurantId, load]);

  const filteredIngredients = useMemo(() => {
    let list = ingredients.slice();
    const q = search.trim().toLowerCase();
    if (q) list = list.filter((i) => i.name.toLowerCase().includes(q) || (i.sku ?? "").toLowerCase().includes(q));
    if (statusFilter === "active") list = list.filter((i) => i.is_active);
    else if (statusFilter === "inactive") list = list.filter((i) => !i.is_active);
    else if (statusFilter === "low") list = list.filter((i) => i.is_active && Number(i.current_qty) <= Number(i.min_qty));
    list.sort((a, b) => {
      switch (sortBy) {
        case "current_qty": return Number(b.current_qty) - Number(a.current_qty);
        case "avg_cost": return Number(b.avg_cost) - Number(a.avg_cost);
        case "value": return Number(b.current_qty) * Number(b.avg_cost) - Number(a.current_qty) * Number(a.avg_cost);
        default: return a.name.localeCompare(b.name, "pt-BR");
      }
    });
    return list;
  }, [ingredients, search, statusFilter, sortBy]);

  const filteredSuppliers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return suppliers;
    return suppliers.filter((s) =>
      s.name.toLowerCase().includes(q) ||
      (s.contact ?? "").toLowerCase().includes(q) ||
      (s.phone ?? "").toLowerCase().includes(q) ||
      (s.email ?? "").toLowerCase().includes(q),
    );
  }, [suppliers, search]);

  const unitById = useMemo(() => Object.fromEntries(units.map((u) => [u.id, u])), [units]);
  const ingById = useMemo(() => Object.fromEntries(ingredients.map((i) => [i.id, i])), [ingredients]);

  const filteredMovements = useMemo(() => {
    let list = movements;
    if (movTypeFilter !== "all") list = list.filter((m) => m.movement_type === movTypeFilter);
    const q = movSearch.trim().toLowerCase();
    if (q) list = list.filter((m) => (ingById[m.ingredient_id]?.name ?? "").toLowerCase().includes(q) || (m.reason ?? "").toLowerCase().includes(q));
    return list;
  }, [movements, movTypeFilter, movSearch, ingById]);

  const openMovement = (ing: StockIngredient, type: StockMovementType = "entry") => {
    setMovTarget(ing); setMovDefaultType(type); setMovDialogOpen(true);
  };

  const inactivateIng = async (ing: StockIngredient) => {
    if (!confirm(`Inativar ingrediente "${ing.name}"?`)) return;
    try { await updateIngredient({ id: ing.id, is_active: false }); toast.success("Inativado"); load(); }
    catch (e: any) { toast.error(e?.message ?? "Erro"); }
  };

  if (loading) {
    return (
      <AdminPageLayout kicker="Operação" title="Estoque" subtitle="Controle de ingredientes e movimentações" accent="orange" icon={Boxes}>
        <LoadingState label="Carregando estoque…" />
      </AdminPageLayout>
    );
  }
  if (error) {
    return (
      <AdminPageLayout kicker="Operação" title="Estoque" accent="orange" icon={Boxes}>
        <ErrorState description={error} onRetry={load} />
      </AdminPageLayout>
    );
  }

  return (
    <AdminPageLayout
      kicker="Operação"
      title="Estoque"
      subtitle="Controle inteligente de ingredientes, fornecedores e movimentações"
      accent="orange"
      icon={Boxes}
      actions={
        <Button variant="outline" size="sm" onClick={load}>
          <RefreshCw className="h-4 w-4 mr-2" /> Atualizar
        </Button>
      }
    >
      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="h-auto p-1 flex flex-wrap gap-1 bg-card border-2 border-ink rounded-xl">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="ingredients">Ingredientes</TabsTrigger>
          <TabsTrigger value="suppliers">Fornecedores</TabsTrigger>
          <TabsTrigger value="units">Unidades</TabsTrigger>
          <TabsTrigger value="movements">Movimentações</TabsTrigger>
          <TabsTrigger value="recipes">Ficha Técnica</TabsTrigger>
          <TabsTrigger value="alerts">
            Alertas {overview && overview.ingredients_low > 0 && (
              <span className="ml-2 bg-brand-magenta text-background text-[10px] px-1.5 rounded font-bold">{overview.ingredients_low}</span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* DASHBOARD */}
        <TabsContent value="dashboard" className="space-y-6">
          <DashboardGrid cols={4}>
            <StatCard label="Valor em estoque" value={formatBRL(overview?.stock_value ?? 0)} icon={Package} accent="orange" />
            <StatCard label="Ingredientes ativos" value={overview?.ingredients_total ?? 0} icon={Boxes} accent="violet" />
            <StatCard label="Abaixo do mínimo" value={overview?.ingredients_low ?? 0} icon={AlertTriangle} accent="magenta" />
            <StatCard label="Movimentações hoje" value={overview?.movements_today ?? 0} icon={Activity} accent="blue" />
          </DashboardGrid>
          <DashboardGrid cols={2}>
            <StatCard label="Perdas (30d)" value={formatBRL(overview?.losses_30d_value ?? 0)} icon={TrendingDown} accent="magenta" hint="Total financeiro das perdas registradas nos últimos 30 dias." />
            <StatCard label="Fornecedores" value={suppliers.filter((s) => s.is_active).length} icon={Truck} accent="amber" />
          </DashboardGrid>

          <Section>
            <SectionHeader title="Alertas de estoque baixo" description="Ingredientes ativos com quantidade abaixo do mínimo configurado." />
            <SectionContent>
              {(overview?.low_ingredients ?? []).length === 0 ? (
                <p className="text-sm text-ink/60">Nenhum ingrediente abaixo do mínimo. 🎉</p>
              ) : (
                <div className="divide-y divide-ink/10">
                  {overview!.low_ingredients.slice(0, 5).map((i) => (
                    <div key={i.id} className="py-3 flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="font-bold text-ink truncate">{i.name}</p>
                        <p className="text-xs text-ink/60">Atual {Number(i.current_qty).toLocaleString("pt-BR")} {i.unit ?? ""} · mín {Number(i.min_qty).toLocaleString("pt-BR")} {i.unit ?? ""}</p>
                      </div>
                      <Button size="sm" onClick={() => { const ing = ingById[i.id]; if (ing) openMovement(ing, "entry"); }}>
                        <Plus className="h-3.5 w-3.5 mr-1" /> Entrada
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </SectionContent>
          </Section>
        </TabsContent>

        {/* INGREDIENTES */}
        <TabsContent value="ingredients" className="space-y-4">
          <FilterBar
            actions={
              <Button onClick={() => { setEditingIng(null); setIngDialogOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" /> Novo ingrediente
              </Button>
            }
          >
            <SearchBar value={search} onChange={setSearch} placeholder="Buscar ingrediente…" />
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
              <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="inactive">Inativos</SelectItem>
                <SelectItem value="low">Estoque baixo</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortKey)}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Ordenar: nome</SelectItem>
                <SelectItem value="current_qty">Ordenar: quantidade</SelectItem>
                <SelectItem value="avg_cost">Ordenar: custo médio</SelectItem>
                <SelectItem value="value">Ordenar: valor</SelectItem>
              </SelectContent>
            </Select>
          </FilterBar>

          {filteredIngredients.length === 0 ? (
            <EmptyState
              icon={Boxes}
              title="Nenhum ingrediente"
              description="Cadastre seu primeiro ingrediente para começar o controle de estoque."
              action={<Button onClick={() => { setEditingIng(null); setIngDialogOpen(true); }}><Plus className="h-4 w-4 mr-2" /> Novo ingrediente</Button>}
            />
          ) : (
            <Section chrome={false} className="overflow-hidden border-2 border-ink rounded-2xl bg-card shadow-[5px_5px_0_0_oklch(0.15_0.02_30)]">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-left text-[11px] uppercase tracking-wider text-ink/60">
                    <tr>
                      <th className="px-4 py-3">Ingrediente</th>
                      <th className="px-4 py-3">Estoque</th>
                      <th className="px-4 py-3">Mínimo</th>
                      <th className="px-4 py-3">Custo médio</th>
                      <th className="px-4 py-3">Valor</th>
                      <th className="px-4 py-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredIngredients.map((i) => {
                      const unit = i.unit_id ? unitById[i.unit_id]?.symbol ?? "" : "";
                      const low = i.is_active && Number(i.current_qty) <= Number(i.min_qty);
                      const value = Number(i.current_qty) * Number(i.avg_cost);
                      return (
                        <tr key={i.id} className="border-t border-ink/10 hover:bg-muted/20">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div>
                                <p className={`font-bold ${i.is_active ? "text-ink" : "text-ink/50"}`}>{i.name}</p>
                                {i.sku && <p className="text-[11px] text-ink/50">SKU {i.sku}</p>}
                              </div>
                              {low && <Badge className="bg-brand-magenta text-background border-brand-magenta">Estoque baixo</Badge>}
                              {!i.is_active && <Badge variant="outline">Inativo</Badge>}
                            </div>
                          </td>
                          <td className="px-4 py-3 font-bold">{Number(i.current_qty).toLocaleString("pt-BR")} {unit}</td>
                          <td className="px-4 py-3 text-ink/70">{Number(i.min_qty).toLocaleString("pt-BR")} {unit}</td>
                          <td className="px-4 py-3">{formatBRL(i.avg_cost)}</td>
                          <td className="px-4 py-3 font-bold">{formatBRL(value)}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1 justify-end">
                              <Button size="sm" variant="outline" onClick={() => openMovement(i, "entry")} title="Registrar movimentação">
                                <ArrowDownUp className="h-3.5 w-3.5" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => { setEditingIng(i); setIngDialogOpen(true); }} title="Editar">
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              {i.is_active && (
                                <Button size="sm" variant="ghost" onClick={() => inactivateIng(i)} title="Inativar">
                                  <Trash2 className="h-3.5 w-3.5" />
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
        </TabsContent>

        {/* FORNECEDORES */}
        <TabsContent value="suppliers" className="space-y-4">
          <FilterBar
            actions={
              <Button onClick={() => { setEditingSup(null); setSupDialogOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" /> Novo fornecedor
              </Button>
            }
          >
            <SearchBar value={search} onChange={setSearch} placeholder="Buscar fornecedor…" />
          </FilterBar>

          {filteredSuppliers.length === 0 ? (
            <EmptyState icon={Truck} title="Nenhum fornecedor" description="Cadastre fornecedores para vincular às entradas de estoque." />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSuppliers.map((s) => (
                <Section key={s.id}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <h3 className="font-display text-lg text-ink truncate">{s.name}</h3>
                      {s.contact && <p className="text-xs text-ink/60">{s.contact}</p>}
                    </div>
                    {!s.is_active && <Badge variant="outline">Inativo</Badge>}
                  </div>
                  <div className="text-sm text-ink/70 space-y-1 mb-3">
                    {s.phone && <div>📞 {s.phone}</div>}
                    {s.email && <div>✉️ {s.email}</div>}
                    {s.notes && <div className="text-xs text-ink/50 pt-1">{s.notes}</div>}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => { setEditingSup(s); setSupDialogOpen(true); }}>
                      <Pencil className="h-3.5 w-3.5 mr-1" /> Editar
                    </Button>
                    <Button size="sm" variant="ghost" onClick={async () => {
                      if (!confirm(`Remover fornecedor "${s.name}"?`)) return;
                      try { await deleteSupplier(s.id); toast.success("Removido"); load(); }
                      catch (e: any) { toast.error(e?.message ?? "Erro"); }
                    }}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </Section>
              ))}
            </div>
          )}
        </TabsContent>

        {/* UNIDADES */}
        <TabsContent value="units" className="space-y-4">
          <FilterBar
            actions={
              <Button onClick={() => { setEditingUnit(null); setUnitDialogOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" /> Nova unidade
              </Button>
            }
          >
            <p className="text-sm text-ink/60">Unidades de medida usadas pelos ingredientes.</p>
          </FilterBar>

          {units.length === 0 ? (
            <EmptyState icon={Ruler} title="Nenhuma unidade" description="Cadastre unidades como kg, g, L, un para usar nos ingredientes." />
          ) : (
            <Section chrome={false} className="border-2 border-ink rounded-2xl bg-card shadow-[5px_5px_0_0_oklch(0.15_0.02_30)]">
              <div className="divide-y divide-ink/10">
                {units.map((u) => (
                  <div key={u.id} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="font-bold text-ink">{u.name}</p>
                      <p className="text-xs text-ink/60">Símbolo: {u.symbol}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => { setEditingUnit(u); setUnitDialogOpen(true); }}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={async () => {
                        if (!confirm(`Remover unidade "${u.name}"?`)) return;
                        try { await deleteUnit(u.id); toast.success("Removida"); load(); }
                        catch (e: any) { toast.error(e?.message ?? "Erro"); }
                      }}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}
        </TabsContent>

        {/* MOVIMENTAÇÕES */}
        <TabsContent value="movements" className="space-y-4">
          <FilterBar>
            <SearchBar value={movSearch} onChange={setMovSearch} placeholder="Buscar por ingrediente ou motivo…" />
            <Select value={movTypeFilter} onValueChange={(v) => setMovTypeFilter(v as any)}>
              <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="entry">Entradas</SelectItem>
                <SelectItem value="exit">Saídas</SelectItem>
                <SelectItem value="loss">Perdas</SelectItem>
                <SelectItem value="adjust">Ajustes</SelectItem>
                <SelectItem value="sale">Vendas</SelectItem>
                <SelectItem value="reversal">Estornos</SelectItem>
              </SelectContent>
            </Select>
          </FilterBar>

          {filteredMovements.length === 0 ? (
            <EmptyState icon={Activity} title="Sem movimentações" description="Ao registrar entradas, saídas, perdas ou ajustes, elas aparecerão aqui." />
          ) : (
            <Section chrome={false} className="border-2 border-ink rounded-2xl bg-card shadow-[5px_5px_0_0_oklch(0.15_0.02_30)] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-left text-[11px] uppercase tracking-wider text-ink/60">
                    <tr>
                      <th className="px-4 py-3">Data</th>
                      <th className="px-4 py-3">Tipo</th>
                      <th className="px-4 py-3">Ingrediente</th>
                      <th className="px-4 py-3">Qtd</th>
                      <th className="px-4 py-3">Antes → Depois</th>
                      <th className="px-4 py-3">Custo</th>
                      <th className="px-4 py-3">Motivo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMovements.map((m) => {
                      const ing = ingById[m.ingredient_id];
                      const unit = ing?.unit_id ? unitById[ing.unit_id]?.symbol ?? "" : "";
                      const accent = MOVEMENT_ACCENT[m.movement_type];
                      const accentCls: Record<string, string> = {
                        green: "bg-emerald-500/15 text-emerald-700 border-emerald-500/40",
                        orange: "bg-brand-orange/15 text-brand-orange border-brand-orange/40",
                        magenta: "bg-brand-magenta/15 text-brand-magenta border-brand-magenta/40",
                        violet: "bg-brand-violet/15 text-brand-violet border-brand-violet/40",
                        blue: "bg-sky-500/15 text-sky-700 border-sky-500/40",
                        amber: "bg-brand-amber/15 text-brand-amber border-brand-amber/40",
                      };
                      return (
                        <tr key={m.id} className="border-t border-ink/10">
                          <td className="px-4 py-3 text-ink/70 whitespace-nowrap">{new Date(m.created_at).toLocaleString("pt-BR")}</td>
                          <td className="px-4 py-3">
                            <span className={`text-[11px] px-2 py-0.5 rounded font-bold uppercase tracking-wide border ${accentCls[accent]}`}>
                              {MOVEMENT_LABEL[m.movement_type]}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-bold">{ing?.name ?? "—"}</td>
                          <td className="px-4 py-3">{Number(m.quantity).toLocaleString("pt-BR")} {unit}</td>
                          <td className="px-4 py-3 text-ink/70">{Number(m.qty_before).toLocaleString("pt-BR")} → {Number(m.qty_after).toLocaleString("pt-BR")}</td>
                          <td className="px-4 py-3">{m.total_cost != null ? formatBRL(m.total_cost) : "—"}</td>
                          <td className="px-4 py-3 text-ink/60 max-w-[240px] truncate">{m.reason ?? ""}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Section>
          )}
        </TabsContent>

        {/* FICHA TÉCNICA */}
        <TabsContent value="recipes" className="space-y-4">
          <RecipesTab
            enabled={canRecipes}
            products={recipeStatus}
            ingredients={ingredients}
            search={recipeSearch}
            onSearch={setRecipeSearch}
            filter={recipeFilter}
            onFilter={setRecipeFilter}
            sort={recipeSort}
            onSort={setRecipeSort}
            onEdit={(p) => { setRecipeTarget(p); setRecipeDialogOpen(true); }}
          />
        </TabsContent>

        {/* ALERTAS */}
        <TabsContent value="alerts" className="space-y-4">
          <Section>
            <SectionHeader title="Estoque baixo" description="Ingredientes ativos com quantidade menor ou igual ao mínimo configurado." />
            <SectionContent>
              {ingredients.filter((i) => i.is_active && Number(i.current_qty) <= Number(i.min_qty)).length === 0 ? (
                <p className="text-sm text-ink/60">Tudo em ordem — nenhum ingrediente abaixo do mínimo. 🎉</p>
              ) : (
                <div className="divide-y divide-ink/10">
                  {ingredients.filter((i) => i.is_active && Number(i.current_qty) <= Number(i.min_qty)).map((i) => {
                    const unit = i.unit_id ? unitById[i.unit_id]?.symbol ?? "" : "";
                    return (
                      <div key={i.id} className="py-3 flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <p className="font-bold text-ink">{i.name}</p>
                          <p className="text-xs text-ink/60">Atual {Number(i.current_qty).toLocaleString("pt-BR")} {unit} · mín {Number(i.min_qty).toLocaleString("pt-BR")} {unit}</p>
                        </div>
                        <Button size="sm" onClick={() => openMovement(i, "entry")}>
                          <Plus className="h-3.5 w-3.5 mr-1" /> Registrar entrada
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </SectionContent>
          </Section>
        </TabsContent>
      </Tabs>

      {/* Ingredient dialog */}
      <IngredientDialog
        open={ingDialogOpen}
        onOpenChange={setIngDialogOpen}
        editing={editingIng}
        units={units}
        suppliers={suppliers}
        restaurantId={restaurantId ?? ""}
        onSuccess={load}
      />

      {/* Supplier dialog */}
      <SupplierDialog
        open={supDialogOpen}
        onOpenChange={setSupDialogOpen}
        editing={editingSup}
        restaurantId={restaurantId ?? ""}
        onSuccess={load}
      />

      {/* Unit dialog */}
      <UnitDialog
        open={unitDialogOpen}
        onOpenChange={setUnitDialogOpen}
        editing={editingUnit}
        restaurantId={restaurantId ?? ""}
        onSuccess={load}
      />

      {/* Movement dialog */}
      <MovementDialog
        open={movDialogOpen}
        onOpenChange={setMovDialogOpen}
        ingredient={movTarget}
        suppliers={suppliers}
        defaultType={movDefaultType}
        onSuccess={load}
      />

      {/* Recipe dialog */}
      <RecipeDialog
        open={recipeDialogOpen}
        onOpenChange={setRecipeDialogOpen}
        product={recipeTarget ? {
          id: recipeTarget.product_id,
          name: recipeTarget.product_name,
          price: Number(recipeTarget.price),
          promo_price: recipeTarget.promo_price != null ? Number(recipeTarget.promo_price) : null,
        } : null}
        ingredients={ingredients}
        onSaved={() => { loadRecipes(); load(); }}
      />
    </AdminPageLayout>
  );
}

// ---------- Recipes tab ----------
function RecipesTab({ enabled, products, ingredients, search, onSearch, filter, onFilter, sort, onSort, onEdit }: {
  enabled: boolean;
  products: ProductRecipeStatus[];
  ingredients: StockIngredient[];
  search: string; onSearch: (v: string) => void;
  filter: "all" | "missing" | "configured"; onFilter: (v: "all" | "missing" | "configured") => void;
  sort: "name" | "margin_percent" | "margin_value" | "cost"; onSort: (v: "name" | "margin_percent" | "margin_value" | "cost") => void;
  onEdit: (p: ProductRecipeStatus) => void;
}) {
  if (!enabled) {
    return (
      <Section>
        <div className="grid place-items-center text-center py-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-sunset text-background mb-4 border-2 border-ink shadow-brutal">
            <Lock className="h-6 w-6" />
          </div>
          <p className="text-xs uppercase tracking-wider text-ink/60 font-bold">Disponível no plano Business</p>
          <h3 className="font-display text-2xl md:text-3xl text-ink mt-1 mb-2">Ficha Técnica e Custos</h3>
          <p className="text-sm text-ink/60 max-w-md mb-4">
            Cadastre a receita de cada produto, veja custo automático, margem em R$ e %, e ative a baixa automática de estoque a cada venda.
          </p>
          <Button asChild variant="gradient">
            <Link to="/admin/configuracoes"><Sparkles className="h-4 w-4 mr-2" /> Ver planos</Link>
          </Button>
        </div>
      </Section>
    );
  }

  const missing = products.filter((p) => !p.has_recipe).length;

  const filtered = (() => {
    let list = products.slice();
    const q = search.trim().toLowerCase();
    if (q) list = list.filter((p) => p.product_name.toLowerCase().includes(q));
    if (filter === "missing") list = list.filter((p) => !p.has_recipe);
    else if (filter === "configured") list = list.filter((p) => p.has_recipe);
    list.sort((a, b) => {
      switch (sort) {
        case "margin_percent": return (Number(b.margin_percent ?? -Infinity)) - (Number(a.margin_percent ?? -Infinity));
        case "margin_value":   return Number(b.margin_value) - Number(a.margin_value);
        case "cost":           return Number(b.total_cost) - Number(a.total_cost);
        default:               return a.product_name.localeCompare(b.product_name, "pt-BR");
      }
    });
    return list;
  })();

  const noIngredients = ingredients.filter((i) => i.is_active).length === 0;

  return (
    <>
      <DashboardGrid cols={3}>
        <StatCard label="Produtos" value={products.length} icon={ChefHat} accent="violet" />
        <StatCard label="Com ficha" value={products.length - missing} icon={ChefHat} accent="green" />
        <StatCard label="Sem ficha" value={missing} icon={AlertTriangle} accent="magenta" />
      </DashboardGrid>

      {noIngredients && (
        <Section>
          <p className="text-sm text-ink/70">Cadastre ingredientes ativos antes de montar fichas técnicas.</p>
        </Section>
      )}

      <FilterBar>
        <SearchBar value={search} onChange={onSearch} placeholder="Buscar produto…" />
        <Select value={filter} onValueChange={(v) => onFilter(v as any)}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="missing">Sem ficha</SelectItem>
            <SelectItem value="configured">Configuradas</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={(v) => onSort(v as any)}>
          <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Ordenar: nome</SelectItem>
            <SelectItem value="margin_percent">Ordenar: margem %</SelectItem>
            <SelectItem value="margin_value">Ordenar: margem R$</SelectItem>
            <SelectItem value="cost">Ordenar: custo</SelectItem>
          </SelectContent>
        </Select>
      </FilterBar>

      {filtered.length === 0 ? (
        <EmptyState icon={ChefHat} title="Nenhum produto" description="Cadastre produtos no cardápio para montar suas fichas técnicas." />
      ) : (
        <Section chrome={false} className="overflow-hidden border-2 border-ink rounded-2xl bg-card shadow-[5px_5px_0_0_oklch(0.15_0.02_30)]">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left text-[11px] uppercase tracking-wider text-ink/60">
                <tr>
                  <th className="px-4 py-3">Produto</th>
                  <th className="px-4 py-3">Preço</th>
                  <th className="px-4 py-3">Custo</th>
                  <th className="px-4 py-3">Margem R$</th>
                  <th className="px-4 py-3">Margem %</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const sell = Number(p.promo_price ?? p.price);
                  const marginNeg = Number(p.margin_value) < 0;
                  return (
                    <tr key={p.product_id} className="border-t border-ink/10 hover:bg-muted/20">
                      <td className="px-4 py-3 font-bold text-ink">{p.product_name}</td>
                      <td className="px-4 py-3">{formatBRL(sell)}</td>
                      <td className="px-4 py-3">{p.has_recipe ? formatBRL(p.total_cost) : "—"}</td>
                      <td className={`px-4 py-3 font-bold ${marginNeg ? "text-brand-magenta" : "text-emerald-600"}`}>
                        {p.has_recipe ? formatBRL(p.margin_value) : "—"}
                      </td>
                      <td className={`px-4 py-3 font-bold ${marginNeg ? "text-brand-magenta" : ""}`}>
                        {p.has_recipe && p.margin_percent != null ? `${Number(p.margin_percent).toFixed(1)}%` : "—"}
                      </td>
                      <td className="px-4 py-3">
                        {p.has_recipe ? (
                          <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-500/40" variant="outline">
                            {p.item_count} ingrediente{p.item_count === 1 ? "" : "s"}
                          </Badge>
                        ) : (
                          <Badge className="bg-brand-magenta text-background border-brand-magenta">Sem ficha</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button size="sm" variant="outline" onClick={() => onEdit(p)}>
                          <Pencil className="h-3.5 w-3.5 mr-1" /> Editar ficha
                        </Button>
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


// ---------- Ingredient dialog ----------
function IngredientDialog({ open, onOpenChange, editing, units, suppliers, restaurantId, onSuccess }: {
  open: boolean; onOpenChange: (v: boolean) => void;
  editing: StockIngredient | null; units: StockUnit[]; suppliers: StockSupplier[];
  restaurantId: string; onSuccess: () => void;
}) {
  const [form, setForm] = useState({
    name: "", sku: "", unit_id: "", supplier_id: "", min_qty: "", notes: "",
    initial_qty: "", initial_cost: "", is_active: true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setForm({
        name: editing.name, sku: editing.sku ?? "", unit_id: editing.unit_id ?? "",
        supplier_id: editing.supplier_id ?? "", min_qty: String(editing.min_qty ?? ""),
        notes: editing.notes ?? "", initial_qty: "", initial_cost: "", is_active: editing.is_active,
      });
    } else {
      setForm({ name: "", sku: "", unit_id: "", supplier_id: "", min_qty: "", notes: "", initial_qty: "", initial_cost: "", is_active: true });
    }
  }, [open, editing]);

  const save = async () => {
    if (!form.name.trim()) { toast.error("Nome é obrigatório"); return; }
    setSaving(true);
    try {
      if (editing) {
        await updateIngredient({
          id: editing.id,
          name: form.name,
          sku: form.sku || null,
          unit_id: form.unit_id || null,
          supplier_id: form.supplier_id || null,
          min_qty: form.min_qty ? parseFloat(form.min_qty.replace(",", ".")) : 0,
          notes: form.notes || null,
          is_active: form.is_active,
        });
        toast.success("Ingrediente atualizado");
      } else {
        await createIngredient({
          restaurantId,
          name: form.name,
          sku: form.sku || null,
          unit_id: form.unit_id || null,
          supplier_id: form.supplier_id || null,
          min_qty: form.min_qty ? parseFloat(form.min_qty.replace(",", ".")) : 0,
          initial_qty: form.initial_qty ? parseFloat(form.initial_qty.replace(",", ".")) : 0,
          initial_cost: form.initial_cost ? parseFloat(form.initial_cost.replace(",", ".")) : 0,
          notes: form.notes || null,
        });
        toast.success("Ingrediente cadastrado");
      }
      onOpenChange(false); onSuccess();
    } catch (e: any) {
      toast.error(e?.message ?? "Erro");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{editing ? "Editar ingrediente" : "Novo ingrediente"}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label>Nome *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label>SKU</Label>
              <Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
            </div>
            <div>
              <Label>Unidade</Label>
              <Select value={form.unit_id} onValueChange={(v) => setForm({ ...form, unit_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecionar…" /></SelectTrigger>
                <SelectContent>
                  {units.map((u) => <SelectItem key={u.id} value={u.id}>{u.name} ({u.symbol})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Fornecedor padrão</Label>
              <Select value={form.supplier_id} onValueChange={(v) => setForm({ ...form, supplier_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecionar…" /></SelectTrigger>
                <SelectContent>
                  {suppliers.filter((s) => s.is_active).map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Estoque mínimo</Label>
              <Input inputMode="decimal" value={form.min_qty} onChange={(e) => setForm({ ...form, min_qty: e.target.value })} />
            </div>
            {!editing && (
              <>
                <div>
                  <Label>Estoque inicial</Label>
                  <Input inputMode="decimal" value={form.initial_qty} onChange={(e) => setForm({ ...form, initial_qty: e.target.value })} />
                </div>
                <div>
                  <Label>Custo inicial (unitário)</Label>
                  <Input inputMode="decimal" value={form.initial_cost} onChange={(e) => setForm({ ...form, initial_cost: e.target.value })} />
                </div>
              </>
            )}
            <div className="col-span-2">
              <Label>Observações</Label>
              <Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
            {editing && (
              <div className="col-span-2 flex items-center gap-2">
                <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
                <span className="text-sm">Ativo</span>
              </div>
            )}
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

// ---------- Supplier dialog ----------
function SupplierDialog({ open, onOpenChange, editing, restaurantId, onSuccess }: {
  open: boolean; onOpenChange: (v: boolean) => void; editing: StockSupplier | null;
  restaurantId: string; onSuccess: () => void;
}) {
  const [form, setForm] = useState({ name: "", contact: "", phone: "", email: "", notes: "", is_active: true });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (editing) setForm({
      name: editing.name, contact: editing.contact ?? "", phone: editing.phone ?? "",
      email: editing.email ?? "", notes: editing.notes ?? "", is_active: editing.is_active,
    });
    else setForm({ name: "", contact: "", phone: "", email: "", notes: "", is_active: true });
  }, [open, editing]);

  const save = async () => {
    if (!form.name.trim()) { toast.error("Nome é obrigatório"); return; }
    setSaving(true);
    try {
      await upsertSupplier({
        restaurantId, id: editing?.id ?? null,
        name: form.name, contact: form.contact || null, phone: form.phone || null,
        email: form.email || null, notes: form.notes || null, is_active: form.is_active,
      });
      toast.success(editing ? "Fornecedor atualizado" : "Fornecedor cadastrado");
      onOpenChange(false); onSuccess();
    } catch (e: any) { toast.error(e?.message ?? "Erro"); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{editing ? "Editar fornecedor" : "Novo fornecedor"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Nome *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Contato</Label><Input value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} /></div>
            <div><Label>Telefone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          </div>
          <div><Label>E-mail</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div><Label>Observações</Label><Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          <div className="flex items-center gap-2">
            <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
            <span className="text-sm">Ativo</span>
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

// ---------- Unit dialog ----------
function UnitDialog({ open, onOpenChange, editing, restaurantId, onSuccess }: {
  open: boolean; onOpenChange: (v: boolean) => void; editing: StockUnit | null;
  restaurantId: string; onSuccess: () => void;
}) {
  const [form, setForm] = useState({ name: "", symbol: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (editing) setForm({ name: editing.name, symbol: editing.symbol });
    else setForm({ name: "", symbol: "" });
  }, [open, editing]);

  const save = async () => {
    if (!form.name.trim() || !form.symbol.trim()) { toast.error("Nome e símbolo obrigatórios"); return; }
    setSaving(true);
    try {
      await upsertUnit({ restaurantId, id: editing?.id ?? null, name: form.name, symbol: form.symbol });
      toast.success(editing ? "Unidade atualizada" : "Unidade cadastrada");
      onOpenChange(false); onSuccess();
    } catch (e: any) { toast.error(e?.message ?? "Erro"); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>{editing ? "Editar unidade" : "Nova unidade"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Nome</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Quilograma" /></div>
          <div><Label>Símbolo</Label><Input value={form.symbol} onChange={(e) => setForm({ ...form, symbol: e.target.value })} placeholder="kg" /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Salvando…" : "Salvar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
