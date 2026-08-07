import { handlePaymentWebhook, getSupabaseAdmin } from "./webhook-handler.server";

async function runLocalTests() {
  console.log("=== INICIANDO TESTES LOCAIS (BYPASS HTTP) ===");
  
  try {
    const provider = "mercadopago";
    const payload = JSON.stringify({ 
      id: `test_local_${Date.now()}`,
      user_id: "00000000-0000-4000-a000-000000000001",
      type: "payment.created" 
    });
    const headers = { "x-signature": "valid_dummy" };

    console.log("\n[TESTE 1] Chamada direta ao handlePaymentWebhook...");
    const result = await handlePaymentWebhook(provider, payload, headers);
    console.log("Resultado:", JSON.stringify(result, null, 2));

    if (result.status === 202 || result.status === 200) {
      console.log("\n[VERIFICAÇÃO] Buscando log no banco...");
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase
        .from("payment_provider_webhook_logs")
        .select("*")
        .eq("id", result.logId)
        .single();
      
      if (error) console.error("Erro ao buscar log:", error);
      else console.log("Log encontrado:", {
        id: data.id,
        status: data.status,
        account_id: data.account_id
      });
    }

  } catch (err: any) {
    console.error("ERRO CRÍTICO NO TESTE:", err.message, err.stack);
  }
}

runLocalTests();
