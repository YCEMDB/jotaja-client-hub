import { SLIService } from "../../src/lib/reliability/sli.service";
import { SLOService } from "../../src/lib/reliability/slo.service";
import { CapacityService } from "../../src/lib/reliability/capacity.service";
import { ReliabilityScoreService } from "../../src/lib/reliability/reliability-score.service";

async function runTests() {
  console.log('🚀 Starting Phase 16 Test Suite...');

  console.log('Step 1: Recording baseline metrics...');
  
  // Record several latency metrics
  for (let i = 0; i < 15; i++) {
    await SLIService.recordMetric({
      metric_name: 'api_request_latency',
      metric_type: 'LATENCY',
      service_name: 'API',
      value: 100 + Math.random() * 50,
      unit: 'ms',
      scope: 'GLOBAL'
    });
  }

  // Record availability
  await SLIService.recordMetric({
    metric_name: 'api_availability',
    metric_type: 'AVAILABILITY',
    service_name: 'API',
    value: 1.0,
    unit: 'ratio',
    scope: 'GLOBAL'
  });

  console.log('Step 2: Testing latency profile calculation...');
  const profile = await SLIService.getLatencyProfile('API', 5);
  console.log('Latency Profile:', profile);

  console.log('Step 3: Evaluating SLOs...');
  await SLOService.evaluateSLOs();
  console.log('SLO Evaluation Completed.');

  console.log('Step 4: Testing capacity engine...');
  const capacityStatus = await CapacityService.analyzeQueue('WEBHOOKS', 50, 10);
  console.log('Capacity Analysis Status:', capacityStatus);

  console.log('Step 5: Generating Reliability Score...');
  const snapshot = await ReliabilityScoreService.generateSnapshot('GLOBAL');
  console.log('Reliability Score:', snapshot.reliability_score);

  console.log('✅ Phase 16 Tests Completed.');
}

runTests().catch(console.error);
