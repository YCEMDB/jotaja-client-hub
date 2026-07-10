import { supabase } from "@/integrations/supabase/client";
import { toZonedTime, fromZonedTime, formatInTimeZone } from "date-fns-tz";

export type PeriodPreset =
  | "today"
  | "yesterday"
  | "7d"
  | "30d"
  | "this_month"
  | "last_month"
  | "custom";

export type DashboardRange = {
  from: Date;
  to: Date; // exclusive
  prevFrom: Date;
  prevTo: Date; // exclusive
  label: string;
  comparisonLabel: string;
};

export type DashboardSummary = {
  timezone: string;
  from: string;
  to: string;
  prev_from: string;
  prev_to: string;
  current: {
    revenue: number;
    orders_count: number;
    avg_ticket: number;
    total_orders: number;
    cancelled_count: number;
    cancellation_rate: number;
  };
  previous: {
    revenue: number;
    orders_count: number;
    avg_ticket: number;
    total_orders: number;
    cancelled_count: number;
    cancellation_rate: number;
  };
  daily: Array<{ day: string; orders: number; revenue: number }>;
  by_channel: Array<{ name: string; value: number; revenue: number }>;
  by_payment: Array<{ name: string; value: number; revenue: number }>;
  generated_at: string;
};

/** Returns the start-of-day in the given timezone as a UTC Date. */
function tzStartOfDay(date: Date, tz: string): Date {
  const y = Number(formatInTimeZone(date, tz, "yyyy"));
  const m = Number(formatInTimeZone(date, tz, "MM"));
  const d = Number(formatInTimeZone(date, tz, "dd"));
  // Build the "wall time" 00:00 in tz, convert to UTC.
  const wall = new Date(Date.UTC(y, m - 1, d, 0, 0, 0));
  return fromZonedTime(
    `${wall.getUTCFullYear()}-${String(wall.getUTCMonth() + 1).padStart(2, "0")}-${String(
      wall.getUTCDate(),
    ).padStart(2, "0")} 00:00:00`,
    tz,
  );
}

function addDays(d: Date, days: number): Date {
  const n = new Date(d);
  n.setUTCDate(n.getUTCDate() + days);
  return n;
}

function addMonths(d: Date, months: number, tz: string): Date {
  const y = Number(formatInTimeZone(d, tz, "yyyy"));
  const m = Number(formatInTimeZone(d, tz, "MM")) - 1 + months;
  const day = Number(formatInTimeZone(d, tz, "dd"));
  const targetY = y + Math.floor(m / 12);
  const targetM = ((m % 12) + 12) % 12;
  const wallStr = `${targetY}-${String(targetM + 1).padStart(2, "0")}-${String(day).padStart(2, "0")} 00:00:00`;
  return fromZonedTime(wallStr, tz);
}

export function buildRange(
  preset: PeriodPreset,
  tz: string,
  custom?: { from?: Date; to?: Date },
): DashboardRange {
  const now = new Date();
  const todayStart = tzStartOfDay(now, tz);
  const tomorrowStart = addDays(todayStart, 1);

  let from: Date;
  let to: Date;
  let prevFrom: Date | null = null;
  let prevTo: Date | null = null;
  let label = "";
  let comparisonLabel = "período anterior";

  switch (preset) {
    case "today": {
      from = todayStart;
      to = tomorrowStart;
      label = "Hoje";
      comparisonLabel = "vs ontem";
      break;
    }
    case "yesterday": {
      to = todayStart;
      from = addDays(todayStart, -1);
      label = "Ontem";
      comparisonLabel = "vs anteontem";
      break;
    }
    case "7d": {
      from = addDays(todayStart, -6);
      to = tomorrowStart;
      label = "Últimos 7 dias";
      comparisonLabel = "vs 7 dias anteriores";
      break;
    }
    case "30d": {
      from = addDays(todayStart, -29);
      to = tomorrowStart;
      label = "Últimos 30 dias";
      comparisonLabel = "vs 30 dias anteriores";
      break;
    }
    case "this_month": {
      // First day of current month in tz; end = tomorrow (exclusive, includes today)
      const y = Number(formatInTimeZone(now, tz, "yyyy"));
      const m = Number(formatInTimeZone(now, tz, "MM"));
      from = fromZonedTime(`${y}-${String(m).padStart(2, "0")}-01 00:00:00`, tz);
      to = tomorrowStart;
      // Comparison: SAME number of days elapsed in previous month.
      // e.g. Jul 1..10 → Jun 1..10 (not Jun 21..30)
      const prevMonthStart = addMonths(from, -1, tz);
      const elapsedDays = Math.round((to.getTime() - from.getTime()) / 86400000);
      prevFrom = prevMonthStart;
      prevTo = addDays(prevMonthStart, elapsedDays);
      label = "Mês atual";
      comparisonLabel = "vs mesmos dias do mês anterior";
      break;
    }
    case "last_month": {
      const y = Number(formatInTimeZone(now, tz, "yyyy"));
      const m = Number(formatInTimeZone(now, tz, "MM"));
      const startThis = fromZonedTime(`${y}-${String(m).padStart(2, "0")}-01 00:00:00`, tz);
      from = addMonths(startThis, -1, tz);
      to = startThis;
      label = "Mês anterior";
      comparisonLabel = "vs 2 meses atrás";
      break;
    }
    case "custom":
    default: {
      const cf = custom?.from ?? todayStart;
      const ct = custom?.to ?? now;
      from = tzStartOfDay(cf, tz);
      to = addDays(tzStartOfDay(ct, tz), 1);
      label = "Período personalizado";
      comparisonLabel = "vs período anterior equivalente";
      break;
    }
  }

  if (!prevFrom || !prevTo) {
    const durationMs = to.getTime() - from.getTime();
    prevTo = from;
    prevFrom = new Date(from.getTime() - durationMs);
  }

  return { from, to, prevFrom, prevTo, label, comparisonLabel };
}


export async function fetchDashboardSummary(
  restaurantId: string,
  range: DashboardRange,
): Promise<DashboardSummary> {
  const { data, error } = await supabase.rpc("get_dashboard_summary", {
    p_restaurant_id: restaurantId,
    p_from: range.from.toISOString(),
    p_to: range.to.toISOString(),
    p_prev_from: range.prevFrom.toISOString(),
    p_prev_to: range.prevTo.toISOString(),
  } as never);
  if (error) throw error;
  return data as unknown as DashboardSummary;
}

/** Percent change with defensive handling of zeros / missing data. */
export function pctChange(current: number, previous: number): {
  value: number | null;
  direction: "up" | "down" | "flat" | "na";
  display: string;
} {
  if (!Number.isFinite(current) || !Number.isFinite(previous)) {
    return { value: null, direction: "na", display: "—" };
  }
  if (previous === 0 && current === 0) return { value: 0, direction: "flat", display: "0%" };
  if (previous === 0) return { value: null, direction: "up", display: "novo" };
  const diff = ((current - previous) / Math.abs(previous)) * 100;
  const dir = diff > 0.5 ? "up" : diff < -0.5 ? "down" : "flat";
  const sign = diff > 0 ? "+" : "";
  return { value: diff, direction: dir, display: `${sign}${diff.toFixed(1)}%` };
}

export function formatBRL(v: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);
}

export function formatDayBR(iso: string, tz: string): string {
  // iso is "YYYY-MM-DD"
  const [y, m, d] = iso.split("-").map(Number);
  const wall = new Date(Date.UTC(y, m - 1, d));
  return formatInTimeZone(wall, tz, "dd/MM");
}

export function toZoned(d: Date, tz: string): Date {
  return toZonedTime(d, tz);
}
