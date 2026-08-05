import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { buildAuthorizationUrl } from "./mercadopago-api.server";

const connectInitSchema = z.object({
  restaurantId: z.string().uuid(),
  redirectAfter: z.string().optional(),
});

export const mercadopagoConnectInit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => connectInitSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;

    // Usaremos a mesma lógica de state que o PagBank, mas adaptada para MP no banco se necessário
    // Por enquanto, vamos assumir que o sistema de states pode ser genérico ou criaremos um específico.
    // Para agilidade, vamos usar um RPC que crie o state para MP.
    const { data: initRes, error } = await supabase.rpc("mercadopago_connect_init", {
      p_restaurant_id: data.restaurantId,
      p_redirect_after: data.redirectAfter ?? "/admin/configuracoes?tab=pagamentos",
    });

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
