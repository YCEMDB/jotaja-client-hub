export type MetricType = 'LATENCY' | 'THROUGHPUT' | 'ERROR_RATE' | 'SATURATION' | 'AVAILABILITY' | 'SUCCESS_RATE';
export type ServiceName = 'API' | 'WEBHOOK' | 'PROCESSOR' | 'SETTLEMENT' | 'DATABASE' | 'PROVIDER';
export type ReliabilityStatus = 'EXCELLENT' | 'HEALTHY' | 'DEGRADED' | 'AT_RISK' | 'CRITICAL';
export type CapacityStatus = 'NORMAL' | 'GROWING' | 'SATURATED' | 'UNKNOWN';
export type RecommendationPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface PerformanceMetric {
  id?: string;
  metric_name: string;
  metric_type: MetricType;
  service_name: ServiceName;
  value: number;
  unit: string;
  scope: 'GLOBAL' | 'TENANT';
  restaurant_id?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface SLODefinition {
  id: string;
  name: string;
  service: ServiceName;
  metric_name: string;
  target_value: number;
  window_days: number;
  severity: 'LOW' | 'MEDIUM' | 'WARNING' | 'CRITICAL';
  is_enabled: boolean;
}

export interface ReliabilitySnapshot {
  id?: string;
  scope: 'GLOBAL' | 'TENANT';
  restaurant_id?: string;
  reliability_score: ReliabilityStatus;
  availability_percentage: number;
  latency_p95_ms: number;
  error_rate_percentage: number;
  error_budget_remaining: number;
  timestamp: string;
  details: Record<string, any>;
}

export interface CapacitySnapshot {
  id?: string;
  resource_type: string;
  current_load: number;
  peak_load?: number;
  max_capacity?: number;
  headroom_percentage?: number;
  status: CapacityStatus;
  timestamp: string;
  details: Record<string, any>;
}

export interface PerformanceRecommendation {
  id?: string;
  type: string;
  priority: RecommendationPriority;
  evidence: Record<string, any>;
  impact_description: string;
  status: 'PENDING' | 'APPLIED' | 'DISMISSED' | 'OBSOLETE';
  created_at: string;
}

export interface LatencyProfile {
  p50: number;
  p75: number;
  p90: number;
  p95: number;
  p99: number;
  count: number;
}
