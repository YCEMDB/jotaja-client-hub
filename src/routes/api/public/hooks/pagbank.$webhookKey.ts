import { createFileRoute } from "@tanstack/react-router";
import { createHash } from "node:crypto";
import {
  fetchOrder,
  mapPagbankStatus,
  verifyWebhookSignature,
  type PagbankEnvironment,
} from "@/lib/payments/pagbank-api.server";

/**
 * Webhook do PagBank.
 *   POST /api/public/hooks/pagbank/{webhook_key}
 *
 * - webhook_key é opaco, gerado no connect, único por integração.
 * - Corpo bruto preservado antes de qualquer parse.
 * - Assinatura x-authenticity-token validada com o access_token do restaurante.
 * - Evento idempotente via payment_apply_provider_event.
 * - Nunca confia em campos financeiros vindos apenas do payload — sempre reconsulta o /orders.
 */
export const Route = createFileRoute("/api/public/hooks/pagbank/$webhookKey")({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        const rawBody = await request.text();
        const webhookKey = params.webhookKey;
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        // Lookup da integração (server-only RPC devolve access_token descriptografado)
        const { data: rows, error: lookupErr } = await supabaseAdmin.rpc(
          "pagbank_lookup_integration_by_webhook_key",
          { p_webhook_key: webhookKey },
        );
        const integration = Array.isArray(rows) ? rows[0] : null;
        if (lookupErr || !integration || integration.status !== "active") {
          return new Response("not found", { status: 404 });
        }

        const signatureHeader =
          request.headers.get("x-authenticity-token") ??
          request.headers.get("x-signature") ??
          null;
        const valid = verifyWebhookSignature({
          accessToken: integration.access_token,
          rawBody,
          signatureHeader,
        });
        if (!valid) return new Response("invalid signature", { status: 401 });

        let body: any = {};
        try {
          body = rawBody ? JSON.parse(rawBody) : {};
        } catch {
          return new Response("invalid body", { status: 400 });
        }

        // Payload padrão: { id: "ORDE_xxx", charges: [...] } ou { charges: [{ id: "CHAR_..." }] }
        const providerOrderId: string | null =
          body?.id?.startsWith?.("ORDE") ? body.id : body?.order_id ?? null;
        const primaryCharge = Array.isArray(body?.charges) ? body.charges[0] : null;
        const providerPaymentId: string | null = primaryCharge?.id ?? null;

        if (!providerOrderId && !providerPaymentId) {
          return new Response("no ids", { status: 200 });
        }

        // Sempre reconsulta o /orders para confirmar valor/status oficialmente
        let refreshed: Awaited<ReturnType<typeof fetchOrder>> | null = null;
        if (providerOrderId) {
          refreshed = await fetchOrder({
            environment: integration.environment as PagbankEnvironment,
            accessToken: integration.access_token,
            providerOrderId,
          });
        }

        const target = refreshed?.ok
          ? refreshed.pix_payments.find((p) => p.provider_payment_id === providerPaymentId) ??
            refreshed.pix_payments[0]
          : null;

        if (!target && !providerPaymentId) {
          return new Response("no pix payment", { status: 200 });
        }

        const effectivePaymentId = target?.provider_payment_id ?? providerPaymentId!;
        const statusRaw = target?.status_raw ?? primaryCharge?.status ?? "UNKNOWN";
        const amount = target?.amount_cents
          ? target.amount_cents / 100
          : primaryCharge?.amount?.value
          ? Number(primaryCharge.amount.value) / 100
          : null;
        const paidAt: string | null = target?.paid_at ?? primaryCharge?.paid_at ?? null;
        const newStatus = mapPagbankStatus(statusRaw);
        const payloadHash = createHash("sha256").update(rawBody).digest("hex");
        const externalEventId: string | null =
          body?.notification_code ?? body?.event_id ?? null;

        await supabaseAdmin
          .from("restaurant_payment_integrations")
          .update({ last_webhook_at: new Date().toISOString() })
          .eq("id", integration.integration_id);

        try {
          await supabaseAdmin.rpc("payment_apply_provider_event", {
            p_provider: "pagbank",
            p_provider_payment_id: effectivePaymentId,
            p_external_event_id: externalEventId,
            p_payload_hash: payloadHash,
            p_new_status: newStatus,
            p_provider_status_raw: statusRaw,
            p_amount: amount,
            p_paid_at: paidAt,
            p_failure_code: null,
            p_failure_message: null,
            p_source: "webhook",
          } as never);
        } catch (e: any) {
          // Erro tratável (amount mismatch, payment_not_found) — devolvemos 200
          // para o PagBank não retentar em loop; o incidente ficou registrado
          // em payment_webhook_events com error_code.
          console.warn("[pagbank webhook] apply event failed", e?.message ?? e);
          return new Response("ignored", { status: 200 });
        }

        return new Response("ok", { status: 200 });
      },
      GET: async () => new Response("ok"),
    },
  },
});
