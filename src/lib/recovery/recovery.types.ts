export type RecoveryLevel = 'LEVEL-0' | 'LEVEL-1' | 'LEVEL-2' | 'LEVEL-3' | 'LEVEL-4';

export interface RecoveryAction {
  id: string;
  incident_id: string | null;
  recovery_level: RecoveryLevel;
  action_type: string;
  status: string;
  payload: any;
  result?: any;
  actor_id: string | null;
  executed_at?: string | null;
  created_at: string;
}


export interface BackupIntegrityCheck {
  id: string;
  backup_id: string;
  status: 'PASS' | 'FAIL' | 'BLOCKED';
  duration_ms: number;
  integrity_score: number;
  notes?: string;
  created_at: string;
}

export interface RecoveryCapabilities {
  rpo_target_minutes: number;
  rpo_verified_minutes?: number;
  rto_target_minutes: number;
  rto_verified_minutes?: number;
  last_restore_test?: string;
}
