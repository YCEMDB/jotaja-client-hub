import { createClient } from "@supabase/supabase-js";

// Usando o cliente Admin para ignorar RLS durante o teste técnico de concorrência
const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Script de teste de concorrência para a Fase 4.
 * Simula dois workers tentando adquirir o lock simultaneamente para a mesma conta.
 */
async function testConcurrency() {
  console.log("=== INICIANDO TESTE DE CONCORRÊNCIA (FASE 4) ===");

  // 1. Buscar a conta de teste seedada
  const { data: accounts, error: fetchErr } = await supabaseAdmin
    .from("restaurant_payment_accounts")
    .select("id, restaurant_id")
    .eq("id", "00000000-0000-4000-a000-000000000001")
    .single();

  if (fetchErr || !accounts) {
    console.error("ERRO: Nenhuma conta ativa encontrada para o teste.", fetchErr);
    return;
  }

  const accountId = accounts.id;
  const workerA = crypto.randomUUID();
  const workerB = crypto.randomUUID();

  console.log(`Testando Conta: ${accountId}`);
  console.log(`Worker A: ${workerA}`);
  console.log(`Worker B: ${workerB}`);

  // Teste 1: Aquisição simultânea
  console.log("\n1. Teste: Aquisição Simultânea...");
  const [resA, resB] = await Promise.all([
    supabaseAdmin.rpc("try_acquire_refresh_lock" as any, { p_account_id: accountId, p_worker_id: workerA }),
    supabaseAdmin.rpc("try_acquire_refresh_lock" as any, { p_account_id: accountId, p_worker_id: workerB })
  ]);

  console.log(`Worker A Lock: ${resA.data} ${resA.error ? resA.error.message : ""}`);
  console.log(`Worker B Lock: ${resB.data} ${resB.error ? resB.error.message : ""}`);

  const successCount = (resA.data ? 1 : 0) + (resB.data ? 1 : 0);
  if (successCount === 1) {
    console.log("RESULTADO: SUCESSO. Apenas um worker obteve o lock.");
  } else {
    console.error(`RESULTADO: FALHA. ${successCount} workers obtiveram o lock simultaneamente.`);
  }

  // Teste 2: Liberação indevida (B tenta liberar o lock de A)
  console.log("\n2. Teste: Liberação Indevida (B tenta liberar o lock de A)...");
  const winner = resA.data ? workerA : workerB;
  const loser = resA.data ? workerB : workerA;

  const { data: releaseByLoser } = await supabaseAdmin.rpc("release_refresh_lock" as any, { 
    p_account_id: accountId, 
    p_worker_id: loser 
  });
  console.log(`Worker Perdedor tentou liberar: ${releaseByLoser}`);

  const { data: checkLock } = await supabaseAdmin
    .from("restaurant_payment_accounts")
    .select("refresh_locked_by")
    .eq("id", accountId)
    .single();

  if (checkLock?.refresh_locked_by === winner) {
    console.log("RESULTADO: SUCESSO. O lock permanece com o vencedor.");
  } else {
    console.error("RESULTADO: FALHA. O lock foi liberado ou alterado indevidamente.");
  }

  // Teste 3: Liberação correta
  console.log("\n3. Teste: Liberação Correta...");
  const { data: releaseByWinner } = await supabaseAdmin.rpc("release_refresh_lock" as any, { 
    p_account_id: accountId, 
    p_worker_id: winner 
  });
  console.log(`Worker Vencedor liberou: ${releaseByWinner}`);

  const { data: checkLockFinal } = await supabaseAdmin
    .from("restaurant_payment_accounts")
    .select("refresh_locked_by, refresh_locked_at")
    .eq("id", accountId)
    .single();

  if (!checkLockFinal?.refresh_locked_by && !checkLockFinal?.refresh_locked_at) {
    console.log("RESULTADO: SUCESSO. Lock liberado corretamente.");
  } else {
    console.error("RESULTADO: FALHA. Lock ainda presente após liberação.");
  }

  console.log("\n=== FIM DOS TESTES ===");
}

testConcurrency();
