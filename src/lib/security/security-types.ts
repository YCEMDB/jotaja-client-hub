export type ThreatCategory = 
  | 'SECURITY_RATE_LIMIT'
  | 'SECURITY_BRUTE_FORCE'
  | 'SECURITY_API_ABUSE'
  | 'SECURITY_SUSPICIOUS_ADMIN'
  | 'SECURITY_TENANT_ANOMALY'
  | 'SECURITY_WEBHOOK_ABUSE'
  | 'SECURITY_AUTOMATION_ABUSE';

export type ThreatSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ThreatStatus = 'PENDING' | 'INVESTIGATING' | 'RESOLVED' | 'FALSE_POSITIVE';

export interface ThreatEvent {
  id: string;
  event_type: ThreatCategory;
  severity: ThreatSeverity;
  risk_score: number;
  actor_id?: string;
  restaurant_id?: string;
  ip_hash: string;
  endpoint: string;
  metadata: Record<string, any>;
  status: ThreatStatus;
  created_at: string;
}
