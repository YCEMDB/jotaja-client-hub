/**
 * PagBank Connect + Pix API — cliente HTTP server-only.
 *
 * NUNCA importar este módulo do bundle do cliente. Ele lê secrets do processo
 * e chama endpoints do PagBank com o token do restaurante.
 *
 * Credenciais esperadas (por ambiente) via Secrets:
 *  - Sandbox:    PAGBANK_SANDBOX_CLIENT_ID / PAGBANK_SANDBOX_CLIENT_SECRET
 *  - Produção:   PAGBANK_PROD_CLIENT_ID / PAGBANK_PROD_CLIENT_SECRET
 *
 * Enquanto elas não forem preenchidas via add_secret, as chamadas HTTP
 * retornarão erro estruturado (`missing_credentials`) e a UI mostrará a
 * mensagem apropriada. Não simulamos conexão bem-sucedida.
 */

import { createHash, timingSafeEqual } from "node:crypto";

export type PagbankEnvironment = "sandbox" | "production";

const BASE = {
  sandbox: {
    api: "https://sandbox.api.pagseguro.com",
    connect: "https://connect.sandbox.pagbank.com.br",
  },
  production: {
    api: "https://api.pagseguro.com",
    connect: "https://connect.pagbank.com.br",
  },
} as const;

function envCreds(env: PagbankEnvironment): { clientId: string; clientSecret: string } | null {
  const cid =
    env === "sandbox"
      ? process.env.PAGBANK_SANDBOX_CLIENT_ID ?? process.env.PAGBANK_CLIENT_ID_SANDBOX
      : process.env.PAGBANK_PROD_CLIENT_ID ?? process.env.PAGBANK_CLIENT_ID;
  const sec =
    env === "sandbox"
      ? process.env.PAGBANK_SANDBOX_CLIENT_SECRET ?? process.env.PAGBANK_CLIENT_SECRET_SANDBOX
      : process.env.PAGBANK_PROD_CLIENT_SECRET ?? process.env.PAGBANK_CLIENT_SECRET;
  if (!cid || !sec) return null;
  return { clientId: cid, clientSecret: sec };
}

export function siteUrl(): string {
  return process.env.PUBLIC_SITE_URL ?? "https://comandahub.online";
}

export function pagbankRedirectUri(): string {
  return `${siteUrl()}/api/public/pagbank/callback`;
}

/**
 * URL para o usuário aprovar a conexão. A permissão exata (scopes) segue o
 * escopo mínimo para gerar cobranças Pix na conta do restaurante.
 */
export function buildAuthorizationUrl(input: {
  environment: PagbankEnvironment;
  state: string;
}): { ok: true; url: string } | { ok: false; error: "missing_credentials" } {
  const creds = envCreds(input.environment);
  if (!creds) return { ok: false, error: "missing_credentials" };
  const url = new URL(`${BASE[input.environment].connect}/oauth2/authorize`);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", creds.clientId);
  url.searchParams.set("redirect_uri", pagbankRedirectUri());
  url.searchParams.set("scope", "payments.read payments.create accounts.read");
  url.searchParams.set("state", input.state);
  return { ok: true, url: url.toString() };
}

export type ExchangeTokenResult =
  | {
      ok: true;
      access_token: string;
      refresh_token: string | null;
      expires_in: number | null;
      scope: string[];
      account_id: string | null;
      account_masked: string | null;
    }
  | { ok: false; error: string };

/**
 * Troca o `code` retornado pelo PagBank pelo access_token do lojista.
 * Server-only. Nunca chame no cliente.
 */
