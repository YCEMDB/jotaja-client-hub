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
    const { data: payments, error } = await supabase
      .from("financial_transactions")
      .select("amount")
      .eq("restaurant_id", restaurantId)
      .gte("created_at", startDate)
      .lte("created_at", endDate);

    if (error) throw new Error(`Failed to fetch financial transactions: ${error.message}`);

    const transactions = payments?.length || 0;
    const revenue = payments?.reduce((acc, curr) => acc + Number(curr.amount), 0) || 0;
    const averageTicket = transactions > 0 ? revenue / transactions : 0;

    // 2. Fetch payment attempts for rates (from processing logs)
    const { data: events, error: eventsError } = await supabase
      .from("payment_processing_logs")
      .select("status")
      .eq("restaurant_id", restaurantId)
      .gte("created_at", startDate)
      .lte("created_at", endDate);

    if (eventsError) throw new Error(`Failed to fetch processing logs: ${eventsError.message}`);

    const totalEvents = events?.length || 0;
    const paidEvents = events?.filter(e => e.status === 'PAID').length || 0;
    const failedEvents = events?.filter(e => e.status === 'FAILED').length || 0;

    const successfulRate = totalEvents > 0 ? (paidEvents / totalEvents) * 100 : 0;
    const failureRate = totalEvents > 0 ? (failedEvents / totalEvents) * 100 : 0;

    // 3. (Optional) Fetch previous period for growth comparison
    // Simplified for this implementation
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
