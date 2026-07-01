import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "node:crypto";
import { getProvider } from "@/lib/communication/registry";

// Webhook inbound genérico: /api/public/hooks/communication/:provider/:settingsId
// - verifica HMAC SHA256 do raw body usando webhook_secret do settings
// - delega parseWebhook ao adapter para extrair updates de status
// - atualiza communication_queue por provider_message_id
export const Route = createFileRoute("/api/public/hooks/communication/$provider/$settingsId")({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        const raw = await request.text();
        const { provider: providerCode, settingsId } = params;

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: settings } = await supabaseAdmin
          .from("communication_settings")
          .select("id, provider_code, webhook_secret, restaurant_id")
          .eq("id", settingsId).maybeSingle();

        if (!settings || settings.provider_code !== providerCode) {
          return new Response("not found", { status: 404 });
        }

        // Verificação HMAC (opcional se webhook_secret não configurado).
        if (settings.webhook_secret) {
          const sigHeader =
            request.headers.get("x-hub-signature-256") ||
            request.headers.get("x-signature") ||
            request.headers.get("x-webhook-signature") || "";
          const provided = sigHeader.replace(/^sha256=/, "");
          const expected = createHmac("sha256", settings.webhook_secret).update(raw).digest("hex");
          const a = Buffer.from(provided, "hex");
          const b = Buffer.from(expected, "hex");
          if (a.length !== b.length || !timingSafeEqual(a, b)) {
            return new Response("invalid signature", { status: 401 });
          }
        }

        let provider;
        try { provider = getProvider(providerCode); }
        catch { return new Response("provider unknown", { status: 400 }); }

        const updates = provider.parseWebhook
          ? await provider.parseWebhook(request.headers, raw)
          : [];

        for (const u of updates) {
          const patch: Record<string, unknown> = {};
          if (u.status === "sent")      patch.status = "sent";
          if (u.status === "delivered") patch.status = "sent";
          if (u.status === "failed")    patch.status = "failed";
          if (Object.keys(patch).length === 0) continue;
          await supabaseAdmin
            .from("communication_queue")
            .update(patch)
            .eq("provider_message_id", u.provider_message_id);

          await supabaseAdmin.from("communication_logs").insert({
            restaurant_id: settings.restaurant_id, settings_id: settings.id,
            direction: "inbound", attempt: 0,
            status: u.status, raw_request: { body: raw.slice(0, 8000) } as any,
            error: u.error ?? null,
          });
        }

        return Response.json({ ok: true, processed: updates.length });
      },
    },
  },
});
