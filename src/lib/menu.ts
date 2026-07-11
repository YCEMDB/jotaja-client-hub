import { supabase } from "@/integrations/supabase/client";

/**
 * Wrappers das RPCs de Cardápio (Onda 2.b.3.1 → 2.b.3.1.2).
 * NUNCA usar DML direto em `categories`/`products` a partir da UI.
 *
 * Nota de tipagem: as RPCs geradas aceitam parâmetros opcionais (undefined),
 * então convertemos `null` → `undefined` no envio, preservando o significado
 * "não enviar" para o servidor (que usa DEFAULT NULL).
 */

const blankToUndef = (s: string | null | undefined): string | undefined => {
  const v = (s ?? "").trim();
  return v ? v : undefined;
};
const undef = <T>(v: T | null | undefined): T | undefined => (v ?? undefined);

export async function createCategory(input: {
  restaurantId: string;
  name: string;
  description?: string | null;
  position?: number | null;
  stationId?: string | null;
  reason?: string | null;
}) {
  const { data, error } = await supabase.rpc("create_category", {
    p_restaurant_id: input.restaurantId,
    p_name: input.name.trim(),
    p_description: blankToUndef(input.description),
    p_position: undef(input.position),
    p_station_id: undef(input.stationId),
    p_reason: blankToUndef(input.reason),
  });
  if (error) throw error;
  return data as string;
}

export async function updateCategory(input: {
  id: string;
  name?: string | null;
  description?: string | null;
  position?: number | null;
  stationId?: string | null;
  isActive?: boolean | null;
  reason?: string | null;
}) {
  const { error } = await supabase.rpc("update_category", {
    p_id: input.id,
    p_name: input.name != null ? input.name.trim() : undefined,
    p_description: input.description === undefined ? undefined : blankToUndef(input.description),
    p_position: undef(input.position),
    p_station_id: undef(input.stationId),
    p_is_active: undef(input.isActive),
    p_reason: blankToUndef(input.reason),
  });
  if (error) throw error;
}

export async function archiveCategory(id: string, reason: string) {
  const { error } = await supabase.rpc("archive_category", {
    p_id: id, p_reason: reason.trim(),
  });
  if (error) throw error;
}

export async function restoreCategory(id: string, reason: string) {
  const { error } = await supabase.rpc("restore_category", {
    p_id: id, p_reason: reason.trim(),
  });
  if (error) throw error;
}

export async function createProduct(input: {
  restaurantId: string;
  name: string;
  price: number;
  categoryId?: string | null;
  description?: string | null;
  promoPrice?: number | null;
  imageUrl?: string | null;
  position?: number | null;
  stationId?: string | null;
  isAvailable?: boolean;
  reason?: string | null;
}) {
  const { data, error } = await supabase.rpc("create_product", {
    p_restaurant_id: input.restaurantId,
    p_name: input.name.trim(),
    p_price: input.price,
    p_category_id: undef(input.categoryId),
    p_description: blankToUndef(input.description),
    p_promo_price: undef(input.promoPrice),
    p_image_url: blankToUndef(input.imageUrl),
    p_position: undef(input.position),
    p_station_id: undef(input.stationId),
    p_is_available: input.isAvailable ?? true,
    p_reason: blankToUndef(input.reason),
  });
  if (error) throw error;
  return data as string;
}

/** Somente campos operacionais — nunca envia price/promo/is_available/archived. */
export async function updateProductOperational(input: {
  id: string;
  name?: string | null;
  description?: string | null;
  categoryId?: string | null;
  stationId?: string | null;
  imageUrl?: string | null;
  clearImage?: boolean;
  position?: number | null;
  reason?: string | null;
}) {
  const { error } = await supabase.rpc("update_product", {
    p_id: input.id,
    p_name: input.name != null ? input.name.trim() : undefined,
    p_description: input.description === undefined ? undefined : blankToUndef(input.description),
    p_category_id: undef(input.categoryId),
    p_station_id: undef(input.stationId),
    p_image_url: input.imageUrl === undefined ? undefined : blankToUndef(input.imageUrl),
    p_clear_image: input.clearImage ?? false,
    p_position: undef(input.position),
    p_reason: blankToUndef(input.reason),
  });
  if (error) throw error;
}

export async function setProductAvailability(input: {
  id: string;
  isAvailable: boolean;
  reason?: string | null;
}) {
  const { data, error } = await supabase.rpc("set_product_availability", {
    p_id: input.id,
    p_is_available: input.isAvailable,
    p_reason: blankToUndef(input.reason),
  });
  if (error) throw error;
  return data as { noop: boolean } | null;
}

/**
 * Sempre exige valores esperados (concorrência otimista).
 * NULL de promoção NÃO é convertido para zero — enviado como null direto.
 */
export async function setProductPrice(input: {
  id: string;
  price: number;
  promoPrice: number | null;
  expectedCurrentPrice: number;
  expectedCurrentPromoPrice: number | null;
  reason?: string | null;
}) {
  // Para promo NULL usamos undefined para respeitar a assinatura gerada;
  // o servidor interpreta ausência como "sem promoção" e compara com IS DISTINCT FROM.
  const { data, error } = await supabase.rpc("set_product_price", {
    p_id: input.id,
    p_price: input.price,
    p_promo_price: input.promoPrice ?? undefined,
    p_expected_current_price: input.expectedCurrentPrice,
    p_expected_current_promo_price: input.expectedCurrentPromoPrice ?? undefined,
    p_expected_provided: true,
    p_reason: blankToUndef(input.reason),
  });
  if (error) throw error;
  return data as { noop: boolean } | null;
}

export async function archiveProduct(id: string, reason: string) {
  const { error } = await supabase.rpc("archive_product", {
    p_id: id, p_reason: reason.trim(),
  });
  if (error) throw error;
}

export async function restoreProduct(id: string, reason: string) {
  const { error } = await supabase.rpc("restore_product", {
    p_id: id, p_reason: reason.trim(),
  });
  if (error) throw error;
}

/** Recarrega valores atuais do produto (usado em conflito de preço). */
export async function fetchProductPriceSnapshot(id: string) {
  const { data, error } = await supabase
    .from("products")
    .select("id, price, promo_price, updated_at")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}
