/**
 * Mapa canônico de códigos de erro do backend → mensagens PT-BR.
 * Sprint 2.3: Toda RPC retorna código estável; frontend traduz.
 */

const ERROR_MESSAGES: Record<string, string> = {
  // Genéricos
  forbidden: "Você não tem permissão para esta ação.",
  unauthorized: "Faça login para continuar.",
  not_found: "Registro não encontrado.",
  conflict: "Conflito de dados. Recarregue e tente novamente.",
  rate_limit: "Muitas tentativas. Aguarde alguns segundos e tente novamente.",

  // Restaurante
  restaurant_not_found: "Restaurante não encontrado.",
  restaurant_closed: "A loja está fechada no momento.",
  invalid_schedule: "Horários de funcionamento inválidos.",

  // Cliente
  invalid_customer: "Dados do cliente inválidos.",
  customer_blocked: "Este cliente está bloqueado no restaurante.",
  invalid_email: "E-mail inválido.",

  // Carrinho / Pedido
  empty_cart: "Adicione itens ao carrinho antes de finalizar.",
  invalid_transition: "Transição de status inválida.",
  status_change_forbidden: "Alteração de status não permitida.",
  order_not_found: "Pedido não encontrado.",

  // Cupom
  coupon_invalid: "Cupom inválido.",
  coupon_not_started: "Este cupom ainda não está ativo.",
  coupon_expired: "Cupom expirado.",
  coupon_exhausted: "Cupom esgotado.",
  coupon_min_order: "Pedido não atinge o valor mínimo do cupom.",
  coupon_customer_limit: "Você já usou este cupom o número máximo de vezes.",
  coupon_first_purchase_only: "Cupom válido apenas para o primeiro pedido.",

  // Equipe
  invite_invalid_or_expired: "Convite inválido ou expirado.",
  email_mismatch: "O convite foi emitido para outro e-mail.",
  is_owner: "Este e-mail já é o dono do restaurante.",
  already_member: "Este usuário já faz parte da equipe.",
  duplicate_invite: "Já existe um convite pendente para este e-mail.",
  invalid_role: "Papel inválido.",
  already_accepted_or_missing: "Convite já aceito ou inexistente.",

  // Planos
  plan_limit_reached: "Limite do seu plano atingido. Faça upgrade.",
  plan_limit_products: "Limite de produtos do seu plano atingido.",
  plan_limit_categories: "Limite de categorias do seu plano atingido.",
  plan_limit_coupons: "Limite de cupons do seu plano atingido.",
  plan_feature_locked: "Este recurso requer um plano superior.",
};

/**
 * Traduz um erro do Supabase/PostgREST em mensagem amigável.
 * Aceita `Error`, `PostgrestError`, `string` ou `unknown`.
 */
export function translateError(err: unknown, fallback = "Ocorreu um erro. Tente novamente."): string {
  const raw =
    typeof err === "string"
      ? err
      : err && typeof err === "object" && "message" in err
        ? String((err as { message: unknown }).message)
        : "";

  if (!raw) return fallback;

  // RPCs lançam "code: mensagem" — extrai o primeiro token
  const token = raw.split(":")[0].trim().toLowerCase();
  if (ERROR_MESSAGES[token]) return ERROR_MESSAGES[token];

  // Match parcial (ex.: "plan_limit_reached: Limite mensal ...")
  for (const key of Object.keys(ERROR_MESSAGES)) {
    if (raw.toLowerCase().includes(key)) return ERROR_MESSAGES[key];
  }
  return fallback;
}

export { ERROR_MESSAGES };
