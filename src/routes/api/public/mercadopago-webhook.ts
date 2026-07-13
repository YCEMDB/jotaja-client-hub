import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { createHmac, createHash, timingSafeEqual } from "node:crypto";

/**
 * Webhook Mercado Pago — agora escreve no módulo canônico order_payments
 * via RPC payment_apply_provider_event. Mantém compat com pedidos antigos
 * cujo pagamento ainda não foi backfilled (raro): tenta criar order_payment
 * pending sob demanda a partir de orders.mp_payment_id.
 */
function verifyMpSignature(request: Request, _rawBody: string, paymentId: string | null): boolean {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret) return true;
  const header = request.headers.get("x-signature") ?? "";
  const requestId = request.headers.get("x-request-id") ?? "";
  const parts = Object.fromEntries(
    header.split(",").map((p) => p.split("=").map((s) => s.trim())) as [string, string][],
  );
  const ts = parts.ts;
  const v1 = parts.v1;
  if (!ts || !v1 || !paymentId) return false;
  const manifest = `id:${paymentId};request-id:${requestId};ts:${ts};`;
  const expected = createHmac("sha256", secret).update(manifest).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(v1);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function mapMpStatus(status: string): "waiting" | "paid" | "failed" | "refunded" | "canceled" {
  switch (status) {
    case "approved":
      return "paid";
    case "rejected":
      return "failed";
    case "cancelled":
      return "canceled";
    case "refunded":
      return "refunded";
    default:
      return "waiting";
  }
}

export const Route = createFileRoute("/api/public/mercadopago-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const rawBody = await request.text();
          const body = rawBody ? (() => { try { return JSON.parse(rawBody); } catch { return {} as any; } })() : ({} as any);
          const url = new URL(request.url);
          const paymentId =
            body?.data?.id ?? body?.id ?? url.searchParams.get("id") ?? url.searchParams.get("data.id");
          const type = body?.type ?? url.searchParams.get("type") ?? url.searchParams.get("topic");
          if (!paymentId || (type && type !== "payment")) return new Response("ignored", { status: 200 });
          if (!verifyMpSignature(request, rawBody, String(paymentId)))
            return new Response("invalid signature", { status: 401 });

          // Resolve o restaurante pelo pagamento
          const { data: order } = await supabaseAdmin
            .from("orders")
            .select("id, restaurant_id, total, payment_status")
            .eq("mp_payment_id", String(paymentId))
            .maybeSingle();
          if (!order) return new Response("order not found", { status: 200 });

          const { data: tokenData } = await supabaseAdmin.rpc("admin_get_restaurant_mp_token", {
            p_restaurant_id: order.restaurant_id,
          });
          const mpToken = (tokenData as string | null) ?? null;
          if (!mpToken) return new Response("no token", { status: 200 });

          const mp = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
            headers: { Authorization: `Bearer ${mpToken}` },
          });

          const payment: any = await mp.json();
          if (!mp.ok) return new Response("mp fetch failed", { status: 200 });

          const status = String(payment?.status ?? "");
          const newStatus = mapMpStatus(status);
          const amount = Number(payment?.transaction_amount ?? order.total);
          const paidAt = payment?.date_approved ?? null;

          // Garante linha canônica em order_payments (backfill just-in-time se necessário)
          const { data: existing } = await supabaseAdmin
            .from("order_payments")
            .select("id")
            .eq("provider", "mercado_pago")
            .eq("provider_payment_id", String(paymentId))
            .maybeSingle();
          if (!existing) {
            await supabaseAdmin.rpc("payment_create_pending", {
              p_order_id: order.id,
              p_provider: "mercado_pago",
              p_provider_payment_id: String(paymentId),
              p_provider_order_id: null,
              p_amount: Number(order.total),
              p_currency: "BRL",
              p_method: "pix",
              p_qr_text: null,
              p_qr_image_url: null,
              p_expires_at: null,
              p_reference_id: `order:${order.id}`,
              p_idempotency_key: `mp-legacy-${paymentId}`,
            } as never);
          }

          const payloadHash = createHash("sha256").update(rawBody || String(paymentId)).digest("hex");

          try {
            await supabaseAdmin.rpc("payment_apply_provider_event", {
              p_provider: "mercado_pago",
              p_provider_payment_id: String(paymentId),
              p_external_event_id: String(body?.id ?? paymentId),
              p_payload_hash: payloadHash,
              p_new_status: newStatus,
              p_provider_status_raw: status,
              p_amount: amount,
              p_paid_at: paidAt,
              p_failure_code: null,
              p_failure_message: null,
              p_source: "webhook",
            } as never);
          } catch (e: any) {
            console.warn("[mp webhook] canonical apply failed", e?.message ?? e);
          }

          return new Response("ok", { status: 200 });
        } catch (e) {
          console.error("webhook error", e);
          return new Response("error", { status: 200 });
        }
      },
      GET: async () => new Response("ok"),
    },
  },
});
