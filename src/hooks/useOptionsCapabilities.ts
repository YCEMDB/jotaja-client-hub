import { useSupportContext } from "@/hooks/useSupportContext";

export interface OptionsCapabilities {
  isSupport: boolean;
  supportLevel: "view_only" | "operational" | "administrative" | null;
  canRead: boolean;
  /** Criar/editar nome, posição, limites de grupo; disponibilidade e item com preço 0. */
  canWriteOperational: boolean;
  /** Criar item com preço > 0, alterar preço, arquivar, restaurar. */
  canAdmin: boolean;
  /** Toda escrita durante suporte exige motivo próprio (mín. 5 caracteres). */
  requiresReasonForWrites: boolean;
  loading: boolean;
}

/**
 * Espelha `useMenuCapabilities`, mas para o CRUD de adicionais (grupos/itens).
 * Autoridade final está no backend — RPCs validam nível e motivo.
 */
export function useOptionsCapabilities(): OptionsCapabilities {
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
