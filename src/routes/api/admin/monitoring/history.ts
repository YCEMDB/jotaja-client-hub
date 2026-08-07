import { createFileRoute } from '@tanstack/react-router';
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const Route = createFileRoute('/api/admin/monitoring/history')({
  server: {
    handlers: {
      GET: async () => {
        const { data, error } = await (supabaseAdmin.from as any)('financial_alert_events')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100);

        if (error) return new Response(error.message, { status: 500 });

        return new Response(JSON.stringify(data), {
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
  }
});
