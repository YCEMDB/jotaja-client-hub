import { supabase } from '@/integrations/supabase/client';

export class AutomationAuditService {
  static async logExecution(jobId: string, action: string, result: 'SUCCESS' | 'FAILED', details?: any, error?: string) {
    try {
      const { error: dbError } = await supabase
        .from('automation_execution_logs')
        .insert({
          job_id: jobId,
          action,
          result,
          details,
          error
        });

      if (dbError) throw dbError;
    } catch (err) {
      console.error('Failed to log automation execution:', err);
    }
  }

  static async logAdminAction(adminId: string, action: string, details: any) {
    try {
      const { error: dbError } = await supabase
        .from('admin_audit_logs')
        .insert({
          admin_id: adminId,
          action,
          target_resource: 'automation',
          details
        });

      if (dbError) throw dbError;
    } catch (err) {
      console.error('Failed to log admin action for automation:', err);
    }
  }
}
