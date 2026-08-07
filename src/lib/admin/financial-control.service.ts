import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { PlatformFinancialOverview, FinancialIncident } from "./admin-types";

export class FinancialControlService {
  /**
   * Obtém a visão financeira global da plataforma
   * Apenas para SuperAdmin
   */
  static async getPlatformOverview(): Promise<PlatformFinancialOverview> {
    const { data, error } = await (supabaseAdmin.rpc as any)('get_platform_financial_metrics');
    
    if (error) throw error;
    const metrics = data as any;

    return {
      total_restaurants: Number(metrics.total_restaurants || 0),
      total_transactions: Number(metrics.total_transactions || 0),
      total_volume: Number(metrics.total_volume || 0),
      success_rate: Number(metrics.success_rate || 0),
      failure_rate: Number(metrics.failure_rate || 0),
      pending_events: Number(metrics.pending_events || 0)
    };
  }

  /**
   * Lista incidentes financeiros críticos
   */
  static async getFinancialIncidents(limit = 50): Promise<FinancialIncident[]> {
    const { data, error } = await (supabaseAdmin.from as any)('financial_incidents')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data as FinancialIncident[];
  }
}
