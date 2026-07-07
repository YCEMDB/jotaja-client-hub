import { useCallback, useEffect, useMemo, useState } from "react";
import { DollarSign, Bike, CheckCircle2, XCircle, Timer, TrendingUp, Users, Percent } from "lucide-react";
import { DashboardGrid, StatCard, Section, LoadingState, ErrorState, EmptyState } from "@/components/ds";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  getDeliveryFinancialSummary, getDeliveryMetrics, periodPreset, formatBRL,
  type DeliveryFinancialSummary, type DeliveryMetrics, type DeliveryDriver,
} from "@/lib/delivery";

type Preset = "today" | "7d" | "30d" | "month";

interface Props {
  restaurantId: string;
  drivers: DeliveryDriver[];
}

export function DeliveryReports({ restaurantId, drivers }: Props) {
  const [preset, setPreset] = useState<Preset>("today");
  const [driverId, setDriverId] = useState<string>("all");
  const [financial, setFinancial] = useState<DeliveryFinancialSummary | null>(null);
  const [metrics, setMetrics] = useState<DeliveryMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const period = useMemo(() => periodPreset(preset), [preset]);

  const reload = useCallback(async () => {
    if (!restaurantId) return;
    try {
      setError(null);
      setLoading(true);
      const [fin, met] = await Promise.all([
        getDeliveryFinancialSummary(restaurantId, period.from, period.to, driverId === "all" ? null : driverId),
        getDeliveryMetrics(restaurantId, period.from, period.to),
      ]);
      setFinancial(fin);
      setMetrics(met);
    } catch (e: any) {
      setError(e?.message ?? "Erro ao carregar relatórios.");
    } finally {
      setLoading(false);
    }
  }, [restaurantId, period.from, period.to, driverId]);

  useEffect(() => { reload(); }, [reload]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Tabs value={preset} onValueChange={(v) => setPreset(v as Preset)}>
          <TabsList>
            <TabsTrigger value="today">Hoje</TabsTrigger>
            <TabsTrigger value="7d">7 dias</TabsTrigger>
            <TabsTrigger value="30d">30 dias</TabsTrigger>
            <TabsTrigger value="month">Mês</TabsTrigger>
          </TabsList>
        </Tabs>
        <Select value={driverId} onValueChange={setDriverId}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="Motoboy" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos motoboys</SelectItem>
            {drivers.filter((d) => d.is_active).map((d) => (
              <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading && <LoadingState />}
      {error && <ErrorState description={error} onRetry={reload} />}

      {!loading && !error && financial && metrics && (
        <>
          {/* Financeiro */}
          <Section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display text-lg">Financeiro do período</h3>
              <Badge variant="outline" className="border-ink">
                {financial.totals.delivered_count} entregas · {financial.totals.cancelled_count} canceladas
              </Badge>
            </div>
            <DashboardGrid cols={4}>
              <StatCard label="Valor total entregue" value={formatBRL(financial.totals.gross_total)} icon={DollarSign} accent="green" />
              <StatCard label="Taxas de entrega" value={formatBRL(financial.totals.delivery_fees)} icon={Bike} accent="orange" hint="Cobrado do cliente" />
              <StatCard label="Comissões (a pagar)" value={formatBRL(financial.totals.commissions_total)} icon={TrendingUp} accent="violet" hint="Valor devido aos motoboys" />
              <StatCard label="Ticket médio" value={formatBRL(financial.totals.avg_ticket)} icon={DollarSign} accent="magenta" />
            </DashboardGrid>
          </Section>

          {/* Métricas SLA */}
          <Section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display text-lg">SLA e produtividade</h3>
              <Badge variant="outline" className="border-ink">Taxa de aceitação: {metrics.acceptance_rate ?? "—"}%</Badge>
            </div>
            <DashboardGrid cols={4}>
              <StatCard label="Tempo médio até aceitar" value={metrics.avg_accept_min != null ? `${metrics.avg_accept_min} min` : "—"} icon={Timer} accent="blue" />
              <StatCard label="Tempo médio até retirada" value={metrics.avg_pickup_min != null ? `${metrics.avg_pickup_min} min` : "—"} icon={Timer} accent="amber" />
              <StatCard label="Tempo médio em rota" value={metrics.avg_in_route_min != null ? `${metrics.avg_in_route_min} min` : "—"} icon={Timer} accent="orange" />
              <StatCard label="SLA total (aceite → entrega)" value={metrics.avg_total_min != null ? `${metrics.avg_total_min} min` : "—"} icon={CheckCircle2} accent="green" />
            </DashboardGrid>
            <DashboardGrid cols={4}>
              <StatCard label="Aceites" value={metrics.accept_events} icon={CheckCircle2} accent="green" />
              <StatCard label="Recusas" value={metrics.reject_events} icon={XCircle} accent="magenta" />
              <StatCard label="Aguardando motoboy" value={metrics.awaiting_now} icon={Users} accent="amber" hint="Agora" />
              <StatCard label="Em rota agora" value={metrics.in_route_now} icon={Bike} accent="orange" />
            </DashboardGrid>
          </Section>

          {/* Ranking por motoboy */}
          <Section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display text-lg">Produtividade por motoboy</h3>
              <span className="text-xs text-ink/50">Ordenado por comissão do período</span>
            </div>
            {financial.drivers.length === 0 ? (
              <EmptyState icon={Bike} title="Sem dados no período" description="Nenhuma entrega registrada para os filtros escolhidos." />
            ) : (
              <div className="overflow-x-auto -mx-2">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wider text-ink/60 border-b-2 border-ink">
                      <th className="py-2 px-2">Motoboy</th>
                      <th className="py-2 px-2 text-right">Entregas</th>
                      <th className="py-2 px-2 text-right">Cancelados</th>
                      <th className="py-2 px-2 text-right">Bruto</th>
                      <th className="py-2 px-2 text-right">Taxas</th>
                      <th className="py-2 px-2 text-right">Comissão</th>
                      <th className="py-2 px-2 text-right">Tempo médio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {financial.drivers.map((d) => (
                      <tr key={d.driver_id} className="border-b border-ink/10">
                        <td className="py-2 px-2 font-bold">{d.driver_name}</td>
                        <td className="py-2 px-2 text-right">{d.delivered_count}</td>
                        <td className="py-2 px-2 text-right text-ink/60">{d.cancelled_count}</td>
                        <td className="py-2 px-2 text-right">{formatBRL(d.gross_total)}</td>
                        <td className="py-2 px-2 text-right">{formatBRL(d.delivery_fees)}</td>
                        <td className="py-2 px-2 text-right font-bold text-brand-violet">{formatBRL(d.commissions_total)}</td>
                        <td className="py-2 px-2 text-right">{d.avg_delivery_min ? `${Number(d.avg_delivery_min).toFixed(1)} min` : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-ink font-bold">
                      <td className="py-2 px-2">Total</td>
                      <td className="py-2 px-2 text-right">{financial.totals.delivered_count}</td>
                      <td className="py-2 px-2 text-right">{financial.totals.cancelled_count}</td>
                      <td className="py-2 px-2 text-right">{formatBRL(financial.totals.gross_total)}</td>
                      <td className="py-2 px-2 text-right">{formatBRL(financial.totals.delivery_fees)}</td>
                      <td className="py-2 px-2 text-right text-brand-violet">{formatBRL(financial.totals.commissions_total)}</td>
                      <td className="py-2 px-2 text-right">—</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
            <p className="text-[11px] text-ink/50 mt-3 flex items-center gap-1">
              <Percent className="h-3 w-3" /> Comissões são registradas no momento da retirada e não geram movimentação no caixa — o pagamento aos motoboys é gerenciado fora do fluxo de caixa dos pedidos.
            </p>
          </Section>
        </>
      )}
    </div>
  );
}