export async function exchangeAuthorizationCode(input: {
  environment: PagbankEnvironment;
  code: string;
}): Promise<ExchangeTokenResult> {
  const creds = envCreds(input.environment);
  if (!creds) return { ok: false, error: "missing_credentials" };
  try {
    const res = await fetch(`${BASE[input.environment].api}/oauth2/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code: input.code,
        redirect_uri: pagbankRedirectUri(),
        client_id: creds.clientId,
        client_secret: creds.clientSecret,
      }).toString(),
    });
    const body: any = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: body?.error ?? `http_${res.status}` };
    const scope: string[] = typeof body?.scope === "string" ? body.scope.split(/\s+/) : [];
    const accountId: string | null =
      body?.account_id ?? body?.user_id ?? body?.merchant_id ?? null;
    return {
      ok: true,
      access_token: body.access_token,
      refresh_token: body.refresh_token ?? null,
      expires_in: typeof body.expires_in === "number" ? body.expires_in : null,
      scope,
      account_id: accountId ? String(accountId) : null,
      account_masked: accountId ? String(accountId).slice(-4).padStart(6, "•") : null,
    };
  } catch (e) {
    console.error("[pagbank] exchange error", e);
    return { ok: false, error: "network_error" };
  }
}

/**
 * Cria uma cobrança Pix na conta do RESTAURANTE (não da COMANDAHUB).
 * O dinheiro cai direto na conta PagBank do lojista.
 */
export type CreatePixResult =
  | {
      ok: true;
      provider_payment_id: string;
      provider_order_id: string | null;
      qr_code_text: string;
      qr_code_image_url: string | null;
      expires_at: string;
    }
  | { ok: false; error: string; message?: string };

export async function createPixCharge(input: {
  environment: PagbankEnvironment;
  accessToken: string;
  idempotencyKey: string;
  referenceId: string;
  amountCents: number;
  description: string;
  expiresInMinutes?: number;
  notificationUrl: string;
}): Promise<CreatePixResult> {
  const expiresInMinutes = input.expiresInMinutes ?? 30;
  const expiresAt = new Date(Date.now() + expiresInMinutes * 60_000);
  const body = {
    reference_id: input.referenceId,
    customer: { name: "Cliente" },
    qr_codes: [
      {
        amount: { value: input.amountCents },
        expiration_date: expiresAt.toISOString(),
      },
    ],
    notification_urls: [input.notificationUrl],
  };
  try {
    const res = await fetch(`${BASE[input.environment].api}/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${input.accessToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        "x-idempotency-key": input.idempotencyKey,
      },
      body: JSON.stringify(body),
    });
    const payload: any = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        ok: false,
        error: payload?.error_messages?.[0]?.code ?? `http_${res.status}`,
        message: payload?.error_messages?.[0]?.description,
      };
    }
    const qr = payload?.qr_codes?.[0];
    if (!qr) return { ok: false, error: "no_qr_code" };
    const qrLink =
      qr?.links?.find((l: any) => l?.media?.startsWith?.("image/"))?.href ?? null;
    return {
      ok: true,
      provider_payment_id: String(qr.id),
      provider_order_id: payload?.id ? String(payload.id) : null,
      qr_code_text: qr?.text ?? "",
      qr_code_image_url: qrLink,
      expires_at: qr?.expiration_date ?? expiresAt.toISOString(),
    };
  } catch (e) {
    console.error("[pagbank] create pix error", e);
    return { ok: false, error: "network_error" };
  }
}

/**
 * Consulta o status de uma cobrança específica (reconciliação server-side).
 */
export type FetchOrderResult =
  | {
      ok: true;
      provider_order_id: string;
      pix_payments: Array<{
        provider_payment_id: string;
        status_raw: string;
        amount_cents: number;
        paid_at: string | null;
      }>;
    }
  | { ok: false; error: string };

export async function fetchOrder(input: {
  environment: PagbankEnvironment;
  accessToken: string;
  providerOrderId: string;
}): Promise<FetchOrderResult> {
  try {
    const res = await fetch(`${BASE[input.environment].api}/orders/${input.providerOrderId}`, {
      headers: {
        Authorization: `Bearer ${input.accessToken}`,
        Accept: "application/json",
      },
    });
    if (!res.ok) return { ok: false, error: `http_${res.status}` };
    const payload: any = await res.json();
    const pixPayments = (payload?.charges ?? [])
      .filter((c: any) => c?.payment_method?.type === "PIX")
      .map((c: any) => ({
        provider_payment_id: String(c?.id ?? ""),
        status_raw: String(c?.status ?? "UNKNOWN"),
        amount_cents: Number(c?.amount?.value ?? 0),
        paid_at: c?.paid_at ?? null,
      }));
    return {
      ok: true,
      provider_order_id: String(payload?.id ?? input.providerOrderId),
      pix_payments: pixPayments,
    };
  } catch (e) {
    console.error("[pagbank] fetch order error", e);
    return { ok: false, error: "network_error" };
  }
}

/**
 * Verifica a assinatura oficial de um webhook do PagBank.
 *
 * Regra oficial documentada pelo PagBank:
 *   expected = SHA-256( access_token + "-" + raw_body ) em hexadecimal
 *
 * Não é HMAC. É um digest SHA-256 simples sobre a concatenação
 * `access_token + "-" + payload_bruto`. O `access_token` do lojista é o
 * segredo compartilhado — não há chave separada.
 *
 * O corpo DEVE ser o buffer bruto exato recebido no request; nunca
 * `JSON.stringify()` de um objeto já interpretado.
 *
 * Comparação em tempo constante para evitar ataques de timing.
 */
export function verifyWebhookSignature(input: {
  accessToken: string;
  rawBody: string;
  signatureHeader: string | null;
}): boolean {
  const sig = input.signatureHeader?.trim().toLowerCase();
  if (!sig || !input.accessToken) return false;
  const expected = createHash("sha256")
    .update(`${input.accessToken}-${input.rawBody}`)
    .digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(sig);
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/**
 * Mapeia o status externo do PagBank para o enum canônico local.
 * Estados oficiais: AUTHORIZED, PAID, IN_ANALYSIS, DECLINED, CANCELED, WAITING.
 */
export function mapPagbankStatus(
  raw: string,
):
  | "waiting"
  | "processing"
  | "authorized"
  | "paid"
  | "declined"
  | "canceled"
  | "refunded"
  | "failed" {
  switch (raw?.toUpperCase()) {
    case "PAID":
      return "paid";
    case "AUTHORIZED":
      return "authorized";
    case "WAITING":
      return "waiting";
    case "IN_ANALYSIS":
      return "processing";
    case "DECLINED":
      return "declined";
    case "CANCELED":
      return "canceled";
    case "REFUNDED":
      return "refunded";
    default:
      return "failed";
  }
}
