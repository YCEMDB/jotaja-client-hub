/**
 * Traduções canônicas para mensagens de pagamento.
 * Nunca exibir payload cru do PagBank ou do Mercado Pago ao cliente final.
 */
export const PAYMENT_MESSAGES: Record<string, string> = {
  // PagBank
  pagbank_not_connected: "A conta PagBank do restaurante ainda não foi conectada.",
  pagbank_authorization_expired:
    "A autorização do PagBank expirou. O restaurante precisa reconectar a conta.",
  pagbank_connection_failed: "Não foi possível concluir a conexão com o PagBank.",
  pagbank_account_not_eligible:
    "A conta PagBank do restaurante não está habilitada para receber Pix.",
  pagbank_pix_key_required: "A conta PagBank do restaurante precisa ter uma chave Pix ativa.",
  pagbank_unavailable: "O PagBank está temporariamente indisponível. Tente novamente em instantes.",

  // Mercado Pago
  mercado_pago_not_connected: "A conta Mercado Pago do restaurante ainda não foi conectada.",

  // Módulo canônico
  payment_creation_failed: "Não foi possível criar o pagamento agora.",
  payment_already_exists: "Já existe um pagamento em andamento para este pedido.",
  payment_expired: "O QR Code expirou. Peça um novo ao restaurante ou refaça o pedido.",
  payment_not_found: "Pagamento não encontrado.",
  payment_amount_mismatch:
    "O valor pago não confere com o total do pedido. Fale com o restaurante.",
  payment_reference_mismatch: "Referência do pagamento não confere com este pedido.",
  invalid_webhook_signature: "Assinatura do webhook inválida.",
  price_changed_refresh_menu:
    "Os preços foram atualizados. Atualize o cardápio antes de tentar novamente.",
  feature_not_available: "Este recurso não está disponível no plano atual.",
  rate_limit_exceeded: "Muitas tentativas em pouco tempo. Aguarde alguns instantes.",

  // Estados operacionais que interagem com o financeiro
  restaurant_inactive: "O restaurante está temporariamente indisponível.",
  restaurant_not_found: "Restaurante não encontrado.",

  // OAuth
  oauth_state_not_found: "O link de conexão expirou ou é inválido. Tente conectar novamente.",
  oauth_state_expired: "O link de conexão expirou. Tente conectar novamente.",
  oauth_state_already_used: "Este link de conexão já foi utilizado.",

  // Configuração externa ainda pendente
  missing_credentials:
    "A integração PagBank do MESIVO ainda está pendente de configuração pelo administrador.",
};

export function translatePaymentError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err ?? "");
  const key = raw.split(":")[0].trim();
  return PAYMENT_MESSAGES[key] ?? PAYMENT_MESSAGES[raw] ?? "Não foi possível concluir a operação.";
}
