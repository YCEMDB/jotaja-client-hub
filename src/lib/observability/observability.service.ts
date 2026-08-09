import { HealthStatus, PlatformHealthOverview } from "./observability-types";
import { ProviderHealthService } from "../admin/provider-health.service";

export class ObservabilityService {
  static async getPlatformHealth(): Promise<PlatformHealthOverview> {
    // Reusing ProviderHealthService for dependencies
    const providers = await ProviderHealthService.getProvidersHealth();
    
    const dependencies = providers.map(p => ({
      name: p.provider,
      type: 'PAYMENT_PROVIDER' as const,
      status: (p.status.toUpperCase()) as HealthStatus,
      message: `Latency: ${p.average_processing_time_ms}ms`
    }));

    // Placeholder for other systems (to be implemented with real signals)
    const overall_status: HealthStatus = dependencies.some(d => d.status === 'CRITICAL') ? 'CRITICAL' :
                                         dependencies.some(d => d.status === 'DEGRADED') ? 'DEGRADED' : 'HEALTHY';

    return {
      overall_status,
      services: [
        {
          service: 'Core API',
          status: 'HEALTHY',
          last_checked: new Date().toISOString()
        }
      ],
      dependencies,
      timestamp: new Date().toISOString()
    };
  }
}
