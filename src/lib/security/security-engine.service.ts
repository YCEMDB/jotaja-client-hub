import { RateLimitService } from "./rate-limit.service";
import { ThreatDetectionService } from "./threat-detection.service";
import { ThreatCategory } from "./security-types";

export class SecurityEngine {
  static async validateRequest(params: {
    ip: string;
    endpoint: string;
    actor_id?: string;
    actor_role?: string;
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

  static async reportThreat(params: {
    category: ThreatCategory;
    actor_id?: string;
    actor_role?: string;
    restaurant_id?: string;
    endpoint: string;
    details: any;
  }) {
    return ThreatDetectionService.analyzeActivity(params);
  }
}
