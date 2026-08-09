import { IntegrityService } from '../../src/lib/integrity/integrity.service';
import { ReconciliationEngine } from '../../src/lib/integrity/reconciliation.service';

async function runTests() {
  console.log('--- Phase 17: Integrity & Reconciliation Tests ---');
  
  const testRestaurantId = 'a1b2c3d4-0000-4000-8000-000000000001';
  
  try {
    // Test 1: Record Integrity
    console.log('Test 1: Recording integrity...');
    const record = await IntegrityService.recordIntegrity({
      restaurant_id: testRestaurantId,
      chain_type: 'financial_ledger',
      entity_type: 'test_entry',
      entity_id: '00000000-0000-0000-0000-000000000000',
      payload: { amount: 100, status: 'completed' }
    });
    console.log('✅ Integrity recorded:', record.current_hash);

    // Test 2: Verify Chain
    console.log('Test 2: Verifying chain...');
    const result = await IntegrityService.verifyChain(record.chain_id);
    console.log('✅ Verification result:', result.status);

    if (result.status !== 'valid') {
      throw new Error(`Verification failed: ${result.status}`);
    }

    console.log('--- PHASE 17 TESTS COMPLETE: SUCCESS ---');
  } catch (error) {
    console.error('❌ Phase 17 Tests FAILED:', error);
    process.exit(1);
  }
}

runTests();
