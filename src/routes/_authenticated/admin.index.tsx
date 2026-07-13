import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

import {
  ShoppingBag,
  DollarSign,
  Users,
  TrendingUp,
  TrendingDown,
  Minus,
  LayoutDashboard,
  RefreshCw,
  CalendarIcon,
  AlertTriangle,
  Ban,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { PlanUsageBanner } from "@/components/PlanUsageBanner";
import { OnboardingChecklist } from "@/components/onboarding/OnboardingChecklist";
import { AdminPageLayout, StatCard, DashboardGrid, Section } from "@/components/ds";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { paymentLabel, orderTypeLabel } from "@/lib/labels";
import {
  buildRange,
  fetchDashboardSummary,
  formatBRL,
  formatDayBR,
  pctChange,
  type DashboardSummary,
  type PeriodPreset,
} from "@/lib/dashboard";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: Dashboard,
  head: () => ({ meta: [{ title: "Painel — Mesivo" }] }),
});

const COLORS = ["#ff6b35", "#e84393", "#7c5cff", "#f7931e", "#10b981", "#1a1a1a"];
const ACCENTS = ["orange", "magenta", "violet", "amber"] as const;

const PRESET_OPTIONS: Array<{ value: PeriodPreset; label: string }> = [
  { value: "today", label: "Hoje" },
  { value: "yesterday", label: "Ontem" },
  { value: "7d", label: "Últimos 7 dias" },
  { value: "30d", label: "Últimos 30 dias" },
  { value: "this_month", label: "Mês atual" },
  { value: "last_month", label: "Mês anterior" },
  { value: "custom", label: "Personalizado" },
];

function useRestaurantTimezone(restaurantId: string | null | undefined) {
  return useQuery({
    queryKey: ["restaurant-tz", restaurantId],
    enabled: !!restaurantId,
    staleTime: 60 * 60 * 1000,
    queryFn: async () => {
      const { data } = await supabase
        .from("restaurants")
        .select("timezone")
        .eq("id", restaurantId!)
        .maybeSingle();
      return (data?.timezone as string | undefined) || "America/Sao_Paulo";
    },
  });
}

function ComparisonBadge({ current, previous }: { current: number; previous: number }) {
  const { direction, display } = pctChange(current, previous);
  const Icon =
    direction === "up" ? TrendingUp : direction === "down" ? TrendingDown : direction === "flat" ? Minus : Minus;
  const cls =
    direction === "up"
      ? "text-emerald-700 bg-emerald-50 border-emerald-300"
      : direction === "down"
      ? "text-rose-700 bg-rose-50 border-rose-300"
      : "text-muted-foreground bg-muted border-border";
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-bold uppercase", cls)}>
      <Icon className="h-3 w-3" />
      {display}
    </span>
  );
}

