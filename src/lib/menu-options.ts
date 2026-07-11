/**
 * Wrappers das RPCs de adicionais (grupos e itens) — Onda 2.b (bloco final).
 * NUNCA usar DML direto em `product_option_groups`/`product_option_items`.
 * Todas as escritas passam por essas funções, que validam autorização,
 * nível de suporte, motivo, limites e concorrência no servidor.
 */
import { supabase } from "@/integrations/supabase/client";

const blankToUndef = (s: string | null | undefined): string | undefined => {
  const v = (s ?? "").trim();
  return v ? v : undefined;
};

// ---------------------------------------------------------------------------
// Grupos
// ---------------------------------------------------------------------------

export async function createOptionGroup(input: {
  productId: string;
  name: string;
  minSelect?: number;
  maxSelect?: number;
  isRequired?: boolean;
  position?: number;
  reason?: string | null;
}): Promise<string> {
  const { data, error } = await supabase.rpc("create_option_group", {
    p_product_id: input.productId,
    p_name: input.name.trim(),
    p_min_select: input.minSelect ?? 0,
    p_max_select: input.maxSelect ?? 1,
    p_is_required: input.isRequired ?? false,
    p_position: input.position ?? 0,
    p_reason: blankToUndef(input.reason),
  });
  if (error) throw error;
  return data as string;
}

export async function updateOptionGroupName(id: string, name: string, reason?: string | null) {
  const { error } = await supabase.rpc("update_option_group_name", {
    p_id: id, p_name: name.trim(), p_reason: blankToUndef(reason),
  });
  if (error) throw error;
}

export async function updateOptionGroupPosition(id: string, position: number, reason?: string | null) {
  const { error } = await supabase.rpc("update_option_group_position", {
    p_id: id, p_position: position, p_reason: blankToUndef(reason),
  });
  if (error) throw error;
}

export async function updateOptionGroupLimits(input: {
  id: string;
  minSelect: number;
  maxSelect: number;
  isRequired: boolean;
  reason?: string | null;
}) {
  const { error } = await supabase.rpc("update_option_group_limits", {
    p_id: input.id,
    p_min_select: input.minSelect,
    p_max_select: input.maxSelect,
    p_is_required: input.isRequired,
    p_reason: blankToUndef(input.reason),
  });
  if (error) throw error;
}

export async function archiveOptionGroup(id: string, reason: string) {
  const { error } = await supabase.rpc("archive_option_group", {
    p_id: id, p_reason: reason.trim(),
  });
  if (error) throw error;
}

export async function restoreOptionGroup(id: string, reason: string) {
  const { error } = await supabase.rpc("restore_option_group", {
    p_id: id, p_reason: reason.trim(),
  });
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Itens
// ---------------------------------------------------------------------------

export async function createOptionItem(input: {
  groupId: string;
  name: string;
  extraPrice?: number;
  position?: number;
  isAvailable?: boolean;
  reason?: string | null;
}): Promise<string> {
  const { data, error } = await supabase.rpc("create_option_item", {
    p_group_id: input.groupId,
    p_name: input.name.trim(),
    p_extra_price: input.extraPrice ?? 0,
    p_position: input.position ?? 0,
    p_is_available: input.isAvailable ?? true,
    p_reason: blankToUndef(input.reason),
  });
  if (error) throw error;
  return data as string;
}

export async function updateOptionItemName(id: string, name: string, reason?: string | null) {
  const { error } = await supabase.rpc("update_option_item_name", {
    p_id: id, p_name: name.trim(), p_reason: blankToUndef(reason),
  });
  if (error) throw error;
}

export async function updateOptionItemPosition(id: string, position: number, reason?: string | null) {
  const { error } = await supabase.rpc("update_option_item_position", {
    p_id: id, p_position: position, p_reason: blankToUndef(reason),
  });
  if (error) throw error;
}

export async function setOptionItemAvailability(input: {
  id: string;
  isAvailable: boolean;
  reason?: string | null;
}) {
  const { data, error } = await supabase.rpc("set_option_item_availability", {
    p_id: input.id,
    p_is_available: input.isAvailable,
    p_reason: blankToUndef(input.reason),
  });
  if (error) throw error;
  return data as { noop: boolean } | null;
}

/**
 * Sempre exige valor esperado (concorrência otimista).
 * Servidor recusa se `p_expected_provided=false` — o wrapper nunca envia false.
 */
export async function setOptionItemPrice(input: {
  id: string;
  extraPrice: number;
  expectedCurrentPrice: number;
  reason?: string | null;
}) {
  const { data, error } = await supabase.rpc("set_option_item_price", {
    p_id: input.id,
    p_extra_price: input.extraPrice,
    p_expected_current_price: input.expectedCurrentPrice,
    p_expected_provided: true,
    p_reason: blankToUndef(input.reason),
  });
  if (error) throw error;
  return data as { noop: boolean } | null;
}

export async function archiveOptionItem(id: string, reason: string) {
  const { error } = await supabase.rpc("archive_option_item", {
    p_id: id, p_reason: reason.trim(),
  });
  if (error) throw error;
}

export async function restoreOptionItem(id: string, reason: string) {
  const { error } = await supabase.rpc("restore_option_item", {
    p_id: id, p_reason: reason.trim(),
  });
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Leitura (para telas administrativas futuras). RLS já filtra por tenant.
// ---------------------------------------------------------------------------

export async function fetchOptionItemPriceSnapshot(id: string) {
  const { data, error } = await supabase
    .from("product_option_items")
    .select("id, extra_price, is_available, archived_at")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}
