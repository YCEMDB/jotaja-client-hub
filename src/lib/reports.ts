import { supabase } from "@/integrations/supabase/client";

export type ReportRange = { from: string; to: string; tz?: string };

export type OverviewMetrics = {
  completed_revenue: number;
  completed_orders: number;
  open_amount: number;
  open_orders: number;
  valid_orders: number;
  cancelled_orders: number;
  pending_orders: number;
  avg_ticket_completed: number;
  total_discount: number;
  total_delivery_fee: number;
  unique_customers: number;
  new_customers: number;
  units_sold: number;
};

export type OverviewSeriesPoint = { bucket: string; revenue: number; orders: number };

export type OverviewReport = {
  tz: string;
  from: string;
  to: string;
  granularity: "hour" | "day" | "month";
  current: OverviewMetrics;
  previous: { completed_revenue: number; completed_orders: number; cancelled_orders: number };
  series: OverviewSeriesPoint[];
};

export type OrdersBreakdown = {
  tz: string;
  from: string;
  to: string;
  by_status: Record<string, number>;
  by_type: Record<string, { count: number; revenue: number }>;
  by_payment_method: Record<string, { count: number; revenue: number }>;
  by_payment_status: Record<string, number>;
  by_hour: { hour: number; orders: number }[];
  by_dow: { dow: number; orders: number }[];
};

export type ProductsReport = {
  tz: string;
  from: string;
  to: string;
  top_products: {
    product_id: string | null;
    name: string;
    qty: number;
    revenue: number;
    archived: boolean;
    category_name: string | null;
  }[];
  categories: { name: string; qty: number; revenue: number }[];
  unsold_products: { product_id: string; name: string }[];
  total_revenue: number;
};

export type CustomersReport = {
  tz: string;
  from: string;
  to: string;
  summary: {
    unique_customers: number;
    recurring_customers: number;
    new_customers: number;
    total_spent: number;
    avg_per_customer: number;
  };
  top: {
    customer_id: string;
    name: string;
    phone_masked: string | null;
    orders: number;
    spent: number;
    last_order_at: string | null;
  }[];
};

export type CashReport = {
  tz: string;
  from: string;
  to: string;
  movements: Record<string, { count: number; total: number }>;
  sessions: {
    id: string;
    opened_at: string;
    closed_at: string | null;
    status: string;
    opening_amount: number;
    closing_amount: number | null;
    expected_amount: number | null;
    difference: number | null;
    opened_by: string | null;
    closed_by: string | null;
    origin: string | null;
  }[];
};

export type StockReport = {
  tz: string;
  from: string;
  to: string;
  movements: Record<string, { count: number; qty: number; cost: number }>;
  below_min: { id: string; name: string; current_qty: number; min_qty: number; avg_cost: number }[];
  valuation: number;
  top_consumed: { name: string; qty: number }[];
};

const call = async <T,>(fn: string, args: Record<string, unknown>): Promise<T> => {
  const { data, error } = await supabase.rpc(fn as never, args as never);
  if (error) throw error;
  return data as T;
};

export const fetchOverview = (restaurantId: string, r: ReportRange) =>
  call<OverviewReport>("report_overview", {
    p_restaurant_id: restaurantId,
    p_from: r.from,
    p_to: r.to,
    p_tz: r.tz ?? null,
  });

export const fetchOrdersBreakdown = (restaurantId: string, r: ReportRange) =>
  call<OrdersBreakdown>("report_orders_breakdown", {
    p_restaurant_id: restaurantId,
    p_from: r.from,
    p_to: r.to,
    p_tz: r.tz ?? null,
  });

export const fetchProducts = (restaurantId: string, r: ReportRange, limit = 50) =>
  call<ProductsReport>("report_products", {
    p_restaurant_id: restaurantId,
    p_from: r.from,
    p_to: r.to,
    p_tz: r.tz ?? null,
    p_limit: limit,
  });

