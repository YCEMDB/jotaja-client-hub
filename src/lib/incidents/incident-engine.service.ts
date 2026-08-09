import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { PlatformIncident, IncidentTimelineEvent } from "./incidents-types";

export class IncidentEngineService {
  static async createIncident(
    key: string,
    title: string,
    description: string,
    severity: 'SEV-1' | 'SEV-2' | 'SEV-3' | 'SEV-4',
    scope: 'GLOBAL' | 'TENANT',
    restaurant_id?: string,
    metadata: Record<string, any> = {}
  ): Promise<PlatformIncident> {
    const { data, error } = await supabaseAdmin
      .from('platform_incidents')
      .insert({
        incident_key: key,
        title,
        description,
        severity,
        affected_scope: scope,
        restaurant_id,
        metadata
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async addTimelineEvent(incidentId: string, type: string, message: string, metadata: Record<string, any> = {}): Promise<IncidentTimelineEvent> {
    const { data, error } = await supabaseAdmin
      .from('platform_incident_timeline')
      .insert({
        incident_id: incidentId,
        event_type: type,
        message,
        metadata
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}
