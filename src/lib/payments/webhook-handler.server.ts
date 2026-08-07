import { getProviderAdapter, PaymentProvider, PaymentProviderError } from "./framework";
import { supabase } from "@/integrations/supabase/client";

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
    const adapter = await getProviderAdapter(providerName);
    
    // 1. Validar Assinatura (Antes de qualquer roteamento)
    const isValid = await adapter.verifyWebhookSignature(payload, headers);
    if (!isValid) {
      console.warn(`[webhook-handler] Invalid signature for provider ${providerName}`);
      return { status: 401, message: "Unauthorized" };
    }

    // 2. Parse do Evento
    const jsonPayload = JSON.parse(payload);
    const event = adapter.parseWebhookEvent(jsonPayload);
    
    if (!event.event_id) {
      return { status: 400, message: "Bad Request: Missing event_id" };
    }

    // 3. Idempotência e Persistência Inicial
    const { data: logData, error: logErr } = await supabase
      .from("payment_provider_webhook_logs" as any)
      .insert({
        provider: providerName,
        provider_event_id: event.event_id,
        payload: jsonPayload,
        headers: headers,
        status: 'RECEIVED'
      } as any)
      .select("id")
      .maybeSingle();

    // Se falhar por constraint de unicidade (ON CONFLICT DO NOTHING embutido via 200/Ignore)
    if (logErr) {
      if (logErr.code === '23505') {
        console.log(`[webhook-handler] Duplicate event ${event.event_id} for ${providerName}. Ignoring.`);
        return { status: 200, message: "IGNORED_DUPLICATE" };
      }
      throw logErr;
    }

    const logId = (logData as any).id;

    // 4. Roteamento Interno (Resolver Restaurante)
    const { data: account, error: routeErr } = await supabase.rpc("get_payment_account_for_routing" as any, {
      p_provider: providerName,
      p_provider_account_id: event.provider_account_id
    });

    if (routeErr || !account || (account as any).length === 0) {
      console.log(`[webhook-handler] No active account found for ${providerName} ID ${event.provider_account_id}.`);
      await supabase
        .from("payment_provider_webhook_logs" as any)
        .update({ status: 'IGNORED' } as any)
        .eq("id", logId);
      return { status: 200, message: "IGNORED_UNKNOWN_ACCOUNT", logId };
    }

    const accountData = (account as any)[0];

    // 5. Vincular conta ao log e marcar como VALIDATED
    await supabase
      .from("payment_provider_webhook_logs" as any)
      .update({ 
        account_id: accountData.id || null, // Se a RPC não retornar ID, precisaremos ajustar a RPC
        status: accountData.is_active ? 'VALIDATED' : 'IGNORED'
      } as any)
      .eq("id", logId);

    return { 
      status: accountData.is_active ? 202 : 200, 
      message: accountData.is_active ? "ACCEPTED" : "IGNORED_INACTIVE",
      logId 
    };

  } catch (err: any) {
    console.error(`[webhook-handler] Critical error: ${err.message}`);
    return { status: 500, message: "Internal Server Error" };
  }
}
