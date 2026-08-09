export type AlertType = 
  | 'PROVIDER_FAILURE' 
  | 'PAYMENT_FAILURE_SPIKE' 
  | 'SETTLEMENT_DELAY' 
  | 'RECONCILIATION_DIVERGENCE' 
  | 'PROCESSING_LATENCY'
  | 'PERFORMANCE_DEGRADATION'
  | 'CAPACITY_SATURATION';

export type AlertSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type AlertStatus = 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'SUPPRESSED';

export interface MonitoringResult {
  type: AlertType;
  severity: AlertSeverity;
  metric_value: number;
  threshold_value: number;
  details: Record<string, any>;
  restaurant_id?: string;
  provider?: string;
}

export interface FinancialAlertEvent {
  id: string;
  alert_type: AlertType;
  severity: AlertSeverity;
  status: AlertStatus;
  restaurant_id?: string;
  provider?: string;
  metric_value: number;
  threshold_value: number;
  details: Record<string, any>;
  deduplication_key: string;
  created_at: string;
  resolved_at?: string;
}
