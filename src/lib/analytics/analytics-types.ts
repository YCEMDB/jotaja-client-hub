import { z } from "zod";

export const FinancialMetricsSchema = z.object({
  restaurant_id: z.string().uuid(),
  period_start: z.string(),
  period_end: z.string(),
  revenue: z.number(),
  transactions: z.number(),
  average_ticket: z.number(),
  growth_percentage: z.number().optional(),
  successful_rate: z.number(),
  failure_rate: z.number(),
});

export type FinancialMetrics = z.infer<typeof FinancialMetricsSchema>;

export const OperationalMetricsSchema = z.object({
  restaurant_id: z.string().uuid(),
  orders_count: z.number(),
  payment_volume: z.number(),
  peak_hours: z.array(z.string()),
  daily_average: z.number(),
  active_payment_methods: z.array(z.string()),
});

export type OperationalMetrics = z.infer<typeof OperationalMetricsSchema>;

export const PerformanceRankingSchema = z.object({
  restaurant_id: z.string().uuid(),
  metric: z.string(),
  value: z.number(),
  rank: z.number(),
  total_peers: z.number(),
});

export type PerformanceRanking = z.infer<typeof PerformanceRankingSchema>;
