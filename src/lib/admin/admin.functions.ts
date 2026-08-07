import { createServerFn } from "@tanstack/react-start";
import { FinancialControlService } from "@/lib/admin/financial-control.service";
import { AuditControlService } from "@/lib/admin/audit-control.service";
import { ProviderHealthService } from "@/lib/admin/provider-health.service";

export const getPlatformOverview = createServerFn({ method: "GET" })
  .handler(async () => {
    return await FinancialControlService.getPlatformOverview();
  });

export const getFinancialIncidents = createServerFn({ method: "GET" })
  .handler(async () => {
    return await FinancialControlService.getFinancialIncidents();
  });

export const getProvidersHealth = createServerFn({ method: "GET" })
  .handler(async () => {
    return await ProviderHealthService.getProvidersHealth();
  });

export const getAdminAuditHistory = createServerFn({ method: "GET" })
  .handler(async () => {
    return await AuditControlService.getAuditHistory();
  });