export const fetchCustomers = (restaurantId: string, r: ReportRange, limit = 50) =>
  call<CustomersReport>("report_customers", {
    p_restaurant_id: restaurantId,
    p_from: r.from,
    p_to: r.to,
    p_tz: r.tz ?? null,
    p_limit: limit,
  });

export const fetchCash = (restaurantId: string, r: ReportRange) =>
  call<CashReport>("report_cash", {
    p_restaurant_id: restaurantId,
    p_from: r.from,
    p_to: r.to,
    p_tz: r.tz ?? null,
  });

export const fetchStock = (restaurantId: string, r: ReportRange) =>
  call<StockReport>("report_stock", {
    p_restaurant_id: restaurantId,
    p_from: r.from,
    p_to: r.to,
    p_tz: r.tz ?? null,
  });

export function translateReportError(err: unknown): string {
  let raw = "";
  if (err instanceof Error) {
    raw = err.message;
  } else if (err && typeof err === "object") {
    const e = err as { message?: unknown; details?: unknown; hint?: unknown; code?: unknown };
    raw = [e.message, e.details, e.hint, e.code].filter((v) => typeof v === "string" && v).join(" — ");
    if (!raw) { try { raw = JSON.stringify(err); } catch { raw = ""; } }
  } else if (err != null) {
    raw = String(err);
  }
  const m = raw.toLowerCase();
  if (m.includes("invalid_date_range")) return "Intervalo de datas inválido.";
  if (m.includes("date_range_too_large")) return "Intervalo excede o máximo permitido (400 dias).";
  if (m.includes("report_access_forbidden") || m === "forbidden" || m.includes("\"forbidden\"")) return "Sem permissão para consultar relatórios deste restaurante. Se estiver em modo suporte, verifique se a sessão está ativa.";
  if (m.includes("restaurant_not_found")) return "Restaurante não encontrado.";
  if (m.includes("not_authenticated") || m.includes("unauthorized")) return "Sessão expirada. Faça login novamente.";
  if (m.includes("support_session")) return "Sessão de suporte inativa. Abra uma sessão para consultar dados.";
  return raw || "Erro ao carregar relatório.";
}

export const RANGE_PRESETS = [
  { key: "today", label: "Hoje" },
  { key: "yesterday", label: "Ontem" },
  { key: "7d", label: "Últimos 7 dias" },
  { key: "30d", label: "Últimos 30 dias" },
  { key: "month", label: "Este mês" },
  { key: "last_month", label: "Mês anterior" },
] as const;

export type RangePreset = (typeof RANGE_PRESETS)[number]["key"];

/** Calcula intervalo local (YYYY-MM-DD) para o preset informado, em TZ do navegador. */
export function computeRange(preset: RangePreset): { from: string; to: string } {
  const now = new Date();
  const d = (offset = 0) => {
    const x = new Date(now);
    x.setDate(x.getDate() + offset);
    return x.toISOString().slice(0, 10);
  };
  const monthStart = () => {
    const x = new Date(now.getFullYear(), now.getMonth(), 1);
    return x.toISOString().slice(0, 10);
  };
  const lastMonth = () => {
    const from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const to = new Date(now.getFullYear(), now.getMonth(), 0);
    return {
      from: from.toISOString().slice(0, 10),
      to: to.toISOString().slice(0, 10),
    };
  };
  switch (preset) {
    case "today":
      return { from: d(0), to: d(0) };
    case "yesterday":
      return { from: d(-1), to: d(-1) };
    case "7d":
      return { from: d(-6), to: d(0) };
    case "30d":
      return { from: d(-29), to: d(0) };
    case "month":
      return { from: monthStart(), to: d(0) };
    case "last_month":
      return lastMonth();
  }
}

export const fmtBRL = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(v) || 0);

export const fmtInt = (v: number) => new Intl.NumberFormat("pt-BR").format(Math.round(Number(v) || 0));

export const fmtPct = (a: number, b: number) => {
  if (!b) return null;
  return ((a - b) / b) * 100;
};
