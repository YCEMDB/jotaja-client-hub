import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { ReliabilityScoreService } from "./reliability/reliability-score.service";
import { SLIService } from "./reliability/sli.service";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const getReliabilityOverview = createServerFn({ method: "GET" })
  .handler(async () => {
    return await ReliabilityScoreService.generateSnapshot();
  });

export const getPerformanceMetrics = createServerFn({ method: "GET" })
  .inputValidator((data) => z.object({ 
    service: z.enum(['API', 'WEBHOOK', 'PROCESSOR', 'SETTLEMENT', 'DATABASE', 'PROVIDER']),
    windowMinutes: z.number().default(60)
  }).parse(data))
  .handler(async ({ data }) => {
    const latency = await SLIService.getLatencyProfile(data.service, data.windowMinutes);
    const availability = await SLIService.getAvailability(data.service, data.windowMinutes);
    
    return {
      service: data.service,
      latency,
      availability,
      timestamp: new Date().toISOString()
    };
  });

export const getCapacityStatus = createServerFn({ method: "GET" })
  .handler(async () => {
    const { data, error } = await (supabaseAdmin.from as any)('capacity_snapshots')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(10);
    
    return (data as any[]) || [];
  });

export const getRecommendations = createServerFn({ method: "GET" })
  .handler(async () => {
    const { data, error } = await (supabaseAdmin.from as any)('performance_recommendations')
      .select('*')
      .eq('status', 'PENDING')
      .order('priority', { ascending: false });
    
    return (data as any[]) || [];
  });
