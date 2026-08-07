import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { MonitoringResult, FinancialAlertEvent, AlertStatus } from "./monitoring-types";
import { createHash } from "crypto";

export class AlertEngineService {
  /**
   * Processes monitoring results and creates/updates alerts with idempotency
   */
  static async processResults(results: MonitoringResult[]): Promise<FinancialAlertEvent[]> {
    const alerts: FinancialAlertEvent[] = [];

    for (const result of results) {
      const deduplicationKey = this.generateDeduplicationKey(result);
      
      // Check for existing OPEN alert with same key within a window (e.g., 24h)
      const { data: existing } = await (supabaseAdmin.from as any)('financial_alert_events')
        .select('*')
        .eq('deduplication_key', deduplicationKey)
        .eq('status', 'OPEN')
        .maybeSingle();

      if (existing) {
        // Update existing alert if necessary or just skip to avoid spam
        continue;
      }

      // Create new alert
      const { data: newAlert, error } = await (supabaseAdmin.from as any)('financial_alert_events')
        .insert({
          alert_type: result.type,
          severity: result.severity,
          status: 'OPEN',
          restaurant_id: result.restaurant_id,
          provider: result.provider,
          metric_value: result.metric_value,
          threshold_value: result.threshold_value,
          details: result.details,
          deduplication_key: deduplicationKey
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating alert:', error);
        continue;
      }

      alerts.push(newAlert);
      
      // Also register as a Financial Incident for Phase 10 visibility
      await (supabaseAdmin.from as any)('financial_incidents').insert({
        type: this.mapToIncidentType(result.type),
        severity: result.severity,
        restaurant_id: result.restaurant_id || 'PLATFORM',
        details: { ...result.details, alert_id: newAlert.id },
        status: 'OPEN'
      });
    }

    return alerts;
  }

  private static generateDeduplicationKey(result: MonitoringResult): string {
    const raw = `${result.type}-${result.provider || 'ALL'}-${result.restaurant_id || 'PLATFORM'}`;
    return createHash('sha256').update(raw).digest('hex');
  }

  private static mapToIncidentType(alertType: string): string {
    switch (alertType) {
      case 'PROVIDER_FAILURE': return 'WEBHOOK_ERROR';
      case 'RECONCILIATION_DIVERGENCE': return 'SETTLEMENT_DIVERGENCE';
      default: return 'PAYMENT_FAILURE';
    }
  }
}
