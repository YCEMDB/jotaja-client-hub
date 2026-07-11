import { supabase } from "@/integrations/supabase/client";

/**
 * Wrappers das RPCs administrativas do Super Admin (Onda 2.c).
 * NUNCA usar DML direto nas telas /super — sempre chamar essas funções.
 * Todas exigem Super Admin autenticado e são auditadas no backend.
 *
 * Nota de tipagem: usamos `as never` no payload para permitir null nos
 * parâmetros opcionais das RPCs (o tipo gerado é conservador demais).
 */

export async function adminUpdateRestaurantMeta(input: {
  restaurantId: string;
  planId?: string | null;
  isActive?: boolean | null;
  adminNotes?: string | null;
  reason?: string | null;
}) {
  const { error } = await supabase.rpc("admin_update_restaurant_meta", {
    p_restaurant_id: input.restaurantId,
    p_plan_id: input.planId ?? null,
    p_is_active: input.isActive ?? null,
    p_admin_notes: input.adminNotes ?? null,
    p_reason: (input.reason ?? "").trim() || null,
  } as never);
  if (error) throw error;
}

export async function adminSetSubscriptionEnd(input: {
  restaurantId: string;
  endsAt: string | null;
  reason: string;
}) {
  const { error } = await supabase.rpc("admin_set_subscription_end", {
    p_restaurant_id: input.restaurantId,
    p_ends_at: input.endsAt,
    p_reason: input.reason.trim(),
  } as never);
  if (error) throw error;
}

export async function adminSuspendRestaurant(restaurantId: string, reason: string) {
  const { error } = await supabase.rpc("admin_suspend_restaurant", {
    p_restaurant_id: restaurantId,
    p_reason: reason.trim(),
  } as never);
  if (error) throw error;
}

export async function adminReactivateRestaurant(restaurantId: string, reason: string) {
  const { error } = await supabase.rpc("admin_reactivate_restaurant", {
    p_restaurant_id: restaurantId,
    p_reason: reason.trim(),
  } as never);
  if (error) throw error;
}

export async function adminRegisterPayment(input: {
  restaurantId: string;
  amount: number;
  months: number;
  method?: string | null;
  notes?: string | null;
  reason: string;
}) {
  const { data, error } = await supabase.rpc("admin_register_payment", {
    p_restaurant_id: input.restaurantId,
    p_amount: input.amount,
    p_months: input.months,
    p_method: input.method ?? null,
    p_notes: input.notes ?? null,
    p_reason: input.reason.trim(),
  } as never);
  if (error) throw error;
  return data as unknown as { ok: boolean; payment_id: string; subscription_ends_at: string };
}

export async function adminUpsertAnnouncement(input: {
  id?: string | null;
  message: string;
  variant: "info" | "success" | "warning" | "danger";
  isActive: boolean;
  expiresAt: string | null;
}) {
  const { data, error } = await supabase.rpc("admin_upsert_announcement", {
    p_id: input.id ?? null,
    p_message: input.message.trim(),
    p_variant: input.variant,
    p_is_active: input.isActive,
    p_expires_at: input.expiresAt,
  } as never);
  if (error) throw error;
  return data as unknown as { ok: boolean; id: string };
}

export async function adminDeleteAnnouncement(id: string) {
  const { error } = await supabase.rpc("admin_delete_announcement", { p_id: id } as never);
  if (error) throw error;
}

export async function adminUpsertPlan(input: {
  id: string;
  name: string;
  priceMonthly: number;
  features: unknown;
  position: number;
  isActive: boolean;
}) {
  const { error } = await supabase.rpc("admin_upsert_plan", {
    p_id: input.id,
    p_name: input.name.trim(),
    p_price_monthly: input.priceMonthly,
    p_features: input.features,
    p_position: input.position,
    p_is_active: input.isActive,
  } as never);
  if (error) throw error;
}

export async function adminDeletePlan(id: string, reason: string) {
  const { error } = await supabase.rpc("admin_delete_plan", {
    p_id: id,
    p_reason: reason.trim(),
  } as never);
  if (error) throw error;
}

export async function adminUpdateLead(input: {
  id: string;
  status?: "new" | "contacted" | "approved" | "rejected" | null;
  notes?: string | null;
}) {
  const { error } = await supabase.rpc("admin_update_lead", {
    p_id: input.id,
    p_status: input.status ?? null,
    p_notes: input.notes ?? null,
  } as never);
  if (error) throw error;
}

export async function adminUpsertSetting(input: {
  key: string;
  value: string;
  reason: string;
}) {
  const { data, error } = await supabase.rpc("admin_upsert_setting", {
    p_key: input.key,
    p_value: input.value as unknown as never,
    p_reason: input.reason.trim(),
  } as never);
  if (error) throw error;
  return data as unknown as { ok: boolean; changed: boolean; key: string };
}

/** Traduções semânticas dos erros das RPCs administrativas. */
export function translateAdminError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err ?? "");
  const m = raw.toLowerCase();
  if (m.includes("forbidden: super_admin_required")) return "Ação restrita a Super Admin.";
  if (m.includes("unauthorized")) return "Sessão expirada. Faça login novamente.";
  if (m.includes("reason_required_min_5_chars")) return "Informe um motivo (mínimo 5 caracteres).";
  if (m.includes("invalid_plan_id")) return "Plano de recursos inexistente.";
  if (m.includes("plan_in_use")) return "Não é possível excluir: plano em uso por lojas.";
  if (m.includes("plan_not_found")) return "Plano não encontrado.";
  if (m.includes("invalid_amount")) return "Valor inválido.";
  if (m.includes("invalid_months")) return "Quantidade de meses inválida (1–60).";
  if (m.includes("invalid_status")) return "Status inválido.";
  if (m.includes("invalid_variant")) return "Tipo de aviso inválido.";
  if (m.includes("invalid_id_format")) return "Identificador inválido (use apenas letras minúsculas, números e _).";
  if (m.includes("announcement_not_found")) return "Aviso não encontrado.";
  if (m.includes("lead_not_found")) return "Lead não encontrado.";
  if (m.includes("restaurant not found")) return "Restaurante não encontrado.";
  if (m.includes("message_required")) return "Mensagem obrigatória.";
  if (m.includes("id_required")) return "Identificador obrigatório.";
  if (m.includes("name_required")) return "Nome obrigatório.";
  return raw || "Erro ao executar ação administrativa.";
}
