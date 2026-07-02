// Centralized PT-BR labels for enums/technical terms shown in the UI.
// Use these instead of interpolating raw enum values (cash, pix, delivery, pending, ...).

export const paymentLabels: Record<string, string> = {
  cash: "Dinheiro",
  pix: "PIX",
  card: "Cartão",
  credit: "Crédito",
  debit: "Débito",
  card_on_delivery: "Cartão na entrega",
  pix_online: "PIX Online",
};

export const orderTypeLabels: Record<string, string> = {
  delivery: "Entrega",
  pickup: "Retirada",
  dine_in: "Mesa",
};

export const orderStatusLabels: Record<string, string> = {
  pending: "Novo",
  confirmed: "Confirmado",
  preparing: "Em preparo",
  ready: "Pronto",
  out_for_delivery: "Saiu para entrega",
  delivered: "Entregue",
  completed: "Concluído",
  cancelled: "Cancelado",
};

export const paymentStatusLabels: Record<string, string> = {
  pending: "Pendente",
  paid: "Pago",
  failed: "Falhou",
  refunded: "Reembolsado",
};

export const metricLabels: Record<string, string> = {
  orders: "Pedidos",
  revenue: "Faturamento",
  customers: "Clientes",
  cash: "Dinheiro",
  delivery: "Entrega",
  pickup: "Retirada",
  average_ticket: "Ticket médio",
};

export const paymentLabel = (v?: string | null) =>
  (v && paymentLabels[v]) || (v ?? "");
export const orderTypeLabel = (v?: string | null) =>
  (v && orderTypeLabels[v]) || (v ?? "");
export const orderStatusLabel = (v?: string | null) =>
  (v && orderStatusLabels[v]) || (v ?? "");
export const paymentStatusLabel = (v?: string | null) =>
  (v && paymentStatusLabels[v]) || (v ?? "");
export const metricLabel = (v?: string | null) =>
  (v && metricLabels[v.toLowerCase?.() ?? v]) || (v ?? "");
