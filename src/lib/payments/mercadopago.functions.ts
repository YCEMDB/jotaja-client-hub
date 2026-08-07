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

// createTestMercadoPagoPix e mercadopagoUseSandboxCredentials permanecem inalterados por enquanto
// para compatibilidade com o sistema legado durante a transição da Fase 3.


