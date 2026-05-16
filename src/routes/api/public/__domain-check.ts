import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Health/marker endpoint used by the custom-domain verification flow.
 * The verifier hits https://<custom-domain>/__domain-check; if this app
 * answers, we know DNS points here. The response body and header carry
 * the host being checked so we can confirm the right project responded.
 */
export const Route = createFileRoute("/api/public/__domain-check")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const host = (request.headers.get("host") ?? "").toLowerCase().split(":")[0];
        let knownSlug: string | null = null;
        if (host) {
          const { data } = await supabaseAdmin
            .from("restaurants")
            .select("slug")
            .ilike("custom_domain", host)
            .limit(1)
            .maybeSingle();
          knownSlug = data?.slug ?? null;
        }
        return new Response(
          `__comandahub_marker__ host=${host} slug=${knownSlug ?? ""}`,
          {
            status: 200,
            headers: {
              "content-type": "text/plain; charset=utf-8",
              "x-comandahub-domain": host,
              "cache-control": "no-store",
            },
          },
        );
      },
    },
  },
});
