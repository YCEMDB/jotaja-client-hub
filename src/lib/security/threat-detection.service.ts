import { SecurityAuditService } from "./security-audit.service";
import { ThreatCategory, ThreatSeverity } from "./security-types";

export class ThreatDetectionService {
  /**
   * Analisa atividade suspeita e gera eventos de segurança com scoring.
   */
  static async analyzeActivity(params: {
    category: ThreatCategory;
    actor_id?: string;
    actor_role?: string;
    restaurant_id?: string;
    endpoint: string;
    details: any;
  }) {
    let severity: ThreatSeverity = 'MEDIUM';
    let risk_score = 5;

    // Lógica de scoring baseada na categoria
    switch (params.category) {
      case 'SECURITY_BRUTE_FORCE':
      case 'SECURITY_SUSPICIOUS_ADMIN':
      case 'SECURITY_TENANT_ANOMALY':
        severity = 'HIGH';
        risk_score = 8;
        break;
      case 'SECURITY_WEBHOOK_ABUSE':
      case 'SECURITY_API_ABUSE':
        severity = 'MEDIUM';
        risk_score = 6;
        break;
      case 'SECURITY_RATE_LIMIT':
        severity = 'LOW';
        risk_score = 3;
        break;
    }

    // Aumenta score se houver repetição (simulado aqui, real seria via query)
    if (params.details?.attempts > 10) {
      severity = 'CRITICAL';
      risk_score = 10;
    }

    await SecurityAuditService.logSecurityEvent({
      event_type: params.category,
      severity,
      risk_score,
      actor_id: params.actor_id,
      actor_role: params.actor_role,
      restaurant_id: params.restaurant_id,
      ip_hash: 'REDACTED_BY_ENGINE', // Em produção seria um hash do IP
      endpoint: params.endpoint,
      metadata: params.details
    });
  }
}
