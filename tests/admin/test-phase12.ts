import { AutomationQueueService } from '../../src/lib/automation/automation-queue.service';
import { AutomationWorkerService } from '../../src/lib/automation/automation-worker.service';
import { FinancialAutomationService } from '../../src/lib/automation/financial-automation.service';
import { supabase } from '../../src/integrations/supabase/client';

async function testPhase12() {
  console.log('--- Phase 12 Implementation Test ---');

  try {
    // 1. Create a mock incident
    const mockIncident = {
      id: crypto.randomUUID(),
      type: 'WORKER_FAILURE',
      restaurant_id: crypto.randomUUID(),
      severity: 'HIGH',
      details: { process: 'payment-processor', error: 'Connection timeout' }
    };

    console.log('Step 1: Handling incident...');
    await FinancialAutomationService.handleIncident(mockIncident);

    // 2. Verify job creation
    console.log('Step 2: Verifying job creation...');
    const { data: jobs, error: fetchError } = await supabase
      .from('automation_jobs')
      .select('*')
      .eq('source_incident_id', mockIncident.id);

    if (fetchError || !jobs || jobs.length === 0) {
      throw new Error('Job was not created');
    }
    console.log('Job created successfully:', jobs[0].id);

    // 3. Test Idempotency
    console.log('Step 3: Testing idempotency...');
    await FinancialAutomationService.handleIncident(mockIncident);
    const { data: duplicateJobs } = await supabase
      .from('automation_jobs')
      .select('*')
      .eq('source_incident_id', mockIncident.id);
    
    if (duplicateJobs?.length !== 1) {
      throw new Error('Idempotency check failed: Duplicate job created');
    }
    console.log('Idempotency verified.');

    // 4. Execute job via worker
    console.log('Step 4: Executing job via worker...');
    await AutomationWorkerService.executeJob(jobs[0] as any);

    // 5. Verify success and logs
    console.log('Step 5: Verifying execution results...');
    const { data: updatedJob } = await supabase
      .from('automation_jobs')
      .select('*')
      .eq('id', jobs[0].id)
      .single();

    if (updatedJob?.status !== 'SUCCESS') {
      throw new Error(`Job execution failed. Status: ${updatedJob?.status}`);
    }

    const { data: logs } = await supabase
      .from('automation_execution_logs')
      .select('*')
      .eq('job_id', jobs[0].id);

    if (!logs || logs.length === 0) {
      throw new Error('No execution logs found');
    }
    console.log('Execution logs verified.');

    console.log('--- Phase 12 Test Result: PASS ---');
  } catch (err: any) {
    console.error('--- Phase 12 Test Result: FAIL ---');
    console.error(err.message);
    process.exit(1);
  }
}

testPhase12();
