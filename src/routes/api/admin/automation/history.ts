import { createFileRoute } from '@tanstack/react-router';
import { supabase } from '@/integrations/supabase/client';

export const Route = createFileRoute('/api/admin/automation/history')({
  server: {
    handlers: {
      GET: async () => {
        const { data, error } = await supabase
          .from('automation_execution_logs')
          .select('*, job:automation_jobs(*)')
          .order('created_at', { ascending: false })
          .limit(100);

        if (error) {
          return new Response(JSON.stringify({ error: error.message }), { status: 500 });
        }

        return new Response(JSON.stringify(data), {
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
  }
});
