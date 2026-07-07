import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type StockMovementType = Database["public"]["Enums"]["stock_movement_type"];

export interface StockUnit {
  id: string;
  restaurant_id: string;
  name: string;
  symbol: string;
}

export interface StockSupplier {
  id: string;
  restaurant_id: string;
  name: string;
  contact: string | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
  is_active: boolean;
}

export interface StockIngredient {
  id: string;
  restaurant_id: string;
  supplier_id: string | null;
  unit_id: string | null;
  name: string;
  sku: string | null;
  current_qty: number;
  min_qty: number;
  avg_cost: number;
  is_active: boolean;
  notes: string | null;
  updated_at: string;
}

export interface StockMovement {
  id: string;
  restaurant_id: string;
  ingredient_id: string;
  movement_type: StockMovementType;
  quantity: number;
  unit_cost: number | null;
  total_cost: number | null;
  qty_before: number;
  qty_after: number;
  supplier_id: string | null;
  order_id: string | null;
  reason: string | null;
  created_by: string | null;
  created_at: string;
}

export interface StockOverview {
  ingredients_total: number;
  ingredients_low: number;
  stock_value: number;
  movements_today: number;
  losses_30d_value: number;
  low_ingredients: Array<{
    id: string;
    name: string;
    current_qty: number;
    min_qty: number;
    unit: string | null;
  }>;
}

const EMPTY_OVERVIEW: StockOverview = {
  ingredients_total: 0,
  ingredients_low: 0,
  stock_value: 0,
  movements_today: 0,
  losses_30d_value: 0,
  low_ingredients: [],
};

// -------------------- Overview --------------------
export async function getStockOverview(restaurantId: string): Promise<StockOverview> {
  const { data, error } = await supabase.rpc("get_stock_overview", { p_restaurant_id: restaurantId });
  if (error) throw error;
  return { ...EMPTY_OVERVIEW, ...((data as unknown as StockOverview) ?? {}) };
}

// -------------------- Units --------------------
export async function listUnits(restaurantId: string): Promise<StockUnit[]> {
  const { data, error } = await supabase
    .from("stock_units")
    .select("id,restaurant_id,name,symbol")
    .eq("restaurant_id", restaurantId)
    .order("symbol");
  if (error) throw error;
  return (data ?? []) as StockUnit[];
}

export async function upsertUnit(input: {
  restaurantId: string;
  id?: string | null;
  name: string;
  symbol: string;
}): Promise<string> {
  const { data, error } = await supabase.rpc("upsert_stock_unit", {
    p_restaurant_id: input.restaurantId,
    p_name: input.name,
    p_symbol: input.symbol,
    p_id: input.id ?? undefined,
  });
  if (error) throw error;
  return data as string;
}

export async function deleteUnit(id: string) {
  const { error } = await supabase.from("stock_units").delete().eq("id", id);
  if (error) throw error;
}

// -------------------- Suppliers --------------------
export async function listSuppliers(restaurantId: string): Promise<StockSupplier[]> {
  const { data, error } = await supabase
    .from("stock_suppliers")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .order("name");
  if (error) throw error;
  return (data ?? []) as StockSupplier[];
}

export async function upsertSupplier(input: {
  restaurantId: string;
  id?: string | null;
  name: string;
  contact?: string | null;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
  is_active?: boolean;
}): Promise<string> {
  const { data, error } = await supabase.rpc("upsert_stock_supplier", {
    p_restaurant_id: input.restaurantId,
    p_name: input.name,
    p_contact: input.contact ?? undefined,
    p_phone: input.phone ?? undefined,
    p_email: input.email ?? undefined,
    p_notes: input.notes ?? undefined,
    p_is_active: input.is_active ?? true,
    p_id: input.id ?? undefined,
  });
  if (error) throw error;
  return data as string;
}

export async function deleteSupplier(id: string) {
  const { error } = await supabase.from("stock_suppliers").delete().eq("id", id);
  if (error) throw error;
}

