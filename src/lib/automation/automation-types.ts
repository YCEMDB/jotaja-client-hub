export type AutomationJobType = 
  | 'FAILED_PROCESS_RECOVERY'
  | 'STALE_EVENT_RECOVERY'
  | 'PROVIDER_SYNC_RETRY'
  | 'RECONCILIATION_REVIEW';

export type AutomationJobStatus = 
  | 'PENDING'
  | 'VALIDATING'
  | 'RUNNING'
  | 'SUCCESS'
  | 'FAILED'
  | 'REQUIRES_REVIEW';

export type AutomationPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface AutomationJob {
  id: string;
  type: AutomationJobType;
  status: AutomationJobStatus;
  priority: AutomationPriority;
  restaurant_id?: string;
  source_incident_id?: string;
  attempts: number;
  max_attempts: number;
  payload: any;
  result?: any;
  error?: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  deduplication_key: string;
}

export interface AutomationExecutionLog {
  id: string;
  job_id: string;
  action: string;
  result: 'SUCCESS' | 'FAILED';
  details?: any;
  error?: string;
  created_at: string;
}

export interface AutomationRule {
  type: AutomationJobType;
  maxAttempts: number;
  enabled: boolean;
  requiresManualApproval: boolean;
  priority: AutomationPriority;
}
