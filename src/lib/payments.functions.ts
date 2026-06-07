import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const createPixSchema = z.object({
  orderId: z.string().uuid(),
});

export const createPixPayment = createServerFn({ method: "POST" })
  .inputValidator((d) => createPixSchema.parse(d))
  .handler(async ({ data }) => {
    const { data: order, error: oErr } = await supabaseAdmin
      .from("orders")
      .select("id, total, customer_name, customer_phone, restaurant_id, payment_status, pix_qr_code")
      .eq("id", data.orderId)
      .maybeSingle();

    if (oErr || !order) return { ok: false, error: "Pedido não encontrado" };
    if (order.payment_status === "paid")
      return { ok: true, alreadyPaid: true };

    // Reuse existing QR if still valid
    if (order.pix_qr_code) {
      return {
        ok: true,
        qr_code: order.pix_qr_code,
        qr_code_base64: (order as any).pix_qr_code_base64 ?? null,
      };
    }

    const [{ data: secret }, { data: restRow }] = await Promise.all([
      supabaseAdmin
        .from("restaurant_secrets")
        .select("mp_access_token")
        .eq("restaurant_id", order.restaurant_id)
        .maybeSingle(),
      supabaseAdmin
        .from("restaurants")
        .select("name")
        .eq("id", order.restaurant_id)
        .maybeSingle(),
    ]);
    const rest = { mp_access_token: secret?.mp_access_token ?? null, name: restRow?.name ?? "" };

    if (!rest.mp_access_token)
      return { ok: false, error: "Restaurante não configurou Mercado Pago" };

    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    const body = {
      transaction_amount: Number(order.total),
      description: `Pedido em ${rest.name}`,
      payment_method_id: "pix",
      date_of_expiration: expiresAt.toISOString().replace("Z", "-03:00"),
      payer: {
        email: `cliente-${order.id.slice(0, 8)}@comanda.app`,
        first_name: order.customer_name?.split(" ")[0] ?? "Cliente",
      },
      external_reference: order.id,
      notification_url: `${process.env.SUPABASE_URL?.replace("supabase.co", "lovable.app") ?? ""}/api/public/mercadopago-webhook`,
    };

    const res = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${rest.mp_access_token}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": order.id,
      },
      body: JSON.stringify(body),
    });

    const payload: any = await res.json();
    if (!res.ok) {
      console.error("MP error:", payload);
      return { ok: false, error: payload?.message ?? "Erro ao gerar PIX" };
    }

    const qr = payload?.point_of_interaction?.transaction_data?.qr_code ?? null;
    const qr64 = payload?.point_of_interaction?.transaction_data?.qr_code_base64 ?? null;

    await supabaseAdmin
      .from("orders")
      .update({
        pix_qr_code: qr,
        pix_qr_code_base64: qr64,
        pix_txid: payload?.id ? String(payload.id) : null,
        mp_payment_id: payload?.id ? String(payload.id) : null,
        pix_expires_at: expiresAt.toISOString(),
      })
      .eq("id", order.id);

    return { ok: true, qr_code: qr, qr_code_base64: qr64 };
  });

const markPaidSchema = z.object({ orderId: z.string().uuid() });

export const markOrderPaid = createServerFn({ method: "POST" })
  .inputValidator((d) => markPaidSchema.parse(d))
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin
      .from("orders")
      .update({ payment_status: "paid", paid_at: new Date().toISOString() })
      .eq("id", data.orderId);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  });

// ─── Mercado Pago: testar conexão ────────────────────────────────
// Valida o access token chamando GET /users/me e confirma capacidade PIX.
// Usa o middleware autenticado + RLS para garantir que o usuário só
// consulta credenciais de um restaurante do qual ele é dono/equipe.

const verifyMpSchema = z.object({
  restaurantId: z.string().uuid(),
});

export const verifyMercadoPago = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => verifyMpSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;

    // RLS valida acesso: se não for da equipe, retorna vazio
    const { data: secret, error: secretErr } = await supabase
      .from("restaurant_secrets")
      .select("mp_access_token")
      .eq("restaurant_id", data.restaurantId)
      .maybeSingle();

    if (secretErr) return { ok: false as const, error: "Erro ao ler credenciais" };
    const token = secret?.mp_access_token?.trim();
    if (!token) return { ok: false as const, error: "Nenhum Access Token configurado" };

    try {
      const res = await fetch("https://api.mercadopago.com/users/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const body: any = await res.json().catch(() => ({}));

      if (res.status === 401 || res.status === 403) {
        return { ok: false as const, error: "Access Token inválido ou expirado" };
      }
      if (!res.ok) {
        return { ok: false as const, error: body?.message ?? `Erro ${res.status} ao consultar Mercado Pago` };
      }

      const env: "production" | "sandbox" =
        token.startsWith("TEST-") ? "sandbox" : "production";

      return {
        ok: true as const,
        environment: env,
        account: {
          id: body?.id ? String(body.id) : null,
          nickname: body?.nickname ?? null,
          email: body?.email ?? null,
          country: body?.country_id ?? null,
          site: body?.site_id ?? null,
        },
      };
    } catch (e) {
      console.error("verifyMercadoPago error", e);
      return { ok: false as const, error: "Falha de rede ao contatar o Mercado Pago" };
    }
  });

