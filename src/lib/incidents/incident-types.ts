export type IncidentSeverity = 'SEV-1' | 'SEV-2' | 'SEV-3' | 'SEV-4';

export type IncidentStatus = 
  | 'DETECTED' 
  | 'ACKNOWLEDGED' 
  | 'INVESTIGATING' 
  | 'MITIGATING' 
  | 'RECOVERING' 
  | 'RESOLVED' 
  | 'CLOSED';

export interface PlatformIncident {
  id: string;
  incident_key: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  title: string;
  description: string;
  root_cause?: string;
  affected_scope: 'GLOBAL' | 'TENANT';
  restaurant_id?: string;
  started_at: string;
  acknowledged_at?: string;
  resolved_at?: string;
  closed_at?: string;
  created_at: string;
  updated_at: string;
  metadata: Record<string, any>;
}

export interface IncidentTimelineEvent {
  id: string;
  incident_id: string;
  event_type: string;
  message: string;
  metadata: Record<string, any>;
  created_at: string;
}
