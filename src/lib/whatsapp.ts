// Utilitário WhatsApp: normaliza telefone BR e monta URL wa.me com mensagem pré-preenchida.

const DIGITS = /\D+/g;

/** Retorna o telefone somente com dígitos, com DDI 55 quando aparentar ser BR sem DDI. */
export function normalizeWhatsAppPhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let d = String(raw).replace(DIGITS, "");
  if (!d) return null;

  // Já tem DDI 55? mantém.
  if (d.startsWith("55") && (d.length === 12 || d.length === 13)) return d;

  // BR sem DDI: 10 dígitos (fixo com DDD) ou 11 (celular com DDD).
  if (d.length === 10 || d.length === 11) return "55" + d;

  // Números que já tem outro DDI (>=11 dígitos e não começa com 55): mantém.
  if (d.length >= 11 && d.length <= 15) return d;

  return null;
}

export function isValidWhatsAppPhone(raw: string | null | undefined): boolean {
  const n = normalizeWhatsAppPhone(raw);
  return !!n && n.length >= 11 && n.length <= 15;
}

/** Monta a URL do WhatsApp; retorna null se telefone inválido. */
export function buildWhatsAppUrl(
  phone: string | null | undefined,
  message: string,
): string | null {
  const n = normalizeWhatsAppPhone(phone);
  if (!n) return null;
  const text = encodeURIComponent(message);
  return `https://wa.me/${n}?text=${text}`;
}

/** Mensagem inicial padrão para contato individual (não é campanha). */
export function defaultWhatsAppGreeting(customerName: string, restaurantName: string): string {
  const first = (customerName || "").trim().split(" ")[0] || "tudo bem";
  return `Olá, ${first}! Estamos entrando em contato pelo ${restaurantName}.`;
}
