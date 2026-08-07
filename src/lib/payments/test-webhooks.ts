import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const WEBHOOK_URL = "http://localhost:8080/api/public/payments/webhook?provider=mercadopago";

async function runWebhookTests() {
  console.log("=== INICIANDO TESTES DE WEBHOOK (FASE 5) ===");

  // 1. Teste: Assinatura Inválida
  console.log("\n[TESTE 2] Assinatura Inválida...");
  const resInvalid = await fetch(WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Signature": "invalid" },
    body: JSON.stringify({ id: "test_invalid" })
  });
  console.log(`Status: ${resInvalid.status} (Esperado: 401 ou condicional Sandbox)`);

  // 2. Teste: Webhook Válido (Simulado)
  console.log("\n[TESTE 1] Webhook Válido...");
  const eventId = `test_valid_${Date.now()}`;
  const resValid = await fetch(WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Signature": "valid_dummy" },
    body: JSON.stringify({ 
      id: eventId,
      user_id: "00000000-0000-4000-a000-000000000001", // Mapeado no seed da Fase 4
      type: "payment.created" 
    })
  });
  const validText = await resValid.text();
  console.log(`Status: ${resValid.status} (Esperado: 202)`);
  try {
    const validData = JSON.parse(validText);
    console.log(`Mensagem: ${validData.message}`);
  } catch (e) {
    console.log(`Resposta não-JSON: ${validText.slice(0, 100)}...`);
  }


  // 3. Teste: Duplicidade
  console.log("\n[TESTE 3] Evento Duplicado...");
  const resDup = await fetch(WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Signature": "valid_dummy" },
    body: JSON.stringify({ id: eventId, user_id: "00000000-0000-4000-a000-000000000001" })
  });
  console.log(`Status: ${resDup.status} (Esperado: 200)`);
  const dupData = await resDup.json();
  console.log(`Mensagem: ${dupData.message}`);

  // 4. Teste: Payload acima de 256KB
  console.log("\n[TESTE 8] Payload > 256KB...");
  const bigBody = "a".repeat(257 * 1024);
  const resBig = await fetch(WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: bigBody
  });
  console.log(`Status: ${resBig.status} (Esperado: 413)`);

  console.log("\n=== FIM DOS TESTES DE WEBHOOK ===");
}

runWebhookTests();
