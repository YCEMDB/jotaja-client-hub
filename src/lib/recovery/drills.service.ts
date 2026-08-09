import { supabase } from "@/integrations/supabase/client";
import { RestoreDrill, RestoreDrillResult } from "./recovery-types";
import { integrityService } from "../integrity/integrity.service";

export class DrillsService {
  async registerDrill(data: Partial<RestoreDrill>): Promise<RestoreDrill> {
    const { data: record, error } = await supabase
      .from("restore_drills")
      .insert({
        backup_id: data.backup_id!,
        environment: data.environment || "SANDBOX",
        drill_type: data.drill_type || "RESTORE_TEST",
        operator_id: data.operator_id,
        result: data.result || "PLANNED",
        evidence: data.evidence || {},
        notes: data.notes,
        observed_rpo_seconds: data.observed_rpo_seconds,
        observed_rto_seconds: data.observed_rto_seconds,
      })
      .select()
      .single();

    if (error) throw error;
    return record as unknown as RestoreDrill;
  }

  async updateDrillResult(drillId: string, result: RestoreDrillResult, metrics: { 
    rto?: number; 
    rpo?: number;
    evidence?: Record<string, any>;
  }): Promise<void> {
    const { data: drill, error } = await supabase
      .from("restore_drills")
      .update({
        result,
        completed_at: new Date().toISOString(),
        observed_rto_seconds: metrics.rto,
        observed_rpo_seconds: metrics.rpo,
        evidence: metrics.evidence || {},
      })
      .eq("id", drillId)
      .select()
      .single();

    if (error) throw error;

    // Phase 17 Integration
    if (result === "PASSED") {
      try {
        await integrityService.recordIntegrity({
          entity_type: "restore_drill",
          entity_id: drillId,
          payload: {
            drill_id: drillId,
            result,
            rto: metrics.rto,
            rpo: metrics.rpo
          }
        });
      } catch (err) {
        console.error("Failed to record drill integrity:", err);
      }
    }
  }
}

export const drillsService = new DrillsService();
