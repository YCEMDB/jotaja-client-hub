import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const Route = createFileRoute("/api/public/mercadopago-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json().catch(() => ({} as any));
          // MP sends: { type: "payment", data: { id: "..." } } or topic=payment&id=...
          const url = new URL(request.url);
          const paymentId =
            body?.data?.id ?? body?.id ?? url.searchParams.get("id") ?? url.searchParams.get("data.id");
          const type = body?.type ?? url.searchParams.get("type") ?? url.searchParams.get("topic");

          if (!paymentId || (type && type !== "payment")) {
            return new Response("ignored", { status: 200 });
          }

          // Find order by mp_payment_id to get the restaurant token
          const { data: order } = await supabaseAdmin
            .from("orders")
            .select("id, restaurant_id, payment_status")
            .eq("mp_payment_id", String(paymentId))
            .maybeSingle();

          if (!order) return new Response("order not found", { status: 200 });

          const { data: rest } = await supabaseAdmin
            .from("restaurants")
            .select("mp_access_token")
            .eq("id", order.restaurant_id)
            .maybeSingle();

          if (!rest?.mp_access_token) return new Response("no token", { status: 200 });

          const res = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
            headers: { Authorization: `Bearer ${rest.mp_access_token}` },
          });
          const payment: any = await res.json();
          if (!res.ok) return new Response("mp fetch failed", { status: 200 });

          const status = payment?.status as string;
          let payment_status: "paid" | "failed" | "refunded" | "pending" | "expired" = "pending";
          if (status === "approved") payment_status = "paid";
          else if (status === "rejected" || status === "cancelled") payment_status = "failed";
          else if (status === "refunded") payment_status = "refunded";

          await supabaseAdmin
            .from("orders")
            .update({
              payment_status,
              paid_at: payment_status === "paid" ? new Date().toISOString() : null,
            })
            .eq("id", order.id);

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
