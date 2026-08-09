import { GovernanceAuditService } from "./governance-audit.service";
import { GovernanceEventType } from "./governance-types";

export class ChangeTrackingService {
  /**
   * Registra uma alteração com rastreamento de delta
   */
  static async trackChange(params: {
    actor_id: string;
    actor_role: string;
    event_type: GovernanceEventType;
    action: string;
    target_type: string;
    target_id: string;
    before: any;
    after: any;
    restaurant_id?: string;
    reason?: string;
  }): Promise<void> {
    const delta = this.calculateDelta(params.before, params.after);
    
    // Se não houve alteração real, não registramos delta, mas registramos a tentativa se necessário
    // Aqui assumimos que se chamou trackChange, algo mudou ou deve ser auditado.

    await GovernanceAuditService.logEvent({
      event_type: params.event_type,
      actor_id: params.actor_id,
      actor_role: params.actor_role,
      action: params.action,
      target_type: params.target_type,
      target_id: params.target_id,
      restaurant_id: params.restaurant_id,
      reason: params.reason,
      metadata: {
        delta: {
          before: params.before,
          after: params.after,
          changes: delta
        }
      }
    });
  }

  /**
   * Calcula a diferença entre dois estados (raso)
   */
  private static calculateDelta(before: any, after: any): any {
    if (!before || !after) return after;
    
    const changes: any = {};
    const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);
    
    for (const key of allKeys) {
      if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
        changes[key] = {
          from: before[key],
          to: after[key]
        };
      }
    }
    
    return changes;
  }
}
