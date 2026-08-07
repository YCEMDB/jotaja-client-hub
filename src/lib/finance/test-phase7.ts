import { processFinancialQueue } from "./financial-event-worker";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { SettlementEvent } from "./financial-types";
import { executeSettlement } from "./payment-settlement.server";

/**
 * Test Validation for Phase 7
 */
export async function runPhase7Tests() {
  console.log("=== STARTING PHASE 7 VALIDATION ===");
  
  const results = [];

  try {
    // Setup: Get a test restaurant and account
    const { data: account } = await supabaseAdmin
      .from('restaurant_payment_accounts')
      .select('id, restaurant_id')
      .limit(1)
      .single();

    if (!account) throw new Error("No test account found");

    // TEST 1: Processed Payment -> Settlement
    console.log("TEST 1: Valid Settlement");
    const { data: log1 } = await supabaseAdmin
      .from('payment_provider_webhook_logs')
      .insert({
        account_id: account.id,
        provider: 'mercadopago',
        provider_event_id: `test_p7_1_${Date.now()}`,
        payload: { id: 'ext_1', status: 'approved', transaction_amount: 100.00 },
        status: 'PROCESSED',
        financial_processing_status: 'PENDING'
      })
      .select()
      .single();

    await processFinancialQueue();
    
    // Check processing result
    const { data: log1Check } = await supabaseAdmin
      .from('payment_provider_webhook_logs')
      .select('financial_processing_status, financial_processing_error')
      .eq('id', log1!.id)
      .single();

    const { data: tx1 } = await supabaseAdmin
      .from('financial_transactions')
      .select('*')
      .eq('payment_event_id', log1!.id)
      .maybeSingle();

    console.log(`Log1 Result: ${log1Check?.financial_processing_status}, Error: ${log1Check?.financial_processing_error}`);

    results.push({
      test: "TEST 1: Valid Settlement",
      status: tx1 && tx1.status === 'SETTLED' ? 'PASS' : 'FAIL'
    });

    // TEST 2: Idempotency (Same payment twice)
    console.log("TEST 2: Idempotency");
    // The worker already marked the log as COMPLETED, so it won't pick it up again.
    // We simulate a race by resetting status but keeping the unique TX.
    await supabaseAdmin
      .from('payment_provider_webhook_logs')
      .update({ financial_processing_status: 'PENDING' })
      .eq('id', log1!.id);
      
    await processFinancialQueue();
    
    const { count: txCount } = await supabaseAdmin
      .from('financial_transactions')
      .select('*', { count: 'exact', head: true })
      .eq('payment_event_id', log1!.id);

    results.push({
      test: "TEST 2: Idempotency",
      status: txCount === 1 ? 'PASS' : 'FAIL'
    });

    // TEST 3: Payment FAILED -> No Settlement
    console.log("TEST 3: Payment Failed");
    const { data: log3 } = await supabaseAdmin
      .from('payment_provider_webhook_logs')
      .insert({
        account_id: account.id,
        provider: 'mercadopago',
        provider_event_id: `test_p7_3_${Date.now()}`,
        payload: { id: 'ext_3', status: 'cancelled', transaction_amount: 50.00 },
        status: 'PROCESSED',
        financial_processing_status: 'PENDING'
      })
      .select()
      .single();

    await processFinancialQueue();
    
    const { data: tx3 } = await supabaseAdmin
      .from('financial_transactions')
      .select('*')
      .eq('payment_event_id', log3!.id)
      .maybeSingle();

    results.push({
      test: "TEST 3: Payment Failed",
      status: !tx3 ? 'PASS' : 'FAIL'
    });

    // TEST 4: Value Divergence
    console.log("TEST 4: Divergent Value");
    // We manually create a transaction with different amount than what we will "receive"
    const { data: log4 } = await supabaseAdmin
      .from('payment_provider_webhook_logs')
      .insert({
        account_id: account.id,
        provider: 'mercadopago',
        provider_event_id: `test_p7_4_${Date.now()}`,
        payload: { id: 'ext_4', status: 'approved', transaction_amount: 150.00 },
        status: 'PROCESSED',
        financial_processing_status: 'PENDING'
      })
      .select()
      .single();

    // The worker will use 150.00. We reconcile with something else if we were doing it manually,
    // but the worker reconciles with the payload. 
    // To trigger DIVERGENT, let's inject a TX manually first with wrong amount.
    await supabaseAdmin.from('financial_transactions').insert({
       restaurant_id: account.restaurant_id,
       payment_event_id: log4!.id,
       provider: 'mercadopago',
       external_payment_id: 'ext_4',
       amount: 140.00, // Divergent
       status: 'SETTLED',
       type: 'CREDIT'
    });
    
    await processFinancialQueue();
    
    const { data: reconLog } = await supabaseAdmin
      .from('financial_reconciliation_logs')
      .select('*')
      .eq('status', 'DIVERGENT')
      .limit(1)
      .maybeSingle();

    results.push({
      test: "TEST 4: Divergent Value",
      status: reconLog ? 'PASS' : 'FAIL'
    });

    // TEST 5: Concurrency (Two workers processing same event)
    console.log("TEST 5: Concurrency");
    const { data: log5 } = await supabaseAdmin
      .from('payment_provider_webhook_logs')
      .insert({
        account_id: account.id,
        provider: 'mercadopago',
        provider_event_id: `test_p7_5_${Date.now()}`,
        payload: { id: 'ext_5', status: 'approved', transaction_amount: 200.00 },
        status: 'PROCESSED',
        financial_processing_status: 'PENDING'
      })
      .select()
      .single();

    // Run two workers in parallel
    await Promise.all([
      processFinancialQueue(),
      processFinancialQueue()
    ]);

    const { count: tx5Count } = await supabaseAdmin
      .from('financial_transactions')
      .select('*', { count: 'exact', head: true })
      .eq('payment_event_id', log5!.id);

    results.push({
      test: "TEST 5: Concurrency",
      status: tx5Count === 1 ? 'PASS' : 'FAIL'
    });

    // TEST 6: Exception/Retry (Simulate failure then fix)
    console.log("TEST 6: Error/Retry");
    const { data: log6 } = await supabaseAdmin
      .from('payment_provider_webhook_logs')
      .insert({
        account_id: account.id,
        provider: 'mercadopago',
        provider_event_id: `test_p7_6_${Date.now()}`,
        payload: { id: 'ext_6', status: 'approved', transaction_amount: 'INVALID' }, // Force numeric conversion error
        status: 'PROCESSED',
        financial_processing_status: 'PENDING'
      })
      .select()
      .single();

    await processFinancialQueue();
    
    const { data: log6Check } = await supabaseAdmin
      .from('payment_provider_webhook_logs')
      .select('financial_processing_attempts, financial_processing_status, financial_processing_error')
      .eq('id', log6!.id)
      .single();

    console.log(`Log6 attempts: ${log6Check?.financial_processing_attempts}, error: ${log6Check?.financial_processing_error}`);

    results.push({
      test: "TEST 6: Retry Logic",
      status: log6Check?.financial_processing_attempts && log6Check.financial_processing_attempts > 0 ? 'PASS' : 'FAIL'
    });

    // TEST 7: Multi-tenant Isolation
    console.log("TEST 7: Isolation");
    // Create a new restaurant to test isolation
    const { data: newRest } = await supabaseAdmin.from('restaurants').insert({
      name: 'Isolation Test Restaurant',
      slug: `iso-test-${Date.now()}`,
      owner_id: (await supabaseAdmin.auth.getUser()).data.user?.id || '00000000-0000-0000-0000-000000000000'
    }).select().single();

    if (newRest) {
      try {
        // Attempt to execute settlement for another restaurant ID (should fail via RLS or manual check)
        // Our worker has an internal check for restaurant_id validity.
        const settlementEvent: SettlementEvent = {
          payment_event_id: 99999,
          restaurant_id: '00000000-0000-0000-0000-000000000000', // Invalid
          provider: 'mercadopago',
          external_payment_id: 'ext_iso',
          amount: 100,
          currency: 'BRL',
          type: 'CREDIT',
          occurred_at: new Date().toISOString()
        };

        let isoError = null;
        try {
          await executeSettlement(settlementEvent);
        } catch (e: any) {
          isoError = e.message;
        }

        results.push({
          test: "TEST 7: Isolation",
          status: isoError?.includes('Invalid restaurant_id') ? 'PASS' : 'FAIL'
        });
      } finally {
        // Cleanup
        await supabaseAdmin.from('restaurants').delete().eq('id', newRest.id);
      }
    } else {
      results.push({ test: "TEST 7: Isolation", status: 'BLOCKED', error: 'Could not create test restaurant' });
    }

  } catch (e: any) {
    console.error("Test execution failed:", e);
    results.push({ test: "General Failure", status: 'FAIL', error: e.message });
  }

  console.table(results);
  return results;
}
