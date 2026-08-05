import { createFileRoute } from "@tanstack/react-router";
import { exchangeAuthorizationCode } from "@/lib/payments/mercadopago-api.server";

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

        // Validar o state usando RPC para evitar erro de tipo na tabela que acabou de ser criada
        const { data: states, error: stateErr } = await supabaseAdmin
          .from("mercadopago_oauth_states" as any)
          .select("*")
          .eq("state", state)
          .limit(1);

        const stateRow = states?.[0];

        if (stateErr || !stateRow || (stateRow as any).used_at) 
          return redirectWithError(siteBase, "invalid_state");

        const exchange = await exchangeAuthorizationCode({ code });
        if (!exchange.ok) return redirectWithError(siteBase, "exchange_failed");

        // Salvar as credenciais via RPC seguro
        const { error: completeErr } = await supabaseAdmin.rpc("mercadopago_connect_complete" as any, {
          p_state: state,
          p_access_token: exchange.access_token,
          p_refresh_token: exchange.refresh_token,
          p_public_key: exchange.public_key,
          p_merchant_id: exchange.user_id,
        } as any);

        if (completeErr) return redirectWithError(siteBase, "save_failed");

        const dest = new URL((stateRow as any).redirect_after ?? "/admin/configuracoes?tab=pagamentos", siteBase);
        dest.searchParams.set("mercadopago", "connected");
        return Response.redirect(dest.toString(), 302);
      },
    },
  },
});

function redirectWithError(siteBase: string, code: string): Response {
  const dest = new URL("/admin/configuracoes?tab=pagamentos", siteBase);
  dest.searchParams.set("mercadopago_error", code);
  return Response.redirect(dest.toString(), 302);
}
