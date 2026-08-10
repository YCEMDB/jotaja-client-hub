
import { supabase } from "../src/integrations/supabase/client";
import { markOrderPaid } from "../src/lib/payments.functions";
import { getPlatformOverview } from "../src/lib/admin/admin.functions";

async function runTests() {
  console.log("--- MESIVO SECURITY TEST SUITE ---");

  // 1. SELECT orders (anon)
  console.log("Testing: Anonymous SELECT orders...");
  const { data: anonOrders, error: anonErr } = await supabase
    .from("orders")
    .select("*")
    .limit(1);
  console.log("Result:", anonErr ? "DENIED (Expected)" : "SUCCESS (Vulnerable!)", anonErr?.message || "");

  // 2. Fraudulent order insert (anon)
  console.log("Testing: Fraudulent order creation (status=paid)...");
  const { data: fraudOrder, error: fraudErr } = await supabase
    .from("orders")
    .insert([{
      restaurant_id: "00000000-0000-0000-0000-000000000000",
      status: "delivered",
      payment_status: "paid",
      total: 0
    }]);
  console.log("Result:", fraudErr ? "DENIED (Expected)" : "SUCCESS (Vulnerable!)", fraudErr?.message || "");

  // 3. markOrderPaid (anon)
  console.log("Testing: Anonymous markOrderPaid...");
  try {
    const res = await markOrderPaid({ data: { orderId: "00000000-0000-0000-0000-000000000000" } });
    console.log("Result: SUCCESS (Vulnerable!)");
  } catch (e) {
    console.log("Result: DENIED (Expected)");
  }

  // 4. Admin API (anon)
  console.log("Testing: Anonymous Admin API (getPlatformOverview)...");
  try {
    const res = await getPlatformOverview();
    console.log("Result: SUCCESS (Vulnerable!)");
  } catch (e) {
    console.log("Result: DENIED (Expected)");
  }

  console.log("--- TESTS COMPLETE ---");
}

// Mocking needed browser environment for client tests if necessary or just use fetch
runTests().catch(console.error);
