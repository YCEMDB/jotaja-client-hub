import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

export const getSecurityEvents = createServerFn({ method: "GET" })
  .input(z.object({
    limit: z.number().optional().default(50),
    offset: z.number().optional().default(0),
    type: z.string().optional()
  }))
  .handler(async ({ input }) => {
    let query = supabase
      .from('security_events')
      .select('*')
      .order('created_at', { ascending: false })
      .range(input.offset, input.offset + input.limit - 1);

    if (input.type) {
      query = query.eq('event_type', input.type);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  });

export const getSecurityStatus = createServerFn({ method: "GET" })
  .handler(async () => {
    const { data: events, error } = await supabase
      .from('security_events')
      .select('severity, status')
      .eq('status', 'PENDING');

    if (error) throw error;

    const criticalCount = events?.filter(e => e.severity === 'CRITICAL').length || 0;
    const highCount = events?.filter(e => e.severity === 'HIGH').length || 0;

    return {
      status: criticalCount > 0 ? 'CRITICAL' : highCount > 0 ? 'WARNING' : 'HEALTHY',
      pending_alerts: events?.length || 0,
      critical_threats: criticalCount
    };
  });
