import { supabase } from '@/integrations/supabase/client';
import { AutomationJob, AutomationJobStatus, AutomationJobType, AutomationPriority } from './automation-types';
import { AUTOMATION_RULES } from './automation-rules';

export class AutomationQueueService {
  static async createJob(params: {
    type: AutomationJobType;
    restaurant_id?: string;
    source_incident_id?: string;
    payload: any;
    deduplication_key: string;
    priority?: AutomationPriority;
  }): Promise<AutomationJob | null> {
    const rule = AUTOMATION_RULES[params.type];
    if (!rule || !rule.enabled) return null;

    const { data, error } = await supabase
      .from('automation_jobs')
      .upsert({
        type: params.type,
        restaurant_id: params.restaurant_id,
        source_incident_id: params.source_incident_id,
        payload: params.payload,
        deduplication_key: params.deduplication_key,
        status: rule.requiresManualApproval ? 'REQUIRES_REVIEW' : 'PENDING',
        priority: params.priority || rule.priority,
        max_attempts: rule.maxAttempts,
        attempts: 0
      }, {
        onConflict: 'deduplication_key',
        ignoreDuplicates: true
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') return null; // Deduplication handled
      console.error('Error creating automation job:', error);
      return null;
    }

    return data as unknown as AutomationJob;
  }

  static async getPendingJobs(): Promise<AutomationJob[]> {
    const { data, error } = await supabase
      .from('automation_jobs')
      .select('*')
      .eq('status', 'PENDING')
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching pending jobs:', error);
      return [];
    }

    return data as unknown as AutomationJob[];
  }

  static async updateJobStatus(jobId: string, status: AutomationJobStatus, updates: Partial<AutomationJob> = {}) {
    const { error } = await supabase
      .from('automation_jobs')
      .update({
        status,
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId);

    if (error) {
      console.error(`Error updating job ${jobId} status to ${status}:`, error);
      throw error;
    }
  }

  static async acquireLock(jobId: string): Promise<boolean> {
    // Basic idempotency check by moving to RUNNING status
    // In a real high-concurrency env, we'd use a more robust lock
    const { data, error } = await supabase
      .from('automation_jobs')
      .update({
        status: 'RUNNING',
        started_at: new Date().toISOString()
      })
      .eq('id', jobId)
      .eq('status', 'PENDING')
      .select();

    return !error && data && data.length > 0;
  }
}
