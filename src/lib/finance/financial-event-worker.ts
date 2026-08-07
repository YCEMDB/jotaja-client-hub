import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { executeSettlement } from "./payment-settlement.server";
import { reconcileTransaction } from "./payment-reconciliation.server";
import { SettlementEvent } from "./financial-types";

const MAX_ATTEMPTS = 5;
const RETRY_DELAY = [1000, 2000, 3000, 5000]; // ms

/**
 * Main worker loop to process PROCESSED payment events into financial transactions.
 * Uses pessimistic locking via financial_processing_status on webhook_logs.
 */
export const processFinancialQueue = async () => {
  console.log(`[FinancialWorker] Checking for pending settlements...`);

  // 1. Fetch next eligible events (Multi-tenant safe via isolation in fetch)
  // We use the status 'PROCESSED' from Phase 6 and financial_processing_status 'PENDING'
  const { data: events, error: fetchError } = await supabaseAdmin
    .from('payment_provider_webhook_logs')
    .select(`
      id, 
      account_id, 
      provider, 
      payload,
      financial_processing_attempts,
      restaurant_payment_accounts!inner(restaurant_id)
    `)
    .eq('status', 'PROCESSED')
    .eq('financial_processing_status', 'PENDING')
    .lt('financial_processing_attempts', MAX_ATTEMPTS)
    .order('created_at', { ascending: true })
    .limit(10);

  if (fetchError || !events) return;

  for (const eventLog of events) {
    const restaurantId = (eventLog.restaurant_payment_accounts as any).restaurant_id;
    
    // 2. Atomic Lock attempt using our new status
    // We update to 'PROCESSING' to avoid other workers picking it up
    const { data: lockedEvent, error: lockError } = await supabaseAdmin
      .from('payment_provider_webhook_logs')
      .update({ financial_processing_status: 'PROCESSING' })
      .eq('id', eventLog.id)
      .eq('financial_processing_status', 'PENDING')
      .select()
      .single();

    if (lockError || !lockedEvent) continue; // Lost the race

    try {
      const payload = eventLog.payload as any;
      
      // Phase 6 uses normalized events, but we confirm payment status here
      // Financial integration only for SUCCESSFUL payments (normalizer maps to internal status)
      const isPaid = payload.status === 'approved' || payload.status === 'paid' || payload.status === 'SUCCESS';
      
      if (!isPaid) {
         await markAsFailed(eventLog.id, "Payment status not eligible for settlement", true);
         continue;
      }

      // 3. Map to SettlementEvent
      const settlementEvent: SettlementEvent = {
        payment_event_id: eventLog.id as any,
        restaurant_id: restaurantId,
        provider: eventLog.provider,
        external_payment_id: payload.id || payload.transaction_id,
        amount: Number(payload.transaction_amount || payload.amount || 0),
        currency: payload.currency || 'BRL',
        type: 'CREDIT',
        occurred_at: new Date().toISOString()
      };

      // 4. Execute Settlement (Atomic via DB unique constraint)
      const transaction = await executeSettlement(settlementEvent);

      if (transaction) {
        // 5. Immediate Reconciliation
        await reconcileTransaction(transaction, settlementEvent.amount);

        // 6. Mark as Completed
        await supabaseAdmin
          .from('payment_provider_webhook_logs')
          .update({ 
            financial_processing_status: 'COMPLETED',
            processed_at: new Date().toISOString()
          })
          .eq('id', eventLog.id);
      }

    } catch (err: any) {
      console.error(`[FinancialWorker] Settlement failed for event ${eventLog.id}:`, err);
      await markAsFailed(eventLog.id, err.message, false, eventLog.financial_processing_attempts || 0);
    }
  }
};

async function markAsFailed(id: number, error: string, permanent: boolean, currentAttempts: number = 0) {
  const nextStatus = permanent || currentAttempts >= MAX_ATTEMPTS - 1 ? 'FAILED' : 'PENDING';
  
  await supabaseAdmin
    .from('payment_provider_webhook_logs')
    .update({ 
      financial_processing_status: nextStatus,
      financial_processing_error: error,
      financial_processing_attempts: currentAttempts + 1
    })
    .eq('id', id);
}
