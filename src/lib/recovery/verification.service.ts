import { supabase } from "@/integrations/supabase/client";
import { VerificationLog, BackupStatus, ChecksumResult } from "./recovery-types";
import { inventoryService } from "./inventory.service";
import { integrityService } from "../integrity/integrity.service";

export class VerificationService {
  /**
   * Verify a backup's existence and integrity.
   */
  async verifyBackup(backupId: string, options: { 
    observedChecksum?: string;
    evidence?: Record<string, any>;
  } = {}): Promise<VerificationLog> {
    const startTime = Date.now();
    const backup = await inventoryService.getBackupById(backupId);
    
    if (!backup) {
      throw new Error("Backup not found");
    }

    let status: BackupStatus = "VERIFIED";
    let checksumStatus: ChecksumResult = "NOT_VERIFIED";
    let errorMessage: string | undefined;

    // Checksum verification logic
    if (backup.checksum && options.observedChecksum) {
      if (backup.checksum === options.observedChecksum) {
        checksumStatus = "VALID";
      } else {
        checksumStatus = "INVALID";
        status = "CORRUPTED";
        errorMessage = "Checksum mismatch detected";
      }
    } else if (backup.checksum) {
        checksumStatus = "NOT_AVAILABLE";
    }

    const duration = Date.now() - startTime;

    // Create verification log
    const { data: log, error } = await supabase
      .from("backup_verification_logs")
      .insert({
        backup_id: backupId,
        status,
        checksum_status: checksumStatus,
        observed_checksum: options.observedChecksum,
        duration_ms: duration,
        error_message: errorMessage,
        evidence: options.evidence || {},
      })
      .select()
      .single();

    if (error) throw error;

    // Update backup status in inventory
    await inventoryService.updateStatus(backupId, status, options.evidence);

    // Phase 17 Integration: Register in Proof of Integrity chain if successful
    if (status === "VERIFIED") {
      try {
        await integrityService.recordIntegrity({
          entity_type: "backup_verification",
          entity_id: log.id,
          payload: {
            backup_id: backupId,
            status,
            checksum_status: checksumStatus,
            verified_at: new Date().toISOString()
          },
          restaurant_id: backup.restaurant_id
        });
      } catch (err) {
        console.error("Failed to record backup integrity evidence:", err);
      }
    }

    return log as unknown as VerificationLog;
  }
}

export const verificationService = new VerificationService();
