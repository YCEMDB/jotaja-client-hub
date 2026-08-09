import { SecurityAuditService } from "./security-audit.service";

export interface RateLimitConfig {
  windowMs: number;
  max: number;
}

export class RateLimitService {
  private static store = new Map<string, { count: number; resetAt: number }>();
  
  private static CONFIGS: Record<string, RateLimitConfig> = {
    DEFAULT: { windowMs: 60000, max: 100 },
    ADMIN: { windowMs: 60000, max: 50 },
    WEBHOOK: { windowMs: 60000, max: 300 },
    AUTH: { windowMs: 60000, max: 10 }
  };

  static async checkLimit(params: {
    key: string;
    endpoint: string;
    type: keyof typeof RateLimitService.CONFIGS;
    actor_id?: string;
    restaurant_id?: string;
  }): Promise<{ allowed: boolean; remaining: number }> {
    const config = this.CONFIGS[params.type] || this.CONFIGS.DEFAULT;
    const now = Date.now();
    const storeKey = `${params.type}:${params.key}:${params.endpoint}`;
    
    let record = this.store.get(storeKey);
    
    if (!record || now > record.resetAt) {
      record = { count: 0, resetAt: now + config.windowMs };
    }
    
    record.count++;
    this.store.set(storeKey, record);

    const allowed = record.count <= config.max;
    
    if (!allowed && record.count === config.max + 1) {
      await SecurityAuditService.logSecurityEvent({
        event_type: 'SECURITY_RATE_LIMIT',
        severity: 'MEDIUM',
        risk_score: 5,
        actor_id: params.actor_id,
        restaurant_id: params.restaurant_id,
        ip_hash: 'REDACTED_BY_ENGINE',
        endpoint: params.endpoint,
        metadata: {
          limit: config.max,
          windowMs: config.windowMs,
          count: record.count,
          type: params.type
        }
      });
    }

    return {
      allowed,
      remaining: Math.max(0, config.max - record.count)
    };
  }
}
