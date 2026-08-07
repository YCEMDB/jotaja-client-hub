import { createFileRoute } from "@tanstack/react-router";
import { getProviderAdapter } from "@/lib/payments/framework";

export const Route = createFileRoute("/api/public/mercadopago/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const state = url.searchParams.get("state");
        const code = url.searchParams.get("code");
        const siteBase = process.env.PUBLIC_SITE_URL ?? "https://comandahub.online";

        if (!state || !code) return redirectWithError(siteBase, "invalid_params");

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        // 1. Validar state universal (Fase 2)
        const { data: stateRow, error: stateErr } = await supabaseAdmin.rpc("verify_and_consume_oauth_state" as any, {
          p_state: state,
          p_provider: 'mercadopago'
        });

        if (stateErr || !stateRow) {
          console.error("[MP Callback] State validation failed:", stateErr);
          return redirectWithError(siteBase, "invalid_state");
        }

        const restaurantId = (stateRow as any).restaurant_id;

        try {
          // 2. Usar o Adapter universal
          const adapter = await getProviderAdapter('mercadopago');
          const connection = await adapter.exchangeAuthorizationCode(code, state);

          // 3. Persistir conta (Fase 2)
          const { data: account, error: accErr } = await supabaseAdmin
            .from("restaurant_payment_accounts")
            .upsert({
              restaurant_id: restaurantId,
              provider: 'mercadopago',
              provider_account_id: connection.providerAccountId,
              provider_status: 'active',
              provider_environment: connection.accessToken.startsWith('TEST-') ? 'sandbox' : 'production',
              provider_metadata: connection.metadata,
              is_active: true,
              updated_at: new Date().toISOString()
            })
            .select("id")
            .single();

          if (accErr) throw accErr;

          // 4. Persistir segredos via RPC segura (Vault-ready)
          const { error: secretErr } = await supabaseAdmin.rpc("save_restaurant_payment_secrets", {
            p_account_id: account.id,
            p_access_token_enc: connection.accessToken, // O DB espera bytea ou text? Verificando infra
            p_refresh_token_enc: connection.refreshToken || null,
            p_expires_at: connection.expiresAt?.toISOString() || null,
            p_scopes: []
          } as any);


          if (secretErr) throw secretErr;

          const dest = new URL((stateRow as any).redirect_after ?? "/admin/configuracoes?tab=pagamentos", siteBase);
          dest.searchParams.set("mercadopago", "connected");
          return Response.redirect(dest.toString(), 302);
        } catch (err: any) {
          console.error("[MP Callback] Error:", err);
          return redirectWithError(siteBase, err.code || "connection_failed");
        }
      },
    },
  },
});

function redirectWithError(siteBase: string, code: string): Response {
  const dest = new URL("/admin/configuracoes?tab=pagamentos", siteBase);
  dest.searchParams.set("mercadopago_error", code);
  return Response.redirect(dest.toString(), 302);
}

