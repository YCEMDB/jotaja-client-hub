/**
 * Camada de acesso ao módulo de Mesas & Comandas.
 * Usa apenas RPCs oficiais criadas na migração 20260707123927.
 * Nada de lógica de negócio no cliente — apenas typing + wrappers.
 */
import { supabase } from "@/integrations/supabase/client";

export type TableUiStatus = "free" | "open" | "closing" | "blocked" | "inactive";

export type TableMapRow = {
  id: string;
  number: number;
  name: string | null;
  area: string | null;
  capacity: number;
  qr_token: string;
  is_active: boolean;
  position_x: number | null;
  position_y: number | null;
  session_id: string | null;
  session_status: "open" | "closing" | "blocked" | "closed" | "cancelled" | null;
  opened_at: string | null;
  party_size: number | null;
  customer_name: string | null;
  current_total: number;
  open_orders: number;
  ui_status: TableUiStatus;
};

export type TableInput = {
  number: number;
  name?: string | null;
  area?: string | null;
  capacity?: number;
  notes?: string | null;
};

export async function getTableMap(restaurantId: string): Promise<TableMapRow[]> {
  const { data, error } = await supabase.rpc("get_table_map", { p_restaurant_id: restaurantId });
  if (error) throw error;
  return (data as unknown as TableMapRow[]) ?? [];
}

export async function createTable(restaurantId: string, input: TableInput): Promise<string> {
  const { data, error } = await supabase.rpc("create_table", {
    p_restaurant_id: restaurantId,
    p_number: input.number,
    p_name: input.name ?? null,
    p_area: input.area ?? null,
    p_capacity: input.capacity ?? 2,
    p_notes: input.notes ?? null,
  });
  if (error) throw error;
  return data as unknown as string;
}

export async function updateTable(tableId: string, patch: Partial<TableInput> & {
  is_active?: boolean; position_x?: number; position_y?: number;
}): Promise<void> {
  const { error } = await supabase.rpc("update_table", {
    p_table_id: tableId,
    p_patch: patch as any,
  });
  if (error) throw error;
}

export async function deleteTable(tableId: string): Promise<void> {
  const { error } = await supabase.rpc("delete_table", { p_table_id: tableId });
  if (error) throw error;
}

export async function regenTableQr(tableId: string): Promise<string> {
  const { data, error } = await supabase.rpc("regen_table_qr", { p_table_id: tableId });
  if (error) throw error;
  return data as unknown as string;
}

export async function openTableSession(params: {
  tableId: string;
  partySize?: number | null;
  customerName?: string | null;
  notes?: string | null;
}): Promise<string> {
  const { data, error } = await supabase.rpc("open_table_session", {
    p_table_id: params.tableId,
    p_party_size: params.partySize ?? null,
    p_customer_name: params.customerName ?? null,
    p_notes: params.notes ?? null,
  });
  if (error) throw error;
  return data as unknown as string;
}

export type CloseSplit = { method: "cash" | "pix" | "card_credit" | "card_debit" | "other"; amount: number; payer_label?: string };

export async function closeTableSession(sessionId: string, splits: CloseSplit[] = [], force = false) {
  const { data, error } = await supabase.rpc("close_table_session", {
    p_session_id: sessionId,
    p_splits: splits as any,
    p_force: force,
  });
  if (error) throw error;
  return data as unknown as { session_id: string; total: number; paid: number; balance: number; forced: boolean };
}

export async function cancelTableSession(sessionId: string, reason?: string): Promise<void> {
  const { error } = await supabase.rpc("cancel_table_session", {
    p_session_id: sessionId,
    p_reason: reason ?? null,
  });
  if (error) throw error;
}

export async function blockTable(tableId: string, reason?: string): Promise<void> {
  const { error } = await supabase.rpc("block_table", {
    p_table_id: tableId,
    p_reason: reason ?? null,
  });
  if (error) throw error;
}

export async function unblockTable(tableId: string): Promise<void> {
  const { error } = await supabase.rpc("unblock_table", { p_table_id: tableId });
  if (error) throw error;
}

/** Mensagens amigáveis para erros vindos das RPCs. */
export function translateTableError(msg: string): string {
  if (msg.includes("tables_limit_reached")) return "Limite de mesas do seu plano atingido. Faça upgrade para adicionar mais mesas.";
  if (msg.includes("table_busy")) return "Esta mesa já possui uma sessão aberta.";
  if (msg.includes("table_inactive")) return "Esta mesa está inativa. Ative-a antes de abrir uma sessão.";
  if (msg.includes("table_in_use")) return "Não é possível remover uma mesa com sessão aberta.";
  if (msg.includes("session_not_open")) return "Esta sessão não está aberta.";
  if (msg.includes("session_has_open_orders")) return "Existem pedidos ainda em preparo. Marque-os como entregues, cancele ou use forçar fechamento (apenas dono).";
  if (msg.includes("forbidden: apenas o dono")) return "Apenas o dono do restaurante pode forçar o fechamento.";
  if (msg.includes("forbidden")) return "Você não tem permissão para essa ação.";
  if (msg.includes("not_found")) return "Registro não encontrado.";
  if (msg.includes("duplicate key") && msg.includes("number")) return "Já existe uma mesa com este número.";
  return msg;
}
