import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  buildAuthorizationUrl,
  createPixCharge,
  exchangeAuthorizationCode,
  fetchOrder,
  mapPagbankStatus,
  siteUrl,
  type PagbankEnvironment,
} from "./pagbank-api.server";
import { createHash } from "node:crypto";

// ─── Iniciar conexão ────────────────────────────────────────────────
const connectInitSchema = z.object({
  restaurantId: z.string().uuid(),
  environment: z.enum(["sandbox", "production"]),
  redirectAfter: z.string().min(1).max(500).optional(),
});

export const pagbankConnectInit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => connectInitSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    // Cria o state via RPC (valida sessão administrativa)
    const { data: initRes, error } = await supabase.rpc("pagbank_connect_init", {
      p_restaurant_id: data.restaurantId,
      p_environment: data.environment,
      p_redirect_after: data.redirectAfter ?? "/admin/configuracoes?tab=pagamentos",
    });
    if (error) return { ok: false as const, error: error.message };

    const state = (initRes as any)?.state as string;
    const url = buildAuthorizationUrl({ environment: data.environment, state });
    if (!url.ok) {
      return {
        ok: false as const,
        error: "missing_credentials",
        detail:
          "PAGBANK_CLIENT_ID/SECRET não configurado para este ambiente. Configure via Secrets.",
      };
    }
    return { ok: true as const, url: url.url, state };
  });

// ─── Desconectar ────────────────────────────────────────────────────
const disconnectSchema = z.object({
  restaurantId: z.string().uuid(),
  reason: z.string().min(5).max(500),
});

export const pagbankDisconnect = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => disconnectSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.rpc("pagbank_disconnect", {
      p_restaurant_id: data.restaurantId,
      p_reason: data.reason,
    });
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

// ─── Rotacionar webhook key ─────────────────────────────────────────
export const pagbankRotateWebhookKey = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => disconnectSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { data: res, error } = await context.supabase.rpc("pagbank_rotate_webhook_key", {
      p_restaurant_id: data.restaurantId,
      p_reason: data.reason,
    });
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const, webhook_key: (res as any)?.webhook_key as string };
  });

// ─── Trocar provider ativo ──────────────────────────────────────────
const setProviderSchema = z.object({
  restaurantId: z.string().uuid(),
  provider: z.enum(["mercado_pago", "pagbank"]).nullable(),
  reason: z.string().min(5).max(500),
});

export const setActivePaymentProvider = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => setProviderSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.rpc("set_active_payment_provider", {
      p_restaurant_id: data.restaurantId,
      p_provider: data.provider,
      p_reason: data.reason,
    } as never);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

// ─── Resumo mascarado da integração ─────────────────────────────────
const summarySchema = z.object({ restaurantId: z.string().uuid() });

export const getPaymentIntegrationsSummary = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => summarySchema.parse(d))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase.rpc(
      "admin_view_payment_integrations",
      { p_restaurant_id: data.restaurantId },
    );
    if (error) return { ok: false as const, error: error.message, integrations: [] };
    return { ok: true as const, integrations: (rows ?? []) as any[] };
  });

// ─── Criar cobrança Pix PagBank (cliente final) ────────────────────
const createChargeSchema = z.object({ orderId: z.string().uuid() });

