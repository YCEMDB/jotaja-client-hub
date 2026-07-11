/**
 * Traduz mensagens semânticas das RPCs de cardápio para português.
 * Nunca expor SQL cru ou nomes de constraint.
 */

const MAP: Record<string, string> = {
  category_has_active_products:
    "Esta categoria ainda possui produtos ativos. Mova ou arquive esses produtos antes de arquivar a categoria.",
  category_archived: "Categoria arquivada. Restaure-a antes de continuar.",
  category_inactive: "Categoria inativa. Ative-a antes de continuar.",
  product_archived: "Produto arquivado. Restaure-o antes de continuar.",
  invalid_category: "Categoria inválida ou de outro restaurante.",
  invalid_kitchen_station: "Estação de cozinha inválida.",
  invalid_price: "Preço inválido.",
  invalid_promo_price: "Preço promocional inválido (deve ser menor que o preço).",
  invalid_name: "Nome obrigatório.",
  invalid_position: "Posição inválida.",
  invalid_availability: "Disponibilidade inválida.",
  price_changed_by_another_user:
    "Este preço foi alterado por outro usuário. Os valores foram atualizados; revise antes de salvar novamente.",
  expected_values_required:
    "Recarregue o produto antes de alterar o preço.",
  plan_limit_reached:
    "Limite do plano atingido. Faça upgrade ou arquive registros para liberar espaço.",
  reason_required: "Motivo obrigatório (mínimo 5 caracteres).",
  not_found: "Registro não encontrado.",
  "forbidden: not_authenticated": "Sessão expirada. Entre novamente.",
  "forbidden: no_active_support_session":
    "Sessão de suporte encerrada — reabra para continuar.",
  "forbidden: support_level_insufficient":
    "Seu nível de acesso de suporte não permite essa operação.",
  "forbidden: missing_restaurant": "Restaurante não informado.",
  forbidden: "Você não tem permissão para essa operação.",
};

export function translateMenuError(err: unknown): string {
  const raw =
    (err as { message?: string } | null)?.message?.trim() ??
    (typeof err === "string" ? err : "");
  if (!raw) return "Erro ao executar operação.";
  if (MAP[raw]) return MAP[raw];
  const lower = raw.toLowerCase();
  for (const key of Object.keys(MAP)) {
    if (lower.includes(key)) return MAP[key];
  }
  if (/duplicate key|constraint|syntax|permission denied|null value|jwt|schema/i.test(raw)) {
    return "Operação bloqueada pelo servidor. Verifique os dados e tente novamente.";
  }
  return raw;
}

export function isPriceConflict(err: unknown): boolean {
  const raw = (err as { message?: string } | null)?.message ?? "";
  return raw.toLowerCase().includes("price_changed_by_another_user");
}
