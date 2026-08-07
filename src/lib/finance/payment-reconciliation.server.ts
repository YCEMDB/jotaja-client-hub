import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { FinancialTransaction, ReconciliationResult } from "./financial-types";

/**
 * Reconciles a financial transaction against the original provider data.
 * Detects divergences in amounts.
 */
export const reconcileTransaction = async (
  transaction: FinancialTransaction,
  receivedAmount: number
): Promise<ReconciliationResult> => {
  console.log(`[Reconciliation] Reconciling transaction ${transaction.id}`);

  const expectedAmount = Number(transaction.amount);
  const diff = receivedAmount - expectedAmount;
  
  let status: 'MATCHED' | 'DIVERGENT' = 'MATCHED';
  if (Math.abs(diff) > 0.001) { // Floating point safety
    status = 'DIVERGENT';
    console.warn(`[Reconciliation] Divergence detected for TX ${transaction.id}: Expected ${expectedAmount}, Received ${receivedAmount}`);
  }

  // Record reconciliation log
  const { data: log, error: logError } = await supabaseAdmin
    .from('financial_reconciliation_logs')
    .insert({
      restaurant_id: transaction.restaurant_id,
      financial_transaction_id: transaction.id,
      expected_amount: expectedAmount,
      received_amount: receivedAmount,
      status: status,
      details: {
        reconciled_at: new Date().toISOString(),
        diff: diff
      }
    })
    .select()
    .single();

  if (logError) {
    console.error(`[Reconciliation] Error recording log:`, logError);
    throw logError;
  }

  return {
    status,
    financial_transaction_id: transaction.id,
    expected_amount: expectedAmount,
    received_amount: receivedAmount,
    difference: diff,
    details: log.details as Record<string, any>
  };
};

/**
 * Detects missing settlements for processed payments.
 */
export const auditMissingSettlements = async (restaurantId: string): Promise<number> => {
  // 1. Get account IDs for restaurant
  const { data: accounts } = await supabaseAdmin
    .from('restaurant_payment_accounts')
    .select('id')
    .eq('restaurant_id', restaurantId);

  if (!accounts || accounts.length === 0) return 0;
  const accountIds = accounts.map(a => a.id);

  // 2. Get already settled event IDs
  const { data: settledEvents } = await supabaseAdmin
    .from('financial_transactions')
    .select('payment_event_id');
  
  const settledIds = settledEvents?.map(e => e.payment_event_id) || [];

  // 3. Find webhook logs that are PROCESSED but not settled
  let query = supabaseAdmin
    .from('payment_provider_webhook_logs')
    .select('id', { count: 'exact', head: true })
    .in('account_id', accountIds)
    .eq('status', 'PROCESSED');

  if (settledIds.length > 0) {
    query = query.not('id', 'in', `(${settledIds.join(',')})`);
  }

  const { count, error } = await query;
  return count || 0;
};
