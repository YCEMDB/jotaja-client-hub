import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { SLIService } from "./sli.service";
import { SLODefinition, ServiceName } from "./reliability-types";
import { AlertEngineService } from "../monitoring/alert-engine.service";

export class SLOService {
  /**
   * Evaluates all enabled SLOs
   */
  static async evaluateSLOs(): Promise<void> {
    const { data: slos, error } = await (supabaseAdmin.from as any)('slo_definitions')
      .select('*')
      .eq('is_enabled', true);

    if (error || !slos) return;

    for (const slo of slos as SLODefinition[]) {
      await this.evaluateSLO(slo);
    }
  }

  private static async evaluateSLO(slo: SLODefinition): Promise<void> {
    const windowMinutes = slo.window_days * 24 * 60;
    
    let actualValue: number | 'INSUFFICIENT_DATA';

    if (slo.metric_name.includes('LATENCY')) {
      const profile = await SLIService.getLatencyProfile(slo.service as ServiceName, 60);
      if (profile === 'INSUFFICIENT_DATA') return;
      
      if (slo.metric_name === 'LATENCY_P95') actualValue = profile.p95;
      else if (slo.metric_name === 'LATENCY_P99') actualValue = profile.p99;
      else actualValue = profile.p50;
    } else {
      actualValue = await SLIService.getAvailability(slo.service as ServiceName, 60);
    }

    if (actualValue === 'INSUFFICIENT_DATA') return;

    const isBreached = this.checkBreach(slo, actualValue);

    if (isBreached) {
      await AlertEngineService.processResults([{
        type: 'PERFORMANCE_DEGRADATION',
        severity: (slo.severity as any) === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
        metric_value: actualValue,
        threshold_value: slo.target_value,
        details: {
          slo_name: slo.name,
          service: slo.service,
          metric: slo.metric_name,
          breach_type: 'SLO_VIOLATION'
        }
      }]);
    }
  }

  private static checkBreach(slo: SLODefinition, actual: number): boolean {
    if (slo.metric_name.includes('LATENCY')) {
      return actual > slo.target_value;
    }
    return actual < slo.target_value;
  }
}
