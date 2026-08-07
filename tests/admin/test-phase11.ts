import { MonitoringResult, FinancialAlertEvent } from "@/lib/monitoring/monitoring-types";
import { AlertEngineService } from "@/lib/monitoring/alert-engine.service";
import { FinancialMonitorService } from "@/lib/monitoring/financial-monitor.service";

/**
 * PHASE 11 - INTEGRATION TEST
 * Validates the Monitoring & Alerting Engine logic.
 */
async function testMonitoringFlow() {
  console.log("🚀 Starting Phase 11 Integration Test...");

  try {
    // 1. Perform Analysis
    console.log("Step 1: Running Financial Analysis...");
    const results = await FinancialMonitorService.performAnalysis();
    console.log(`Found ${results.length} potential alert conditions.`);

    // 2. Process Results (Alert Engine)
    console.log("Step 2: Processing results through Alert Engine...");
    const alerts = await AlertEngineService.processResults(results);
    console.log(`Created ${alerts.length} new alerts.`);

    // 3. Test Idempotency
    if (results.length > 0) {
      console.log("Step 3: Testing Idempotency (Processing same results again)...");
      const repeatAlerts = await AlertEngineService.processResults(results);
      if (repeatAlerts.length === 0) {
        console.log("✅ Idempotency check PASSED: No duplicate alerts created.");
      } else {
        console.error("❌ Idempotency check FAILED: Duplicate alerts were created.");
      }
    }

    console.log("✅ Phase 11 Functional Test Complete.");
  } catch (error) {
    console.error("❌ Phase 11 Test FAILED:", error);
    process.exit(1);
  }
}

// Mocking environment for standalone test execution if needed
if (require.main === module) {
  testMonitoringFlow();
}

export { testMonitoringFlow };
