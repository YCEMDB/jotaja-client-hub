import { SecurityAuditService } from "./security-audit.service";
import { ThreatCategory, ThreatSeverity } from "./security-types";

export class ThreatDetectionService {
  static async analyzeActivity(params: {
    category: ThreatCategory;
    actor_id?: string;
    restaurant_id?: string;
    endpoint: string;
    details: any;
  }) {
    // Basic heuristic: frequent failures in automation or auth
    const severity: ThreatSeverity = params.category === 'SECURITY_BRUTE_FORCE' ? 'HIGH' : 'MEDIUM';
    const risk_score = severity === 'HIGH' ? 8 : 4;

    await SecurityAuditService.logSecurityEvent({
      event_type: params.category,
      severity,
      risk_score,
      actor_id: params.actor_id,
      restaurant_id: params.restaurant_id,
      ip_hash: 'REDACTED_BY_ENGINE',
      endpoint: params.endpoint,
      metadata: params.details
    });
  }
}
