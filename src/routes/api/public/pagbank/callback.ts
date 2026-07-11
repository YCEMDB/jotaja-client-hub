import { createFileRoute } from "@tanstack/react-router";
import { exchangeAuthorizationCode, type PagbankEnvironment } from "@/lib/payments/pagbank-api.server";

/**
 * OAuth callback do PagBank Connect.
 *  - Nunca aceita restaurant_id livre — restaurante é resolvido pelo `state`.
 *  - state é one-shot: RPC pagbank_connect_complete recusa reutilização.
 *  - Access token nunca aparece em resposta HTTP nem em logs.
 */
export const Route = createFileRoute("/api/public/pagbank/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const state = url.searchParams.get("state");
        const code = url.searchParams.get("code");
        const errorParam = url.searchParams.get("error");
        const siteBase = process.env.PUBLIC_SITE_URL ?? "https://comandahub.online";

        if (!state) return redirectWithError(siteBase, "oauth_state_not_found");
        if (errorParam) return redirectWithError(siteBase, "pagbank_connection_failed");
        if (!code) return redirectWithError(siteBase, "pagbank_connection_failed");

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        // Lookup do state SEM consumi-lo ainda (para saber environment/restaurant)
        const { data: stateRow, error: stateErr } = await supabaseAdmin
          .from("pagbank_oauth_states")
          .select("state, restaurant_id, environment, redirect_after, used_at, expires_at")
          .eq("state", state)
          .maybeSingle();
        if (stateErr || !stateRow) return redirectWithError(siteBase, "oauth_state_not_found");
        if (stateRow.used_at) return redirectWithError(siteBase, "oauth_state_already_used");
        if (new Date(stateRow.expires_at).getTime() < Date.now())
          return redirectWithError(siteBase, "oauth_state_expired");

        const exchange = await exchangeAuthorizationCode({
          environment: stateRow.environment as PagbankEnvironment,
          code,
        });
        if (!exchange.ok) {
          // Marca state como usado para bloquear replay
          await supabaseAdmin
            .from("pagbank_oauth_states")
            .update({ used_at: new Date().toISOString() })
            .eq("state", state);
          return redirectWithError(siteBase, exchange.error);
        }

        const { error: completeErr } = await supabaseAdmin.rpc("pagbank_connect_complete", {
          p_state: state,
          p_access_token: exchange.access_token,
          p_refresh_token: exchange.refresh_token,
          p_expires_in: exchange.expires_in,
          p_scopes: exchange.scope,
          p_provider_account_id: exchange.account_id,
          p_provider_account_masked: exchange.account_masked,
        } as never);
        if (completeErr) return redirectWithError(siteBase, "pagbank_connection_failed");

        const dest = new URL(stateRow.redirect_after ?? "/admin/configuracoes?tab=pagamentos", siteBase);
        dest.searchParams.set("pagbank", "connected");
        return Response.redirect(dest.toString(), 302);
      },
    },
  },
});

function redirectWithError(siteBase: string, code: string): Response {
  const dest = new URL("/admin/configuracoes?tab=pagamentos", siteBase);
  dest.searchParams.set("pagbank_error", code);
  return Response.redirect(dest.toString(), 302);
}
