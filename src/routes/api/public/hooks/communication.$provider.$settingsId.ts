import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "node:crypto";
import { getProvider } from "@/lib/communication/registry";

// Webhook inbound genérico: /api/public/hooks/communication/:provider/:settingsId
// - verifica HMAC SHA256 do raw body usando webhook_secret do settings
// - delega parseWebhook (status) e parseInbound (mensagens) ao adapter
// - atualiza communication_queue por provider_message_id
// - insere mensagens recebidas em conversation_messages (Sprint 4.2)
export const Route = createFileRoute("/api/public/hooks/communication/$provider/$settingsId")({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        const raw = await request.text();
        const { provider: providerCode, settingsId } = params;

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: settings } = await supabaseAdmin
          .from("communication_settings")
          .select("id, provider_code, channel, webhook_secret, restaurant_id")
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

        // ---- 1) Status updates (outbound tracking) ----
        const statusUpdates = provider.parseWebhook
          ? await provider.parseWebhook(request.headers, raw)
          : [];

        for (const u of statusUpdates) {
          let nextStatus: "sent" | "failed" | null = null;
          if (u.status === "sent" || u.status === "delivered") nextStatus = "sent";
          else if (u.status === "failed") nextStatus = "failed";
          if (!nextStatus) continue;
          await supabaseAdmin
            .from("communication_queue")
            .update({ status: nextStatus })
            .eq("provider_message_id", u.provider_message_id);

          await supabaseAdmin.from("communication_logs").insert({
            restaurant_id: settings.restaurant_id, settings_id: settings.id,
            direction: "inbound", attempt: 0,
            status: u.status, raw_request: { body: raw.slice(0, 8000) } as any,
            error: u.error ?? null,
          });
        }

        // ---- 2) Inbound messages (Sprint 4.2) ----
        const inbound = provider.parseInbound
          ? await provider.parseInbound(request.headers, raw)
          : [];

        let insertedMessages = 0;
        for (const m of inbound) {
          // Dedup por provider_message_id
          if (m.provider_message_id) {
            const { data: existing } = await supabaseAdmin
              .from("conversation_messages")
              .select("id").eq("provider_message_id", m.provider_message_id).maybeSingle();
            if (existing) continue;
          }

          // Cria/localiza conversa via RPC (SECURITY DEFINER)
          const { data: convId, error: convErr } = await supabaseAdmin.rpc("find_or_create_conversation", {
            p_restaurant_id: settings.restaurant_id,
            p_channel: settings.channel,
            p_peer_address: m.from,
            p_provider_code: settings.provider_code,
            p_settings_id: settings.id,
            p_peer_name: m.from_name ?? undefined,
          });
          if (convErr || !convId) continue;

          // Tenta relacionar com o último pedido em aberto do telefone
          const { data: recentOrder } = await supabaseAdmin
            .from("orders")
            .select("id")
            .eq("restaurant_id", settings.restaurant_id)
            .eq("customer_phone", m.from)
            .in("status", ["pending","confirmed","preparing","ready","out_for_delivery"])
            .order("created_at", { ascending: false }).limit(1).maybeSingle();

          const { error: insErr } = await supabaseAdmin.from("conversation_messages").insert({
            conversation_id: convId as string,
            restaurant_id: settings.restaurant_id,
            direction: "inbound",
            source: "webhook",
            body: m.body,
            provider_message_id: m.provider_message_id ?? null,
            order_id: recentOrder?.id ?? null,
            status: "received",
            payload_raw: (m.raw ?? null) as any,
            payload_normalized: (m.normalized ?? null) as any,
          });
          if (!insErr) insertedMessages++;

          // Log de auditoria
          await supabaseAdmin.from("communication_logs").insert({
            restaurant_id: settings.restaurant_id, settings_id: settings.id,
            direction: "inbound", attempt: 0, status: "received",
            raw_request: { body: raw.slice(0, 8000) } as any,
          });
        }

        return Response.json({
          ok: true,
          status_updates: statusUpdates.length,
          inbound_messages: insertedMessages,
        });
      },
    },
  },
});
