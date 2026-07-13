import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Download, BarChart3 } from "lucide-react";
import { downloadCSV } from "@/lib/export-csv";
import { FeatureGate } from "@/components/FeatureGate";
import {
  AdminPageLayout, StatCard, DashboardGrid, Section, FilterBar,
  EmptyState, LoadingState, ErrorState,
} from "@/components/ds";
import {
  fetchOverview, fetchOrdersBreakdown, fetchProducts, fetchCustomers, fetchCash, fetchStock,
  computeRange, RANGE_PRESETS, fmtBRL, fmtInt, fmtPct, translateReportError,
  type RangePreset, type OverviewReport, type OrdersBreakdown, type ProductsReport,
  type CustomersReport, type CashReport, type StockReport,
} from "@/lib/reports";
import { orderStatusLabel, orderTypeLabel, paymentLabel } from "@/lib/labels";

export const Route = createFileRoute("/_authenticated/admin/relatorios")({
  component: RelatoriosGated,
  head: () => ({ meta: [{ title: "Relatórios — Mesivo" }] }),
});

function RelatoriosGated() {
  return (
    <FeatureGate feature="advanced_reports">
      <RelatoriosPage />
    </FeatureGate>
  );
}

const DOW_LABEL = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

function deltaText(current: number, previous: number): string {
  const pct = fmtPct(current, previous);
  if (pct === null) return "Sem base anterior";
  const sign = pct >= 0 ? "↑" : "↓";
  return `${sign} ${Math.abs(pct).toFixed(1)}% vs. anterior`;
}

