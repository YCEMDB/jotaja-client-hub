import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { RecoveryAction, RecoveryLevel } from "./recovery.types";

export class RecoveryService {
  static async startRecovery(
    incidentId: string,
    level: RecoveryLevel,
    actionType: string,
    payload: Record<string, any>,
    actorId: string
  ): Promise<RecoveryAction> {
    const { data, error } = await supabaseAdmin
      .from('recovery_execution_logs')
      .insert({
        incident_id: incidentId,
        recovery_level: level,
        action_type: actionType,
        status: 'RUNNING',
        payload,
        actor_id: actorId,
        executed_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async completeRecovery(recoveryId: string, status: 'SUCCESS' | 'FAILED', result: Record<string, any>): Promise<void> {
    const { error } = await supabaseAdmin
      .from('recovery_execution_logs')
      .update({
        status,
        result
      })
      .eq('id', recoveryId);

    if (error) throw error;
  }
}