// -------------------- Ingredients --------------------
export async function listIngredients(restaurantId: string): Promise<StockIngredient[]> {
  const { data, error } = await supabase
    .from("stock_ingredients")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .order("name");
  if (error) throw error;
  return (data ?? []) as unknown as StockIngredient[];
}

export async function createIngredient(input: {
  restaurantId: string;
  name: string;
  unit_id?: string | null;
  supplier_id?: string | null;
  sku?: string | null;
  min_qty?: number;
  initial_qty?: number;
  initial_cost?: number;
  notes?: string | null;
}): Promise<string> {
  const { data, error } = await supabase.rpc("create_stock_ingredient", {
    p_restaurant_id: input.restaurantId,
    p_name: input.name,
    p_unit_id: input.unit_id ?? undefined,
    p_supplier_id: input.supplier_id ?? undefined,
    p_sku: input.sku ?? undefined,
    p_min_qty: input.min_qty ?? 0,
    p_initial_qty: input.initial_qty ?? 0,
    p_initial_cost: input.initial_cost ?? 0,
    p_notes: input.notes ?? undefined,
  });
  if (error) throw error;
  return data as string;
}

export async function updateIngredient(input: {
  id: string;
  name?: string;
  unit_id?: string | null;
  supplier_id?: string | null;
  sku?: string | null;
  min_qty?: number;
  notes?: string | null;
  is_active?: boolean;
}): Promise<void> {
  const { error } = await supabase.rpc("update_stock_ingredient", {
    p_id: input.id,
    p_name: input.name ?? undefined,
    p_unit_id: input.unit_id ?? undefined,
    p_supplier_id: input.supplier_id ?? undefined,
    p_sku: input.sku ?? undefined,
    p_min_qty: input.min_qty ?? undefined,
    p_notes: input.notes ?? undefined,
    p_is_active: input.is_active ?? undefined,
  });
  if (error) throw error;
}

// -------------------- Movements --------------------
export async function listMovements(restaurantId: string, limit = 100): Promise<StockMovement[]> {
  const { data, error } = await supabase
    .from("stock_movements")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as unknown as StockMovement[];
}

export async function registerMovement(input: {
  ingredient_id: string;
  type: StockMovementType;
  quantity: number;
  unit_cost?: number | null;
  supplier_id?: string | null;
  reason?: string | null;
}): Promise<string> {
  const { data, error } = await supabase.rpc("register_stock_movement", {
    p_ingredient_id: input.ingredient_id,
    p_type: input.type,
    p_quantity: input.quantity,
    p_unit_cost: input.unit_cost ?? undefined,
    p_supplier_id: input.supplier_id ?? undefined,
    p_reason: input.reason ?? undefined,
  });
  if (error) throw error;
  return data as string;
}

// -------------------- Recipes / Ficha Técnica --------------------
export interface RecipeItem {
  ingredient_id: string;
  ingredient_name: string;
  unit_symbol: string | null;
  quantity: number;
  avg_cost: number;
  line_cost: number;
  notes?: string | null;
}

export interface ProductRecipe {
  items: RecipeItem[];
  total_cost: number;
}

export interface ProductRecipeStatus {
  product_id: string;
  product_name: string;
  price: number;
  promo_price: number | null;
  has_recipe: boolean;
  item_count: number;
  total_cost: number;
  margin_value: number;
  margin_percent: number | null;
}

export async function getProductRecipe(productId: string): Promise<ProductRecipe> {
  const { data, error } = await supabase.rpc("get_product_recipe", { p_product_id: productId });
  if (error) throw error;
  const d = (data ?? {}) as any;
  return { items: (d.items ?? []) as RecipeItem[], total_cost: Number(d.total_cost ?? 0) };
}

export async function listProductsRecipeStatus(restaurantId: string): Promise<ProductRecipeStatus[]> {
  const { data, error } = await supabase.rpc("list_products_recipe_status", { p_restaurant_id: restaurantId });
  if (error) throw error;
  return ((data as unknown) ?? []) as ProductRecipeStatus[];
}

export async function setProductRecipe(productId: string, items: Array<{ ingredient_id: string; quantity: number; notes?: string | null }>): Promise<number> {
  const { data, error } = await supabase.rpc("set_product_recipe", {
    p_product_id: productId,
    p_items: items as any,
  });
  if (error) throw error;
  return (data as number) ?? 0;
}