function RelatoriosPage() {
  const { restaurantId } = useAuth();

  // Filtros
  const [preset, setPreset] = useState<RangePreset | "custom">("30d");
  const initial = computeRange("30d");
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);

  // Estado por relatório
  const [overview, setOverview] = useState<OverviewReport | null>(null);
  const [breakdown, setBreakdown] = useState<OrdersBreakdown | null>(null);
  const [products, setProducts] = useState<ProductsReport | null>(null);
  const [customers, setCustomers] = useState<CustomersReport | null>(null);
  const [cash, setCash] = useState<CashReport | null>(null);
  const [stock, setStock] = useState<StockReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = async () => {
    if (!restaurantId) return;
    setLoading(true);
    setErr(null);
    try {
      const range = { from, to };
      const [ov, br, pr, cu, ca, st] = await Promise.all([
        fetchOverview(restaurantId, range),
        fetchOrdersBreakdown(restaurantId, range),
        fetchProducts(restaurantId, range),
        fetchCustomers(restaurantId, range),
        fetchCash(restaurantId, range),
        fetchStock(restaurantId, range),
      ]);
      setOverview(ov); setBreakdown(br); setProducts(pr);
      setCustomers(cu); setCash(ca); setStock(st);
    } catch (e) {
      setErr(translateReportError(e));
    } finally {
      setLoading(false);
    }
  };

  // Reset ao trocar de restaurante (limpa dados de tenant anterior)
  useEffect(() => {
    setOverview(null); setBreakdown(null); setProducts(null);
    setCustomers(null); setCash(null); setStock(null);
    if (restaurantId) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId]);

  const applyPreset = (p: RangePreset) => {
    setPreset(p);
    const r = computeRange(p);
    setFrom(r.from); setTo(r.to);
  };

  const runFilters = () => {
    setPreset("custom");
    void load();
  };

  const stats = overview?.current;
  const prev = overview?.previous;

  const maxHourOrders = useMemo(() => {
    if (!breakdown?.by_hour?.length) return 0;
    return Math.max(...breakdown.by_hour.map((h) => h.orders));
  }, [breakdown]);

  const exportProductsCSV = () => {
    if (!products) return;
    const rows: (string | number)[][] = [
      ["Produto", "Categoria", "Quantidade", "Receita (R$)", "Arquivado"],
      ...products.top_products.map((p) => [
        p.name, p.category_name ?? "—", p.qty, p.revenue.toFixed(2), p.archived ? "Sim" : "Não",
      ]),
    ];
    downloadCSV(`produtos_${from}_a_${to}.csv`, rows);
  };

  const exportCustomersCSV = () => {
    if (!customers) return;
    const rows: (string | number)[][] = [
      ["Cliente", "Telefone", "Pedidos", "Total gasto (R$)", "Última compra"],
      ...customers.top.map((c) => [
        c.name, c.phone_masked ?? "",
        c.orders, c.spent.toFixed(2),
        c.last_order_at ? new Date(c.last_order_at).toLocaleString("pt-BR") : "",
      ]),
    ];
    downloadCSV(`clientes_${from}_a_${to}.csv`, rows);
  };

  const exportOverviewCSV = () => {
    if (!overview) return;
    const c = overview.current;
    const rows: (string | number)[][] = [
      ["Período", from + " a " + to, "TZ", overview.tz, "Granularidade", overview.granularity],
      [],
      ["Métrica", "Valor"],
      ["Receita concluída (R$)", c.completed_revenue.toFixed(2)],
      ["Pedidos concluídos", c.completed_orders],
      ["Valor em aberto (R$)", c.open_amount.toFixed(2)],
      ["Pedidos em aberto", c.open_orders],
      ["Pedidos válidos operacionais", c.valid_orders],
      ["Pedidos cancelados", c.cancelled_orders],
      ["Pedidos pendentes", c.pending_orders],
      ["Ticket médio concluído (R$)", c.avg_ticket_completed.toFixed(2)],
      ["Descontos concluídos (R$)", c.total_discount.toFixed(2)],
      ["Taxa de entrega concluída (R$)", c.total_delivery_fee.toFixed(2)],
      ["Clientes únicos (concluídos)", c.unique_customers],
      ["Novos clientes", c.new_customers],
      ["Itens vendidos (concluídos)", c.units_sold],
      [],
      ["Série (receita concluída)", "Receita (R$)", "Pedidos"],
      ...overview.series.map((s) => [s.bucket, s.revenue.toFixed(2), s.orders]),
    ];
    downloadCSV(`visao_geral_${from}_a_${to}.csv`, rows);
  };

  if (!restaurantId) {
    return (
      <AdminPageLayout kicker="Análise" title="Relatórios" accent="violet" icon={BarChart3}>
        <EmptyState icon={BarChart3} title="Configure seu restaurante primeiro" />
      </AdminPageLayout>
    );
  }

  return (
    <AdminPageLayout
      kicker="Análise"
      title="Relatórios"
      subtitle={`Vendas, pedidos, produtos, clientes, caixa e estoque${overview ? ` — fuso ${overview.tz}` : ""}`}
      accent="violet"
      icon={BarChart3}
    >
      <FilterBar
        actions={
          <Button onClick={runFilters} disabled={loading}>
            {loading ? "Carregando…" : "Atualizar"}
          </Button>
        }
      >
        <div className="flex flex-wrap gap-2 items-end">
          {RANGE_PRESETS.map((p) => (
            <Button
              key={p.key}
              size="sm"
              variant={preset === p.key ? "default" : "outline"}
              onClick={() => applyPreset(p.key)}
            >
              {p.label}
            </Button>
          ))}
        </div>
        <div>
          <Label className="text-xs">De</Label>
          <Input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPreset("custom"); }} />
        </div>
        <div>
          <Label className="text-xs">Até</Label>
          <Input type="date" value={to} onChange={(e) => { setTo(e.target.value); setPreset("custom"); }} />
        </div>
      </FilterBar>

      {err ? (
        <ErrorState title="Erro" description={err} onRetry={load} />
      ) : loading ? (
        <LoadingState />
      ) : (
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="flex flex-wrap gap-1 h-auto">
            <TabsTrigger value="overview">Visão geral</TabsTrigger>
            <TabsTrigger value="orders">Pedidos</TabsTrigger>
            <TabsTrigger value="products">Produtos</TabsTrigger>
            <TabsTrigger value="customers">Clientes</TabsTrigger>
            <TabsTrigger value="cash">Caixa</TabsTrigger>
            <TabsTrigger value="stock">Estoque</TabsTrigger>
          </TabsList>

          {/* VISÃO GERAL */}
          <TabsContent value="overview" className="space-y-4">
            {stats && prev && (
              <>
                <div className="flex justify-end">
                  <Button variant="outline" size="sm" onClick={exportOverviewCSV}>
                    <Download className="h-4 w-4 mr-2" />CSV
                  </Button>
                </div>
                <DashboardGrid cols={4}>
                  <StatCard label="Receita concluída" value={fmtBRL(stats.completed_revenue)} accent="green"
                    hint={deltaText(stats.completed_revenue, prev.completed_revenue)} />
                  <StatCard label="Pedidos concluídos" value={fmtInt(stats.completed_orders)} accent="orange"
                    hint={deltaText(stats.completed_orders, prev.completed_orders)} />
                  <StatCard label="Ticket médio (concluídos)" value={fmtBRL(stats.avg_ticket_completed)} accent="violet" />
                  <StatCard label="Valor em aberto" value={fmtBRL(stats.open_amount)} accent="amber"
                    hint={`${fmtInt(stats.open_orders)} pedidos em operação`} />
                  <StatCard label="Pedidos válidos (operacionais)" value={fmtInt(stats.valid_orders)} accent="violet"
                    hint="Confirmados + em preparo + prontos + em rota + entregues" />
                  <StatCard label="Cancelados" value={fmtInt(stats.cancelled_orders)} accent="magenta" />
                  <StatCard label="Descontos (concluídos)" value={fmtBRL(stats.total_discount)} accent="amber" />
                  <StatCard label="Taxa de entrega (concluídos)" value={fmtBRL(stats.total_delivery_fee)} accent="violet" />
                  <StatCard label="Clientes únicos (concluídos)" value={fmtInt(stats.unique_customers)} accent="green" />
                  <StatCard label="Novos clientes" value={fmtInt(stats.new_customers)} accent="orange" />
                </DashboardGrid>

                <Section>
                  <h3 className="font-bold mb-3">Série temporal — {overview?.granularity === "hour" ? "por hora" : overview?.granularity === "day" ? "por dia" : "por mês"}</h3>
                  {!overview?.series?.length ? (
                    <p className="text-sm text-muted-foreground">Sem vendas no período.</p>
                  ) : (
                    <SeriesBars data={overview.series} />
                  )}
                </Section>
              </>
            )}
          </TabsContent>

          {/* PEDIDOS */}
          <TabsContent value="orders" className="space-y-4">
            {breakdown && (
              <>
                <DashboardGrid cols={2}>
                  <Section>
                    <h3 className="font-bold mb-2">Por status</h3>
                    <BreakdownList
                      items={Object.entries(breakdown.by_status).map(([k, v]) => ({ label: orderStatusLabel(k), value: fmtInt(v) }))}
                    />
                  </Section>
                  <Section>
                    <h3 className="font-bold mb-2">Por tipo</h3>
                    <BreakdownList
                      items={Object.entries(breakdown.by_type).map(([k, v]) => ({
                        label: orderTypeLabel(k),
                        value: `${fmtInt(v.count)} — ${fmtBRL(v.revenue)}`,
                      }))}
                    />
                  </Section>
                  <Section>
                    <h3 className="font-bold mb-2">Forma de pagamento informada</h3>
                    <BreakdownList
                      items={Object.entries(breakdown.by_payment_method).map(([k, v]) => ({
                        label: paymentLabel(k),
                        value: `${fmtInt(v.count)} — ${fmtBRL(v.revenue)}`,
                      }))}
                    />
                    <p className="text-[11px] text-muted-foreground mt-2">
                      Escolha do cliente no pedido — não representa pagamento confirmado. Receita listada é a de pedidos concluídos.
                    </p>
                  </Section>
                  <Section>
                    <h3 className="font-bold mb-2">Status financeiro</h3>
                    <BreakdownList
                      items={Object.entries(breakdown.by_payment_status).map(([k, v]) => ({ label: k, value: fmtInt(v) }))}
                    />
                  </Section>
                </DashboardGrid>

                <Section>
                  <h3 className="font-bold mb-3">Horários de pico</h3>
                  <div className="grid grid-cols-12 gap-1" role="img" aria-label="Distribuição de pedidos por hora">
                    {Array.from({ length: 24 }).map((_, h) => {
                      const item = breakdown.by_hour.find((x) => x.hour === h);
                      const cnt = item?.orders ?? 0;
                      const pct = maxHourOrders ? (cnt / maxHourOrders) * 100 : 0;
                      return (
                        <div key={h} className="col-span-1 flex flex-col items-center gap-1">
                          <div className="w-full h-24 flex items-end">
                            <div className="w-full bg-brand-violet/60 border border-ink/30 rounded-sm" style={{ height: `${pct}%` }} title={`${h}h: ${cnt} pedidos`} />
                          </div>
                          <span className="text-[10px] text-muted-foreground">{h}h</span>
                          <span className="text-[10px] font-medium">{cnt}</span>
                        </div>
                      );
                    })}
                  </div>
                </Section>

                <Section>
                  <h3 className="font-bold mb-2">Movimento por dia da semana</h3>
                  <BreakdownList
                    items={breakdown.by_dow.map((d) => ({ label: DOW_LABEL[d.dow - 1] ?? String(d.dow), value: fmtInt(d.orders) }))}
                  />
                </Section>
              </>
            )}
          </TabsContent>

          {/* PRODUTOS */}
          <TabsContent value="products" className="space-y-4">
            {products && (
              <>
                <div className="flex justify-end">
                  <Button variant="outline" size="sm" onClick={exportProductsCSV} disabled={!products.top_products.length}>
                    <Download className="h-4 w-4 mr-2" />CSV
                  </Button>
                </div>
                <Section className="p-0 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <caption className="sr-only">Produtos mais vendidos no período</caption>
                      <thead className="bg-muted">
                        <tr className="text-left">
                          <th className="p-3">Produto</th>
                          <th className="p-3">Categoria</th>
                          <th className="p-3 text-right">Qtd</th>
                          <th className="p-3 text-right">Receita</th>
                          <th className="p-3 text-right">% do total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.top_products.length === 0 ? (
                          <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">Nenhum produto vendido no período.</td></tr>
                        ) : products.top_products.map((p, i) => (
                          <tr key={p.product_id ?? i} className="border-t border-ink/10">
                            <td className="p-3">{p.name} {p.archived && <span className="ml-1 text-[10px] px-1 py-0.5 rounded bg-muted-foreground/20">arquivado</span>}</td>
                            <td className="p-3 text-muted-foreground">{p.category_name ?? "—"}</td>
                            <td className="p-3 text-right">{fmtInt(p.qty)}</td>
                            <td className="p-3 text-right font-medium">{fmtBRL(p.revenue)}</td>
                            <td className="p-3 text-right text-muted-foreground">
                              {products.total_revenue > 0 ? ((p.revenue / products.total_revenue) * 100).toFixed(1) + "%" : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Section>

                <DashboardGrid cols={2}>
                  <Section>
                    <h3 className="font-bold mb-3">Por categoria</h3>
                    <BreakdownList
                      items={products.categories.map((c) => ({
                        label: c.name,
                        value: `${fmtInt(c.qty)} un — ${fmtBRL(c.revenue)}`,
                      }))}
                    />
                  </Section>
                  <Section>
                    <h3 className="font-bold mb-3">Sem venda no período</h3>
                    {products.unsold_products.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Todos os produtos ativos venderam.</p>
                    ) : (
                      <ul className="text-sm space-y-1 max-h-72 overflow-y-auto">
                        {products.unsold_products.slice(0, 100).map((p) => (
                          <li key={p.product_id} className="border-b border-ink/5 py-1">{p.name}</li>
                        ))}
                        {products.unsold_products.length > 100 && (
                          <li className="text-xs text-muted-foreground">+{products.unsold_products.length - 100} produtos…</li>
                        )}
                      </ul>
                    )}
                  </Section>
                </DashboardGrid>
                <p className="text-[11px] text-muted-foreground">
                  Nome exibido é o snapshot histórico registrado no pedido. Adicionais não são somados em separado —
                  o valor do adicional já compõe o preço unitário do item no snapshot.
                </p>
              </>
            )}
          </TabsContent>

          {/* CLIENTES */}
          <TabsContent value="customers" className="space-y-4">
            {customers && (
              <>
                <DashboardGrid cols={4}>
                  <StatCard label="Clientes únicos" value={fmtInt(customers.summary.unique_customers)} accent="green" />
                  <StatCard label="Recorrentes" value={fmtInt(customers.summary.recurring_customers)} accent="violet" />
                  <StatCard label="Novos" value={fmtInt(customers.summary.new_customers)} accent="orange" />
                  <StatCard label="Ticket por cliente" value={fmtBRL(customers.summary.avg_per_customer)} accent="magenta" />
                </DashboardGrid>
                <div className="flex justify-end">
                  <Button variant="outline" size="sm" onClick={exportCustomersCSV} disabled={!customers.top.length}>
                    <Download className="h-4 w-4 mr-2" />CSV
                  </Button>
                </div>
                <Section className="p-0 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted">
                        <tr className="text-left">
                          <th className="p-3">Cliente</th>
                          <th className="p-3">Telefone</th>
                          <th className="p-3 text-right">Pedidos</th>
                          <th className="p-3 text-right">Total</th>
                          <th className="p-3">Última compra</th>
                        </tr>
                      </thead>
                      <tbody>
                        {customers.top.length === 0 ? (
                          <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">Nenhum cliente identificado no período.</td></tr>
                        ) : customers.top.map((c) => (
                          <tr key={c.customer_id} className="border-t border-ink/10">
                            <td className="p-3">{c.name}</td>
                            <td className="p-3 text-muted-foreground">{c.phone_masked ?? "—"}</td>
                            <td className="p-3 text-right">{fmtInt(c.orders)}</td>
                            <td className="p-3 text-right font-medium">{fmtBRL(c.spent)}</td>
                            <td className="p-3 text-muted-foreground">
                              {c.last_order_at ? new Date(c.last_order_at).toLocaleString("pt-BR") : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Section>
                <p className="text-[11px] text-muted-foreground">
                  Recorrente = mais de 1 pedido válido no período. Telefone parcialmente mascarado; CPF/token nunca são exibidos.
                </p>
              </>
            )}
          </TabsContent>

          {/* CAIXA */}
          <TabsContent value="cash" className="space-y-4">
            {cash && (
              <>
                <DashboardGrid cols={4}>
                  <StatCard label="Vendas registradas" value={fmtBRL(cash.movements.sale?.total ?? 0)} accent="green" hint={`${fmtInt(cash.movements.sale?.count ?? 0)} lançamentos`} />
                  <StatCard label="Suprimentos" value={fmtBRL(cash.movements.reinforcement?.total ?? 0)} accent="orange" hint={`${fmtInt(cash.movements.reinforcement?.count ?? 0)} manuais`} />
                  <StatCard label="Sangrias" value={fmtBRL(cash.movements.withdrawal?.total ?? 0)} accent="magenta" hint={`${fmtInt(cash.movements.withdrawal?.count ?? 0)} manuais`} />
                  <StatCard label="Despesas" value={fmtBRL(cash.movements.expense?.total ?? 0)} accent="amber" hint={`${fmtInt(cash.movements.expense?.count ?? 0)} manuais`} />
                </DashboardGrid>
                <Section className="p-0 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted">
                        <tr className="text-left">
                          <th className="p-3">Abertura</th>
                          <th className="p-3">Fechamento</th>
                          <th className="p-3">Status</th>
                          <th className="p-3 text-right">Inicial</th>
                          <th className="p-3 text-right">Esperado</th>
                          <th className="p-3 text-right">Informado</th>
                          <th className="p-3 text-right">Diferença</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cash.sessions.length === 0 ? (
                          <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">Sem sessões de caixa no período.</td></tr>
                        ) : cash.sessions.map((s) => (
                          <tr key={s.id} className="border-t border-ink/10">
                            <td className="p-3">{new Date(s.opened_at).toLocaleString("pt-BR")}</td>
                            <td className="p-3">{s.closed_at ? new Date(s.closed_at).toLocaleString("pt-BR") : <span className="text-muted-foreground">—</span>}</td>
                            <td className="p-3">{s.status === "open" ? "Aberto" : "Fechado"}</td>
                            <td className="p-3 text-right">{fmtBRL(s.opening_amount)}</td>
                            <td className="p-3 text-right">{s.expected_amount != null ? fmtBRL(s.expected_amount) : "—"}</td>
                            <td className="p-3 text-right">{s.closing_amount != null ? fmtBRL(s.closing_amount) : "—"}</td>
                            <td className={`p-3 text-right font-medium ${(s.difference ?? 0) < 0 ? "text-rose-600" : (s.difference ?? 0) > 0 ? "text-emerald-600" : ""}`}>
                              {s.difference != null ? fmtBRL(s.difference) : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Section>
                <p className="text-[11px] text-muted-foreground">
                  Vendas registradas são as automáticas atreladas a pedidos. Suprimento, sangria e despesa são manuais e não contam como venda.
                </p>
              </>
            )}
          </TabsContent>

          {/* ESTOQUE */}
          <TabsContent value="stock" className="space-y-4">
            {stock && (
              <>
                <DashboardGrid cols={4}>
                  <StatCard label="Entradas" value={fmtInt(stock.movements.entry?.qty ?? 0)} accent="green" hint={fmtBRL(stock.movements.entry?.cost ?? 0)} />
                  <StatCard label="Saídas" value={fmtInt((stock.movements.exit?.qty ?? 0) + (stock.movements.sale?.qty ?? 0))} accent="orange" hint={`${fmtInt(stock.movements.sale?.count ?? 0)} por vendas`} />
                  <StatCard label="Perdas" value={fmtInt(stock.movements.loss?.qty ?? 0)} accent="magenta" hint={fmtBRL(stock.movements.loss?.cost ?? 0)} />
                  <StatCard label="Ajustes" value={fmtInt(stock.movements.adjust?.qty ?? 0)} accent="amber" hint={`${fmtInt(stock.movements.adjust?.count ?? 0)} ajustes`} />
                </DashboardGrid>
                <DashboardGrid cols={2}>
                  <Section>
                    <h3 className="font-bold mb-2">Insumos abaixo do mínimo</h3>
                    {stock.below_min.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Todos os insumos monitorados estão dentro do mínimo.</p>
                    ) : (
                      <ul className="text-sm space-y-1 max-h-72 overflow-y-auto">
                        {stock.below_min.map((s) => (
                          <li key={s.id} className="flex justify-between border-b border-ink/5 py-1">
                            <span>{s.name}</span>
                            <span className="text-rose-600 font-medium">
                              {fmtInt(s.current_qty)} / mín {fmtInt(s.min_qty)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </Section>
                  <Section>
                    <h3 className="font-bold mb-2">Mais consumidos</h3>
                    {stock.top_consumed.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Sem movimentações no período.</p>
                    ) : (
                      <ul className="text-sm space-y-1">
                        {stock.top_consumed.map((s, i) => (
                          <li key={i} className="flex justify-between border-b border-ink/5 py-1">
                            <span>{s.name}</span>
                            <span className="font-medium">{fmtInt(s.qty)}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </Section>
                </DashboardGrid>
                <Section>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Valor estimado do estoque</p>
                      <p className="text-2xl font-black">{fmtBRL(stock.valuation)}</p>
                    </div>
                    <p className="text-[11px] text-muted-foreground max-w-sm text-right">
                      Estimativa = quantidade × custo médio dos insumos ativos. CMV e margem não são exibidos por dependerem
                      de fichas técnicas completas.
                    </p>
                  </div>
                </Section>
              </>
            )}
          </TabsContent>
        </Tabs>
      )}
    </AdminPageLayout>
  );

}

function BreakdownList({ items }: { items: { label: string; value: string }[] }) {
  if (!items.length) return <p className="text-sm text-muted-foreground">Sem dados.</p>;
  return (
    <ul className="text-sm space-y-1">
      {items.map((i, idx) => (
        <li key={idx} className="flex justify-between border-b border-ink/5 py-1">
          <span>{i.label}</span>
          <span className="font-medium">{i.value}</span>
        </li>
      ))}
    </ul>
  );
}

function SeriesBars({ data }: { data: { bucket: string; revenue: number; orders: number }[] }) {
  const max = Math.max(...data.map((d) => d.revenue), 0);
  return (
    <div className="space-y-1" role="img" aria-label="Receita por período">
      {data.slice(-30).map((d) => {
        const pct = max ? (d.revenue / max) * 100 : 0;
        return (
          <div key={d.bucket} className="grid grid-cols-[110px_1fr_120px] items-center gap-2 text-xs">
            <span className="text-muted-foreground">{d.bucket}</span>
            <div className="h-4 bg-muted rounded-sm overflow-hidden border border-ink/10">
              <div className="h-full bg-brand-violet" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-right">
              <span className="font-medium">{fmtBRL(d.revenue)}</span>
              <span className="text-muted-foreground"> · {d.orders}</span>
            </span>
          </div>
        );
      })}
      {data.length > 30 && (
        <p className="text-[11px] text-muted-foreground text-right">Mostrando últimas 30 amostras (CSV traz tudo).</p>
      )}
    </div>
  );
}
