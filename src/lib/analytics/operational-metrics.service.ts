import { supabase } from "@/integrations/supabase/client";
import { OperationalMetrics, OperationalMetricsSchema } from "./analytics-types";

/**
 * Service to calculate operational efficiency and behavioral metrics.
 */
export class OperationalMetricsService {
  /**
   * Retrieves operational behavior data.
   */
  static async getOperationalMetrics(
    restaurantId: string,
    days: number = 30
  ): Promise<OperationalMetrics> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateIso = startDate.toISOString();

    // 1. Basic volume from processed orders/payments
    const { data: txs, error } = await (supabase
      .from("financial_transactions" as any)
      .select("amount, created_at") as any)
      .eq("restaurant_id", restaurantId)
      .gte("created_at", startDateIso);

    if (error) throw new Error(`Failed to fetch operational data: ${error.message}`);

    const ordersCount = (txs as any[])?.length || 0;
    const paymentVolume = (txs as any[])?.reduce((acc: number, curr: any) => acc + Number(curr.amount), 0) || 0;
    const dailyAverage = days > 0 ? ordersCount / days : 0;

    // 2. Peak Hours Analysis (Simple hourly grouping)
    const hourCounts: Record<number, number> = {};
    (txs as any[])?.forEach(tx => {
      const hour = new Date(tx.created_at).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    const peakHours = Object.entries(hourCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => `${hour.padStart(2, '0')}:00`);

    // 3. Active Payment Methods (from accounts)
    const { data: accounts } = await (supabase
      .from("restaurant_payment_accounts" as any)
      .select("provider") as any)
      .eq("restaurant_id", restaurantId)
      .eq("status", "ACTIVE");

    const activePaymentMethods = Array.from(new Set((accounts as any[])?.map(a => a.provider) || []));

    return OperationalMetricsSchema.parse({
      restaurant_id: restaurantId,
      orders_count: ordersCount,
      payment_volume: paymentVolume,
      peak_hours: peakHours,
      daily_average: dailyAverage,
      active_payment_methods: activePaymentMethods,
    });
  }
}
