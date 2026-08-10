import { createServerFn } from "@tanstack/react-start";
import { FinancialControlService } from "@/lib/admin/financial-control.service";
import { AuditControlService } from "@/lib/admin/audit-control.service";
import { ProviderHealthService } from "@/lib/admin/provider-health.service";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// P0.4: Todas as funções admin agora exigem autenticação
export const getPlatformOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // AuditControlService ou similar deve verificar se é SuperAdmin internamente
    // ou usamos uma role check aqui.
    return await FinancialControlService.getPlatformOverview();
  });

export const getFinancialIncidents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    return await FinancialControlService.getFinancialIncidents();
  });

export const getProvidersHealth = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    return await ProviderHealthService.getProvidersHealth();
  });

export const getAdminAuditHistory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    return await AuditControlService.getAuditHistory();
  });
