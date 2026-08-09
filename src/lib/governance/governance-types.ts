export type GovernanceEventType =
  | 'ADMIN_LOGIN'
  | 'ADMIN_PERMISSION_CHANGE'
  | 'ADMIN_CONFIGURATION_CHANGE'
  | 'ADMIN_FINANCIAL_ACTION'
  | 'ADMIN_AUTOMATION_ACTION'
  | 'ADMIN_PROVIDER_ACTION'
  | 'ADMIN_SECURITY_ACTION'
  | 'ADMIN_DATA_ACCESS'
  | 'ADMIN_DATA_EXPORT'
  | 'ADMIN_ROLE_CHANGE'
  | 'SYSTEM_CONFIGURATION_CHANGE';

export interface GovernanceEvent {
  id: string;
  event_type: GovernanceEventType;
  actor_id: string;
  actor_role: string;
  target_type?: string;
  target_id?: string;
  restaurant_id?: string;
  action: string;
  reason?: string;
  metadata: GovernanceMetadata;
  created_at: string;
}

export interface GovernanceMetadata {
  delta?: {
    before: any;
    after: any;
    changes?: any;
  };
  ip?: string;
  user_agent?: string;
  [key: string]: any;
}

export interface RetentionPolicy {
  event_type: GovernanceEventType;
  retention_days: number;
  classification: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED';
}
