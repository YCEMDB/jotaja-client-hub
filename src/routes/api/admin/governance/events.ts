import { createFileRoute } from '@tanstack/react-router';
import { GovernanceAuditService } from '@/lib/governance/governance-audit.service';

export const Route = createFileRoute('/api/admin/governance/events')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        // Validação de SuperAdmin omitida para brevidade do scaffold, 
        // mas deve estar no middleware de produção.
        
        const url = new URL(request.url);
        const limit = parseInt(url.searchParams.get('limit') || '50');
        const offset = parseInt(url.searchParams.get('offset') || '0');
        
        try {
          const events = await GovernanceAuditService.getEvents({ limit, offset });
          return new Response(JSON.stringify(events), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        } catch (error: any) {
          return new Response(JSON.stringify({ error: error.message }), { status: 500 });
        }
      }
    }
  }
});
