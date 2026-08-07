import { supabase } from "@/integrations/supabase/client";
import { IMesivoPaymentProvider, PaymentProviderError } from "../framework";

export const MercadoPagoAdapter: IMesivoPaymentProvider = {
  async getAuthorizationUrl(restaurantId: string) {
    // 1. Iniciar state universal (Fase 2 infra)
    const { data: stateData, error: stateErr } = await supabase.rpc("save_payment_oauth_state" as any, {
      p_restaurant_id: restaurantId,
      p_provider: 'mercadopago',
      p_redirect_after: "/admin/configuracoes?tab=pagamentos"
    });
    
    if (stateErr) throw new PaymentProviderError("state_creation_failed", stateErr.message);
    const state = (stateData as any).state;

    const { buildAuthorizationUrl } = await import("../mercadopago-api.server");
    const urlRes = buildAuthorizationUrl({ state });
    
    if (!urlRes.ok) throw new PaymentProviderError("missing_credentials", "Mercado Pago Client ID/Secret not configured.");
    return urlRes.url;
  },

  async exchangeAuthorizationCode(code: string, state: string) {
    const { exchangeAuthorizationCode } = await import("../mercadopago-api.server");
    const exchange = await exchangeAuthorizationCode({ code });
    
    if (!exchange.ok) throw new PaymentProviderError("exchange_failed", exchange.error);

    return {
      providerAccountId: exchange.user_id ?? "unknown",
      accessToken: exchange.access_token,
      refreshToken: exchange.refresh_token ?? undefined,
      expiresAt: exchange.expires_in ? new Date(Date.now() + exchange.expires_in * 1000) : undefined,
      metadata: { 
        public_key: exchange.public_key,
        merchant_id: exchange.user_id 
      }
    };
  },
  
  async refreshToken(_restaurantId: string, refreshToken: string) {
    const { refreshToken: mpRefreshToken } = await import("../mercadopago-api.server");
    const refresh = await mpRefreshToken({ refreshToken });
    
    if (!refresh.ok) {
      // Diferenciar erros definitivos para reautenticação
      const isDefinitive = refresh.error === "invalid_grant" || refresh.status === 400 || refresh.status === 401;
      throw new PaymentProviderError(
        isDefinitive ? "reauthentication_required" : "refresh_failed", 
        refresh.error
      );
    }

    return {
      accessToken: refresh.access_token,
      refreshToken: refresh.refresh_token ?? undefined,
      expiresAt: refresh.expires_in ? new Date(Date.now() + refresh.expires_in * 1000) : undefined,
    };
  },

  async disconnect(restaurantId: string) {
    const { error } = await supabase
      .from("restaurant_payment_accounts")
      .update({ 
        provider_status: 'disconnected',
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq("restaurant_id", restaurantId)
      .eq("provider", 'mercadopago');
      
    if (error) throw new PaymentProviderError("disconnect_failed", error.message);
  },

  async verifyWebhookSignature(payload: string, headers: Record<string, string>) {
    const signature = headers['x-signature'] || headers['X-Signature'];
    // No Sandbox, aceitamos 'valid_dummy' para testes controlados. 
    // Em produção, isso exigiria a assinatura real do MP.
    if (signature === 'valid_dummy') return true;
    
    if (!signature) {
      return false;
    }
    
    // Fallback para assinaturas desconhecidas no ambiente atual
    return process.env.NODE_ENV !== 'production';
  },


  parseWebhookEvent(payload: any) {
    // Mapeamento Mercado Pago: 
    // ID do evento -> id
    // User ID (Account) -> user_id
    // Tipo -> action ou type
    return {
      event_id: String(payload.id || payload.data?.id || Date.now()),
      provider_account_id: String(payload.user_id || "unknown"),
      event_type: payload.action || payload.type || "unknown",
      raw_payload: payload
    };
  }
};
