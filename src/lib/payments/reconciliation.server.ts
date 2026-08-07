import { getSupabaseAdmin } from "./webhook-handler.server";

/**
 * Responsabilidade:
 * - Comparar eventos recebidos.
 * - Detectar divergências.
 * - Registrar inconsistências.
 */
export async function runInitialReconciliation(restaurantId: string) {
  const supabaseAdmin = getSupabaseAdmin();
  
  console.log(`[reconciliation] Starting reconciliation for restaurant ${restaurantId}`);
  
  // Buscar eventos VALIDATED que não foram processados há mais de 5 minutos
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  
  const { data: stuckEvents } = await supabaseAdmin
    .from("payment_provider_webhook_logs")
    .select("id, status, created_at")
    .eq("status", "VALIDATED")
    .lt("created_at", fiveMinutesAgo);

  if (stuckEvents && stuckEvents.length > 0) {
    console.warn(`[reconciliation] Found ${stuckEvents.length} stuck events for restaurant ${restaurantId}`);
    // Futuro: enfileirar para re-processamento
  }
  
  return {
    stuck_events_count: stuckEvents?.length || 0
  };
}
