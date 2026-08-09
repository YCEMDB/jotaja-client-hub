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
  description: string | null;
  root_cause?: string | null;
  affected_scope: 'GLOBAL' | 'TENANT';
  restaurant_id?: string | null;
  started_at: string;
  acknowledged_at?: string | null;
  resolved_at?: string | null;
  closed_at?: string | null;
  created_at: string;
  updated_at: string;
  metadata: any;
}

export interface IncidentTimelineEvent {
  id: string;
  incident_id: string;
  event_type: string;
  message: string;
  metadata: any;
  created_at: string;
}

