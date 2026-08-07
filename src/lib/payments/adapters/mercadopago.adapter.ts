import { supabase } from "@/integrations/supabase/client";

/**
 * Adaptador para Mercado Pago seguindo o contrato universal.
 */
export const MercadoPagoAdapter = {
  async getAuthorizationUrl(restaurantId: string, state: string) {
    const { data: initRes, error } = await supabase.rpc("mercadopago_connect_init" as any, {
      p_restaurant_id: restaurantId,
      p_redirect_after: "/admin/configuracoes?tab=pagamentos",
    });
    if (error) throw new Error(error.message);
    
    // O buildAuthorizationUrl atual depende de ENV, vamos refatorar na Fase 3.
    // Usamos a função existente temporariamente até a abstração total.
    const { buildAuthorizationUrl } = await import("./mercadopago-api.server");
    const urlRes = buildAuthorizationUrl({ state });
    if (!urlRes.ok) throw new Error("Credenciais Mercado Pago não configuradas.");
    return urlRes.url;
  },

  async exchangeAuthorizationCode(code: string, state: string, restaurantId: string) {
    const { exchangeAuthorizationCode } = await import("./mercadopago-api.server");
    const exchange = await exchangeAuthorizationCode({ code });
    if (!exchange.ok) throw new Error(exchange.error);

    // O retorno deve ser mapeado para o contrato universal.
    // accountId virá do provider_account_id da tabela.
    return {
      accountId: exchange.user_id ?? "unknown",
      accessToken: exchange.access_token,
      refreshToken: exchange.refresh_token ?? undefined,
      expiresAt: exchange.expires_in ? new Date(Date.now() + exchange.expires_in * 1000) : undefined,
      metadata: { public_key: exchange.public_key }
    };
  },
  
  async getAccount(accessToken: string) {
     // A ser implementado conforme integração MP
     return { providerAccountId: "unknown", metadata: {} };
  }
};
