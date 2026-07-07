import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type FinanceDirection = Database["public"]["Enums"]["finance_direction"];
export type FinanceStatus = Database["public"]["Enums"]["finance_status"];
export type FinancePayMethod = Database["public"]["Enums"]["finance_pay_method"];

export interface FinanceCategory {
  id: string;
  restaurant_id: string;
  name: string;
  direction: FinanceDirection;
  color: string | null;
  is_active: boolean;
}

export interface FinanceCostCenter {
  id: string;
  restaurant_id: string;
  name: string;
  description: string | null;
  is_active: boolean;
}

export interface FinanceEntry {
  id: string;
  restaurant_id: string;
  direction: FinanceDirection;
  category_id: string | null;
  cost_center_id: string | null;
  description: string;
  amount: number;
  amount_paid: number;
  status: FinanceStatus;
  issue_date: string;
  due_date: string;
  paid_at: string | null;
  payment_method: FinancePayMethod | null;
  supplier: string | null;
  customer: string | null;
  document: string | null;
  notes: string | null;
  is_fixed: boolean;
  recurrence: string | null;
  order_id: string | null;
  cash_session_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface FinanceDashboard {
  payable_open: number;
  receivable_open: number;
  payable_overdue: number;
  receivable_overdue: number;
  paid_period: number;
  received_period: number;
  today_due_payable: number;
  today_due_receivable: number;
}

export const STATUS_LABEL: Record<FinanceStatus, string> = {
  pending: "Em aberto",
  partial: "Parcial",
  paid: "Quitado",
  overdue: "Vencido",
  cancelled: "Cancelado",
};

export const STATUS_ACCENT: Record<FinanceStatus, string> = {
  pending: "bg-brand-amber/20 text-ink border-brand-amber",
  partial: "bg-brand-violet/20 text-ink border-brand-violet",
  paid: "bg-emerald-500/20 text-ink border-emerald-500",
  overdue: "bg-brand-magenta/20 text-ink border-brand-magenta",
  cancelled: "bg-muted text-ink/60 border-ink/20",
};

export const METHOD_LABEL: Record<FinancePayMethod, string> = {
  cash: "Dinheiro",
  pix: "PIX",
  credit: "Cartão de crédito",
  debit: "Cartão de débito",
  transfer: "Transferência",
  boleto: "Boleto",
  other: "Outro",
};

export const formatBRL = (v: number | string | null | undefined) =>
  Number(v ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// ---------- Categories ----------
export async function listCategories(restaurantId: string): Promise<FinanceCategory[]> {
  const { data, error } = await supabase
    .from("finance_categories")
    .select("id,restaurant_id,name,direction,color,is_active")
    .eq("restaurant_id", restaurantId)
    .order("name");
  if (error) throw error;
  return (data ?? []) as FinanceCategory[];
}

export async function upsertCategory(input: {
  id?: string;
  restaurant_id: string;
  name: string;
  direction: FinanceDirection;
  color?: string | null;
  is_active?: boolean;
}): Promise<FinanceCategory> {
  const payload = {
    name: input.name.trim(),
    direction: input.direction,
    color: input.color ?? null,
    is_active: input.is_active ?? true,
    restaurant_id: input.restaurant_id,
  };
  if (input.id) {
    const { data, error } = await supabase.from("finance_categories").update(payload).eq("id", input.id).select().single();
    if (error) throw error;
    return data as FinanceCategory;
  }
  const { data, error } = await supabase.from("finance_categories").insert(payload).select().single();
  if (error) throw error;
  return data as FinanceCategory;
}

export async function deleteCategory(id: string) {
  const { error } = await supabase.from("finance_categories").delete().eq("id", id);
  if (error) throw error;
}

// ---------- Cost centers ----------
export async function listCostCenters(restaurantId: string): Promise<FinanceCostCenter[]> {
  const { data, error } = await supabase
    .from("finance_cost_centers")
    .select("id,restaurant_id,name,description,is_active")
    .eq("restaurant_id", restaurantId)
    .order("name");
  if (error) throw error;
  return (data ?? []) as FinanceCostCenter[];
}

export async function upsertCostCenter(input: {
  id?: string;
  restaurant_id: string;
  name: string;
  description?: string | null;
  is_active?: boolean;
}): Promise<FinanceCostCenter> {
  const payload = {
    restaurant_id: input.restaurant_id,
    name: input.name.trim(),
    description: input.description ?? null,
    is_active: input.is_active ?? true,
  };
  if (input.id) {
    const { data, error } = await supabase.from("finance_cost_centers").update(payload).eq("id", input.id).select().single();
    if (error) throw error;
    return data as FinanceCostCenter;
  }
  const { data, error } = await supabase.from("finance_cost_centers").insert(payload).select().single();
  if (error) throw error;
  return data as FinanceCostCenter;
}

export async function deleteCostCenter(id: string) {
  const { error } = await supabase.from("finance_cost_centers").delete().eq("id", id);
  if (error) throw error;
}

// ---------- Entries ----------
export interface EntryFilters {
  direction?: FinanceDirection | "all";
  status?: FinanceStatus | "all";
  from?: string;
  to?: string;
  categoryId?: string;
  costCenterId?: string;
  q?: string;
}

export async function listEntries(restaurantId: string, filters: EntryFilters = {}): Promise<FinanceEntry[]> {
  let query = supabase
    .from("finance_entries")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .order("due_date", { ascending: false })
    .limit(500);
  if (filters.direction && filters.direction !== "all") query = query.eq("direction", filters.direction);
  if (filters.status && filters.status !== "all") query = query.eq("status", filters.status);
  if (filters.from) query = query.gte("due_date", filters.from);
  if (filters.to) query = query.lte("due_date", filters.to);
  if (filters.categoryId) query = query.eq("category_id", filters.categoryId);
  if (filters.costCenterId) query = query.eq("cost_center_id", filters.costCenterId);
  const { data, error } = await query;
  if (error) throw error;
  let list = (data ?? []) as FinanceEntry[];
  if (filters.q) {
    const q = filters.q.toLowerCase();
    list = list.filter(
      (e) =>
        e.description.toLowerCase().includes(q) ||
        (e.supplier ?? "").toLowerCase().includes(q) ||
        (e.customer ?? "").toLowerCase().includes(q) ||
        (e.document ?? "").toLowerCase().includes(q),
    );
  }
  return list;
}

export interface EntryInput {
  id?: string;
  restaurant_id: string;
  direction: FinanceDirection;
  description: string;
  amount: number;
  due_date: string;
  issue_date?: string;
  category_id?: string | null;
  cost_center_id?: string | null;
  payment_method?: FinancePayMethod | null;
  supplier?: string | null;
  customer?: string | null;
  document?: string | null;
  notes?: string | null;
  is_fixed?: boolean;
  recurrence?: string | null;
}

export async function upsertEntry(input: EntryInput): Promise<FinanceEntry> {
  const payload = {
    restaurant_id: input.restaurant_id,
    direction: input.direction,
    description: input.description.trim(),
    amount: input.amount,
    due_date: input.due_date,
    issue_date: input.issue_date,
    category_id: input.category_id ?? null,
    cost_center_id: input.cost_center_id ?? null,
    payment_method: input.payment_method ?? null,
    supplier: input.supplier ?? null,
    customer: input.customer ?? null,
    document: input.document ?? null,
    notes: input.notes ?? null,
    is_fixed: input.is_fixed ?? false,
    recurrence: input.recurrence ?? null,
  };
  if (input.id) {
    const { data, error } = await supabase.from("finance_entries").update(payload).eq("id", input.id).select().single();
    if (error) throw error;
    return data as FinanceEntry;
  }
  const { data, error } = await supabase.from("finance_entries").insert(payload).select().single();
  if (error) throw error;
  return data as FinanceEntry;
}

export async function payEntry(input: {
  entry_id: string;
  amount: number;
  payment_method?: FinancePayMethod | null;
  cash_session_id?: string | null;
  notes?: string | null;
}): Promise<FinanceEntry> {
  const { data, error } = await supabase.rpc("finance_entry_pay", {
    p_entry_id: input.entry_id,
    p_amount: input.amount,
    p_payment_method: input.payment_method ?? undefined,
    p_cash_session_id: input.cash_session_id ?? undefined,
    p_notes: input.notes ?? undefined,
  });
  if (error) throw error;
  return data as unknown as FinanceEntry;
}

export async function cancelEntry(entryId: string): Promise<FinanceEntry> {
  const { data, error } = await supabase.rpc("finance_entry_cancel", { p_entry_id: entryId });
  if (error) throw error;
  return data as unknown as FinanceEntry;
}

export async function getDashboard(restaurantId: string, from?: string, to?: string): Promise<FinanceDashboard> {
  const { data, error } = await supabase.rpc("get_finance_dashboard", {
    p_restaurant_id: restaurantId,
    p_from: from ?? undefined,
    p_to: to ?? undefined,
  });
  if (error) throw error;
  return (data ?? {}) as unknown as FinanceDashboard;
}

// ---------- Open cash session helper ----------
export async function getOpenCashSession(restaurantId: string): Promise<{ id: string } | null> {
  const { data, error } = await supabase
    .from("cash_sessions")
    .select("id")
    .eq("restaurant_id", restaurantId)
    .eq("status", "open")
    .order("opened_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) return null;
  return (data as any) ?? null;
}
