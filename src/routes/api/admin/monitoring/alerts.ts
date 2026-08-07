import { createFileRoute } from '@tanstack/react-router';
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const Route = createFileRoute('/api/admin/monitoring/alerts')({
  server: {
    handlers: {
      GET: async () => {
        const { data, error } = await (supabaseAdmin.from as any)('financial_alert_events')
          .select('*')
          .eq('status', 'OPEN')
          .order('created_at', { ascending: false });

        if (error) return new Response(error.message, { status: 500 });

        return new Response(JSON.stringify(data), {
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
  }
});
