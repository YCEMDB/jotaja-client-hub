import { useEffect, useState } from "react";
import { Section, SectionHeader, SectionContent, DashboardGrid, StatCard, LoadingState, ErrorState, EmptyState } from "@/components/ds";
import { Button } from "@/components/ui/button";
import { Download, Percent, PieChart as PieIcon, TrendingUp, Wallet } from "lucide-react";
import {
  formatBRL, getFinalReport, RECON_METHOD_LABEL,
  type FinalReport, type PaymentMethodItem,
} from "@/lib/finance";
import { downloadCSV } from "@/lib/export-csv";

interface Props {
  restaurantId: string;
  from: string;
  to: string;
  /** show category/cost center detail (Business) */
  showAdvanced?: boolean;
}

export function FinancialReportsTab({ restaurantId, from, to, showAdvanced = false }: Props) {
  const [report, setReport] = useState<FinalReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancel = false;
    (async () => {
      setLoading(true); setError(null);
      try {
        const r = await getFinalReport(restaurantId, from, to);
        if (!cancel) setReport(r);
      } catch (e: any) {
        if (!cancel) setError(e?.message ?? "Erro ao carregar relatório");
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => { cancel = true; };
  }, [restaurantId, from, to]);

  if (loading) return <LoadingState label="Carregando relatório…" />;
  if (error) return <ErrorState description={error} />;
  if (!report) return null;

  const rev = Number(report.dre?.revenue?.total ?? 0);
  const exp = Number(report.dre?.expense?.total ?? 0);
  const profit = Number(report.dre?.operating_profit ?? 0);
  const margin = Number(report.dre?.margin ?? 0);
  const methods: PaymentMethodItem[] = report.payment_methods?.items ?? [];
  const revCats = report.dre?.revenue?.by_category ?? [];
  const expCats = report.dre?.expense?.by_category ?? [];
  const revCc = report.dre?.revenue?.by_cost_center ?? [];
  const expCc = report.dre?.expense?.by_cost_center ?? [];

  const exportSummaryCsv = () => {
    const rows: (string | number | null)[][] = [
      ["Relatório financeiro", `${from} a ${to}`],
      [],
      ["Receitas (R$)", rev.toFixed(2)],
      ["Despesas (R$)", exp.toFixed(2)],
      ["Lucro operacional (R$)", profit.toFixed(2)],
      ["Margem (%)", margin.toFixed(2)],
      [],
      ["Por forma de pagamento"],
      ["Método", "Pedidos", "Bruto", "Descontos", "Líquido", "Ticket médio"],
      ...methods.map((m) => [
        RECON_METHOD_LABEL[m.method] ?? m.method,
        m.orders_count,
        Number(m.gross_total).toFixed(2),
        Number(m.discounts).toFixed(2),
        Number(m.net_total).toFixed(2),
        Number(m.avg_ticket).toFixed(2),
      ]),
    ];
    if (showAdvanced) {
      rows.push([], ["Receitas por categoria"], ["Categoria", "Total"]);
      revCats.forEach((c) => rows.push([c.name, Number(c.total).toFixed(2)]));
      rows.push([], ["Despesas por categoria"], ["Categoria", "Total"]);
      expCats.forEach((c) => rows.push([c.name, Number(c.total).toFixed(2)]));
      rows.push([], ["Receitas por centro de custo"], ["Centro de custo", "Total"]);
      revCc.forEach((c) => rows.push([c.name, Number(c.total).toFixed(2)]));
      rows.push([], ["Despesas por centro de custo"], ["Centro de custo", "Total"]);
      expCc.forEach((c) => rows.push([c.name, Number(c.total).toFixed(2)]));
    }
    downloadCSV(`relatorio_financeiro_${from}_${to}.csv`, rows);
  };

  const exportMethodsCsv = () => {
    downloadCSV(`pagamentos_${from}_${to}.csv`, [
      ["Método", "Pedidos", "Bruto (R$)", "Descontos (R$)", "Líquido (R$)", "Ticket médio (R$)"],
      ...methods.map((m) => [
        RECON_METHOD_LABEL[m.method] ?? m.method,
        m.orders_count,
        Number(m.gross_total).toFixed(2),
        Number(m.discounts).toFixed(2),
        Number(m.net_total).toFixed(2),
        Number(m.avg_ticket).toFixed(2),
      ]),
    ]);
  };

  const exportCashflowCsv = () => {
    const series = report.cashflow?.series ?? [];
    downloadCSV(`fluxo_caixa_${from}_${to}.csv`, [
      ["Data", "Entradas (R$)", "Saídas (R$)", "Líquido (R$)", "Saldo acumulado (R$)"],
      ...series.map((s) => [
        s.date,
        Number(s.inflow).toFixed(2),
        Number(s.outflow).toFixed(2),
        Number(s.net).toFixed(2),
        Number(s.balance).toFixed(2),
      ]),
    ]);
  };

  return (
    <div className="space-y-6">
      <DashboardGrid cols={4}>
        <StatCard label="Receitas" value={formatBRL(rev)} icon={Wallet} accent="violet" />
        <StatCard label="Despesas" value={formatBRL(exp)} icon={Wallet} accent="magenta" />
        <StatCard label="Lucro operacional" value={formatBRL(profit)} icon={TrendingUp} accent={profit >= 0 ? "amber" : "magenta"} />
        <StatCard label="Margem" value={`${margin.toFixed(1)}%`} icon={Percent} accent={margin >= 0 ? "orange" : "magenta"} />
      </DashboardGrid>

      <Section>
        <SectionHeader
          title="Exportações"
          description="Baixe relatórios em CSV (UTF-8 com BOM, abre direto no Excel)."
          actions={
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={exportSummaryCsv}><Download className="h-4 w-4 mr-2" />Resumo completo</Button>
              <Button size="sm" variant="outline" onClick={exportMethodsCsv}><Download className="h-4 w-4 mr-2" />Por forma de pagamento</Button>
              <Button size="sm" variant="outline" onClick={exportCashflowCsv}><Download className="h-4 w-4 mr-2" />Fluxo de caixa diário</Button>
            </div>
          }
        />
        <SectionContent>
          <p className="text-sm text-ink/60">
            Exportação em XLSX planejada para uma próxima iteração para não impactar o bundle. Enquanto isso, o CSV pode ser aberto ou reimportado em qualquer planilha.
          </p>
        </SectionContent>
      </Section>

      <Section>
        <SectionHeader title="Receita por forma de pagamento" description="Pedidos pagos no período." />
        <SectionContent>
          {methods.length === 0 ? (
            <EmptyState icon={PieIcon} title="Sem pagamentos no período" description="Nenhum pedido pago encontrado." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-[11px] uppercase tracking-wider text-ink/60 bg-muted/40">
                  <tr>
                    <th className="px-4 py-2">Método</th>
                    <th className="px-4 py-2 text-right">Pedidos</th>
                    <th className="px-4 py-2 text-right">Bruto</th>
                    <th className="px-4 py-2 text-right">Descontos</th>
                    <th className="px-4 py-2 text-right">Líquido</th>
                    <th className="px-4 py-2 text-right">Ticket médio</th>
                  </tr>
                </thead>
                <tbody>
                  {methods.map((m) => (
                    <tr key={m.method} className="border-t border-ink/10">
                      <td className="px-4 py-2 font-bold text-ink">{RECON_METHOD_LABEL[m.method] ?? m.method}</td>
                      <td className="px-4 py-2 text-right">{m.orders_count}</td>
                      <td className="px-4 py-2 text-right">{formatBRL(m.gross_total)}</td>
                      <td className="px-4 py-2 text-right">{formatBRL(m.discounts)}</td>
                      <td className="px-4 py-2 text-right font-bold">{formatBRL(m.net_total)}</td>
                      <td className="px-4 py-2 text-right">{formatBRL(m.avg_ticket)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionContent>
      </Section>

      {showAdvanced && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Section>
            <SectionHeader title="Receitas por categoria" />
            <SectionContent>
              {revCats.length === 0 ? <p className="text-sm text-ink/60">Sem receitas.</p> : (
                <ul className="space-y-2 text-sm">
                  {revCats.map((c, i) => (
                    <li key={String(c.category_id ?? i)} className="flex justify-between border-b border-ink/10 pb-1">
                      <span>{c.name}</span><strong>{formatBRL(c.total)}</strong>
                    </li>
                  ))}
                </ul>
              )}
            </SectionContent>
          </Section>
          <Section>
            <SectionHeader title="Despesas por categoria" />
            <SectionContent>
              {expCats.length === 0 ? <p className="text-sm text-ink/60">Sem despesas.</p> : (
                <ul className="space-y-2 text-sm">
                  {expCats.map((c, i) => (
                    <li key={String(c.category_id ?? i)} className="flex justify-between border-b border-ink/10 pb-1">
                      <span>{c.name}</span><strong>{formatBRL(c.total)}</strong>
                    </li>
                  ))}
                </ul>
              )}
            </SectionContent>
          </Section>
        </div>
      )}

      {showAdvanced && (revCc.length > 0 || expCc.length > 0) && (
        <Section>
          <SectionHeader title="Por centro de custo" />
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
                    ...revCc.map((c) => c.cost_center_id ?? "null"),
                    ...expCc.map((c) => c.cost_center_id ?? "null"),
                  ])).map((key) => {
                    const r = revCc.find((c) => (c.cost_center_id ?? "null") === key);
                    const e = expCc.find((c) => (c.cost_center_id ?? "null") === key);
                    const name = r?.name ?? e?.name ?? "Sem centro de custo";
                    const rv = Number(r?.total ?? 0), ev = Number(e?.total ?? 0);
                    return (
                      <tr key={key} className="border-t border-ink/10">
                        <td className="px-4 py-2 font-bold text-ink">{name}</td>
                        <td className="px-4 py-2 text-right">{formatBRL(rv)}</td>
                        <td className="px-4 py-2 text-right">{formatBRL(ev)}</td>
                        <td className={`px-4 py-2 text-right font-bold ${rv - ev >= 0 ? "text-ink" : "text-brand-magenta"}`}>
                          {formatBRL(rv - ev)}
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
