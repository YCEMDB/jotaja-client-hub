import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { ProviderHealthStatus } from "./admin-types";

export class ProviderHealthService {
  /**
   * Analisa a saúde dos provedores baseada nos logs de webhooks e processamento
   */
  static async getProvidersHealth(): Promise<ProviderHealthStatus[]> {
    const { data, error } = await supabaseAdmin.rpc('get_providers_health_status');
    
    if (error) throw error;
    
    return data.map((p: any) => ({
      provider: p.provider,
      events_received: p.total_events || 0,
      failed_events: p.failed_events || 0,
      average_processing_time_ms: p.avg_duration_ms || 0,
      status: this.calculateStatus(p.failure_rate, p.avg_duration_ms)
    }));
  }

  private static calculateStatus(failureRate: number, avgDuration: number): 'healthy' | 'degraded' | 'down' {
    if (failureRate > 0.15) return 'down';
    if (failureRate > 0.05 || avgDuration > 5000) return 'degraded';
    return 'healthy';
  }
}
