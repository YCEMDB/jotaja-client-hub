/**
 * Mercado Pago Connect + Pix API — cliente HTTP server-only.
 * Usa o SDK oficial 'mercadopago' para operações complexas se necessário.
 */
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { MercadoPagoConfig, Payment } from "mercadopago";

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
  url.searchParams.set("platform_id", "mp");
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

/**
 * Cria uma cobrança Pix via Mercado Pago (Checkout Pro / API v1).
 */
export type CreatePixResult =
  | {
      ok: true;
      provider_payment_id: string;
      qr_code_text: string;
      qr_code_image_url: string | null;
      expires_at: string;
    }
  | { ok: false; error: string; message?: string };

export async function createPixCharge(input: {
  accessToken: string;
  idempotencyKey: string;
  referenceId: string;
  amount: number;
  description: string;
  notificationUrl: string;
}): Promise<CreatePixResult> {
  try {
    const client = new MercadoPagoConfig({ 
      accessToken: input.accessToken,
      options: { timeout: 10000 }
    });
    
    const payment = new Payment(client);
    
    // Identifica se o token é sandbox (costuma começar com TEST-)
    // mas o MP exige parâmetros específicos para evitar o erro 'Unauthorized use of live credentials'
    const response = await payment.create({
      body: {
        transaction_amount: input.amount,
        description: input.description,
        payment_method_id: "pix",
        payer: {
          email: "test_user_123@testuser.com", // Obrigatório para Pix MP
        },
        external_reference: input.referenceId,
        notification_url: input.notificationUrl,
      },
      requestOptions: {
        idempotencyKey: input.idempotencyKey,
      }
    });

    const pointOfInteraction = response.point_of_interaction?.transaction_data;
    
    return {
      ok: true,
      provider_payment_id: String(response.id),
      qr_code_text: pointOfInteraction?.qr_code ?? "",
      qr_code_image_url: pointOfInteraction?.ticket_url ?? null,
      expires_at: response.date_of_expiration || new Date(Date.now() + 30 * 60_000).toISOString(),
    };
  } catch (e: any) {
    console.error("[mercadopago] sdk error", e);
    return { 
      ok: false, 
      error: e.cause?.[0]?.code ?? e.message ?? "sdk_error",
      message: e.cause?.[0]?.description ?? e.message
    };
  }
}
