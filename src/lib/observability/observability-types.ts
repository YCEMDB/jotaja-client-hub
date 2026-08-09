export type HealthStatus = 'HEALTHY' | 'DEGRADED' | 'WARNING' | 'CRITICAL' | 'UNKNOWN';

export interface ServiceHealth {
  service: string;
  status: HealthStatus;
  latency_ms?: number;
  error_rate?: number;
  last_checked: string;
  details?: Record<string, any>;
}

export interface DependencyHealth {
  name: string;
  type: 'DATABASE' | 'PAYMENT_PROVIDER' | 'WEBHOOK_GATEWAY' | 'WORKER' | 'MONITORING' | 'AUTOMATION' | 'SECURITY';
  status: HealthStatus;
  message?: string;
}

export interface PlatformHealthOverview {
  overall_status: HealthStatus;
  services: ServiceHealth[];
  dependencies: DependencyHealth[];
  timestamp: string;
}

export interface ObservabilityMetrics {
  availability: number; // percentage
  throughput: number; // requests per second/minute
  error_count: number;
  avg_latency_ms: number;
}
