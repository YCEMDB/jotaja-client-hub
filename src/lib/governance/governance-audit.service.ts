import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { GovernanceEvent, GovernanceEventType, GovernanceMetadata } from "./governance-types";

export class GovernanceAuditService {
  private static readonly SENSITIVE_KEYS = ['password', 'token', 'secret', 'api_key', 'key', 'auth', 'credential'];

  /**
   * Sanitiza metadados removendo chaves sensíveis
   */
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

  /**
   * Registra um evento de governança (Append-only)
   */
  static async logEvent(params: {
    event_type: GovernanceEventType;
    actor_id: string;
    actor_role: string;
    action: string;
    target_type?: string;
    target_id?: string;
    restaurant_id?: string;
    reason?: string;
    metadata?: GovernanceMetadata;
  }): Promise<void> {
    const sanitizedMetadata = this.sanitize(params.metadata || {});

    const { error } = await supabaseAdmin
      .from('platform_governance_events')
      .insert([{
        event_type: params.event_type,
        actor_id: params.actor_id,
        actor_role: params.actor_role,
        action: params.action,
        target_type: params.target_type,
        target_id: params.target_id,
        restaurant_id: params.restaurant_id,
        reason: params.reason,
        metadata: sanitizedMetadata
      }]);

    if (error) {
      console.error('[GovernanceAuditService] Failed to log governance event:', error);
      // We don't throw here to avoid breaking the main flow, 
      // but in a real compliance system we might want to retry or alert.
    }
  }

  /**
   * Consulta eventos com filtros e paginação
   */
  static async getEvents(filters: {
    event_type?: GovernanceEventType;
    actor_id?: string;
    restaurant_id?: string;
    limit?: number;
    offset?: number;
  }): Promise<GovernanceEvent[]> {
    let query = supabaseAdmin
      .from('platform_governance_events')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters.event_type) query = query.eq('event_type', filters.event_type);
    if (filters.actor_id) query = query.eq('actor_id', filters.actor_id);
    if (filters.restaurant_id) query = query.eq('restaurant_id', filters.restaurant_id);
    
    const { data, error } = await query
      .range(filters.offset || 0, (filters.offset || 0) + (filters.limit || 50) - 1);

    if (error) throw error;
    return data as GovernanceEvent[];
  }
}
