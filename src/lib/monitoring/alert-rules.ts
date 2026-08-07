import { AlertType, AlertSeverity } from "./monitoring-types";

export interface AlertRule {
  type: AlertType;
  severity: AlertSeverity;
  threshold: number;
  window_minutes: number;
  enabled: boolean;
  description: string;
}

export const ALERT_RULES: AlertRule[] = [
  {
    type: 'PROVIDER_FAILURE',
    severity: 'HIGH',
    threshold: 15, // > 15% failure rate in window
    window_minutes: 15,
    enabled: true,
    description: 'High failure rate from a specific payment provider'
  },
  {
    type: 'PAYMENT_FAILURE_SPIKE',
    severity: 'MEDIUM',
    threshold: 25, // > 25% failure rate global/restaurant
    window_minutes: 30,
    enabled: true,
    description: 'Significant spike in payment failures'
  },
  {
    type: 'SETTLEMENT_DELAY',
    severity: 'HIGH',
    threshold: 60, // Events pending for more than 60 minutes
    window_minutes: 60,
    enabled: true,
    description: 'Payments processed but not settled within expected timeframe'
  },
  {
    type: 'RECONCILIATION_DIVERGENCE',
    severity: 'CRITICAL',
    threshold: 1, // Any divergence is critical
    window_minutes: 1440,
    enabled: true,
    description: 'Financial divergence detected during reconciliation'
  },
  {
    type: 'PROCESSING_LATENCY',
    severity: 'MEDIUM',
    threshold: 5000, // > 5000ms average processing time
    window_minutes: 10,
    enabled: true,
    description: 'Average event processing latency is too high'
  }
];
