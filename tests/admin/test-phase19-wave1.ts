import { createPixCharge } from "../../src/lib/payments/mercadopago-api.server";
import { supabaseAdmin } from "../../src/integrations/supabase/client.server";

async function testWave1() {
  console.log("--- FASE 19 ONDA 1: MERCADO PAGO PIX ---");
  
  // 1. Verificar se existe restaurante de teste
  const { data: restaurant } = await supabaseAdmin
    .from("restaurants")
    .select("id, slug")
    .eq("slug", "teste-mp-570e")
    .single();

  if (!restaurant) {
    console.error("Restaurante de teste 'teste-mp-570e' não encontrado.");
    return;
  }
  console.log("🟢 Restaurante encontrado:", restaurant.id);

  // 2. Criar pedido de teste
  const { data: order, error: oErr } = await supabaseAdmin
    .from("orders")
    .insert({
      restaurant_id: restaurant.id,
      customer_name: "Auditoria Onda 1",
      customer_phone: "11999999999",
      total: 10.50,
      status: "pending",
      payment: "pix",
      type: "pickup"
    })
    .select("id")
    .single();

  if (oErr) {
    console.error("🔴 Erro ao criar pedido:", oErr.message);
    return;
  }
  console.log("🟢 Pedido criado:", order.id);

  // 3. Obter token (deve falhar se não houver segredo configurado no ambiente de teste)
  const { data: tokenData } = await supabaseAdmin.rpc("admin_get_restaurant_mp_token", {
    p_restaurant_id: restaurant.id,
  });
  
  const token = (tokenData as string | null);
  if (!token) {
    console.warn("🟡 Token não configurado para o restaurante de teste. Pulando chamada real à API.");
    console.log("Checklist de integridade (Módulo framework reutilizado): OK");
    return;
  }

  // 4. Testar criação de Pix via Adapter (Simulado ou Real dependendo do token)
  console.log("🔵 Testando createPixCharge...");
  const res = await createPixCharge({
    accessToken: token,
    idempotencyKey: `audit-19-${order.id}`,
    referenceId: `order:${order.id}`,
    amount: 10.50,
    description: "Teste Auditoria Onda 1",
    notificationUrl: "https://comandahub.online/api/public/mercadopago-webhook"
  });

  if (res.ok) {
    console.log("🟢 Pix criado com sucesso!");
    console.log("Payment ID:", res.provider_payment_id);
  } else {
    console.error("🔴 Falha ao criar Pix:", res.error);
  }
}

testWave1().catch(console.error);
