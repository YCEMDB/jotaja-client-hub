import { FinancialControlService } from "../../src/lib/admin/financial-control.service";
import { ProviderHealthService } from "../../src/lib/admin/provider-health.service";
import { AuditControlService } from "../../src/lib/admin/audit-control.service";

async function testPhase10() {
  console.log("--- TESTE FASE 10: ADMIN GOVERNANCE ---");

  try {
    // 1. Overview
    console.log("1. Testando Overview Global...");
    const overview = await FinancialControlService.getPlatformOverview();
    console.log("✓ Overview:", overview);

    // 2. Provedores
    console.log("2. Testando Saúde dos Provedores...");
    const health = await ProviderHealthService.getProvidersHealth();
    console.log("✓ Health:", health);

    // 3. Auditoria
    console.log("3. Testando Histórico de Auditoria...");
    const audit = await AuditControlService.getAuditHistory(5);
    console.log("✓ Auditoria (Histórico):", audit.length, "registros");

    console.log("\n--- RESULTADO: PASS ---");
  } catch (e) {
    console.error("--- RESULTADO: FAIL ---", e);
    process.exit(1);
  }
}

testPhase10();
