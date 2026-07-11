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
          console.error("[pagbank] exchange failed", { error: exchange.error });
          await supabaseAdmin
            .from("pagbank_oauth_states")
            .update({ used_at: new Date().toISOString() })
            .eq("state", state);
          return redirectWithError(siteBase, `exchange_${exchange.error}`);
        }

        if (!exchange.access_token || typeof exchange.access_token !== "string") {
          console.error("[pagbank] exchange returned no access_token", {
            hasRefresh: !!exchange.refresh_token,
            scopeLen: exchange.scope?.length,
          });
          return redirectWithError(siteBase, "exchange_no_access_token");
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
        if (completeErr) {
          console.error("[pagbank] rpc pagbank_connect_complete failed", completeErr);
          const errCode = (completeErr.message || "rpc_failed")
            .replace(/[^a-z0-9_]/gi, "_")
            .slice(0, 60);
          return redirectWithError(siteBase, `rpc_${errCode}`);
        }

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