function Dashboard() {
  const { restaurantId, roles } = useAuth();
  const canWriteOnboarding = roles.includes("owner");
  const queryClient = useQueryClient();
  const { data: tz } = useRestaurantTimezone(restaurantId);
  const timezone = tz || "America/Sao_Paulo";

  const [preset, setPreset] = useState<PeriodPreset>("7d");
  const [customFrom, setCustomFrom] = useState<Date | undefined>();
  const [customTo, setCustomTo] = useState<Date | undefined>();
  const [customOpen, setCustomOpen] = useState(false);
  const [now, setNow] = useState(Date.now());

  // Rebuild range when preset/custom/tz changes
  const range = useMemo(
    () => buildRange(preset, timezone, { from: customFrom, to: customTo }),
    [preset, timezone, customFrom, customTo, now],
  );

  const enabled = !!restaurantId && (preset !== "custom" || (!!customFrom && !!customTo));
  const query = useQuery<DashboardSummary>({
    queryKey: [
      "dashboard-summary",
      restaurantId,
      range.from.toISOString(),
      range.to.toISOString(),
    ],
    enabled,
    staleTime: 30_000,
    queryFn: () => fetchDashboardSummary(restaurantId!, range),
  });

  // Realtime: single filtered channel on orders → debounced invalidate
  useEffect(() => {
    if (!restaurantId) return;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const invalidateDebounced = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["dashboard-summary", restaurantId] });
      }, 1500);
    };
    const channel = supabase
      .channel(`dashboard-orders-${restaurantId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders", filter: `restaurant_id=eq.${restaurantId}` },
        invalidateDebounced,
      )
      .subscribe();
    return () => {
      if (timer) clearTimeout(timer);
      supabase.removeChannel(channel);
    };
  }, [restaurantId, queryClient]);


  // Refresh clock every minute so "há N min" stays fresh
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);

  const summary = query.data;
  const cur = summary?.current;
  const prev = summary?.previous;
  const isLoading = query.isLoading || query.isFetching;
  const isError = query.isError;
  const lastUpdated = summary?.generated_at ? new Date(summary.generated_at) : null;
  const staleMs = lastUpdated ? Date.now() - lastUpdated.getTime() : 0;
  const isStale = staleMs > 5 * 60 * 1000;

  // Custom range validation
  const customInvalid =
    preset === "custom" && customFrom && customTo && customTo.getTime() < customFrom.getTime();
  const customTooLarge =
    preset === "custom" &&
    customFrom &&
    customTo &&
    (customTo.getTime() - customFrom.getTime()) > 366 * 86400 * 1000;

  const cards = cur
    ? [
        { label: "Faturamento", value: formatBRL(cur.revenue), icon: DollarSign, cur: cur.revenue, prev: prev?.revenue ?? 0 },
        { label: "Pedidos", value: String(cur.orders_count), icon: ShoppingBag, cur: cur.orders_count, prev: prev?.orders_count ?? 0 },
        { label: "Ticket médio", value: formatBRL(cur.avg_ticket), icon: TrendingUp, cur: cur.avg_ticket, prev: prev?.avg_ticket ?? 0 },
        { label: "Cancelados", value: String(cur.cancelled_count), icon: Ban, cur: cur.cancelled_count, prev: prev?.cancelled_count ?? 0, invert: true },
      ]
    : [];

  const cancelRatePct = cur ? cur.cancellation_rate * 100 : 0;
  const prevCancelRatePct = prev ? prev.cancellation_rate * 100 : 0;

  const daily = (summary?.daily ?? []).map((d) => ({
    date: formatDayBR(d.day, timezone),
    pedidos: Number(d.orders),
    receita: Number(d.revenue),
  }));

  const paymentData = (summary?.by_payment ?? []).map((p) => ({
    name: paymentLabel(p.name),
    value: Number(p.value),
    revenue: Number(p.revenue),
  }));

  const channelData = (summary?.by_channel ?? []).map((c) => ({
    name: orderTypeLabel(c.name),
    value: Number(c.value),
    revenue: Number(c.revenue),
  }));

  const relative = (() => {
    if (!lastUpdated) return "—";
    const s = Math.max(0, Math.floor((Date.now() - lastUpdated.getTime()) / 1000));
    if (s < 60) return "agora";
    const m = Math.floor(s / 60);
    if (m < 60) return `há ${m} min`;
    const h = Math.floor(m / 60);
    return `há ${h}h`;
  })();

  return (
    <AdminPageLayout
      kicker="Visão geral"
      title="Painel"
      subtitle={`${range.label} • fuso ${timezone}`}
      accent="magenta"
      icon={LayoutDashboard}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Select value={preset} onValueChange={(v) => setPreset(v as PeriodPreset)}>
            <SelectTrigger className="h-9 w-[180px] bg-background border-2 border-ink font-bold uppercase text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRESET_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {preset === "custom" && (
            <Popover open={customOpen} onOpenChange={setCustomOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 gap-2 border-2 border-ink font-bold">
                  <CalendarIcon className="h-4 w-4" />
                  {customFrom && customTo
                    ? `${customFrom.toLocaleDateString("pt-BR")} → ${customTo.toLocaleDateString("pt-BR")}`
                    : "Escolher datas"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <div className="p-3 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-xs font-bold uppercase mb-1">Início</p>
                      <Calendar
                        mode="single"
                        selected={customFrom}
                        onSelect={setCustomFrom}
                        className="pointer-events-auto"
                      />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase mb-1">Fim</p>
                      <Calendar
                        mode="single"
                        selected={customTo}
                        onSelect={setCustomTo}
                        className="pointer-events-auto"
                        disabled={customFrom ? { before: customFrom } : undefined}
                      />
                    </div>
                  </div>
                  {customInvalid && (
                    <p className="text-xs text-rose-600 font-bold">A data final não pode ser anterior à inicial.</p>
                  )}
                  {customTooLarge && (
                    <p className="text-xs text-amber-600 font-bold flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" /> Período maior que 12 meses pode ser lento.
                    </p>
                  )}
                  <div className="flex justify-between pt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setCustomFrom(undefined);
                        setCustomTo(undefined);
                      }}
                    >
                      Limpar
                    </Button>
                    <Button
                      size="sm"
                      disabled={!customFrom || !customTo || !!customInvalid}
                      onClick={() => setCustomOpen(false)}
                    >
                      Aplicar
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          )}

          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-2 border-2 border-ink font-bold"
            disabled={isLoading}
            onClick={() => query.refetch()}
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            Atualizar
          </Button>
        </div>
      }
    >
      <OnboardingChecklist restaurantId={restaurantId} canWrite={canWriteOnboarding} />
      <PlanUsageBanner restaurantId={restaurantId} />

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <Badge variant="secondary" className="gap-1">
          Atualizado {relative}
        </Badge>
        {isStale && (
          <Badge className="gap-1 bg-amber-100 text-amber-800 border border-amber-300">
            <AlertTriangle className="h-3 w-3" /> Dados podem estar desatualizados
          </Badge>
        )}
        {isError && (
          <Badge className="gap-1 bg-rose-100 text-rose-800 border border-rose-300">
            Falha ao carregar. Toque em Atualizar.
          </Badge>
        )}
      </div>

      <DashboardGrid>
        {cards.map((c, i) => (
          <div key={c.label} className="relative">
            <StatCard label={c.label} value={c.value} icon={c.icon} accent={ACCENTS[i % ACCENTS.length]} />
            <div className="absolute top-3 right-3">
              {prev !== undefined && <ComparisonBadge current={c.cur} previous={c.prev} />}
            </div>
          </div>
        ))}
      </DashboardGrid>

      <Section>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground font-bold">Taxa de cancelamento</p>
            <p className="font-display text-3xl text-ink">{cancelRatePct.toFixed(1)}%</p>
          </div>
          <div className="text-right space-y-1">
            <p className="text-[10px] uppercase text-muted-foreground">{range.comparisonLabel}</p>
            <div className="flex items-center gap-2 justify-end">
              <span className="text-sm text-muted-foreground">Anterior: {prevCancelRatePct.toFixed(1)}%</span>
              <ComparisonBadge current={cancelRatePct} previous={prevCancelRatePct} />
            </div>
          </div>
        </div>
      </Section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Section className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-xl text-ink">Faturamento por dia</h3>
            <span className="text-[10px] uppercase tracking-[0.18em] font-bold text-brand-orange">
              {range.label}
            </span>
          </div>
          <div className="h-64">
            {daily.length === 0 && !isLoading ? (
              <EmptyChart />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={daily}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" strokeOpacity={0.1} />
                  <XAxis dataKey="date" fontSize={11} stroke="#1a1a1a" />
                  <YAxis fontSize={11} stroke="#1a1a1a" tickFormatter={(v) => formatBRL(v).replace("R$", "R$ ")} width={80} />
                  <Tooltip
                    contentStyle={tooltipStyle("#ff6b35")}
                    formatter={(v: number) => [formatBRL(v), "Faturamento"]}
                    labelFormatter={(l) => `Dia ${l}`}
                  />
                  <Line type="monotone" dataKey="receita" stroke="#ff6b35" strokeWidth={3} dot={{ r: 4, fill: "#1a1a1a", strokeWidth: 2, stroke: "#ff6b35" }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </Section>

        <Section>
          <h3 className="font-display text-xl text-ink mb-4">Vendas por canal</h3>
          <div className="h-64">
            {channelData.length === 0 && !isLoading ? (
              <EmptyChart />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={channelData} dataKey="value" nameKey="name" outerRadius={70} stroke="#1a1a1a" strokeWidth={2} label>
                    {channelData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={tooltipStyle("#e84393")}
                    formatter={(v: number, _n, item) => [
                      `${v} pedido(s) — ${formatBRL((item as { payload?: { revenue?: number } })?.payload?.revenue ?? 0)}`,
                      String(item?.name ?? ""),
                    ]}
                  />
                  <Legend wrapperStyle={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </Section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Section>
          <h3 className="font-display text-xl text-ink mb-4">Pedidos por dia</h3>
          <div className="h-56">
            {daily.length === 0 && !isLoading ? (
              <EmptyChart />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={daily}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" strokeOpacity={0.1} />
                  <XAxis dataKey="date" fontSize={11} stroke="#1a1a1a" />
                  <YAxis fontSize={11} stroke="#1a1a1a" allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle("#7c5cff")} formatter={(v: number) => [`${v} pedido(s)`, "Pedidos"]} />
                  <Bar dataKey="pedidos" fill="#7c5cff" radius={[8, 8, 0, 0]} stroke="#1a1a1a" strokeWidth={2} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Section>

        <Section>
          <h3 className="font-display text-xl text-ink mb-4">Formas de pagamento</h3>
          <div className="h-56">
            {paymentData.length === 0 && !isLoading ? (
              <EmptyChart />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={paymentData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" strokeOpacity={0.1} />
                  <XAxis type="number" fontSize={11} stroke="#1a1a1a" allowDecimals={false} />
                  <YAxis dataKey="name" type="category" fontSize={11} stroke="#1a1a1a" width={110} />
                  <Tooltip
                    contentStyle={tooltipStyle("#f7931e")}
                    formatter={(v: number, _n, item) => [
                      `${v} pedido(s) — ${formatBRL((item as { payload?: { revenue?: number } })?.payload?.revenue ?? 0)}`,
                      "Pagamentos",
                    ]}
                  />
                  <Bar dataKey="value" fill="#f7931e" radius={[0, 8, 8, 0]} stroke="#1a1a1a" strokeWidth={2} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Section>
      </div>

      <div className="flex flex-col gap-1 md:flex-row md:justify-between text-xs text-muted-foreground pt-2">
        <p>
          <strong>Como calculamos:</strong> pedidos com status <em>cancelado</em> ou <em>pendente</em> são excluídos do
          faturamento e do ticket médio. Taxa de cancelamento = cancelados ÷ total.
        </p>
        <Users className="hidden md:inline h-4 w-4 opacity-40" />
      </div>
    </AdminPageLayout>
  );
}

function EmptyChart() {
  return (
    <div className="h-full flex items-center justify-center text-center text-sm text-muted-foreground">
      Sem dados no período selecionado.
    </div>
  );
}

function tooltipStyle(borderColor: string) {
  return {
    background: "#1a1a1a",
    border: `2px solid ${borderColor}`,
    borderRadius: "8px",
    color: "#fff",
    fontWeight: 700,
  } as const;
}
