import { getSupabaseAdmin } from "./webhook-handler.server";
import { runPaymentEventWorker } from "../../workers/payment-event-worker";

export async function testPaymentProcessingFlow() {
  const supabaseAdmin = getSupabaseAdmin();
  const testId = `test-${Date.now()}`;

  // 0. Preparar conta fake se não existir
  const { data: restaurants } = await supabaseAdmin.from("restaurants").select("id").limit(1);
  const restaurantId = restaurants?.[0]?.id;

  if (!restaurantId) throw new Error("Nenhum restaurante encontrado para o teste");

  const { data: account, error: accErr } = await supabaseAdmin
    .from("restaurant_payment_accounts")
    .insert({
      restaurant_id: restaurantId,
      provider: 'mercadopago',
      provider_account_id: `provider-${testId}`,
      is_active: true,
      provider_status: 'active',
      provider_environment: 'sandbox'
    })
    .select("id")
    .single();

  if (accErr || !account) throw new Error(`Erro ao criar conta de teste: ${accErr?.message}`);
  console.log(`Conta de teste criada: ${account.id}`);

  console.log("--- TEST 1: Evento VALIDATED processado ---");
  
  // 1. Criar um log VALIDATED fake associado à conta
  const { data: log, error: logErr } = await supabaseAdmin
    .from("payment_provider_webhook_logs")
    .insert({
      provider: 'mercadopago',
      provider_event_id: testId,
      payload: { id: testId, action: 'payment.created', type: 'payment' },
      status: 'VALIDATED' as any,
      account_id: account.id
    })
    .select("id")
    .single();

  if (logErr || !log) throw new Error(`Erro ao criar log: ${logErr?.message}`);
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
      status: 'RECEIVED' as any
    });
  
  const test2Passed = dupErr?.code === '23505';
  console.log(`TEST 2 ${test2Passed ? 'PASSED' : 'FAILED'} (Duplicate blocked by DB)`);

  console.log("\n--- TEST 3: Evento fora de ordem ---");
  const pastDate = new Date(Date.now() - 3600000).toISOString(); // 1 hora atrás
  const { data: log3 } = await supabaseAdmin
    .from("payment_provider_webhook_logs")
    .insert({
      provider: 'mercadopago',
      provider_event_id: `${testId}-old`,
      payload: { 
        id: `${testId}-old`, 
        action: 'payment.updated', 
        status: 'approved',
        occurred_at: pastDate // Custom payload field for normalizer
      },
      status: 'VALIDATED' as any,
      account_id: account.id
    })
    .select("id")
    .single();

  await runPaymentEventWorker();


  const { data: finalLog3 } = await supabaseAdmin
    .from("payment_provider_webhook_logs")
    .select("status, last_error")
    .eq("id", log3!.id)
    .single();

  // Se o watermark da conta já foi atualizado pelo Teste 1 (que usou Date.now())
  // E o evento 3 é processado depois, ele deve falhar se o processor identificar ordem incorreta.
  // No Teste 1 usamos new Date().toISOString() no normalizador.
  
  console.log(`Status final do log fora de ordem: ${finalLog3?.status}`);
  const test3Passed = finalLog3?.status === 'FAILED';
  console.log(`TEST 3 ${test3Passed ? 'PASSED' : 'FAILED'}`);

  console.log("\n--- TEST 4: Erro durante processamento e Retry ---");
  // Simular erro via normalizador (provocando uma exceção no processador)
  const { data: log4 } = await supabaseAdmin
    .from("payment_provider_webhook_logs")
    .insert({
      provider: 'mercadopago',
      provider_event_id: `${testId}-error`,
      payload: { id: `${testId}-error`, action: 'payment.updated', force_error: true },
      status: 'VALIDATED' as any,
      account_id: account.id
    })
    .select("id")
    .single();

  await runPaymentEventWorker();

  const { data: finalLog4 } = await supabaseAdmin
    .from("payment_provider_webhook_logs")
    .select("status, attempts, last_error")
    .eq("id", log4!.id)
    .single();

  console.log(`Status final do log com erro: ${finalLog4?.status}, Tentativas: ${finalLog4?.attempts}`);
  const test4Passed = finalLog4?.status === 'FAILED' && (finalLog4?.attempts || 0) > 0;
  console.log(`TEST 4 ${test4Passed ? 'PASSED' : 'FAILED'}`);

  console.log("\n--- TEST 5: Cinco falhas (Status final FAILED) ---");
  // Atualizar para 4 tentativas e rodar o worker que causará a 5ª falha
  await supabaseAdmin
    .from("payment_provider_webhook_logs")
    .update({ attempts: 4, status: 'VALIDATED' as any })
    .eq("id", log4!.id);

  await runPaymentEventWorker();

  const { data: finalLog5 } = await supabaseAdmin
    .from("payment_provider_webhook_logs")
    .select("status, attempts")
    .eq("id", log4!.id)
    .single();

  console.log(`Status após 5 tentativas: ${finalLog5?.status}, Tentativas: ${finalLog5?.attempts}`);
  const test5Passed = (finalLog5?.attempts || 0) >= 5;
  console.log(`TEST 5 ${test5Passed ? 'PASSED' : 'FAILED'}`);


  console.log("\n--- TEST 6: Dois workers simultâneos (Atomic Lock) ---");
  const { data: log6 } = await supabaseAdmin
    .from("payment_provider_webhook_logs")
    .insert({
      provider: 'mercadopago',
      provider_event_id: `${testId}-concurrent`,
      payload: { id: `${testId}-concurrent`, action: 'payment.created' },
      status: 'VALIDATED' as any,
      account_id: account.id
    })
    .select("id")
    .single();

  // Rodar dois processos de processamento em paralelo
  const { processPaymentEvent } = await import("./event-processor.server");
  await Promise.allSettled([
    processPaymentEvent(log6!.id, "worker-1"),
    processPaymentEvent(log6!.id, "worker-2")
  ]);

  // Verificar logs de processamento para ver se houve dupla entrada PROCESSED
  const { data: procLogs } = await supabaseAdmin
    .from("payment_processing_logs")
    .select("status")
    .eq("webhook_log_id", log6!.id);

  const processedEntries = procLogs?.filter(l => l.status === 'PROCESSED');
  console.log(`Entradas PROCESSED encontradas: ${processedEntries?.length}`);
  const test6Passed = processedEntries?.length === 1;

  console.log(`TEST 6 ${test6Passed ? 'PASSED' : 'FAILED'}`);


  return {
    test1Passed,
    test2Passed,
    test3Passed,
    test4Passed,
    test5Passed,
    test6Passed
  };
}


