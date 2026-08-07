import { MercadoPagoConfig, Payment } from "mercadopago";
const BASE_API = "https://api.mercadopago.com";
function envCreds() {
    const cid = process.env.MERCADOPAGO_CLIENT_ID;
    const sec = process.env.MERCADOPAGO_CLIENT_SECRET;
    return cid && sec ? { clientId: cid, clientSecret: sec } : null;
}
export function siteUrl() {
    return process.env.PUBLIC_SITE_URL ?? "https://comandahub.online";
}
export function mercadopagoRedirectUri() {
    return `${siteUrl()}/api/public/mercadopago/callback`;
}
export function buildAuthorizationUrl(input) {
    const creds = envCreds();
    if (!creds)
        return { ok: false, error: "missing_credentials" };
    const url = new URL("https://auth.mercadopago.com.br/authorization");
    url.searchParams.set("client_id", creds.clientId);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("platform_id", "mp");
    url.searchParams.set("redirect_uri", mercadopagoRedirectUri());
    url.searchParams.set("state", input.state);
    return { ok: true, url: url.toString() };
}
export async function exchangeAuthorizationCode(input) {
    const creds = envCreds();
    if (!creds)
        return { ok: false, error: "missing_credentials" };
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
        const body = await res.json();
        if (!res.ok)
            return { ok: false, error: body?.message ?? `http_${res.status}` };
        return {
            ok: true,
            access_token: body.access_token,
            refresh_token: body.refresh_token ?? null,
            expires_in: body.expires_in ?? null,
            user_id: body.user_id ? String(body.user_id) : null,
            public_key: body.public_key ?? null,
        };
    }
    catch (e) {
        console.error("[mercadopago] exchange error", e);
        return { ok: false, error: "network_error" };
    }
}
export async function refreshToken(input) {
    const creds = envCreds();
    if (!creds)
        return { ok: false, error: "missing_credentials" };
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
                grant_type: "refresh_token",
                refresh_token: input.refreshToken,
            }),
        });
        const body = await res.json();
        if (!res.ok)
            return { ok: false, error: body?.message ?? `http_${res.status}`, status: res.status };
        return {
            ok: true,
            access_token: body.access_token,
            refresh_token: body.refresh_token ?? null,
            expires_in: body.expires_in ?? null,
        };
    }
    catch (e) {
        console.error("[mercadopago] refresh error", e);
        return { ok: false, error: "network_error" };
    }
}
export async function createPixCharge(input) {
    try {
        // Se o token começar com APP_USR-, o MP exige produção. 
        // Se começar com TEST-, exige sandbox.
        // O erro "Unauthorized use of live credentials" ocorre quando usamos um token de produção (APP_USR-)
        // em uma requisição que o MP identifica como sandbox ou vice-versa.
        const client = new MercadoPagoConfig({
            accessToken: input.accessToken,
            options: { timeout: 10000 }
        });
        const payment = new Payment(client);
        const payload = {
            transaction_amount: input.amount,
            description: input.description,
            payment_method_id: "pix",
            payer: {
                email: "test_user_123456@testuser.com",
                first_name: "Test",
                last_name: "User",
                identification: {
                    type: "CPF",
                    number: "19119119100"
                }
            },
            external_reference: input.referenceId,
            notification_url: input.notificationUrl,
        };
        const response = await payment.create({
            body: payload,
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
            expires_at: response.date_of_expiration || new Date(Date.now() + 30 * 60000).toISOString(),
        };
    }
    catch (e) {
        console.error("[mercadopago] sdk error details:", {
            message: e.message,
            cause: e.cause,
            stack: e.stack
        });
        return {
            ok: false,
            error: e.cause?.[0]?.code ?? e.message ?? "sdk_error",
            message: e.cause?.[0]?.description ?? e.message
        };
    }
}
