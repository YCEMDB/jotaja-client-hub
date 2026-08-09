export type IntegrityChainType = 'financial_ledger' | 'admin_audit' | 'security_events' | 'governance_audit';

export type IntegrityStatus = 'valid' | 'invalid' | 'broken' | 'incomplete' | 'not_verified';

export type ReconciliationFindingSeverity = 'info' | 'low' | 'medium' | 'high' | 'critical';

export type ReconciliationFindingStatus = 'open' | 'acknowledged' | 'investigating' | 'resolved' | 'false_positive' | 'ignored';

export interface IntegrityChain {
  id: string;
  restaurant_id: string | null;
  chain_type: IntegrityChainType;
  genesis_hash: string;
  algorithm: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  metadata: Record<string, any>;
}

export interface IntegrityRecord {
  id: string;
  chain_id: string;
  restaurant_id: string;
  entity_type: string;
  entity_id: string;
  payload_hash: string;
  previous_hash: string;
  current_hash: string;
  sequence_number: number;
  created_at: string;
  metadata: Record<string, any>;
}

export interface ReconciliationFinding {
  id: string;
  restaurant_id: string;
  check_type: string;
  entity_type: string;
  entity_id: string;
  severity: ReconciliationFindingSeverity;
  status: ReconciliationFindingStatus;
  divergence_data: Record<string, any>;
  expected_data?: Record<string, any>;
  actual_data?: Record<string, any>;
  correlation_id?: string;
  detected_at: string;
  resolved_at?: string;
  resolved_by?: string;
  resolution_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface VerificationResult {
  status: IntegrityStatus;
  error_details?: Record<string, any>;
  last_verified_sequence?: number;
  duration_ms?: number;
}
