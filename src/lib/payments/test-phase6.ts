import { getSupabaseAdmin } from "./webhook-handler.server";
import { runPaymentEventWorker } from "../../workers/payment-event-worker";

export async function testPaymentProcessingFlow() {
  const supabaseAdmin = getSupabaseAdmin();
  const testId = `test-${Date.now()}`;

  console.log("--- TEST 1: Evento VALIDATED processado ---");
  
  // 1. Criar um log VALIDATED fake
  const { data: log, error: logErr } = await supabaseAdmin
    .from("payment_provider_webhook_logs")
    .insert({
      provider: 'mercadopago',
      provider_event_id: testId,
      payload: { id: testId, action: 'payment.created', type: 'payment' },
      status: 'VALIDATED'
    })
    .select("id")
    .single();

  if (logErr) throw logErr;
  console.log(`Log criado com ID: ${log.id}`);

  // 2. Executar Worker
  await runPaymentEventWorker();

  // 3. Verificar status final
  const { data: finalLog } = await supabaseAdmin
    .from("payment_provider_webhook_logs")
    .select("status, processed_at")
    .eq("id", log.id)
    .single();

  console.log(`Status final do log: ${finalLog?.status}`);
  const test1Passed = finalLog?.status === 'PROCESSED';
  console.log(`TEST 1 ${test1Passed ? 'PASSED' : 'FAILED'}`);

  console.log("\n--- TEST 2: Evento duplicado ---");
  const { error: dupErr } = await supabaseAdmin
    .from("payment_provider_webhook_logs")
    .insert({
      provider: 'mercadopago',
      provider_event_id: testId,
      payload: {},
      status: 'RECEIVED'
    });
  
  const test2Passed = dupErr?.code === '23505'; // Unique violation
  console.log(`TEST 2 ${test2Passed ? 'PASSED' : 'FAILED'} (Duplicate blocked by DB)`);

  return {
    test1Passed,
    test2Passed
  };
}