export const createPagbankPixCharge = createServerFn({ method: "POST" })
  .inputValidator((d) => createChargeSchema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("id, total, customer_name, restaurant_id, payment_status")
      .eq("id", data.orderId)
      .maybeSingle();
    if (!order) return { ok: false as const, error: "order_not_found" };
    if (order.payment_status === "paid") return { ok: true as const, alreadyPaid: true };

    // Idempotência: se já existe waiting, retorna o mesmo QR
    const { data: existing } = await supabaseAdmin
      .from("order_payments")
      .select("*")
      .eq("order_id", order.id)
      .in("status", ["waiting", "processing", "authorized"])
      .eq("provider", "pagbank")
      .maybeSingle();
    if (existing) {
      return {
        ok: true as const,
        payment_id: existing.id,
        qr_code: existing.qr_code_text,
        qr_code_image_url: existing.qr_code_image_url,
        expires_at: existing.expires_at,
      };
    }

    // Recupera integração ativa
    const { data: integration } = await supabaseAdmin
      .from("restaurant_payment_integrations")
      .select("id, environment, status, restaurant_id")
      .eq("restaurant_id", order.restaurant_id)
      .eq("provider", "pagbank")
      .eq("status", "active")
      .maybeSingle();
    if (!integration) return { ok: false as const, error: "pagbank_not_connected" };

    const { data: tokenRes, error: tokenErr } = await supabaseAdmin.rpc(
      "pagbank_get_access_token",
      { p_restaurant_id: order.restaurant_id },
    );
    if (tokenErr || !tokenRes) return { ok: false as const, error: "pagbank_authorization_expired" };
    const accessToken = tokenRes as unknown as string;

    // webhook_key da integração p/ notification_url
    const { data: webhookRow } = await supabaseAdmin
      .rpc("admin_view_payment_integrations", { p_restaurant_id: order.restaurant_id });
    // webhook_key precisa vir via query interna server-side (nunca do cliente)
    const { data: rpiKey } = await supabaseAdmin
      .from("restaurant_payment_integrations")
      .select("id")
      .eq("id", integration.id)
      .maybeSingle();
    // service_role bypassa RLS mas coluna webhook_key foi revogada; leia via SQL cru
    const { data: keyRow } = await supabaseAdmin
      .rpc("pagbank_lookup_integration_by_webhook_key", { p_webhook_key: "" });
    void webhookRow; void rpiKey; void keyRow; // placeholder – webhook_key vem abaixo

    const { data: keyData, error: keyErr } = await supabaseAdmin
      .from("restaurant_payment_integrations")
      // service_role ignora GRANTs a authenticated, pode ler webhook_key
      .select("webhook_key")
      .eq("id", integration.id)
      .maybeSingle<{ webhook_key: string | null }>();
    if (keyErr || !keyData?.webhook_key)
      return { ok: false as const, error: "pagbank_not_connected" };
    const webhookKey = keyData.webhook_key;

    const amountCents = Math.round(Number(order.total) * 100);
    const idempotencyKey = createHash("sha256")
      .update(`pagbank|${order.restaurant_id}|${order.id}|1`)
      .digest("hex");

    const charge = await createPixCharge({
      environment: integration.environment as PagbankEnvironment,
      accessToken,
      idempotencyKey,
      referenceId: `order:${order.id}`,
      amountCents,
      description: `Pedido #${order.id.slice(0, 8)}`,
      notificationUrl: `${siteUrl()}/api/public/hooks/pagbank/${encodeURIComponent(webhookKey)}`,
    });

    if (!charge.ok) {
      return { ok: false as const, error: charge.error, detail: charge.message };
    }

    const { data: created, error: rpcErr } = await supabaseAdmin.rpc("payment_create_pending", {
      p_order_id: order.id,
      p_provider: "pagbank",
      p_provider_payment_id: charge.provider_payment_id,
      p_provider_order_id: charge.provider_order_id,
      p_amount: Number(order.total),
      p_currency: "BRL",
      p_method: "pix",
      p_qr_text: charge.qr_code_text,
      p_qr_image_url: charge.qr_code_image_url,
      p_expires_at: charge.expires_at,
      p_reference_id: `order:${order.id}`,
      p_idempotency_key: idempotencyKey,
    } as never);
    if (rpcErr) return { ok: false as const, error: rpcErr.message };
    return {
      ok: true as const,
      payment_id: (created as any)?.id ?? null,
      qr_code: charge.qr_code_text,
      qr_code_image_url: charge.qr_code_image_url,
      expires_at: charge.expires_at,
    };
  });

// ─── Reconciliar (polling / botão "Já paguei") ─────────────────────
const syncSchema = z.object({ orderId: z.string().uuid() });

export const syncPagbankPayment = createServerFn({ method: "POST" })
  .inputValidator((d) => syncSchema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: pay } = await supabaseAdmin
      .from("order_payments")
      .select("id, order_id, restaurant_id, provider, provider_payment_id, provider_order_id, status, amount")
      .eq("order_id", data.orderId)
      .eq("provider", "pagbank")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!pay || !pay.provider_order_id) return { ok: false as const, status: "no_payment" };
    if (pay.status === "paid") return { ok: true as const, status: "paid" };

    const { data: integration } = await supabaseAdmin
      .from("restaurant_payment_integrations")
      .select("environment")
      .eq("restaurant_id", pay.restaurant_id)
      .eq("provider", "pagbank")
      .eq("status", "active")
      .maybeSingle();
    if (!integration) return { ok: false as const, status: "not_connected" };

    const { data: tokenRes } = await supabaseAdmin.rpc("pagbank_get_access_token", {
      p_restaurant_id: pay.restaurant_id,
    });
    if (!tokenRes) return { ok: false as const, status: "no_token" };

    const remote = await fetchOrder({
      environment: integration.environment as PagbankEnvironment,
      accessToken: tokenRes as unknown as string,
      providerOrderId: pay.provider_order_id,
    });
    if (!remote.ok) return { ok: false as const, status: "remote_error" };

    const matched = remote.pix_payments.find(
      (p) => p.provider_payment_id === pay.provider_payment_id,
    );
    if (!matched) return { ok: true as const, status: pay.status };

    const newStatus = mapPagbankStatus(matched.status_raw);
    const hash = createHash("sha256")
      .update(`reconciliation|${matched.provider_payment_id}|${matched.status_raw}|${matched.paid_at ?? ""}`)
      .digest("hex");

    await supabaseAdmin.rpc("payment_apply_provider_event", {
      p_provider: "pagbank",
      p_provider_payment_id: matched.provider_payment_id,
      p_external_event_id: null,
      p_payload_hash: hash,
      p_new_status: newStatus,
      p_provider_status_raw: matched.status_raw,
      p_amount: matched.amount_cents ? matched.amount_cents / 100 : null,
      p_paid_at: matched.paid_at,
      p_failure_code: null,
      p_failure_message: null,
      p_source: "reconciliation",
    } as never);

    return { ok: true as const, status: newStatus };
  });
