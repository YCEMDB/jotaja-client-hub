import { supabase } from "@/integrations/supabase/client";

export type OnboardingStepKey =
  | "welcome"
  | "restaurant_profile"
  | "opening_hours"
  | "address_operation"
  | "delivery_or_tables"
  | "category"
  | "product"
  | "payment"
  | "menu_published"
  | "test_order"
  | "panel_tour"
  | "done";

export type OnboardingStatus = "not_started" | "in_progress" | "completed" | "dismissed";

export interface OnboardingStep {
  key: OnboardingStepKey;
  completed: boolean;
  required: boolean;
}

export interface OnboardingSnapshot {
  restaurant_id: string;
  status: OnboardingStatus;
  current_step: OnboardingStepKey | null;
  started_at: string | null;
  completed_at: string | null;
  dismissed_at: string | null;
  last_seen_at: string | null;
  version: number;
  steps: OnboardingStep[];
  progress_pct: number;
  required_total: number;
  required_completed: number;
  total_steps: number;
  completed_steps: number;
  recommended_next_step: OnboardingStepKey | null;
  is_ready_to_receive: boolean;
}

/**
 * Human-readable labels for each onboarding step (pt-BR).
 * Keep language simple — see WAVE_7 docs for the rule.
 */
export const STEP_LABELS: Record<OnboardingStepKey, string> = {
  welcome: "Boas-vindas",
  restaurant_profile: "Dados do restaurante",
  opening_hours: "Horários de atendimento",
  address_operation: "Endereço e formas de atender",
  delivery_or_tables: "Entrega ou mesas",
  category: "Primeira categoria",
  product: "Primeiro produto",
  payment: "Forma de pagamento",
  menu_published: "Cardápio publicado",
  test_order: "Pedido de teste",
  panel_tour: "Conhecer o painel",
  done: "Tudo pronto",
};

export const STEP_DESCRIPTIONS: Record<OnboardingStepKey, string> = {
  welcome: "Vamos preparar seu restaurante para receber pedidos.",
  restaurant_profile: "Nome, telefone e link público do seu restaurante.",
  opening_hours: "Fuso horário e horários de atendimento por dia.",
  address_operation: "Endereço da loja e como você atende (delivery, retirada, mesa).",
  delivery_or_tables: "Se faz entrega, cadastre as áreas. Se atende no salão, cadastre mesas.",
  category: "Crie a primeira categoria do cardápio (ex: Lanches).",
  product: "Adicione o primeiro produto com preço e descrição.",
  payment: "Escolha as formas de pagamento aceitas.",
  menu_published: "Seu cardápio já pode ser visualizado pelos clientes.",
  test_order: "Faça um pedido de teste para conhecer o fluxo. Ele não conta no faturamento.",
  panel_tour: "Conheça a tela de pedidos: novo, confirmar, preparar, pronto e finalizar.",
  done: "Restaurante pronto para receber pedidos reais.",
};

/**
 * Rota interna onde a etapa é concluída.
 * O tutorial NÃO abre modais isolados: leva o usuário à tela real de configuração
 * e o checklist re-deriva o estado a partir do banco.
 */
export const STEP_ROUTES: Partial<Record<OnboardingStepKey, string>> = {
  restaurant_profile: "/admin/configuracoes",
  opening_hours: "/admin/configuracoes",
  address_operation: "/admin/configuracoes",
  delivery_or_tables: "/admin/entregas",
  category: "/admin/cardapio",
  product: "/admin/cardapio",
  payment: "/admin/configuracoes",
  menu_published: "/admin/cardapio",
  test_order: "/admin/pedidos",
  panel_tour: "/admin/pedidos",
};

export async function fetchOnboardingStatus(restaurantId: string): Promise<OnboardingSnapshot> {
  const { data, error } = await supabase.rpc("get_onboarding_status", {
    p_restaurant_id: restaurantId,
  } as never);
  if (error) throw error;
  return data as unknown as OnboardingSnapshot;
}

export async function startOnboarding(restaurantId: string, reason?: string): Promise<OnboardingSnapshot> {
  const { data, error } = await supabase.rpc("start_onboarding", {
    p_restaurant_id: restaurantId,
    p_reason: reason ?? null,
  } as never);
  if (error) throw error;
  return data as unknown as OnboardingSnapshot;
}

export async function setCurrentStep(
  restaurantId: string,
  step: OnboardingStepKey,
  reason?: string,
): Promise<OnboardingSnapshot> {
  const { data, error } = await supabase.rpc("set_onboarding_current_step", {
    p_restaurant_id: restaurantId,
    p_step: step,
    p_reason: reason ?? null,
  } as never);
  if (error) throw error;
  return data as unknown as OnboardingSnapshot;
}

export async function dismissOnboarding(restaurantId: string, reason?: string): Promise<OnboardingSnapshot> {
  const { data, error } = await supabase.rpc("dismiss_onboarding", {
    p_restaurant_id: restaurantId,
    p_reason: reason ?? null,
  } as never);
  if (error) throw error;
  return data as unknown as OnboardingSnapshot;
}

export async function completeOnboarding(restaurantId: string, reason?: string): Promise<OnboardingSnapshot> {
  const { data, error } = await supabase.rpc("complete_onboarding", {
    p_restaurant_id: restaurantId,
    p_reason: reason ?? null,
  } as never);
  if (error) throw error;
  return data as unknown as OnboardingSnapshot;
}

export async function resetOnboarding(restaurantId: string, reason: string): Promise<OnboardingSnapshot> {
  const { data, error } = await supabase.rpc("reset_onboarding", {
    p_restaurant_id: restaurantId,
    p_reason: reason,
  } as never);
  if (error) throw error;
  return data as unknown as OnboardingSnapshot;
}

/**
 * Mensagens amigáveis para os erros conhecidos das RPCs de onboarding.
 * Nunca exibimos o texto bruto do banco.
 */
export function translateOnboardingError(err: unknown): string {
  const msg = (err as { message?: string } | null)?.message ?? "";
  if (msg.includes("onboarding_access_forbidden")) return "Você não tem permissão para alterar o tutorial deste restaurante.";
  if (msg.includes("reason_required")) return "Descreva o motivo antes de continuar.";
  if (msg.includes("step_not_available")) return "Etapa desconhecida.";
  if (msg.includes("feature_not_available")) return "Essa etapa não está disponível no seu plano.";
  if (msg.includes("plan_limit_reached")) return "Você atingiu o limite do seu plano.";
  if (msg.includes("restaurant_not_ready")) return "Ainda faltam configurações para essa etapa.";
  if (msg.includes("test_order_failed")) return "Não foi possível criar o pedido de teste. Tente novamente.";
  return "Não foi possível concluir a ação. Tente novamente em instantes.";
}
