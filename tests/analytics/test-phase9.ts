import { OperationalMetricsService } from "./operational-metrics.service";
import { FinancialAnalyticsService } from "./financial-analytics.service";
import { supabase } from "@/integrations/supabase/client";

/**
 * Validation test for Phase 9 Analytics.
 */
export async function runPhase9Tests() {
  console.log("🧪 Iniciando Testes Fase 9 - Financial Intelligence...");
  
  // 1. Get a test restaurant
  const { data: restaurant } = await (supabase
    .from("restaurants" as any)
    .select("id") as any)
    .limit(1)
    .single();

  if (!restaurant) {
    console.error("❌ Nenhum restaurante encontrado para teste.");
    return;
  }

  const restaurantId = (restaurant as any).id;
  const now = new Date().toISOString();
  const monthAgo = new Date();
  monthAgo.setDate(monthAgo.getDate() - 30);
  const monthAgoIso = monthAgo.toISOString();

  try {
    // Test 1: Financial Summary
    console.log("Testing Financial Summary...");
    const summary = await FinancialAnalyticsService.getFinancialSummary(restaurantId, monthAgoIso, now);
    console.log("✅ Financial Summary Success:", {
      revenue: summary.revenue,
      txs: summary.transactions,
      rate: summary.successful_rate
    });

    // Test 2: Operational Metrics
    console.log("Testing Operational Metrics...");
    const operational = await OperationalMetricsService.getOperationalMetrics(restaurantId);
    console.log("✅ Operational Metrics Success:", {
      volume: operational.payment_volume,
      peak: operational.peak_hours,
      methods: operational.active_payment_methods
    });

    console.log("🚀 FASE 9 - TODOS OS TESTES PASSARAM!");
  } catch (err: any) {
    console.error("❌ Erro nos testes da Fase 9:", err.message);
  }
}
