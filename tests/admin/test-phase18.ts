import { inventoryService } from "../../src/lib/recovery/inventory.service";
import { verificationService } from "../../src/lib/recovery/verification.service";
import { drillsService } from "../../src/lib/recovery/drills.service";
import { readinessService } from "../../src/lib/recovery/readiness.service";

async function testPhase18() {
  console.log("--- FASE 18 TEST SUITE ---");

  try {
    const restaurantId = "83fe78f2-7366-4baf-afd8-0755dd73f00f";

    // 1. Register Backup
    console.log("1. Testing Backup Registration...");
    const { data: backup, error: regError } = await inventoryService.registerBackup({
      restaurant_id: restaurantId,
      external_id: `test-backup-${Date.now()}`,
      provider: "SUPABASE",
      source: "TEST_SUITE",
      scope: "FULL",
      environment: "PRODUCTION",
      status: "CREATED",
      checksum: "sha256:d41d8cd98f00b204e9800998ecf8427e", // Empty hash for test
      metadata: { test: true }
    });

    if (regError || !backup) throw new Error(`Registration failed: ${JSON.stringify(regError)}`);
    console.log(`✅ Backup registered: ${backup.id}`);

    // 2. Duplicate Check
    console.log("2. Testing Duplicate Registration (Idempotency)...");
    const { data: dupBackup } = await inventoryService.registerBackup({
      external_id: backup.external_id,
      provider: backup.provider,
    });
    if (dupBackup?.id !== backup.id) throw new Error("Idempotency failure: different ID returned");
    console.log("✅ Idempotency verified.");

    // 3. Verification (Checksum Valid)
    console.log("3. Testing Backup Verification (Valid Checksum)...");
    const log = await verificationService.verifyBackup(backup.id, {
      observedChecksum: "sha256:d41d8cd98f00b204e9800998ecf8427e"
    });
    if (log.checksum_status !== 'VALID') throw new Error(`Checksum status mismatch: ${log.checksum_status}`);
    console.log("✅ Verification passed.");

    // 4. Verification (Checksum Invalid)
    console.log("4. Testing Backup Verification (Invalid Checksum)...");
    const failLog = await verificationService.verifyBackup(backup.id, {
      observedChecksum: "sha256:wrong-hash"
    });
    if (failLog.checksum_status !== 'INVALID') throw new Error(`Checksum status should be INVALID: ${failLog.checksum_status}`);
    console.log("✅ Checksum failure detected correctly.");

    // 5. Restore Drill
    console.log("5. Testing Restore Drill Registry...");
    const drill = await drillsService.registerDrill({
      backup_id: backup.id,
      environment: "SANDBOX",
      drill_type: "INTEGRITY_TEST",
      notes: "Automated test drill"
    });
    console.log(`✅ Drill registered: ${drill.id}`);

    await drillsService.updateDrillResult(drill.id, 'PASSED', {
      rto: 120,
      rpo: 3600,
      evidence: { log: "Restore successful in sandbox" }
    });
    console.log("✅ Drill completion recorded.");

    // 6. Readiness
    console.log("6. Testing Recovery Readiness...");
    const readiness = await readinessService.measureReadiness(restaurantId);
    console.log(`✅ Readiness status: ${readiness.status} (${readiness.readiness_score}%)`);

    console.log("\n--- FASE 18: ALL TESTS PASSED ---");
  } catch (error) {
    console.error("\n❌ FASE 18 TEST FAILED:");
    console.error(error);
    process.exit(1);
  }
}

testPhase18();
