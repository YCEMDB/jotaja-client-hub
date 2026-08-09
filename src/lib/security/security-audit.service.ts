import { supabase } from "@/integrations/supabase/client";
import { ThreatCategory, ThreatSeverity, ThreatStatus } from "./security-types";
import { GovernanceAuditService } from "@/lib/governance/governance-audit.service";

export class SecurityAuditService {
  private static SENSITIVE_KEYS = ['password', 'token', 'api_key', 'secret', 'authorization', 'cookie'];

  private static sanitize(data: any): any {
    if (!data || typeof data !== 'object') return data;
    const sanitized = Array.isArray(data) ? [...data] : { ...data };
    for (const key in sanitized) {
      if (this.SENSITIVE_KEYS.some(k => key.toLowerCase().includes(k))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof sanitized[key] === 'object') {
        sanitized[key] = this.sanitize(sanitized[key]);
      }
    }
    return sanitized;
  }

  static async logSecurityEvent(params: {
    event_type: ThreatCategory;
    severity: ThreatSeverity;
    risk_score: number;
    actor_id?: string;
    actor_role?: string;
    restaurant_id?: string;
    ip_hash: string;
    endpoint: string;
    metadata: Record<string, any>;
  }) {
    const sanitizedMetadata = this.sanitize(params.metadata);
    
    // Log directly via supabase object to bypass type checking for the new table
    const { error } = await (supabase.from('security_events' as any) as any).insert([{
      event_type: params.event_type,
      severity: params.severity,
      risk_score: params.risk_score,
      actor_id: params.actor_id,
      restaurant_id: params.restaurant_id,
      ip_hash: params.ip_hash,
      endpoint: params.endpoint,
      metadata: sanitizedMetadata,
      status: 'PENDING' as ThreatStatus
    }]);

    if (error) {
      console.error('[SecurityAuditService] Failed to log security event:', error);
    }

    if (params.actor_id && params.actor_role) {
      await GovernanceAuditService.logEvent({
        event_type: 'ADMIN_SECURITY_ACTION',
        actor_id: params.actor_id,
        actor_role: params.actor_role,
        action: `SECURITY_EVENT_GENERATED: ${params.event_type}`,
        restaurant_id: params.restaurant_id,
        metadata: {
          severity: params.severity,
          risk_score: params.risk_score,
          endpoint: params.endpoint,
          event_type: params.event_type
        }
      });
    }
  }
}
