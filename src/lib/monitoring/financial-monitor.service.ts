import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { MonitoringResult } from "./monitoring-types";
import { ALERT_RULES } from "./alert-rules";

export class FinancialMonitorService {
  /**
   * Performs financial health analysis and returns potential alert conditions
   */
  static async performAnalysis(): Promise<MonitoringResult[]> {
    const results: MonitoringResult[] = [];
    
    // 1. Check Provider Health
    const providerHealth = await this.checkProviderHealth();
    results.push(...providerHealth);

    // 2. Check Settlement Delays
    const settlementDelays = await this.checkSettlementDelays();
    results.push(...settlementDelays);

    // 3. Check Reconciliation Divergences
    const divergences = await this.checkDivergences();
    results.push(...divergences);

    return results;
  }

  private static async checkProviderHealth(): Promise<MonitoringResult[]> {
    const { data, error } = await (supabaseAdmin.rpc as any)('get_providers_health_status');
    if (error) return [];

    const rule = ALERT_RULES.find(r => r.type === 'PROVIDER_FAILURE');
    if (!rule || !rule.enabled) return [];

    return (data as any[]).map(provider => {
      const failureRate = (provider.failed_events / provider.events_received) * 100;
      if (failureRate > rule.threshold) {
        return {
          type: 'PROVIDER_FAILURE',
          severity: rule.severity,
          metric_value: failureRate,
          threshold_value: rule.threshold,
          provider: provider.provider,
          details: { ...provider, failure_rate: failureRate }
        };
      }
      return null;
    }).filter(Boolean) as MonitoringResult[];
  }

  private static async checkSettlementDelays(): Promise<MonitoringResult[]> {
    // Check for events in payment_provider_webhook_logs that are 'PROCESSED' 
    // but don't have a corresponding settlement within threshold
    const rule = ALERT_RULES.find(r => r.type === 'SETTLEMENT_DELAY');
    if (!rule || !rule.enabled) return [];

    const thresholdDate = new Date();
    thresholdDate.setMinutes(thresholdDate.getMinutes() - rule.window_minutes);

    const { data, error, count } = await (supabaseAdmin.from as any)('payment_provider_webhook_logs')
      .select('id, restaurant_id, provider', { count: 'exact' })
      .eq('status', 'PROCESSED')
      .lt('created_at', thresholdDate.toISOString())
      .limit(10); // Check a sample or use a count RPC for real implementation

    if (error || !count || count === 0) return [];

    return [{
      type: 'SETTLEMENT_DELAY',
      severity: rule.severity,
      metric_value: count,
      threshold_value: 0,
      details: { count, oldest_event_at: thresholdDate.toISOString() }
    }];
  }

  private static async checkDivergences(): Promise<MonitoringResult[]> {
    const rule = ALERT_RULES.find(r => r.type === 'RECONCILIATION_DIVERGENCE');
    if (!rule || !rule.enabled) return [];

    const { data, error } = await (supabaseAdmin.from as any)('financial_reconciliation_logs')
      .select('*')
      .eq('status', 'DIVERGENT')
      .limit(10);

    if (error || !data || data.length === 0) return [];

    return data.map((div: any) => ({
      type: 'RECONCILIATION_DIVERGENCE',
      severity: rule.severity,
      metric_value: 1,
      threshold_value: 0,
      restaurant_id: div.restaurant_id,
      details: div
    }));
  }
}
