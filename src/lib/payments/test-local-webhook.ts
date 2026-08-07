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

    console.log(`[SETUP] Conta MP: ${providerAccountId} (ID: ${accountId})`);

    // 2. Teste: Webhook Válido
    console.log("\n[TESTE 1] Webhook Válido (Roteado)...");
    const eventId1 = `evt_v1_${Date.now()}`;
    const payload1 = JSON.stringify({ 
      id: eventId1,
      user_id: providerAccountId,
      type: "payment.created" 
    });
    const result1 = await handlePaymentWebhook("mercadopago", payload1, { "x-signature": "valid_dummy" });
    console.log("Resultado 1:", result1.status, result1.message);

    // 3. Teste: Duplicidade
    console.log("\n[TESTE 2] Evento Duplicado...");
    const resultDup = await handlePaymentWebhook("mercadopago", payload1, { "x-signature": "valid_dummy" });
    console.log("Resultado Duplicado:", resultDup.message);

    // 4. Teste: Assinatura Inválida
    console.log("\n[TESTE 3] Assinatura Inválida...");
    const eventId2 = `evt_invalid_${Date.now()}`;
    const payload2 = JSON.stringify({ id: eventId2, user_id: providerAccountId });
    const resultInvalid = await handlePaymentWebhook("mercadopago", payload2, { "x-signature": "evil" });
    console.log("Resultado Assinatura (Deve ser 401):", resultInvalid.status);

    // 5. Teste: Conta Inativa
    await supabase.from("restaurant_payment_accounts").update({ is_active: false }).eq("id", accountId);
    console.log("\n[TESTE 4] Conta Inativa...");
    const eventId3 = `evt_inactive_${Date.now()}`;
    const payload3 = JSON.stringify({ id: eventId3, user_id: providerAccountId });
    const resultInactive = await handlePaymentWebhook("mercadopago", payload3, { "x-signature": "valid_dummy" });
    console.log("Resultado Inativa (Deve ser 200/IGNORED_INACTIVE):", resultInactive.status, resultInactive.message);

    // Limpeza
    await supabase.from("restaurant_payment_accounts").delete().eq("id", accountId);
    console.log("\n[CLEANUP] Conta de teste removida.");

  } catch (err: any) {
    console.error("ERRO CRÍTICO NO TESTE:", err.message);
  }
}

runLocalTests();
