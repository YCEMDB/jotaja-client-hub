import { createFileRoute } from '@tanstack/react-router';
import { supabase } from '@/integrations/supabase/client';

export const Route = createFileRoute('/api/admin/security/events')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { data, error } = await supabase
          .from('security_events')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) return new Response(error.message, { status: 500 });
        return new Response(JSON.stringify(data), {
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
  }
});
