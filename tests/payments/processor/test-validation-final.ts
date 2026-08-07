import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ACCOUNT_ID = "00000000-0000-4000-a000-000000000001";

async function runValidationTests() {
  console.log("=== INICIANDO FASE 4 — FINAL VALIDATION ===");

  // ============================================================
  // TESTE 1 — LOCK EXPIRADO
  // ============================================================
  console.log("\n[TESTE 1] Iniciando: Lock Expirado...");
  
  const oldWorkerId = crypto.randomUUID();
  // Simular lock de 3 minutos atrás
  const { error: seedErr } = await supabaseAdmin
    .from("restaurant_payment_accounts")
    .update({
      refresh_locked_at: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
      refresh_locked_by: oldWorkerId
    } as any)
    .eq("id", ACCOUNT_ID);

  if (seedErr) throw new Error(`Falha ao preparar dados do Teste 1: ${seedErr.message}`);

  const newWorkerId = crypto.randomUUID();
  console.log(`Tentando adquirir lock expirado com novo Worker ID: ${newWorkerId}`);
  
  const { data: acquired, error: acqErr } = await supabaseAdmin.rpc("try_acquire_refresh_lock" as any, {
    p_account_id: ACCOUNT_ID,
    p_worker_id: newWorkerId
  });

  if (acqErr) console.error("Erro RPC Teste 1:", acqErr);

  const { data: checkLock } = await supabaseAdmin
    .from("restaurant_payment_accounts")
    .select("refresh_locked_by, refresh_locked_at")
    .eq("id", ACCOUNT_ID)
    .single();

  const t1Recovered = acquired === true && checkLock?.refresh_locked_by === newWorkerId;
  console.log(`Lock recuperado: ${t1Recovered ? "SIM" : "NÃO"}`);

  // Limpeza Teste 1
  const { data: releasedT1 } = await supabaseAdmin.rpc("release_refresh_lock" as any, {
    p_account_id: ACCOUNT_ID,
    p_worker_id: newWorkerId
  });
  console.log(`Lock liberado (T1): ${releasedT1 ? "SIM" : "NÃO"}`);

  // ============================================================
  // TESTE 2 — EXCEÇÃO DURANTE O CICLO
  // ============================================================
  console.log("\n[TESTE 2] Iniciando: Exceção durante Ciclo...");
  
  const workerT2 = crypto.randomUUID();
  let finallyExecuted = false;
  let lockReleasedT2 = false;

  try {
    // 1. Adquirir lock
    const { data: acqT2 } = await supabaseAdmin.rpc("try_acquire_refresh_lock" as any, {
      p_account_id: ACCOUNT_ID,
      p_worker_id: workerT2
    });

    if (!acqT2) throw new Error("Não foi possível adquirir lock para o Teste 2");
    console.log("Lock adquirido. Simulando exceção...");

    // 2. Simular exceção (não chamamos HTTP nem Mercado Pago)
    throw new Error("TEST_FORCED_REFRESH_FAILURE");

  } catch (e: any) {
    console.log(`Exceção capturada: ${e.message}`);
  } finally {
    // 3. Executar liberação no finally (o que o Token Manager faz)
    finallyExecuted = true;
    const { data: relT2 } = await supabaseAdmin.rpc("release_refresh_lock" as any, {
      p_account_id: ACCOUNT_ID,
      p_worker_id: workerT2
    });
    lockReleasedT2 = !!relT2;
    console.log("Executando finally: release_refresh_lock");
  }

  // 4. Verificar se está liberado
  const { data: checkLockT2 } = await supabaseAdmin
    .from("restaurant_payment_accounts")
    .select("refresh_locked_by")
    .eq("id", ACCOUNT_ID)
    .single();

  const isActuallyReleased = !checkLockT2?.refresh_locked_by;
  
  // 5. Tentar com um segundo worker
  const secondWorkerId = crypto.randomUUID();
  const { data: secondAcq } = await supabaseAdmin.rpc("try_acquire_refresh_lock" as any, {
    p_account_id: ACCOUNT_ID,
    p_worker_id: secondWorkerId
  });

  const t2Success = finallyExecuted && lockReleasedT2 && isActuallyReleased && secondAcq === true;
  console.log(`finally executado: ${finallyExecuted ? "SIM" : "NÃO"}`);
  console.log(`Lock liberado após exceção: ${isActuallyReleased ? "SIM" : "NÃO"}`);
  console.log(`Segundo worker conseguiu adquirir: ${secondAcq ? "SIM" : "NÃO"}`);

  // Limpeza final
  await supabaseAdmin.rpc("release_refresh_lock" as any, {
    p_account_id: ACCOUNT_ID,
    p_worker_id: secondWorkerId
  });

  console.log("\n=== FIM DOS TESTES DE VALIDAÇÃO ===");

  // Relatório Final formatado para o log
  console.log("\n--- RESULTADO FINAL ---");
  console.log(`T1_PASS: ${t1Recovered && releasedT1}`);
  console.log(`T2_PASS: ${t2Success}`);
}

runValidationTests();
