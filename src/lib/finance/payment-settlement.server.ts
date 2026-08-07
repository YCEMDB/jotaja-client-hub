import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { SettlementEvent, FinancialTransaction } from "./financial-types";

/**
 * Validates and executes a financial settlement for a processed payment event.
 * Uses atomic DB insertion for idempotency.
 */
export const executeSettlement = async (event: SettlementEvent): Promise<FinancialTransaction | null> => {
  console.log(`[Settlement] Starting settlement for event ${event.payment_event_id} (Restaurant: ${event.restaurant_id})`);

  // 1. Double check restaurant_id exists and is valid (multi-tenant safety)
  const { data: restaurant, error: restError } = await supabaseAdmin
    .from('restaurants')
    .select('id')
    .eq('id', event.restaurant_id)
    .single();

  if (restError || !restaurant) {
    throw new Error(`Invalid restaurant_id: ${event.restaurant_id}`);
  }

  // 2. Atomic Insert with ON CONFLICT DO NOTHING (Idempotency)
  const { data: tx, error: txError } = await supabaseAdmin
    .from('financial_transactions')
    .insert({
      restaurant_id: event.restaurant_id,
      payment_event_id: event.payment_event_id,
      provider: event.provider,
      external_payment_id: event.external_payment_id,
      amount: event.amount,
      currency: event.currency || 'BRL',
      type: event.type,
      status: 'SETTLED',
      settled_at: new Date().toISOString()
    })
    .select()
    .single();

  if (txError) {
    // Check if it was a uniqueness violation (already settled)
    if (txError.code === '23505') {
      console.log(`[Settlement] Event ${event.payment_event_id} already settled. Skipping.`);
      
      // Fetch existing to return it
      const { data: existingTx } = await supabaseAdmin
        .from('financial_transactions')
        .select('*')
        .eq('payment_event_id', event.payment_event_id)
        .single();
        
      return existingTx as FinancialTransaction;
    }
    
    console.error(`[Settlement] Error creating transaction:`, txError);
    throw txError;
  }

  console.log(`[Settlement] Transaction created: ${tx.id}`);
  return tx as FinancialTransaction;
};

/**
 * Check if a settlement already exists for a payment event.
 */
export const checkSettlementExists = async (paymentEventId: number): Promise<boolean> => {
  const { count, error } = await supabaseAdmin
    .from('financial_transactions')
    .select('*', { count: 'exact', head: true })
    .eq('payment_event_id', paymentEventId);
    
  return !error && (count ?? 0) > 0;
};
