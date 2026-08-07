export interface PlatformFinancialOverview {
  total_restaurants: number;
  total_transactions: number;
  total_volume: number;
  success_rate: number;
  failure_rate: number;
  pending_events: number;
}

export interface ProviderHealthStatus {
  provider: string;
  events_received: number;
  failed_events: number;
  average_processing_time_ms: number;
  status: 'healthy' | 'degraded' | 'down';
}

export interface FinancialIncident {
  id: string;
  type: 'PAYMENT_FAILURE' | 'SETTLEMENT_DIVERGENCE' | 'WEBHOOK_ERROR' | 'ADVISORY_LOCK_TIMEOUT';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  restaurant_id: string;
  event_id?: string;
  details: any;
  status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED';
  created_at: string;
}

export interface AdminAuditLog {
  id: string;
  admin_id: string;
  action: string;
  target_resource: string;
  details: any;
  ip_address?: string;
  created_at: string;
}
