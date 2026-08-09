import { SLIService } from "../../src/lib/reliability/sli.service";
import { SLOService } from "../../src/lib/reliability/slo.service";
import { CapacityService } from "../../src/lib/reliability/capacity.service";
import { ReliabilityScoreService } from "../../src/lib/reliability/reliability-score.service";

async function testPhase16() {
  console.log("🚀 Starting Phase 16 Test Suite...");

  try {
    // 1. Record Baseline Metrics
    console.log("Step 1: Recording baseline metrics...");
    await SLIService.recordMetric({
      metric_name: 'api_request_latency',
      metric_type: 'LATENCY',
      service_name: 'API',
      value: 120,
      unit: 'ms',
      scope: 'GLOBAL'
    });
    
    await SLIService.recordMetric({
      metric_name: 'api_request_success',
      metric_type: 'SUCCESS_RATE',
      service_name: 'API',
      value: 100,
      unit: '%',
      scope: 'GLOBAL'
    });

    // 2. Test Latency Profile
    console.log("Step 2: Testing latency profile calculation...");
    for (let i = 0; i < 11; i++) {
      await SLIService.recordMetric({
        metric_name: 'api_request_latency',
        metric_type: 'LATENCY',
        service_name: 'API',
        value: 100 + (i * 10),
        unit: 'ms',
        scope: 'GLOBAL'
      });
    }
    
    const profile = await SLIService.getLatencyProfile('API', 5);
    console.log("Latency Profile:", profile);

    // 3. Test SLO Evaluation
    console.log("Step 3: Evaluating SLOs...");
    await SLOService.evaluateSLOs();

    // 4. Test Capacity Monitoring
    console.log("Step 4: Testing capacity engine...");
    await CapacityService.analyzeQueue('WEBHOOK_PROCESSOR', 5000, 10);

    // 5. Test Reliability Score
    console.log("Step 5: Generating Reliability Score...");
    const score = await ReliabilityScoreService.generateSnapshot();
    console.log("Reliability Score:", score.reliability_score);

    console.log("✅ Phase 16 Tests Completed Successfully.");
  } catch (error) {
    console.error("❌ Phase 16 Tests Failed:", error);
    process.exit(1);
  }
}

testPhase16();
