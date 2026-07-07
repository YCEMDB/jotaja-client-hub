import { useEffect, useMemo, useState } from "react";
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { Section, SectionHeader, SectionContent, DashboardGrid, StatCard, LoadingState, ErrorState, EmptyState } from "@/components/ds";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { formatBRL, getDre, type DreResult, type FinanceCostCenter } from "@/lib/finance";
import { ArrowDownLeft, ArrowUpRight, Percent, PieChart as PieIcon, TrendingUp } from "lucide-react";

interface Props {
  restaurantId: string;
  from: string;
  to: string;
  costCenters: FinanceCostCenter[];
  showCostCenter?: boolean;
}

const PALETTE = [
  "hsl(var(--brand-orange))",
  "hsl(var(--brand-magenta))",
  "hsl(var(--brand-violet))",
  "hsl(var(--brand-amber))",
  "hsl(var(--brand-orange) / 0.7)",
  "hsl(var(--brand-magenta) / 0.7)",
  "hsl(var(--brand-violet) / 0.7)",
  "hsl(var(--brand-amber) / 0.7)",
];

export function DreTab({ restaurantId, from, to, costCenters, showCostCenter = true }: Props) {
  const [costCenterId, setCostCenterId] = useState<string>("all");
  const [data, setData] = useState<DreResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancel = false;
    (async () => {
      setLoading(true); setError(null);
      try {
        const cc = costCenterId === "all" ? null : costCenterId;
        const res = await getDre(restaurantId, from, to, cc);
        if (!cancel) setData(res);
      } catch (e: any) {
        if (!cancel) setError(e?.message ?? "Erro ao carregar DRE");
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => { cancel = true; };
  }, [restaurantId, from, to, costCenterId]);

  const revByCat = useMemo(() => data?.revenue?.by_category ?? [], [data]);
  const expByCat = useMemo(() => data?.expense?.by_category ?? [], [data]);

  if (loading) return <LoadingState label="Carregando DRE…" />;
  if (error) return <ErrorState description={error} />;
  if (!data) return null;

  const revTotal = Number(data.revenue?.total ?? 0);
  const expTotal = Number(data.expense?.total ?? 0);
  const profit = Number(data.operating_profit ?? 0);
  const margin = Number(data.margin ?? 0);

  return (
    <div className="space-y-6">
      {showCostCenter && (
        <div className="flex items-end gap-3">
          <div className="w-full max-w-xs">
            <Label>Centro de custo</Label>
            <Select value={costCenterId} onValueChange={setCostCenterId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {costCenters.map((cc) => <SelectItem key={cc.id} value={cc.id}>{cc.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      <DashboardGrid cols={4}>
        <StatCard label="Receitas" value={formatBRL(revTotal)} icon={ArrowDownLeft} accent="violet" />
        <StatCard label="Despesas" value={formatBRL(expTotal)} icon={ArrowUpRight} accent="magenta" />
        <StatCard
          label="Lucro operacional"
          value={formatBRL(profit)}
          icon={TrendingUp}
          accent={profit >= 0 ? "amber" : "magenta"}
        />
        <StatCard
          label="Margem operacional"
          value={`${margin.toFixed(1)}%`}
          icon={Percent}
          accent={margin >= 0 ? "orange" : "magenta"}
        />
      </DashboardGrid>

      <Section>
        <SectionHeader title="Receitas × Despesas" description="Comparativo do período." />
        <SectionContent>
          <div className="h-[240px] w-full">
            <ResponsiveContainer>
              <BarChart data={[{ label: "Período", Receitas: revTotal, Despesas: expTotal, Lucro: profit }]}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `R$${Math.round(v)}`} />
                <Tooltip formatter={(v: any) => formatBRL(v)} />
                <Legend />
                <Bar dataKey="Receitas" fill="hsl(var(--brand-violet))" radius={[4,4,0,0]} />
                <Bar dataKey="Despesas" fill="hsl(var(--brand-magenta))" radius={[4,4,0,0]} />
                <Bar dataKey="Lucro" fill="hsl(var(--brand-amber))" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionContent>
      </Section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Section>
          <SectionHeader title="Receitas por categoria" />
          <SectionContent>
            {revByCat.length === 0 ? (
              <EmptyState icon={PieIcon} title="Sem receitas no período" description="Registre recebimentos para ver o breakdown." />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                <div className="h-[220px]">
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={revByCat} dataKey="total" nameKey="name" innerRadius={40} outerRadius={80} stroke="hsl(var(--card))">
                        {revByCat.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v: any) => formatBRL(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <ul className="space-y-2 text-sm">
                  {revByCat.map((c, i) => (
                    <li key={String(c.category_id ?? i)} className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2 truncate">
                        <span className="inline-block h-3 w-3 rounded-full" style={{ background: PALETTE[i % PALETTE.length] }} />
                        <span className="truncate">{c.name}</span>
                      </span>
                      <span className="font-bold text-ink">{formatBRL(c.total)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </SectionContent>
        </Section>

        <Section>
          <SectionHeader title="Despesas por categoria" />
          <SectionContent>
            {expByCat.length === 0 ? (
              <EmptyState icon={PieIcon} title="Sem despesas no período" description="Registre pagamentos para ver o breakdown." />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                <div className="h-[220px]">
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={expByCat} dataKey="total" nameKey="name" innerRadius={40} outerRadius={80} stroke="hsl(var(--card))">
                        {expByCat.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v: any) => formatBRL(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <ul className="space-y-2 text-sm">
                  {expByCat.map((c, i) => (
                    <li key={String(c.category_id ?? i)} className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2 truncate">
                        <span className="inline-block h-3 w-3 rounded-full" style={{ background: PALETTE[i % PALETTE.length] }} />
                        <span className="truncate">{c.name}</span>
                      </span>
                      <span className="font-bold text-ink">{formatBRL(c.total)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </SectionContent>
        </Section>
      </div>

      {showCostCenter && (data.revenue.by_cost_center.length > 0 || data.expense.by_cost_center.length > 0) && (
        <Section>
          <SectionHeader title="Por centro de custo" description="Receitas e despesas agrupadas por centro de custo." />
          <SectionContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-[11px] uppercase tracking-wider text-ink/60 bg-muted/40">
                  <tr>
                    <th className="px-4 py-2">Centro de custo</th>
                    <th className="px-4 py-2 text-right">Receitas</th>
                    <th className="px-4 py-2 text-right">Despesas</th>
                    <th className="px-4 py-2 text-right">Resultado</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from(new Set([
                    ...data.revenue.by_cost_center.map((c) => c.cost_center_id ?? "null"),
                    ...data.expense.by_cost_center.map((c) => c.cost_center_id ?? "null"),
                  ])).map((key) => {
                    const rev = data.revenue.by_cost_center.find((c) => (c.cost_center_id ?? "null") === key);
                    const exp = data.expense.by_cost_center.find((c) => (c.cost_center_id ?? "null") === key);
                    const name = rev?.name ?? exp?.name ?? "Sem centro de custo";
                    const r = Number(rev?.total ?? 0);
                    const e = Number(exp?.total ?? 0);
                    return (
                      <tr key={key} className="border-t border-ink/10">
                        <td className="px-4 py-2 font-bold text-ink">{name}</td>
                        <td className="px-4 py-2 text-right">{formatBRL(r)}</td>
                        <td className="px-4 py-2 text-right">{formatBRL(e)}</td>
                        <td className={`px-4 py-2 text-right font-bold ${r - e >= 0 ? "text-ink" : "text-brand-magenta"}`}>
                          {formatBRL(r - e)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </SectionContent>
        </Section>
      )}
    </div>
  );
}
