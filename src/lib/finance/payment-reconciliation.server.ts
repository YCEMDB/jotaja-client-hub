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
    details: log.details
  };
};

/**
 * Detects missing settlements for processed payments.
 */
export const auditMissingSettlements = async (restaurantId: string): Promise<number> => {
  // Find webhook logs that are PROCESSED but have no entry in financial_transactions
  // This uses a subquery to find missing links
  const { data, error } = await supabaseAdmin
    .from('payment_provider_webhook_logs')
    .select('id, payload')
    .eq('account_id', (
       // Sub-select for restaurant accounts
       supabaseAdmin.from('restaurant_payment_accounts').select('id').eq('restaurant_id', restaurantId)
    ))
    .eq('status', 'PROCESSED')
    .not('id', 'in', (
      supabaseAdmin.from('financial_transactions').select('payment_event_id')
    ));

  if (error) return 0;
  return data?.length || 0;
};
