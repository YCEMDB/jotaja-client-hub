import { useEffect, useState } from "react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Legend, Line, LineChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { Section, SectionHeader, SectionContent, DashboardGrid, StatCard, LoadingState, ErrorState } from "@/components/ds";
import { formatBRL, getCashflow, type CashflowResult } from "@/lib/finance";
import { ArrowDownLeft, ArrowUpRight, TrendingUp, Wallet } from "lucide-react";

interface Props {
  restaurantId: string;
  from: string;
  to: string;
  /** optional comparison period (previous) */
  compareFrom?: string;
  compareTo?: string;
}

const shortDate = (iso: string) => {
  const d = new Date(iso + "T12:00");
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
};

export function CashflowTab({ restaurantId, from, to, compareFrom, compareTo }: Props) {
  const [data, setData] = useState<CashflowResult | null>(null);
  const [prev, setPrev] = useState<CashflowResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancel = false;
    (async () => {
      setLoading(true); setError(null);
      try {
        const [cur, previous] = await Promise.all([
          getCashflow(restaurantId, from, to),
          compareFrom && compareTo ? getCashflow(restaurantId, compareFrom, compareTo) : Promise.resolve(null as any),
        ]);
        if (!cancel) { setData(cur); setPrev(previous); }
      } catch (e: any) {
        if (!cancel) setError(e?.message ?? "Erro ao carregar fluxo de caixa");
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => { cancel = true; };
  }, [restaurantId, from, to, compareFrom, compareTo]);

  if (loading) return <LoadingState label="Carregando fluxo de caixa…" />;
  if (error) return <ErrorState description={error} />;
  if (!data) return null;

  const series = (data.series ?? []).map((p) => ({ ...p, label: shortDate(p.date) }));
  const totals = data.totals ?? { total_inflow: 0, total_outflow: 0, net: 0, final_balance: 0 };
  const cash = data.cash_operational ?? { sales: 0, reinforcements: 0, withdrawals: 0, expenses: 0 };

  const deltaPct = (cur: number, base: number) => {
    if (!base) return null;
    return ((cur - base) / Math.abs(base)) * 100;
  };
  const fmtDelta = (v: number | null) => v == null ? "—" : `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`;

  return (
    <div className="space-y-6">
      <DashboardGrid cols={4}>
        <StatCard
          label="Entradas no período"
          value={formatBRL(totals.total_inflow)}
          icon={ArrowDownLeft}
          accent="violet"
          delta={prev ? fmtDelta(deltaPct(totals.total_inflow, prev.totals?.total_inflow ?? 0)) : undefined}
        />
        <StatCard
          label="Saídas no período"
          value={formatBRL(totals.total_outflow)}
          icon={ArrowUpRight}
          accent="magenta"
          delta={prev ? fmtDelta(deltaPct(totals.total_outflow, prev.totals?.total_outflow ?? 0)) : undefined}
        />
        <StatCard
          label="Resultado líquido"
          value={formatBRL(totals.net)}
          icon={TrendingUp}
          accent={totals.net >= 0 ? "amber" : "magenta"}
        />
        <StatCard
          label="Saldo final acumulado"
          value={formatBRL(totals.final_balance)}
          icon={Wallet}
          accent="orange"
        />
      </DashboardGrid>

      <Section>
        <SectionHeader
          title="Receitas × Despesas"
          description="Comparativo diário no período. Consolida contas pagas/recebidas e movimentações do caixa sem duplicar."
        />
        <SectionContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer>
              <BarChart data={series}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `R$${Math.round(v)}`} />
                <Tooltip formatter={(v: any) => formatBRL(v)} labelClassName="font-bold" />
                <Legend />
                <Bar dataKey="inflow" name="Entradas" fill="hsl(var(--brand-violet))" radius={[4,4,0,0]} />
                <Bar dataKey="outflow" name="Saídas" fill="hsl(var(--brand-magenta))" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionContent>
      </Section>

      <Section>
        <SectionHeader
          title="Saldo acumulado"
          description="Evolução do saldo líquido (entradas − saídas) dentro do período."
        />
        <SectionContent>
          <div className="h-[240px] w-full">
            <ResponsiveContainer>
              <AreaChart data={series}>
                <defs>
                  <linearGradient id="cashflow-balance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--brand-orange))" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="hsl(var(--brand-orange))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `R$${Math.round(v)}`} />
                <Tooltip formatter={(v: any) => formatBRL(v)} labelClassName="font-bold" />
                <Area type="monotone" dataKey="balance" name="Saldo" stroke="hsl(var(--brand-orange))" strokeWidth={2} fill="url(#cashflow-balance)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </SectionContent>
      </Section>

      <Section>
        <SectionHeader
          title="Caixa operacional"
          description="Totais lidos diretamente das movimentações de caixa (fonte operacional)."
        />
        <SectionContent>
          <DashboardGrid cols={4}>
            <StatCard label="Vendas" value={formatBRL(cash.sales)} icon={ArrowDownLeft} accent="violet" />
            <StatCard label="Reforços" value={formatBRL(cash.reinforcements)} icon={ArrowDownLeft} accent="amber" />
            <StatCard label="Sangrias" value={formatBRL(cash.withdrawals)} icon={ArrowUpRight} accent="magenta" />
            <StatCard label="Despesas de caixa" value={formatBRL(cash.expenses)} icon={ArrowUpRight} accent="magenta" />
          </DashboardGrid>
        </SectionContent>
      </Section>

      {prev && (
        <Section>
          <SectionHeader
            title="Comparativo com período anterior"
            description={`Período anterior: ${prev.from} → ${prev.to}`}
          />
          <SectionContent>
            <div className="h-[240px] w-full">
              <ResponsiveContainer>
                <LineChart>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="label" allowDuplicatedCategory={false} tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `R$${Math.round(v)}`} />
                  <Tooltip formatter={(v: any) => formatBRL(v)} />
                  <Legend />
                  <Line
                    data={series.map((p, i) => ({ label: `Dia ${i + 1}`, v: p.net }))}
                    dataKey="v" name="Período atual"
                    stroke="hsl(var(--brand-orange))" strokeWidth={2} dot={false}
                  />
                  <Line
                    data={(prev.series ?? []).map((p, i) => ({ label: `Dia ${i + 1}`, v: p.net }))}
                    dataKey="v" name="Período anterior"
                    stroke="hsl(var(--brand-violet))" strokeWidth={2} strokeDasharray="4 4" dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </SectionContent>
        </Section>
      )}
    </div>
  );
}
