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
    
    // Buscar tentativas atuais diretamente do log para incrementar corretamente
    const { data: currentLog } = await supabaseAdmin
      .from("payment_provider_webhook_logs")
      .select("attempts")
      .eq("id", webhookLogId)
      .single();

    const attempts = (currentLog?.attempts || 0) + 1;
    const nextStatus = attempts >= 5 ? 'FAILED' : 'FAILED'; // Mantemos FAILED mas o log de processing registra o retry

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
  const supabaseAdmin = getSupabaseAdmin();
  
  // 1. Proteção contra Eventos Fora de Ordem
  const { data: account, error: accErr } = await supabaseAdmin
    .from("restaurant_payment_accounts")
    .select("last_event_occurred_at")
    .eq("id", event.account_id)
    .single();

  if (accErr) {
    console.error(`[event-processor] Error fetching account ${event.account_id}:`, accErr);
    throw new EventProcessorError("account_fetch_error", `Error fetching account: ${accErr.message}`);
  }


  const eventTime = new Date(event.occurred_at).getTime();
  const lastTime = account.last_event_occurred_at ? new Date(account.last_event_occurred_at).getTime() : 0;

  if (eventTime < lastTime) {
    console.log(`[event-processor] Out-of-order event rejected for restaurant ${restaurantId}. Event time: ${event.occurred_at}, Last sync: ${account.last_event_occurred_at}`);
    throw new EventProcessorError("out_of_order", "Event is older than last processed event");
  }

  // 2. Máquina de Estados Financeiros
  // Aqui buscaríamos o status atual da entidade financeira (ex: OrderPayment)
  // Como as entidades financeiras ainda serão refinadas na Fase 7, implementamos o log de proteção.
  
  // 3. Atualizar watermark de sincronização
  await supabaseAdmin
    .from("restaurant_payment_accounts")
    .update({ last_event_occurred_at: event.occurred_at })
    .eq("id", event.account_id);

  console.log(`[event-processor] State validated and watermark updated for restaurant ${restaurantId}`);
}