// -------------------- Reports / Fase D --------------------

export interface ConsumptionRow {
  ingredient_id: string;
  name: string;
  unit: string | null;
  avg_cost: number;
  qty_sale: number;
  qty_exit: number;
  qty_loss: number;
  qty_entry: number;
  qty_adjust: number;
  qty_reversal: number;
  cost_out: number;
  cost_in: number;
}

export async function getConsumptionReport(restaurantId: string, from: string, to: string): Promise<ConsumptionRow[]> {
  const { data, error } = await (supabase.rpc as any)("get_stock_consumption_report", {
    p_restaurant_id: restaurantId, p_from: from, p_to: to,
  });
  if (error) throw error;
  return ((data ?? []) as ConsumptionRow[]);
}

export interface LossReport {
  total_value: number;
  total_events: number;
  by_ingredient: Array<{ ingredient_id: string; name: string; unit: string | null; quantity: number; total_cost: number; events: number }>;
  events: Array<{ id: string; created_at: string; quantity: number; total_cost: number | null; reason: string | null; ingredient_name: string }>;
}

export async function getLossesReport(restaurantId: string, from: string, to: string): Promise<LossReport> {
  const { data, error } = await (supabase.rpc as any)("get_stock_losses_report", {
    p_restaurant_id: restaurantId, p_from: from, p_to: to,
  });
  if (error) throw error;
  return (data ?? { total_value: 0, total_events: 0, by_ingredient: [], events: [] }) as LossReport;
}

export interface ProfitabilityRow {
  product_id: string;
  product_name: string;
  price: number;
  promo_price: number | null;
  units_sold: number;
  revenue: number;
  unit_cost: number;
  unit_margin: number;
  total_margin: number;
  has_recipe: boolean;
}

export async function getProfitabilityReport(restaurantId: string, from: string, to: string): Promise<ProfitabilityRow[]> {
  const { data, error } = await (supabase.rpc as any)("get_products_profitability_report", {
    p_restaurant_id: restaurantId, p_from: from, p_to: to,
  });
  if (error) throw error;
  return ((data ?? []) as ProfitabilityRow[]);
}

export interface PurchaseSuggestionGroup {
  supplier_key: string;
  supplier_id: string | null;
  supplier_name: string;
  phone: string | null;
  email: string | null;
  estimated_cost: number;
  items: Array<{
    ingredient_id: string;
    name: string;
    unit: string | null;
    current_qty: number;
    min_qty: number;
    suggested_qty: number;
    avg_cost: number;
    line_cost: number;
  }>;
}

export async function getPurchaseSuggestions(restaurantId: string): Promise<PurchaseSuggestionGroup[]> {
  const { data, error } = await (supabase.rpc as any)("get_purchase_suggestions", { p_restaurant_id: restaurantId });
  if (error) throw error;
  return ((data ?? []) as PurchaseSuggestionGroup[]);
}

export async function applyInventoryAdjustment(ingredientId: string, physicalQty: number, reason?: string | null): Promise<string | null> {
  const { data, error } = await (supabase.rpc as any)("apply_inventory_adjustment", {
    p_ingredient_id: ingredientId,
    p_physical_qty: physicalQty,
    p_reason: reason ?? null,
  });
  if (error) throw error;
  return (data as string) ?? null;
}

// -------------------- Labels --------------------

export const MOVEMENT_LABEL: Record<StockMovementType, string> = {
  entry: "Entrada",
  exit: "Saída",
  loss: "Perda",
  adjust: "Ajuste",
  sale: "Venda",
  reversal: "Estorno",
};

export const MOVEMENT_ACCENT: Record<StockMovementType, "green" | "orange" | "magenta" | "violet" | "amber" | "blue"> = {
  entry: "green",
  exit: "orange",
  loss: "magenta",
  adjust: "violet",
  sale: "blue",
  reversal: "amber",
};

export function formatBRL(value: number | null | undefined) {
  const n = Number(value ?? 0);
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
