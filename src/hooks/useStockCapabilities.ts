import { useSupportContext } from "@/hooks/useSupportContext";

export interface StockCapabilities {
  /** Sessão de suporte ativa (super_admin operando como). */
  isSupport: boolean;
  /** Nível efetivo (null = usuário nativo). */
  supportLevel: "view_only" | "operational" | "administrative" | null;
  /** Pode criar/editar unidades, fornecedores, insumos e registrar entrada/saída/perda + editar ficha. */
  canWrite: boolean;
  /** Pode ajustar saldo (adjust) e arquivar insumos — administrativo. */
  canAdmin: boolean;
  /** Toda operação de escrita exige motivo próprio (mínimo 5 caracteres). */
  requiresReasonForWrites: boolean;
  /** Sessão está carregando. */
  loading: boolean;
}

/**
 * Regras (Onda 2.b.2):
 * - Nativo (owner): canWrite=true, canAdmin=true, reason opcional exceto para
 *   ações classificadas como administrativas (o backend valida via
 *   private.authorize_tenant_action).
 * - Suporte view_only: só leitura.
 * - Suporte operational: escrita comum + edição de ficha; ajuste/arquivar bloqueados.
 * - Suporte administrative: tudo. Toda operação exige motivo próprio.
 */
export function useStockCapabilities(): StockCapabilities {
  const s = useSupportContext();

  if (s.loading) {
    return {
      isSupport: false, supportLevel: null,
      canWrite: false, canAdmin: false,
      requiresReasonForWrites: false, loading: true,
    };
  }

  if (!s.active) {
    return {
      isSupport: false, supportLevel: null,
      canWrite: true, canAdmin: true,
      requiresReasonForWrites: false, loading: false,
    };
  }

  const level = s.level;
  return {
    isSupport: true,
    supportLevel: level,
    canWrite: level === "operational" || level === "administrative",
    canAdmin: level === "administrative",
    requiresReasonForWrites: true,
    loading: false,
  };
}

/**
 * Valida um motivo digitado. Retorna null se ok, ou mensagem em pt-BR.
 */
export function validateReason(raw: string): string | null {
  const trimmed = raw.trim();
  const nonBlank = trimmed.replace(/\s+/g, "");
  if (nonBlank.length < 5) {
    return "Informe um motivo com pelo menos 5 caracteres (sem contar espaços).";
  }
  return null;
}
