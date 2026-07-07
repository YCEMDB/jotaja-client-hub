import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type DriverStatus = "offline" | "available" | "busy";

export interface DeliveryDriver {
  id: string;
  name: string;
  phone: string | null;
  vehicle: string | null;
  license_plate: string | null;
  is_active: boolean;
  status: DriverStatus;
  fee_per_delivery: number | null;
  commission_percent: number | null;
  current_latitude: number | null;
  current_longitude: number | null;
  last_location_at: string | null;
  user_id: string | null;
}

export interface DeliveryOrder {
  id: string;
  order_number: number;
  customer_name: string;
  customer_phone: string;
  status: Database["public"]["Enums"]["order_status"];
  payment: string;
  payment_status: string;
  total: number;
  delivery_fee: number;
  delivery_address: any;
  notes: string | null;
  created_at: string;
  updated_at: string;
  driver_id: string | null;
  driver_assigned_at: string | null;
  driver_accepted_at: string | null;
  driver_picked_up_at: string | null;
  driver_delivered_at: string | null;
  driver_reject_reason: string | null;
  estimated_minutes: number | null;
}

export interface DeliveryDashboard {
  drivers_total: number;
  drivers_online: number;
  drivers_available: number;
  drivers_busy: number;
  awaiting_driver: number;
  in_route: number;
  delivered_today: number;
  avg_pickup_min: number | null;
  avg_delivery_min: number | null;
}

export async function getDeliveryDashboard(restaurantId: string): Promise<DeliveryDashboard> {
  const { data, error } = await supabase.rpc("get_delivery_dashboard", { p_restaurant_id: restaurantId });
  if (error) throw error;
  return (data as unknown as DeliveryDashboard) ?? {
    drivers_total: 0, drivers_online: 0, drivers_available: 0, drivers_busy: 0,
    awaiting_driver: 0, in_route: 0, delivered_today: 0, avg_pickup_min: null, avg_delivery_min: null,
  };
}

export async function listDeliveryDrivers(restaurantId: string): Promise<DeliveryDriver[]> {
  const { data, error } = await supabase
    .from("delivery_drivers")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .order("name");
  if (error) throw error;
  return (data ?? []) as unknown as DeliveryDriver[];
}

/**
 * Pedidos de delivery ativos + entregues hoje. Não inclui pickup/dine_in.
 */
export async function listDeliveryOrders(restaurantId: string): Promise<DeliveryOrder[]> {
  const since = new Date();
  since.setHours(0, 0, 0, 0);
  const { data, error } = await supabase
    .from("orders")
    .select("id,order_number,customer_name,customer_phone,status,payment,payment_status,total,delivery_fee,delivery_address,notes,created_at,updated_at,driver_id,driver_assigned_at,driver_accepted_at,driver_picked_up_at,driver_delivered_at,driver_reject_reason,estimated_minutes")
    .eq("restaurant_id", restaurantId)
    .eq("type", "delivery")
    .or(`status.in.(pending,confirmed,preparing,ready,out_for_delivery),and(status.eq.delivered,driver_delivered_at.gte.${since.toISOString()})`)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as DeliveryOrder[];
}

export async function assignDriver(orderId: string, driverId: string) {
  const { error } = await supabase.rpc("assign_driver", { p_order_id: orderId, p_driver_id: driverId });
  if (error) throw error;
}

export async function unassignDriver(orderId: string, reason?: string) {
  const { error } = await supabase.rpc("unassign_driver", { p_order_id: orderId, p_reason: reason ?? undefined });
  if (error) throw error;
}

/**
 * Bucket para colunas do Kanban.
 */
export type DeliveryBucket = "awaiting" | "assigned" | "in_route" | "delivered";

export function bucketOf(o: DeliveryOrder): DeliveryBucket {
  if (o.status === "delivered") return "delivered";
  if (o.status === "out_for_delivery") return "in_route";
  if (!o.driver_id && ["pending", "confirmed", "preparing", "ready"].includes(o.status)) return "awaiting";
  return "assigned";
}
