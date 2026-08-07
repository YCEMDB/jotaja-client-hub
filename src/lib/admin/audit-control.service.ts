import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { AdminAuditLog } from "./admin-types";

export class AuditControlService {
  /**
   * Registra uma ação administrativa
   */
  static async logAdminAction(params: {
    admin_id: string;
    action: string;
    target_resource: string;
    details: any;
    ip_address?: string;
  }): Promise<void> {
    const { error } = await supabaseAdmin
      .from('admin_audit_logs')
      .insert([params]);

    if (error) {
      console.error('[AuditControlService] Failed to log admin action:', error);
    }
  }

  /**
   * Consulta o histórico de auditoria
   */
  static async getAuditHistory(limit = 100): Promise<AdminAuditLog[]> {
    const { data, error } = await supabaseAdmin
      .from('admin_audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }
}
