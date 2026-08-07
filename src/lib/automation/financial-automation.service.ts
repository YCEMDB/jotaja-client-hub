import { AutomationQueueService } from './automation-queue.service';
import { AutomationAuditService } from './automation-audit.service';
import { AutomationJobType } from './automation-types';
import { AUTOMATION_RULES } from './automation-rules';

export class FinancialAutomationService {
  static async handleIncident(incident: {
    id: string;
    type: string;
    restaurant_id: string;
    severity: string;
    details: any;
  }) {
    // Map incident type to automation type
    const automationType = this.mapIncidentToAutomation(incident.type);
    if (!automationType) return;

    const rule = AUTOMATION_RULES[automationType];
    if (!rule || !rule.enabled) return;

    const deduplicationKey = `incident:${incident.id}:${automationType}`;

    const job = await AutomationQueueService.createJob({
      type: automationType,
      restaurant_id: incident.restaurant_id,
      source_incident_id: incident.id,
      payload: incident.details,
      deduplication_key: deduplicationKey,
      priority: incident.severity === 'CRITICAL' ? 'CRITICAL' : 'MEDIUM'
    });

    if (job) {
      await AutomationAuditService.logExecution(job.id, 'CREATION', 'SUCCESS', {
        incident_id: incident.id,
        rule: automationType
      });
    }
  }

  private static mapIncidentToAutomation(incidentType: string): AutomationJobType | null {
    switch (incidentType) {
      case 'PROVIDER_FAILURE':
      case 'PROVIDER_INSTABILITY':
        return 'PROVIDER_SYNC_RETRY';
      case 'PROCESS_STUCK':
      case 'WORKER_FAILURE':
        return 'FAILED_PROCESS_RECOVERY';
      case 'STALE_TRANSACTION':
        return 'STALE_EVENT_RECOVERY';
      case 'RECONCILIATION_DIVERGENCE':
        return 'RECONCILIATION_REVIEW';
      default:
        return null;
    }
  }
}
