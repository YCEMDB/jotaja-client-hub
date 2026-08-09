import { supabase } from "@/integrations/supabase/client";
import { ReadinessSnapshot, ReadinessStatus } from "./recovery-types";
import { inventoryService } from "./inventory.service";

export class ReadinessService {
  /**
   * Calculate and record current recovery readiness.
   */
  async measureReadiness(restaurantId?: string): Promise<ReadinessSnapshot> {
    // 1. Fetch recent backups
    const backups = await inventoryService.listBackups(10);
    const recentVerifiedBackups = backups.filter(b => b.status === 'VERIFIED');
    
    // 2. Simple heuristic for readiness
    let score = 0;
    let status: ReadinessStatus = 'NOT_READY';
    const details: Record<string, any> = {
      total_backups_scanned: backups.length,
      verified_backups: recentVerifiedBackups.length,
    };

    if (recentVerifiedBackups.length > 0) {
      score += 50;
      status = 'DEGRADED';
    }

    // Check freshness (e.g. at least one backup in last 24h)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const hasFreshBackup = recentVerifiedBackups.some(b => new Date(b.created_at) > oneDayAgo);
    
    if (hasFreshBackup) {
      score += 50;
      status = 'READY';
    }

    details.has_fresh_backup = hasFreshBackup;
    details.readiness_score = score;

    const { data: snapshot, error } = await supabase
      .from("recovery_readiness_snapshots")
      .insert({
        status,
        readiness_score: score,
        details,
        restaurant_id: restaurantId
      })
      .select()
      .single();

    if (error) throw error;

    // Send signals to Phase 11 (Monitoring) if not ready
    if (status !== 'READY') {
      // Logic to trigger alerts would go here
      console.warn(`[RECOVERY ALERT] Readiness is ${status} with score ${score}`);
    }

    return snapshot as unknown as ReadinessSnapshot;
  }
}

export const readinessService = new ReadinessService();
