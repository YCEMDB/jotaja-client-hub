import { useSupportContext } from "@/hooks/useSupportContext";

export interface MenuCapabilities {
  isSupport: boolean;
  supportLevel: "view_only" | "operational" | "administrative" | null;
  /** Ver dados. Sempre true fora de suporte view_only. */
  canRead: boolean;
  /** Criar/editar categoria; editar operacional de produto; alterar disponibilidade. */
  canWriteOperational: boolean;
  /** Criar produto (com preço inicial); alterar preço; arquivar/restaurar. */
  canAdmin: boolean;
  /** Toda escrita durante suporte exige motivo próprio (≥5 chars). */
  requiresReasonForWrites: boolean;
  loading: boolean;
}

/**
 * Gating da UI de Cardápio. O backend é a autoridade — RPCs validam.
 * - Nativo (owner/manager/employee): canWriteOperational=true, canAdmin=true.
 *   Motivo só é exigido nas ações que o backend classifica como administrativas
 *   (arquivamento, restauração).
 * - Suporte view_only: só leitura.
 * - Suporte operational: cria/edita categoria, edita op. de produto, disponibilidade.
 * - Suporte administrative: tudo. Toda escrita exige motivo próprio.
 */
export function useMenuCapabilities(): MenuCapabilities {
  const s = useSupportContext();

  if (s.loading) {
    return {
      isSupport: false, supportLevel: null, canRead: true,
      canWriteOperational: false, canAdmin: false,
      requiresReasonForWrites: false, loading: true,
    };
  }

  if (!s.active) {
    return {
      isSupport: false, supportLevel: null, canRead: true,
      canWriteOperational: true, canAdmin: true,
      requiresReasonForWrites: false, loading: false,
    };
  }

  const level = s.level;
  return {
    isSupport: true,
    supportLevel: level,
    canRead: true,
    canWriteOperational: level === "operational" || level === "administrative",
    canAdmin: level === "administrative",
    requiresReasonForWrites: true,
    loading: false,
  };
}

export function validateMenuReason(raw: string): string | null {
  const trimmed = raw.trim().replace(/\s+/g, "");
  if (trimmed.length < 5) {
    return "Informe um motivo com pelo menos 5 caracteres (sem contar espaços).";
  }
  return null;
}
