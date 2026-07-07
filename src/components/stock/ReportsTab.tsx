import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Section, SectionHeader, SectionContent, DashboardGrid, StatCard, LoadingState, EmptyState, FilterBar } from "@/components/ds";
import { downloadCSV } from "@/lib/export-csv";
import {
  formatBRL,
  getConsumptionReport, getLossesReport, getProfitabilityReport,
  type ConsumptionRow, type LossReport, type ProfitabilityRow,
} from "@/lib/stock";
import { toast } from "sonner";
import { Download, TrendingDown, TrendingUp, Package, AlertTriangle, Lock, Sparkles } from "lucide-react";
import { Link } from "@tanstack/react-router";

function isoStart(d: Date) { const x = new Date(d); x.setHours(0,0,0,0); return x.toISOString(); }
function isoEndExclusive(d: Date) { const x = new Date(d); x.setHours(0,0,0,0); x.setDate(x.getDate()+1); return x.toISOString(); }
function daysAgo(n: number) { const x = new Date(); x.setDate(x.getDate()-n); return x; }
function toInput(d: Date) { return d.toISOString().slice(0,10); }

export function ReportsTab({ restaurantId, canProfitability }: { restaurantId: string; canProfitability: boolean }) {
  const [from, setFrom] = useState<string>(toInput(daysAgo(30)));
  const [to, setTo] = useState<string>(toInput(new Date()));
  const [loading, setLoading] = useState(false);
  const [consumption, setConsumption] = useState<ConsumptionRow[]>([]);
  const [losses, setLosses] = useState<LossReport | null>(null);
  const [profit, setProfit] = useState<ProfitabilityRow[]>([]);

  const load = useCallback(async () => {
    if (!restaurantId) return;
    setLoading(true);
    try {
      const fromIso = isoStart(new Date(from));
      const toIso = isoEndExclusive(new Date(to));
      const promises: Promise<any>[] = [
        getConsumptionReport(restaurantId, fromIso, toIso),
        getLossesReport(restaurantId, fromIso, toIso),
      ];
      if (canProfitability) promises.push(getProfitabilityReport(restaurantId, fromIso, toIso));
      const results = await Promise.all(promises);
      setConsumption(results[0]);
      setLosses(results[1]);
      if (canProfitability) setProfit(results[2]);
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao carregar relatórios");
    } finally { setLoading(false); }
  }, [restaurantId, from, to, canProfitability]);

  useEffect(() => { load(); }, [load]);

  const totals = useMemo(() => {
    const consumed = consumption.reduce((s,r) => s + Number(r.qty_sale) + Number(r.qty_exit), 0);
    const costOut = consumption.reduce((s,r) => s + Number(r.cost_out), 0);
    const costIn = consumption.reduce((s,r) => s + Number(r.cost_in), 0);
    return { consumed, costOut, costIn };
  }, [consumption]);

  const exportConsumptionCSV = () => {
    const rows: (string | number)[][] = [
      ["Ingrediente","Unidade","Entradas","Saídas","Vendas","Perdas","Ajustes","Estornos","Custo saídas","Custo entradas"],
      ...consumption.map(r => [
        r.name, r.unit ?? "",
        r.qty_entry, r.qty_exit, r.qty_sale, r.qty_loss, r.qty_adjust, r.qty_reversal,
        Number(r.cost_out).toFixed(2), Number(r.cost_in).toFixed(2),
      ]),
    ];
    downloadCSV(`consumo-${from}-a-${to}.csv`, rows);
  };

  const exportLossesCSV = () => {
    if (!losses) return;
    const rows: (string | number)[][] = [
      ["Ingrediente","Unidade","Quantidade","Custo total","Eventos"],
      ...losses.by_ingredient.map(r => [r.name, r.unit ?? "", r.quantity, Number(r.total_cost).toFixed(2), r.events]),
    ];
    downloadCSV(`perdas-${from}-a-${to}.csv`, rows);
  };

  const exportProfitCSV = () => {
    const rows: (string | number)[][] = [
      ["Produto","Preço","Custo","Margem un.","Vendidos","Receita","Margem total","Tem ficha"],
      ...profit.map(r => [
        r.product_name, Number(r.price).toFixed(2), Number(r.unit_cost).toFixed(2),
        Number(r.unit_margin).toFixed(2), r.units_sold, Number(r.revenue).toFixed(2),
        Number(r.total_margin).toFixed(2), r.has_recipe ? "sim" : "não",
      ]),
    ];
    downloadCSV(`lucratividade-${from}-a-${to}.csv`, rows);
  };

  return (
    <div className="space-y-4">
      <FilterBar>
        <div className="flex items-end gap-2">
          <div>
            <Label className="text-[11px] uppercase font-bold text-ink/60">De</Label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-[150px]" />
          </div>
          <div>
            <Label className="text-[11px] uppercase font-bold text-ink/60">Até</Label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-[150px]" />
          </div>
          <Button variant="outline" size="sm" onClick={load}>Atualizar</Button>
        </div>
      </FilterBar>

      {loading ? <LoadingState label="Gerando relatórios…" /> : (
        <Tabs defaultValue="consumo" className="space-y-4">
          <TabsList className="h-auto p-1 flex flex-wrap gap-1 bg-card border-2 border-ink rounded-xl">
            <TabsTrigger value="consumo">Consumo</TabsTrigger>
            <TabsTrigger value="perdas">Perdas</TabsTrigger>
            <TabsTrigger value="lucratividade">Lucratividade</TabsTrigger>
          </TabsList>

          {/* CONSUMO */}
          <TabsContent value="consumo" className="space-y-4">
            <DashboardGrid cols={3}>
              <StatCard label="Qtd consumida" value={totals.consumed.toLocaleString("pt-BR")} icon={Package} accent="orange" />
              <StatCard label="Custo saídas" value={formatBRL(totals.costOut)} icon={TrendingDown} accent="magenta" />
              <StatCard label="Custo entradas" value={formatBRL(totals.costIn)} icon={TrendingUp} accent="green" />
            </DashboardGrid>
            <FilterBar actions={
              <Button size="sm" variant="outline" onClick={exportConsumptionCSV} disabled={!consumption.length}>
                <Download className="h-4 w-4 mr-2" /> Exportar CSV
              </Button>
            }>
              <p className="text-sm text-ink/60">Movimentações por ingrediente no período.</p>
            </FilterBar>
            {consumption.length === 0 ? (
              <EmptyState icon={Package} title="Sem dados" description="Não há movimentações registradas no período." />
            ) : (
              <Section chrome={false} className="overflow-hidden border-2 border-ink rounded-2xl bg-card shadow-[5px_5px_0_0_oklch(0.15_0.02_30)]">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/40 text-left text-[11px] uppercase tracking-wider text-ink/60">
                      <tr>
                        <th className="px-4 py-3">Ingrediente</th>
                        <th className="px-4 py-3 text-right">Entradas</th>
                        <th className="px-4 py-3 text-right">Vendas</th>
                        <th className="px-4 py-3 text-right">Saídas</th>
                        <th className="px-4 py-3 text-right">Perdas</th>
                        <th className="px-4 py-3 text-right">Ajustes</th>
                        <th className="px-4 py-3 text-right">Custo saída</th>
                      </tr>
                    </thead>
                    <tbody>
                      {consumption.map((r) => (
                        <tr key={r.ingredient_id} className="border-t border-ink/10">
                          <td className="px-4 py-3 font-bold">{r.name} <span className="text-ink/40 text-xs">{r.unit ?? ""}</span></td>
                          <td className="px-4 py-3 text-right">{Number(r.qty_entry).toLocaleString("pt-BR")}</td>
                          <td className="px-4 py-3 text-right">{Number(r.qty_sale).toLocaleString("pt-BR")}</td>
                          <td className="px-4 py-3 text-right">{Number(r.qty_exit).toLocaleString("pt-BR")}</td>
                          <td className="px-4 py-3 text-right text-brand-magenta">{Number(r.qty_loss).toLocaleString("pt-BR")}</td>
                          <td className="px-4 py-3 text-right">{Number(r.qty_adjust).toLocaleString("pt-BR")}</td>
                          <td className="px-4 py-3 text-right font-bold">{formatBRL(r.cost_out)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Section>
            )}
          </TabsContent>

          {/* PERDAS */}
          <TabsContent value="perdas" className="space-y-4">
            <DashboardGrid cols={2}>
              <StatCard label="Valor perdido" value={formatBRL(losses?.total_value ?? 0)} icon={TrendingDown} accent="magenta" />
              <StatCard label="Eventos" value={losses?.total_events ?? 0} icon={AlertTriangle} accent="amber" />
            </DashboardGrid>
            <FilterBar actions={
              <Button size="sm" variant="outline" onClick={exportLossesCSV} disabled={!losses || !losses.by_ingredient.length}>
                <Download className="h-4 w-4 mr-2" /> Exportar CSV
              </Button>
            }>
              <p className="text-sm text-ink/60">Ranking de perdas por ingrediente no período.</p>
            </FilterBar>
            {!losses || losses.by_ingredient.length === 0 ? (
              <EmptyState icon={TrendingDown} title="Sem perdas" description="Nenhuma perda registrada no período. 🎉" />
            ) : (
              <Section chrome={false} className="overflow-hidden border-2 border-ink rounded-2xl bg-card shadow-[5px_5px_0_0_oklch(0.15_0.02_30)]">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/40 text-left text-[11px] uppercase tracking-wider text-ink/60">
                      <tr>
                        <th className="px-4 py-3">Ingrediente</th>
                        <th className="px-4 py-3 text-right">Quantidade</th>
                        <th className="px-4 py-3 text-right">Valor</th>
                        <th className="px-4 py-3 text-right">Eventos</th>
                      </tr>
                    </thead>
                    <tbody>
                      {losses.by_ingredient.map((r) => (
                        <tr key={r.ingredient_id} className="border-t border-ink/10">
                          <td className="px-4 py-3 font-bold">{r.name} <span className="text-ink/40 text-xs">{r.unit ?? ""}</span></td>
                          <td className="px-4 py-3 text-right">{Number(r.quantity).toLocaleString("pt-BR")}</td>
                          <td className="px-4 py-3 text-right font-bold text-brand-magenta">{formatBRL(r.total_cost)}</td>
                          <td className="px-4 py-3 text-right">{r.events}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Section>
            )}
          </TabsContent>

          {/* LUCRATIVIDADE */}
          <TabsContent value="lucratividade" className="space-y-4">
            {!canProfitability ? (
              <Section>
                <div className="grid place-items-center text-center py-10">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-sunset text-background mb-4 border-2 border-ink shadow-brutal">
                    <Lock className="h-6 w-6" />
                  </div>
                  <p className="text-xs uppercase tracking-wider text-ink/60 font-bold">Plano Business</p>
                  <h3 className="font-display text-2xl md:text-3xl text-ink mt-1 mb-2">Ranking de Lucratividade</h3>
                  <p className="text-sm text-ink/60 max-w-md mb-4">
                    Requer ficha técnica ativa para calcular margem por produto.
                  </p>
                  <Button asChild variant="gradient">
                    <Link to="/admin/configuracoes"><Sparkles className="h-4 w-4 mr-2" /> Ver planos</Link>
                  </Button>
                </div>
              </Section>
            ) : (
              <>
                <FilterBar actions={
                  <Button size="sm" variant="outline" onClick={exportProfitCSV} disabled={!profit.length}>
                    <Download className="h-4 w-4 mr-2" /> Exportar CSV
                  </Button>
                }>
                  <p className="text-sm text-ink/60">Produtos ordenados por margem total no período.</p>
                </FilterBar>
                {profit.length === 0 ? (
                  <EmptyState icon={TrendingUp} title="Sem vendas" description="Nenhum produto vendido no período." />
                ) : (
                  <Section chrome={false} className="overflow-hidden border-2 border-ink rounded-2xl bg-card shadow-[5px_5px_0_0_oklch(0.15_0.02_30)]">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/40 text-left text-[11px] uppercase tracking-wider text-ink/60">
                          <tr>
                            <th className="px-4 py-3">Produto</th>
                            <th className="px-4 py-3 text-right">Vendidos</th>
                            <th className="px-4 py-3 text-right">Receita</th>
                            <th className="px-4 py-3 text-right">Custo un.</th>
                            <th className="px-4 py-3 text-right">Margem un.</th>
                            <th className="px-4 py-3 text-right">Margem total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {profit.map((p) => (
                            <tr key={p.product_id} className="border-t border-ink/10">
                              <td className="px-4 py-3 font-bold">
                                {p.product_name}
                                {!p.has_recipe && <span className="ml-2 text-[10px] px-1.5 py-0.5 bg-brand-magenta/15 text-brand-magenta rounded font-bold uppercase">Sem ficha</span>}
                              </td>
                              <td className="px-4 py-3 text-right">{p.units_sold}</td>
                              <td className="px-4 py-3 text-right">{formatBRL(p.revenue)}</td>
                              <td className="px-4 py-3 text-right">{formatBRL(p.unit_cost)}</td>
                              <td className={`px-4 py-3 text-right font-bold ${Number(p.unit_margin) < 0 ? "text-brand-magenta" : ""}`}>{formatBRL(p.unit_margin)}</td>
                              <td className={`px-4 py-3 text-right font-bold ${Number(p.total_margin) < 0 ? "text-brand-magenta" : ""}`}>{formatBRL(p.total_margin)}</td>
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
      )}
    </div>
  );
}
