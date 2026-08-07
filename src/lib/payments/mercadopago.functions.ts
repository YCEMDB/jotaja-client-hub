import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getProviderAdapter, PaymentProviderError } from "./framework";

const connectInitSchema = z.object({
  restaurantId: z.string().uuid(),
});

/**
 * Inicia o fluxo OAuth universal para Mercado Pago.
 */
export const mercadopagoConnectInit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => connectInitSchema.parse(d))
  .handler(async ({ data, context }) => {
    try {
      const adapter = await getProviderAdapter('mercadopago');
      const url = await adapter.getAuthorizationUrl(data.restaurantId);
      return { ok: true as const, url };
    } catch (err: any) {
      console.error("[MP Connect] Init failed:", err);
      return { 
        ok: false as const, 
        error: err.code || "init_failed",
        detail: err.message
      };
    }
  });

/**
 * Desconecta a conta do framework sem afetar outros módulos.
 */
export const mercadopagoDisconnect = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ restaurantId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    try {
      const adapter = await getProviderAdapter('mercadopago');
      await adapter.disconnect(data.restaurantId);
      return { ok: true as const };
    } catch (err: any) {
      return { ok: false as const, error: err.message };
    }
  });

/**
 * Simula a criação de um pedido Pix de teste para o Mercado Pago.
 * Usado exclusivamente no ambiente Sandbox para validar a integração.
 */
export const createTestMercadoPagoPix = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ restaurantId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;

    // 1. Verificar se o restaurante tem token MP
    let mpToken: string | null = null;
    
    const { data: accData } = await supabase
      .from("restaurant_payment_accounts")
      .select("id")
      .eq("restaurant_id", data.restaurantId)
      .eq("provider", 'mercadopago')
      .eq("provider_status", 'active')
      .single();

    if (accData) {
      // Usar a RPC existente para compatibilidade de segurança, enquanto a nova RPC da Fase 2
      // está sendo integrada (a nova save_restaurant_payment_secrets já existe no DB)
      const { data: secretData } = await supabase.rpc("admin_get_restaurant_mp_token", {
        p_restaurant_id: data.restaurantId,
      });
      mpToken = secretData as string | null;
    }


    if (!mpToken) {
      return { ok: false as const, error: "Mercado Pago não conectado ou token não encontrado." };
    }

    // 2. Criar um pedido fictício no banco para rastreio
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .insert({
        restaurant_id: data.restaurantId,
        customer_name: "Teste Sandbox",
        customer_phone: "00000000000",
        total: 15.00,
        subtotal: 15.00,
        status: "pending",
        payment: "pix",
        payment_status: "pending",
        type: "delivery",
      })
      .select("id")
      .single();

    if (orderErr || !order) {
      return { ok: false as const, error: `Falha ao criar pedido: ${orderErr?.message}` };
    }

    const { createPixCharge } = await import("./mercadopago-api.server");
    const idempotencyKey = `test-mp-${order.id}`;
    const notificationUrl = `${process.env.PUBLIC_SITE_URL ?? "https://comandahub.online"}/api/public/mercadopago-webhook`;
    
    const res = await createPixCharge({
      accessToken: mpToken,
      idempotencyKey,
      referenceId: `order:${order.id}`,
      amount: 15.00,
      description: `Pedido de Teste #${order.id.slice(0, 8)}`,
      notificationUrl,
    });

    if (!res.ok) return res;

    await supabase.rpc("payment_create_pending", {
      p_order_id: order.id,
      p_provider: "mercado_pago",
      p_provider_payment_id: res.provider_payment_id,
      p_provider_order_id: null,
      p_amount: 15.00,
      p_currency: "BRL",
      p_method: "pix",
      p_qr_text: res.qr_code_text,
      p_qr_image_url: res.qr_code_image_url,
      p_expires_at: res.expires_at,
      p_reference_id: `order:${order.id}`,
      p_idempotency_key: idempotencyKey,
    } as any);

    return {
      ok: true as const,
      orderId: order.id,
      paymentId: res.provider_payment_id,
      qrCode: res.qr_code_text,
      ticketUrl: res.qr_code_image_url,
      amount: 15.00,
    };
  });

/**
 * Aplica as credenciais Sandbox ao restaurante via Framework.
 */
export const mercadopagoUseSandboxCredentials = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ restaurantId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const token = process.env["MERCADOPAGO_ACCESS_TOKEN_SANDBOX"];
    const publicKey = process.env["MERCADOPAGO_PUBLIC_KEY_SANDBOX"];
    
    if (!token) return { ok: false as const, error: "Credenciais Sandbox não configuradas." };

    const { data: account, error: accErr } = await supabase
      .from("restaurant_payment_accounts")
      .upsert({
        restaurant_id: data.restaurantId,
        provider: 'mercadopago',
        provider_account_id: 'sandbox_manual',
        provider_status: 'active',
        provider_environment: 'sandbox',
        provider_metadata: { public_key: publicKey },
        is_active: true
      })
      .select("id")
      .single();

    if (accErr) return { ok: false as const, error: accErr.message };

    await supabase.rpc("save_restaurant_payment_secrets", {
      p_account_id: account.id,
      p_access_token_enc: token,
      p_refresh_token_enc: null,
      p_expires_at: null,
      p_scopes: []
    } as any);

    await supabase
      .from("restaurants")
      .update({ accept_pix_online: true, active_payment_provider: 'mercado_pago' })
      .eq("id", data.restaurantId);

    return { ok: true as const };
  });



