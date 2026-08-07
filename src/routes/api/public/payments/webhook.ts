import { createFileRoute } from '@tanstack/react-router';
import { handlePaymentWebhook } from '@/lib/payments/webhook-handler.server';

export const Route = createFileRoute('/api/public/payments/webhook')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // 1. Limite de Payload (256KB)
        const contentLength = parseInt(request.headers.get('content-length') || '0');
        if (contentLength > 256 * 1024) {
          return new Response('Payload Too Large', { status: 413 });
        }

        const url = new URL(request.url);
        const provider = url.searchParams.get('provider') || 'mercadopago';
        
        try {
          const body = await request.text();
          
          // Capturar headers para auditoria
          const headers: Record<string, string> = {};
          request.headers.forEach((value, key) => {
            headers[key] = value;
          });

          // 2. Pipeline de Processamento (Webhook Handler)
          const result = await handlePaymentWebhook(provider, body, headers);

          return new Response(JSON.stringify({ 
            message: result.message,
            log_id: result.logId 
          }), {
            status: result.status,
            headers: { 'Content-Type': 'application/json' }
          });

        } catch (err) {
          console.error('[webhook-route] Error processing webhook:', err);
          return new Response('Internal Server Error', { status: 500 });
        }
      }
    }
  }
});
