import { GovernanceAuditService } from "./governance-audit.service";
import { ChangeTrackingService } from "./change-tracking.service";
import { ComplianceService } from "./compliance.service";

export class GovernanceEngineService {
  /**
   * Orquestrador central de governança
   */
  static async initialize() {
    console.log('[GovernanceEngineService] Initialized Platform Governance Layer');
  }

  // Fachada para facilitar o uso em outros serviços
  static audit = GovernanceAuditService;
  static tracking = ChangeTrackingService;
  static compliance = ComplianceService;
}
