import { RateLimitService } from "./rate-limit.service";
import { ThreatDetectionService } from "./threat-detection.service";
import { SecurityAuditService } from "./security-audit.service";

export class SecurityEngine {
  static async validateRequest(params: {
    ip: string;
    endpoint: string;
    actor_id?: string;
    restaurant_id?: string;
    type: 'DEFAULT' | 'ADMIN' | 'WEBHOOK' | 'AUTH';
  }) {
    const rateLimit = await RateLimitService.checkLimit({
      key: params.ip,
      endpoint: params.endpoint,
      type: params.type,
      actor_id: params.actor_id,
      restaurant_id: params.restaurant_id
    });

    if (!rateLimit.allowed) {
      return {
        allowed: false,
        reason: 'RATE_LIMIT_EXCEEDED',
        retryAfter: 60
      };
    }

    return { allowed: true };
  }

  static async reportThreat(params: Parameters<typeof ThreatDetectionService.analyzeActivity>[0]) {
    return ThreatDetectionService.analyzeActivity(params);
  }
}
