import { handlePaymentWebhook, getSupabaseAdmin } from "./webhook-handler.server";

async function runLocalTests() {
  console.log("=== INICIANDO TESTES LOCAIS (BYPASS HTTP) ===");
  
  try {
    const supabase = getSupabaseAdmin();
    
    // 1. Criar um restaurante de teste se não existir
    const { data: restaurant } = await supabase
      .from("restaurants")
      .insert({ name: "Webhook Test Restaurant", slug: `test-webhook-${Date.now()}` })
      .select("id")
      .single();

    if (!restaurant) throw new Error("Falha ao criar restaurante");
    const restaurantId = restaurant.id;

    // 2. Criar uma conta de pagamento vinculada
    const providerAccountId = `mp_test_${Date.now()}`;
    await supabase.from("restaurant_payment_accounts").insert({
      restaurant_id: restaurantId,
      provider: "mercadopago",
      provider_account_id: providerAccountId,
      provider_status: "active",
      provider_environment: "sandbox",
      is_active: true
    });

    console.log(`\n[SETUP] Restaurante: ${restaurantId}, MP Account: ${providerAccountId}`);

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
      console.log("Log Validado:", { status: log.status, account_id: log.account_id });
    }

    // 4. Teste: Duplicidade
    console.log("\n[TESTE 2] Evento Duplicado...");
    const resultDup = await handlePaymentWebhook("mercadopago", payload, headers);
    console.log("Resultado Duplicado:", resultDup.message);

    // 5. Teste: Assinatura Inválida
    console.log("\n[TESTE 3] Assinatura Inválida...");
    const resultInvalid = await handlePaymentWebhook("mercadopago", payload, { "x-signature": "evil" });
    console.log("Resultado Assinatura:", resultInvalid.status);

    // Limpeza
    await supabase.from("restaurants").delete().eq("id", restaurantId);
    console.log("\n[CLEANUP] Test data removed.");

  } catch (err: any) {
    console.error("ERRO CRÍTICO NO TESTE:", err.message);
  }
}

runLocalTests();
