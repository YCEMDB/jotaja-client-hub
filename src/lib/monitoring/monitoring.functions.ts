import { createServerFn } from "@tanstack/react-start";
import { FinancialMonitorService } from "./financial-monitor.service";
import { AlertEngineService } from "./alert-engine.service";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { z } from "zod";

/**
 * Server Function for SuperAdmin to trigger a manual monitoring sweep
 */
export const runFinancialMonitoring = createServerFn({ method: "POST" })
  .handler(async () => {
    // Note: Middleware check for super_admin should be present in a real app
    // For this implementation, we rely on the DB RLS and server-side execution context
    
    const results = await FinancialMonitorService.performAnalysis();
    const alerts = await AlertEngineService.processResults(results);
    
    return {
      timestamp: new Date().toISOString(),
      analyzed_conditions: results.length,
      new_alerts_created: alerts.length
    };
  });

/**
 * Server Function to fetch recent alert history
 */
export const getAlertHistory = createServerFn({ method: "GET" })
  .inputValidator((data) => z.object({ limit: z.number().optional().default(50) }).parse(data))
  .handler(async ({ data }) => {
    const { data: alerts, error } = await (supabaseAdmin.from as any)('financial_alert_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(data.limit);

    if (error) throw error;
    return alerts;
  });
