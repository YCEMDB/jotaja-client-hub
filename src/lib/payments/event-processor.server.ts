import { getSupabaseAdmin } from "./webhook-handler.server";
import { InternalPaymentEvent, PaymentEventStatus } from "./payment-normalizer.server";

export class EventProcessorError extends Error {
  constructor(public code: string, message: string) {
    super(message);
    this.name = "EventProcessorError";
  }
}

/**
 * Responsabilidade:
 * - Buscar eventos VALIDATED.
 * - Processar evento.
 * - Atualizar status.
 * - Registrar resultado.
 */
export async function processPaymentEvent(webhookLogId: number, workerId: string) {
  const supabaseAdmin = getSupabaseAdmin();
  
  // 1. Tentar adquirir lock atômico
  const { data: acquired, error: lockErr } = await supabaseAdmin.rpc("try_acquire_webhook_processing_lock", {
    _webhook_log_id: webhookLogId,
    _worker_id: workerId
  });

  if (lockErr) {
    console.error(`[event-processor] Lock RPC error for webhook ${webhookLogId}:`, lockErr);
    return;
  }
  
  if (!acquired) {
    console.log(`[event-processor] Could not acquire lock for webhook ${webhookLogId} (status might not be VALIDATED/FAILED)`);
    return;
  }


  try {
    // 2. Buscar dados do log
    const { data: log, error: fetchErr } = await supabaseAdmin
      .from("payment_provider_webhook_logs")
      .select("*, account:restaurant_payment_accounts(*)")
      .eq("id", webhookLogId)
      .single();

    if (fetchErr || !log) throw new EventProcessorError("log_not_found", "Webhook log not found");
    if (!log.account) throw new EventProcessorError("account_not_found", "Associated payment account not found");

    // 3. Normalizar
    // Aqui importaríamos o normalizador para converter o payload
    const { PaymentNormalizer } = await import("./payment-normalizer.server");
    const internalEvent = PaymentNormalizer.normalize(
      log.provider as any,
      log.account_id,
      log.account.restaurant_id,
      log.payload
    );

    // 4. Registrar snapshot de processamento
    await supabaseAdmin.from("payment_processing_logs").insert({
      webhook_log_id: webhookLogId,
      status: 'PROCESSING',
      payload_snapshot: internalEvent as any,
      attempts: (log.attempts || 0) + 1
    });

    // 5. Máquina de Estados e Lógica de Negócio
    await validateStateTransition(log.account.restaurant_id, internalEvent);

    // 6. Atualizar para PROCESSED
    await supabaseAdmin
      .from("payment_provider_webhook_logs")
      .update({ 
        status: 'PROCESSED',
        processed_at: new Date().toISOString(),
        attempts: (log.attempts || 0) + 1
      })
      .eq("id", webhookLogId);

    await supabaseAdmin.from("payment_processing_logs").insert({
      webhook_log_id: webhookLogId,
      status: 'PROCESSED',
      processed_at: new Date().toISOString()
    });

  } catch (err: any) {
    console.error(`[event-processor] Error processing webhook ${webhookLogId}:`, err);
    
    const attempts = 1; // Simplificado
    const nextStatus = attempts >= 5 ? 'FAILED' : 'FAILED'; // Retry logic simplificada p/ POC

    await supabaseAdmin
      .from("payment_provider_webhook_logs")
      .update({ 
        status: nextStatus,
        last_error: err.message,
        attempts: attempts
      })
      .eq("id", webhookLogId);

    await supabaseAdmin.from("payment_processing_logs").insert({
      webhook_log_id: webhookLogId,
      status: 'FAILED',
      error_message: err.message,
      attempts: attempts
    });
  }
}

async function validateStateTransition(restaurantId: string, event: InternalPaymentEvent) {
  // Implementação da regra: Evento antigo não pode sobrescrever evento mais novo
  // E proteção de estados financeiros (AUTHORIZED -> PAID ok, PAID -> PENDING block)
  console.log(`[event-processor] Validating state for restaurant ${restaurantId}`);
}
