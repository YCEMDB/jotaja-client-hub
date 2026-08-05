/**
 * Mercado Pago OAuth API — cliente HTTP server-only.
 */
import { z } from "zod";

export type MercadoPagoEnvironment = "sandbox" | "production";

const BASE_API = "https://api.mercadopago.com";

function envCreds() {
  const cid = process.env.MERCADOPAGO_CLIENT_ID;
  const sec = process.env.MERCADOPAGO_CLIENT_SECRET;
  return cid && sec ? { clientId: cid, clientSecret: sec } : null;
}

export function siteUrl(): string {
  return process.env.PUBLIC_SITE_URL ?? "https://comandahub.online";
}

export function mercadopagoRedirectUri(): string {
  return `${siteUrl()}/api/public/mercadopago/callback`;
}

export function buildAuthorizationUrl(input: {
  state: string;
}): { ok: true; url: string } | { ok: false; error: "missing_credentials" } {
  const creds = envCreds();
  if (!creds) return { ok: false, error: "missing_credentials" };
  
  const url = new URL("https://auth.mercadopago.com.br/authorization");
  url.searchParams.set("client_id", creds.clientId);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("platform_id", "mp"); // Mercado Pago platform
  url.searchParams.set("redirect_uri", mercadopagoRedirectUri());
  url.searchParams.set("state", input.state);
  return { ok: true, url: url.toString() };
}

export async function exchangeAuthorizationCode(input: {
  code: string;
}) {
  const creds = envCreds();
  if (!creds) return { ok: false, error: "missing_credentials" };

  try {
    const res = await fetch(`${BASE_API}/oauth/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json",
      },
      body: new URLSearchParams({
        client_secret: creds.clientSecret,
        client_id: creds.clientId,
        grant_type: "authorization_code",
        code: input.code,
        redirect_uri: mercadopagoRedirectUri(),
      }),
    });

    const body: any = await res.json();
    if (!res.ok) return { ok: false, error: body?.message ?? `http_${res.status}` };

    return {
      ok: true as const,
      access_token: body.access_token,
      refresh_token: body.refresh_token ?? null,
      expires_in: body.expires_in ?? null,
      user_id: body.user_id ? String(body.user_id) : null,
      public_key: body.public_key ?? null,
    };
  } catch (e) {
    console.error("[mercadopago] exchange error", e);
    return { ok: false, error: "network_error" };
  }
}
