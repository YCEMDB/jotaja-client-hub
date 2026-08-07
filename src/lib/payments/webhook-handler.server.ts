import { getProviderAdapter, PaymentProvider } from "./framework";
import { createClient } from "@supabase/supabase-js";

export function getSupabaseAdmin() {

  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing Supabase configuration (URL or Service Role Key)");
  }
  return createClient(url, key);
}

export interface WebhookProcessingResult {
  status: number;
  message: string;
  logId?: number;
}

export async function handlePaymentWebhook(
  provider: string,
  payload: string,
  headers: Record<string, string>
): Promise<WebhookProcessingResult> {
  const providerName = provider.toLowerCase() as PaymentProvider;
  
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const adapter = await getProviderAdapter(providerName);
    
    // 1. Validar Assinatura (Antes de qualquer roteamento)
    const isValid = await adapter.verifyWebhookSignature(payload, headers);
    if (!isValid) {
      console.warn(`[webhook-handler] Invalid signature for provider ${providerName}`);
      return { status: 401, message: "Unauthorized" };
    }


    // 2. Parse do Evento
    let jsonPayload: any;
    try {
      jsonPayload = JSON.parse(payload);
    } catch (e) {
      return { status: 400, message: "Invalid JSON" };
    }

    const event = adapter.parseWebhookEvent(jsonPayload);
    
    if (!event.event_id) {
      console.warn(`[webhook-handler] Missing event_id for ${providerName}`);
      return { status: 400, message: "Bad Request: Missing event_id" };
    }

    // 3. Idempotência e Persistência Inicial
    const { data: logData, error: logErr } = await supabaseAdmin
      .from("payment_provider_webhook_logs")
      .insert({
        provider: providerName,
        provider_event_id: event.event_id,
        payload: jsonPayload,
        headers: headers,
        status: 'RECEIVED'
      })
      .select("id")
      .maybeSingle();

    if (logErr) {
      if (logErr.code === '23505') {
        console.log(`[webhook-handler] Duplicate event ${event.event_id} for ${providerName}. Ignoring.`);
        return { status: 200, message: "IGNORED_DUPLICATE" };
      }
      throw logErr;
    }

    const logId = (logData as any).id;

    // 4. Roteamento Interno (Resolver Restaurante)
    const { data: accounts, error: routeErr } = await supabaseAdmin.rpc("get_payment_account_for_routing", {
      p_provider: providerName,
      p_provider_account_id: event.provider_account_id
    });

    if (routeErr) throw routeErr;

    const account = Array.isArray(accounts) ? accounts[0] : accounts;

    if (!account) {
      console.log(`[webhook-handler] No active account found for ${providerName} ID ${event.provider_account_id}.`);
      await supabaseAdmin
        .from("payment_provider_webhook_logs")
        .update({ status: 'IGNORED' })
        .eq("id", logId);
      return { status: 200, message: "IGNORED_UNKNOWN_ACCOUNT", logId };
    }

    // 5. Vincular conta ao log e marcar como VALIDATED
    const { error: updateErr } = await supabaseAdmin
      .from("payment_provider_webhook_logs")
      .update({ 
        account_id: account.id,
        status: account.is_active ? 'VALIDATED' : 'IGNORED'
      })
      .eq("id", logId);

    if (updateErr) throw updateErr;

    return { 
      status: account.is_active ? 202 : 200, 
      message: account.is_active ? "ACCEPTED" : "IGNORED_INACTIVE",
      logId 
    };

  } catch (err: any) {
    console.error(`[webhook-handler] Critical error: ${err.message}`, err);
    return { status: 500, message: `Internal Server Error: ${err.message}` };
  }
}
