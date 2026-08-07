import { processPaymentEvent } from "../lib/payments/event-processor.server";
import { getSupabaseAdmin } from "../lib/payments/webhook-handler.server";

/**
 * Responsabilidade:
 * - Executar processamento assíncrono.
 * - Controlar retry.
 * - Evitar processamento concorrente.
 */
export async function runPaymentEventWorker() {
  const workerId = `worker-${crypto.randomUUID().split('-')[0]}`;
  const supabaseAdmin = getSupabaseAdmin();

  console.log(`[worker] Starting payment event worker ${workerId}`);

  // Buscar próximos eventos VALIDATED
  const { data: events, error } = await supabaseAdmin
    .from("payment_provider_webhook_logs")
    .select("id")
    .eq("status", "VALIDATED")
    .order("created_at", { ascending: true })
    .limit(10);

  if (error) {
    console.error("[worker] Error fetching events:", error);
    return;
  }

  if (!events || events.length === 0) {
    return;
  }

  console.log(`[worker] Found ${events.length} events to process`);

  for (const event of events) {
    await processPaymentEvent(event.id, workerId);
  }
}
