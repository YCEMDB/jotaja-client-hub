import { handlePaymentWebhook, getSupabaseAdmin } from "./webhook-handler.server";

async function runLocalTests() {
  console.log("=== INICIANDO TESTES LOCAIS (BYPASS HTTP) ===");
  
  const supabase = getSupabaseAdmin();
  const restaurantId = "83fe78f2-7366-4baf-afd8-0755dd73f00f";
  
  try {
    // 1. Criar uma conta de pagamento temporária
    const providerAccountId = `mp_test_${Date.now()}`;
    const { data: account, error: accErr } = await supabase.from("restaurant_payment_accounts").insert({
      restaurant_id: restaurantId,
      provider: "mercadopago",
      provider_account_id: providerAccountId,
      provider_status: "active",
      provider_environment: "sandbox",
      is_active: true
    }).select("id").single();

    if (accErr) throw new Error(`Falha ao criar conta: ${accErr.message}`);
    const accountId = account.id;

    console.log(`[SETUP] Restaurante: ${restaurantId}, MP Account: ${providerAccountId} (ID: ${accountId})`);

    // 3. Teste: Webhook Válido
    console.log("\n[TESTE 1] Webhook Válido (Roteado)...");
    const payload = JSON.stringify({ 
      id: `evt_valid_${Date.now()}`,
      user_id: providerAccountId,
      type: "payment.created" 
    });
    const headers = { "x-signature": "valid_dummy" };

    const result = await handlePaymentWebhook("mercadopago", payload, headers);
    console.log("Resultado:", JSON.stringify(result, null, 2));

    if (result.status === 202) {
      const { data: log } = await supabase
        .from("payment_provider_webhook_logs")
        .select("*")
        .eq("id", result.logId)
        .single();
      console.log("Log Validado:", { 
        status: log.status, 
        account_id: log.account_id,
        matched: log.account_id === accountId ? "SIM" : "NÃO" 
      });
    }

    // 4. Teste: Duplicidade
    console.log("\n[TESTE 2] Evento Duplicado...");
    const resultDup = await handlePaymentWebhook("mercadopago", payload, headers);
    console.log("Resultado Duplicado:", resultDup.message);

    // 5. Teste: Assinatura Inválida
    console.log("\n[TESTE 3] Assinatura Inválida...");
    const resultInvalid = await handlePaymentWebhook("mercadopago", payload, { "x-signature": "evil" });
    console.log("Resultado Assinatura:", resultInvalid.status);

    // Limpeza parcial (apenas a conta de pagamento criada)
    await supabase.from("restaurant_payment_accounts").delete().eq("id", accountId);
    console.log("\n[CLEANUP] Conta de teste removida.");

  } catch (err: any) {
    console.error("ERRO CRÍTICO NO TESTE:", err.message);
  }
}

runLocalTests();
