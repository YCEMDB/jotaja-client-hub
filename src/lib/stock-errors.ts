/**
 * Traduz mensagens semânticas dos RPCs de estoque para português.
 * As RPCs endurecidas (2.b.1/2.b.1.1) lançam códigos padronizados via
 * RAISE EXCEPTION '<code>'. Aqui mapeamos para textos que a UI mostra.
 * Nunca expor mensagens SQL cruas ou nomes de constraint ao usuário.
 */

const MAP: Record<string, string> = {
  invalid_movement_type: "Tipo de movimentação inválido.",
  invalid_quantity: "Quantidade inválida para esse tipo de movimentação.",
  invalid_stock_state: "Estado do estoque inconsistente. Recarregue e tente novamente.",
  insufficient_stock: "Estoque insuficiente para essa saída.",
  reason_required: "Motivo obrigatório para esta operação (mínimo 5 caracteres).",
  invalid_unit: "Unidade de medida inválida.",
  invalid_supplier: "Fornecedor inválido.",
  invalid_ingredient: "Ingrediente inválido ou não encontrado.",
  not_found: "Registro não encontrado.",
  "forbidden: owner_only": "Somente o dono da loja pode executar essa operação.",
  "forbidden: support_level_insufficient":
    "Seu nível de acesso de suporte não permite essa operação.",
  "forbidden: no_active_support_session":
    "Sessão de suporte encerrada — reabra para continuar.",
  forbidden: "Você não tem permissão para essa operação.",
};

export function translateStockError(err: unknown): string {
  const raw =
    (err as { message?: string } | null)?.message?.trim() ??
    (typeof err === "string" ? err : "");
  if (!raw) return "Erro ao executar operação.";
  // exact match
  if (MAP[raw]) return MAP[raw];
  // strip PostgREST wrappers
  const lower = raw.toLowerCase();
  for (const key of Object.keys(MAP)) {
    if (lower.includes(key)) return MAP[key];
  }
  // Never leak SQL details
  if (/duplicate key|constraint|syntax|permission denied|null value/i.test(raw)) {
    return "Operação bloqueada pelo servidor. Verifique os dados e tente novamente.";
  }
  return raw;
}
