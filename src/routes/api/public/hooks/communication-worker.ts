import { createFileRoute } from "@tanstack/react-router";
import { processCommunicationQueue } from "@/lib/communication/worker.functions";

// Trigger externo do worker. Autorizado por header `apikey` = SUPABASE_ANON_KEY.
// Chamado on-demand pelo painel admin ou por cron externo se configurado.
export const Route = createFileRoute("/api/public/hooks/communication-worker")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apikey = request.headers.get("apikey") ?? request.headers.get("x-apikey") ?? "";
        const expected = process.env.SUPABASE_ANON_KEY ?? process.env.SUPABASE_PUBLISHABLE_KEY ?? "";
        if (!expected || apikey !== expected) {
          return new Response(JSON.stringify({ error: "unauthorized" }), {
            status: 401, headers: { "Content-Type": "application/json" },
          });
        }
        const result = await processCommunicationQueue({ data: { batchSize: 20, workerId: "hook" } });
        return Response.json(result);
      },
      GET: async () => Response.json({ ok: true, hint: "POST with apikey header" }),
    },
  },
});
