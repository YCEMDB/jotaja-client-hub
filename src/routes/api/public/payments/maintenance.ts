import { createFileRoute } from "@tanstack/react-router";
import { processTokenMaintenance } from "@/lib/payments/token-manager.server";

export const Route = createFileRoute("/api/public/payments/maintenance")({
  server: {
    handlers: {
      /**
       * Endpoint de manutenção disparado por cron externo.
       * Deve ser chamado via POST.
       */
      POST: async ({ request }) => {
        const authHeader = request.headers.get("Authorization");
        const internalSecret = process.env["INTERNAL_MAINTENANCE_SECRET"];

        // Segurança: Verificar segredo interno se configurado
        if (internalSecret && authHeader !== `Bearer ${internalSecret}`) {
          return new Response("Unauthorized", { status: 401 });
        }

        try {
          const result = await processTokenMaintenance();
          return new Response(JSON.stringify(result), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch (error: any) {
          console.error("[maintenance-api] Job failed:", error);
          return new Response(
            JSON.stringify({ ok: false, error: error.message }),
            {
              status: 500,
              headers: { "Content-Type": "application/json" },
            }
          );
        }
      },
    },
  },
});
