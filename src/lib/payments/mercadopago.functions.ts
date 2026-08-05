import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { buildAuthorizationUrl, createPixCharge } from "./mercadopago-api.server";

const connectInitSchema = z.object({
  restaurantId: z.string().uuid(),
  redirectAfter: z.string().optional(),
});

export const mercadopagoConnectInit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => connectInitSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;

    const { data: initRes, error } = await supabase.rpc("mercadopago_connect_init" as any, {
      p_restaurant_id: data.restaurantId,
      p_redirect_after: data.redirectAfter ?? "/admin/configuracoes?tab=pagamentos",
    } as any);

    if (error) return { ok: false as const, error: error.message };

    const state = (initRes as any)?.state as string;
    const url = buildAuthorizationUrl({ state });

    if (!url.ok) {
      return {
        ok: false as const,
        error: "missing_credentials",
        detail: "MERCADOPAGO_CLIENT_ID/SECRET não configurado. Configure via Secrets.",
      };
    }

    return { ok: true as const, url: url.url, state };
  });

/**
 * Simula a criação de um pedido Pix de teste para o Mercado Pago.
 * Usado exclusivamente no ambiente Sandbox para validar a integração.
 */
export const createTestMercadoPagoPix = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ restaurantId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // 1. Verificar se o restaurante tem token MP
    const { data: tokenData, error: tokenErr } = await supabase.rpc("admin_get_restaurant_mp_token", {
      p_restaurant_id: data.restaurantId,
    });
    
    const mpToken = tokenData as string | null;
    if (!mpToken || tokenErr) {
      return { ok: false as const, error: "Mercado Pago não conectado ou token não encontrado." };
    }

    // 2. Criar um pedido fictício no banco para rastreio
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .insert({
        restaurant_id: data.restaurantId,
        customer_name: "Teste Sandbox",
        total: 15.00,
        status: "pending",
        payment_method: "pix",
        payment_status: "waiting",
        items: [{ name: "Teste Sandbox", price: 15.00, quantity: 1 }],
      })
      .select("id")
      .single();

    if (orderErr || !order) return { ok: false as const, error: "Falha ao criar pedido de teste." };

    // 3. Gerar cobrança no Mercado Pago
    const idempotencyKey = `test-mp-${order.id}`;
    const notificationUrl = `https://comandahub.online/api/public/mercadopago-webhook`;
    
    const res = await createPixCharge({
      accessToken: mpToken,
      idempotencyKey,
      referenceId: `order:${order.id}`,
      amount: 15.00,
      description: `Pedido de Teste #${order.id.slice(0, 8)}`,
      notificationUrl,
    });

    if (!res.ok) return res;

    // 4. Registrar o pagamento no banco (canonical)
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

    // 5. Atualizar o pedido com o ID do pagamento MP (legado compat)
    await supabase
      .from("orders")
      .update({ mp_payment_id: res.provider_payment_id })
      .eq("id", order.id);

    return {
      ok: true as const,
      orderId: order.id,
      paymentId: res.provider_payment_id,
      qrCode: res.qr_code_text,
      ticketUrl: res.qr_code_image_url,
      amount: 15.00,
    };
  });
