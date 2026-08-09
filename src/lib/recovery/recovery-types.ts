export type BackupStatus = 
  | 'EXPECTED'
  | 'CREATED'
  | 'AVAILABLE'
  | 'VERIFIED'
  | 'EXPIRED'
  | 'MISSING'
  | 'CORRUPTED'
  | 'FAILED';

export type ChecksumResult = 
  | 'VALID'
  | 'INVALID'
  | 'NOT_AVAILABLE'
  | 'NOT_VERIFIED';

export type RestoreDrillResult = 
  | 'PLANNED'
  | 'RUNNING'
  | 'PASSED'
  | 'FAILED'
  | 'CANCELLED'
  | 'NOT_VERIFIED';

export type ReadinessStatus = 
  | 'READY'
  | 'DEGRADED'
  | 'NOT_READY'
  | 'UNKNOWN';

export interface BackupRecord {
  id: string;
  restaurant_id?: string;
  external_id?: string;
  provider: string;
  source: string;
  scope: string;
  environment: string;
  created_at: string;
  completed_at?: string;
  size_bytes?: number;
  checksum?: string;
  status: BackupStatus;
  retention_until?: string;
  metadata: Record<string, any>;
  evidence: Record<string, any>;
}

export interface VerificationLog {
  id: string;
  backup_id: string;
  verified_at: string;
  status: BackupStatus;
  checksum_status: ChecksumResult;
  observed_checksum?: string;
  duration_ms?: number;
  error_message?: string;
  evidence: Record<string, any>;
  integrity_reference_id?: string;
}

export interface RestoreDrill {
  id: string;
  backup_id: string;
  environment: string;
  drill_type: string;
  started_at: string;
  completed_at?: string;
  operator_id?: string;
  result: RestoreDrillResult;
  observed_rpo_seconds?: number;
  observed_rto_seconds?: number;
  evidence: Record<string, any>;
  notes?: string;
  integrity_reference_id?: string;
}

export interface ReadinessSnapshot {
  id: string;
  measured_at: string;
  status: ReadinessStatus;
  readiness_score: number;
  details: Record<string, any>;
  restaurant_id?: string;
}
