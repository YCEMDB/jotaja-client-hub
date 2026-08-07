import { AutomationQueueService } from './automation-queue.service';
import { AutomationEngineService } from './automation-engine.service';
import { AutomationAuditService } from './automation-audit.service';
import { AutomationJob } from './automation-types';

export class AutomationWorkerService {
  static async processJobs() {
    const pendingJobs = await AutomationQueueService.getPendingJobs();
    
    for (const job of pendingJobs) {
      await this.executeJob(job);
    }
  }

  static async executeJob(job: AutomationJob) {
    const locked = await AutomationQueueService.acquireLock(job.id);
    if (!locked) return;

    try {
      const isSafe = await AutomationEngineService.validateSafety(job);
      if (!isSafe) {
        await AutomationQueueService.updateJobStatus(job.id, 'REQUIRES_REVIEW', {
          error: 'Safety validation failed: Auto-execution not permitted for this type'
        });
        return;
      }

      const { success, result, error } = await AutomationEngineService.executeJobAction(job);

      if (success) {
        await AutomationQueueService.updateJobStatus(job.id, 'SUCCESS', {
          result,
          completed_at: new Date().toISOString()
        });
        await AutomationAuditService.logExecution(job.id, 'EXECUTION', 'SUCCESS', result);
      } else {
        const nextAttempt = job.attempts + 1;
        const status = nextAttempt >= job.max_attempts ? 'FAILED' : 'PENDING';
        
        await AutomationQueueService.updateJobStatus(job.id, status, {
          attempts: nextAttempt,
          error: error || 'Unknown error during execution'
        });
        await AutomationAuditService.logExecution(job.id, 'EXECUTION', 'FAILED', null, error);
      }
    } catch (err: any) {
      console.error(`Unexpected error executing job ${job.id}:`, err);
      await AutomationQueueService.updateJobStatus(job.id, 'FAILED', {
        error: `System Error: ${err.message}`
      });
    }
  }
}
