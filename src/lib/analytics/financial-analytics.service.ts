import { supabase } from "@/integrations/supabase/client";
import { FinancialMetrics, FinancialMetricsSchema } from "./analytics-types";

/**
 * Service to calculate and retrieve financial metrics from processed payment events.
 * Only consumes data from finalized/processed state.
 */
export class FinancialAnalyticsService {
  /**
   * Calculates financial summary for a restaurant within a date range.
   */
  static async getFinancialSummary(
    restaurantId: string,
    startDate: string,
    endDate: string
  ): Promise<FinancialMetrics> {
    // 1. Fetch processed payments volume and count
    const { data: payments, error } = await (supabase
      .from("financial_transactions" as any)
      .select("amount") as any)
      .eq("restaurant_id", restaurantId)
      .gte("created_at", startDate)
      .lte("created_at", endDate);

    if (error) throw new Error(`Failed to fetch financial transactions: ${error.message}`);

    const paymentsArray = (payments as any[]) || [];
    const transactions = paymentsArray.length;
    const revenue = paymentsArray.reduce((acc: number, curr: any) => acc + Number(curr.amount), 0);
    const averageTicket = transactions > 0 ? revenue / transactions : 0;

    // 2. Fetch payment attempts for rates (from processing logs)
    const { data: events, error: eventsError } = await (supabase
      .from("payment_processing_logs" as any)
      .select("status") as any)
      .eq("restaurant_id", restaurantId)
      .gte("created_at", startDate)
      .lte("created_at", endDate);

    if (eventsError) throw new Error(`Failed to fetch processing logs: ${eventsError.message}`);

    const eventsArray = (events as any[]) || [];
    const totalEvents = eventsArray.length;
    const paidEvents = eventsArray.filter((e: any) => e.status === 'PAID').length;
    const failedEvents = eventsArray.filter((e: any) => e.status === 'FAILED').length;

    const successfulRate = totalEvents > 0 ? (paidEvents / totalEvents) * 100 : 0;
    const failureRate = totalEvents > 0 ? (failedEvents / totalEvents) * 100 : 0;

    // 3. (Optional) Fetch previous period for growth comparison
    const growthPercentage = 0; 

    return FinancialMetricsSchema.parse({
      restaurant_id: restaurantId,
      period_start: startDate,
      period_end: endDate,
      revenue,
      transactions,
      average_ticket: averageTicket,
      growth_percentage: growthPercentage,
      successful_rate: successfulRate,
      failure_rate: failureRate,
    });
  }
}
