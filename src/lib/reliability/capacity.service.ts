import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { CapacityStatus, CapacitySnapshot } from "./reliability-types";
import { AlertEngineService } from "../monitoring/alert-engine.service";

export class CapacityService {
  /**
   * Records a resource capacity snapshot
   */
  static async recordCapacity(snapshot: Omit<CapacitySnapshot, 'timestamp' | 'id'>): Promise<void> {
    const { error } = await (supabaseAdmin.from as any)('capacity_snapshots')
      .insert({
        ...snapshot,
        timestamp: new Date().toISOString()
      });

    if (error) {
      console.error('Error recording capacity snapshot:', error);
      return;
    }

    if (snapshot.status === 'SATURATED') {
      await AlertEngineService.processResults([{
        type: 'CAPACITY_SATURATION',
        severity: 'HIGH',
        metric_value: snapshot.current_load,
        threshold_value: snapshot.max_capacity || 0,
        details: {
          resource: snapshot.resource_type,
          headroom: snapshot.headroom_percentage
        }
      }]);
    }
  }

  /**
   * Calculates queue drain time and backlog status
   */
  static async analyzeQueue(
    queueName: string, 
    depth: number, 
    processingRatePerSec: number
  ): Promise<CapacityStatus> {
    if (processingRatePerSec <= 0) return 'UNKNOWN';
    
    const drainTimeSec = depth / processingRatePerSec;
    
    const status: CapacityStatus = drainTimeSec > 300 ? 'SATURATED' : 
                                   drainTimeSec > 60 ? 'GROWING' : 'NORMAL';

    await this.recordCapacity({
      resource_type: `QUEUE_${queueName}`,
      current_load: depth,
      max_capacity: processingRatePerSec * 60,
      headroom_percentage: Math.max(0, 100 - (depth / (processingRatePerSec * 60) * 100)),
      status,
      details: { drain_time_sec: drainTimeSec, rate_per_sec: processingRatePerSec }
    });

    return status;
  }
}
