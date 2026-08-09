import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { IncidentEngineService } from "../lib/incidents/incident-engine.service";
import { RecoveryService } from "../lib/recovery/recovery.service";
import { ObservabilityService } from "../lib/observability/observability.service";

async function runTests() {
  console.log("🚀 Starting Phase 15 Tests...");

  try {
    // 1. Test Health
    console.log("Test 1: Health...");
    const health = await ObservabilityService.getPlatformHealth();
    console.log("Health Status:", health.overall_status);
    if (health.overall_status !== 'HEALTHY' && health.overall_status !== 'DEGRADED') {
      throw new Error("Invalid health status");
    }

    // 2. Test Incident Creation & Correlation
    console.log("Test 2: Incident Creation...");
    const incident = await IncidentEngineService.createIncident(
      `test-key-${Date.now()}`,
      "Test Incident",
      "Manual test incident for Phase 15",
      "SEV-3",
      "GLOBAL",
      undefined,
      { test: true }
    );
    console.log("Incident created:", incident.id);

    // 3. Test Timeline
    console.log("Test 3: Timeline...");
    await IncidentEngineService.addTimelineEvent(
      incident.id,
      "TEST_EVENT",
      "Test timeline message"
    );
    console.log("Timeline event added");

    // 4. Test Recovery Execution
    console.log("Test 4: Recovery Execution...");
    const recovery = await RecoveryService.startRecovery(
      incident.id,
      "LEVEL-1",
      "RETRY_SYNC",
      { retry: 1 },
      "00000000-0000-0000-0000-000000000000" // Mock SuperAdmin ID
    );
    console.log("Recovery started:", recovery.id);
    
    await RecoveryService.completeRecovery(recovery.id, 'SUCCESS', { recovered: true });
    console.log("Recovery completed");

    console.log("✅ Phase 15 Tests Passed!");
  } catch (error) {
    console.error("❌ Phase 15 Tests Failed:", error);
    process.exit(1);
  }
}

runTests();
