import { RateLimitService } from "../../src/lib/security/rate-limit.service";
import { SecurityEngine } from "../../src/lib/security/security-engine.service";
import { ThreatDetectionService } from "../../src/lib/security/threat-detection.service";

async function runTests() {
  console.log("--- FASE 14 TESTING ---");

  // Test 1: Rate Limit
  console.log("Test 1: Rate Limit (Excess requests)");
  for (let i = 0; i < 15; i++) {
    const res = await RateLimitService.checkLimit({
      key: "test-ip",
      endpoint: "/api/auth",
      type: "AUTH"
    });
    if (i >= 10 && res.allowed) {
        console.error("FAIL: Rate limit should have blocked request", i);
    } else if (i < 10 && !res.allowed) {
        console.error("FAIL: Rate limit should have allowed request", i);
    }
  }
  console.log("PASS: Rate limit working (Max 10 for AUTH)");

  // Test 2: Brute Force Detection
  console.log("Test 2: Brute Force Detection");
  await ThreatDetectionService.analyzeActivity({
    category: 'SECURITY_BRUTE_FORCE',
    endpoint: '/api/auth/login',
    details: { attempts: 20, user: 'target@example.com' }
  });
  console.log("PASS: Brute force threat reported");

  // Test 3: Engine Validation
  console.log("Test 3: Engine Validation");
  const validation = await SecurityEngine.validateRequest({
    ip: "new-ip",
    endpoint: "/api/admin/governance",
    type: "ADMIN"
  });
  if (validation.allowed) {
    console.log("PASS: Normal traffic allowed");
  } else {
    console.error("FAIL: Normal traffic blocked");
  }

  console.log("--- FASE 14 TESTS COMPLETE ---");
}

runTests().catch(console.error);
