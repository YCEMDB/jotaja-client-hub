import { AutomationJobType, AutomationRule } from './automation-types';

export const AUTOMATION_RULES: Record<AutomationJobType, AutomationRule> = {
  FAILED_PROCESS_RECOVERY: {
    type: 'FAILED_PROCESS_RECOVERY',
    maxAttempts: 3,
    enabled: true,
    requiresManualApproval: false,
    priority: 'HIGH'
  },
  STALE_EVENT_RECOVERY: {
    type: 'STALE_EVENT_RECOVERY',
    maxAttempts: 1,
    enabled: true,
    requiresManualApproval: true,
    priority: 'MEDIUM'
  },
  PROVIDER_SYNC_RETRY: {
    type: 'PROVIDER_SYNC_RETRY',
    maxAttempts: 5,
    enabled: true,
    requiresManualApproval: false,
    priority: 'LOW'
  },
  RECONCILIATION_REVIEW: {
    type: 'RECONCILIATION_REVIEW',
    maxAttempts: 1,
    enabled: true,
    requiresManualApproval: true,
    priority: 'HIGH'
  }
};
