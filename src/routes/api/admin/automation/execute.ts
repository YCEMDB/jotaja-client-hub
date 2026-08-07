import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { AutomationWorkerService } from '@/lib/automation/automation-worker.service';
import { supabase } from '@/integrations/supabase/client';

export const Route = createFileRoute('/api/admin/automation/execute')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json();
          const { jobId } = z.object({ jobId: z.string() }).parse(body);

          const { data: job, error: fetchError } = await supabase
            .from('automation_jobs')
            .select('*')
            .eq('id', jobId)
            .single();

          if (fetchError || !job) {
            return new Response(JSON.stringify({ error: 'Job not found' }), { status: 404 });
          }

          await AutomationWorkerService.executeJob(job as any);

          return new Response(JSON.stringify({ success: true }), {
            headers: { 'Content-Type': 'application/json' }
          });
        } catch (err: any) {
          return new Response(JSON.stringify({ error: err.message }), { status: 400 });
        }
      }
    }
  }
});
