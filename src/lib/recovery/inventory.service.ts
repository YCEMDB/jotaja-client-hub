import { supabase } from "@/integrations/supabase/client";
import { BackupRecord, BackupStatus } from "./recovery-types";

export class InventoryService {
  /**
   * Register a new backup in the inventory.
   * Ensures idempotency via provider + external_id.
   */
  async registerBackup(data: Partial<BackupRecord>): Promise<{ data: BackupRecord | null; error: any }> {
    const { data: record, error } = await supabase
      .from("backup_inventory")
      .upsert(
        {
          restaurant_id: data.restaurant_id,
          external_id: data.external_id,
          provider: data.provider || "UNKNOWN",
          source: data.source || "MANUAL",
          scope: data.scope || "FULL",
          environment: data.environment || "PRODUCTION",
          status: data.status || "CREATED",
          size_bytes: data.size_bytes,
          checksum: data.checksum,
          metadata: data.metadata || {},
          evidence: data.evidence || {},
          retention_until: data.retention_until,
        },
        { onConflict: "provider, external_id" }
      )
      .select()
      .single();

    return { data: record as unknown as BackupRecord, error };
  }

  async getBackupById(id: string): Promise<BackupRecord | null> {
    const { data } = await supabase
      .from("backup_inventory")
      .select("*")
      .eq("id", id)
      .single();
    
    return data as unknown as BackupRecord;
  }

  async listBackups(limit = 50): Promise<BackupRecord[]> {
    const { data } = await supabase
      .from("backup_inventory")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    
    return (data || []) as unknown as BackupRecord[];
  }

  async updateStatus(id: string, status: BackupStatus, evidence?: Record<string, any>): Promise<void> {
    const update: any = { status };
    if (evidence) {
      update.evidence = evidence;
    }
    
    await supabase
      .from("backup_inventory")
      .update(update)
      .eq("id", id);
  }
}

export const inventoryService = new InventoryService();
