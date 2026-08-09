import { supabase } from "@/integrations/supabase/client";
import { ThreatEvent, ThreatCategory, ThreatSeverity, ThreatStatus } from "./security-types";

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
    restaurant_id?: string;
    ip_hash: string;
    endpoint: string;
    metadata: Record<string, any>;
  }) {
    const { error } = await supabase.from('security_events').insert([{
      ...params,
      status: 'PENDING' as ThreatStatus,
      metadata: this.sanitize(params.metadata)
    }]);

    if (error) {
      console.error('[SecurityAuditService] Failed to log security event:', error);
    }
  }
}
