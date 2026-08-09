import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { inventoryService } from "./recovery/inventory.service";
import { verificationService } from "./recovery/verification.service";
import { drillsService } from "./recovery/drills.service";
import { readinessService } from "./recovery/readiness.service";

export const getRecoveryBackups = createServerFn({ method: "GET" })
  .handler(async () => {
    return await inventoryService.listBackups();
  });

export const getReadinessStatus = createServerFn({ method: "GET" })
  .handler(async () => {
    return await readinessService.measureReadiness();
  });

export const verifyBackupById = createServerFn({ method: "POST" })
  .validator((data: { backupId: string }) => z.object({ backupId: z.string() }).parse(data))
  .handler(async ({ data }) => {
    return await verificationService.verifyBackup(data.backupId);
  });

export const recordRestoreDrill = createServerFn({ method: "POST" })
  .validator((data: { 
    backupId: string, 
    environment: string, 
    drillType: string, 
    notes?: string 
  }) => z.object({ 
    backupId: z.string(),
    environment: z.string(),
    drillType: z.string(),
    notes: z.string().optional()
  }).parse(data))
  .handler(async ({ data }) => {
    return await drillsService.registerDrill({
      backup_id: data.backupId,
      environment: data.environment,
      drill_type: data.drillType,
      notes: data.notes,
      result: 'PLANNED'
    });
  });
