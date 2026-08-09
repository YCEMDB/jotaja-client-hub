import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { IncidentEngineService } from "./incidents/incident-engine.service";
import { RecoveryService } from "./recovery/recovery.service";
import { ObservabilityService } from "./observability/observability.service";

export const getPlatformHealth = createServerFn({ method: "GET" })
  .handler(async () => {
    return ObservabilityService.getPlatformHealth();
  });

export const getIncidents = createServerFn({ method: "GET" })
  .handler(async () => {
    const { data, error } = await supabaseAdmin
      .from('platform_incidents')
      .select('*, platform_incident_timeline(*)')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  });

export const acknowledgeIncident = createServerFn({ method: "POST" })
  .input((data: { id: string }) => data)
  .handler(async ({ input }) => {
    const { id } = input;

    const { error } = await supabaseAdmin
      .from('platform_incidents')
      .update({
        status: 'ACKNOWLEDGED',
        acknowledged_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) throw error;


    await IncidentEngineService.addTimelineEvent(
      id,
      'INCIDENT_ACKNOWLEDGED',
      'Incident acknowledged by SuperAdmin'
    );

    
    return { success: true };
  });
