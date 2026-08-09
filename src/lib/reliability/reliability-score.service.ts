import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { ReliabilityStatus, ReliabilitySnapshot } from "./reliability-types";
import { SLIService } from "./sli.service";

export class ReliabilityScoreService {
  /**
   * Generates a reliability snapshot for the platform or a tenant
   */
  static async generateSnapshot(restaurantId?: string): Promise<ReliabilitySnapshot> {
    const availability = await SLIService.getAvailability('API', 1440, restaurantId);
    const latencyProfile = await SLIService.getLatencyProfile('API', 1440, restaurantId);
    
    const availabilityVal = availability === 'INSUFFICIENT_DATA' ? 100 : availability;
    const p95 = latencyProfile === 'INSUFFICIENT_DATA' ? 0 : latencyProfile.p95;

    let score: ReliabilityStatus = 'EXCELLENT';
    if (availabilityVal < 99) score = 'CRITICAL';
    else if (availabilityVal < 99.5) score = 'AT_RISK';
    else if (availabilityVal < 99.9 || p95 > 2000) score = 'DEGRADED';
    else if (availabilityVal < 99.95 || p95 > 1000) score = 'HEALTHY';

    const snapshotData: Omit<ReliabilitySnapshot, 'id'> = {
      scope: restaurantId ? 'TENANT' : 'GLOBAL',
      restaurant_id: restaurantId,
      reliability_score: score,
      availability_percentage: availabilityVal,
      latency_p95_ms: p95,
      error_rate_percentage: 100 - availabilityVal,
      error_budget_remaining: Math.max(0, availabilityVal - 99.9),
      timestamp: new Date().toISOString(),
      details: {
        latency_profile: latencyProfile
      }
    };

    const { data, error } = await (supabaseAdmin.from as any)('reliability_snapshots')
      .insert(snapshotData)
      .select()
      .single();

    if (error) console.error('Error saving reliability snapshot:', error);

    return (data as ReliabilitySnapshot) || (snapshotData as ReliabilitySnapshot);
  }
}
