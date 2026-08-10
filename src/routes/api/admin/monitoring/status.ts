import { createFileRoute } from '@tanstack/react-router';
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { FinancialMonitorService } from "@/lib/monitoring/financial-monitor.service";

export const Route = createFileRoute('/api/admin/monitoring/status')({
  server: {
    handlers: {
      GET: async ({ request, context }) => {
        // P0.5: Force authentication in API routes
        const authHeader = request.headers.get('Authorization');
        if (!authHeader) {
          return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        }

        
        try {
          const { data: providers } = await (supabaseAdmin.rpc as any)('get_providers_health_status');
          const { data: activeAlerts } = await (supabaseAdmin.from as any)('financial_alert_events')
            .select('*')
            .eq('status', 'OPEN');

          return new Response(JSON.stringify({
            status: activeAlerts?.length > 0 ? 'DEGRADED' : 'HEALTHY',
            providers: providers || [],
            active_alerts_count: activeAlerts?.length || 0,
            timestamp: new Date().toISOString()
          }), {
            headers: { 'Content-Type': 'application/json' }
          });
        } catch (error) {
          return new Response(JSON.stringify({ error: 'Failed to fetch monitoring status' }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }
    }
  }
});
