// Sprint 4.3 — Automações de Conversa + Timelines + Dashboard
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const uuid = z.string().uuid();

const listSchema = z.object({ restaurant_id: uuid });

const upsertSchema = z.object({
  id: uuid.optional(),
  restaurant_id: uuid,
  code: z.string().max(64).nullable().optional(),
  name: z.string().min(1).max(120),
  trigger_type: z.enum(["keyword", "regex"]).default("keyword"),
  trigger_value: z.string().min(1).max(500),
  match_mode: z.enum(["exact", "contains", "starts_with"]).default("contains"),
  response_template_id: uuid.nullable().optional(),
  response_body: z.string().max(4000).nullable().optional(),
  handoff: z.boolean().default(false),
  is_active: z.boolean().default(true),
  priority: z.number().int().min(0).max(9999).default(100),
  cooldown_seconds: z.number().int().min(0).max(86400).default(60),
});

async function assertOwner(supabase: any, userId: string, restaurantId: string) {
  const { data: allowed } = await supabase.rpc("is_team_owner", {
    _uid: userId,
    _restaurant_id: restaurantId,
  });
  if (!allowed) throw new Error("forbidden");
}

// ---------- Rules ----------
export const listAutomationRules = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => listSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: rows, error } = await supabase
      .from("conversation_automation_rules")
      .select("*")
      .eq("restaurant_id", data.restaurant_id)
      .order("priority", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const upsertAutomationRule = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => upsertSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertOwner(supabase, userId, data.restaurant_id);

    // Enforce plan limit
    const { data: rest } = await supabase
      .from("restaurants").select("plan_id").eq("id", data.restaurant_id).maybeSingle();
    const { data: plan } = await supabase
      .from("app_plans").select("features").eq("id", rest?.plan_id ?? "starter").maybeSingle();
    const maxAllowed = plan?.features?.automations_max ?? 0;

    if (!data.id) {
      const { count } = await supabase
        .from("conversation_automation_rules")
        .select("id", { count: "exact", head: true })
        .eq("restaurant_id", data.restaurant_id);
      if (maxAllowed !== null && (count ?? 0) >= maxAllowed) {
        throw new Error(`plan_limit_reached: limite de ${maxAllowed} automações do plano`);
      }
    }

    const payload = {
      restaurant_id: data.restaurant_id,
      code: data.code ?? null,
      name: data.name,
      trigger_type: data.trigger_type,
      trigger_value: data.trigger_value,
      match_mode: data.match_mode,
      response_template_id: data.response_template_id ?? null,
      response_body: data.response_body ?? null,
      handoff: data.handoff,
      is_active: data.is_active,
      priority: data.priority,
      cooldown_seconds: data.cooldown_seconds,
    };
    if (data.id) {
      const { data: row, error } = await supabase
        .from("conversation_automation_rules")
        .update(payload).eq("id", data.id).select().single();
      if (error) throw new Error(error.message);
      return row;
    }
    const { data: row, error } = await supabase
      .from("conversation_automation_rules")
      .insert(payload).select().single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteAutomationRule = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: uuid }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { error } = await supabase
      .from("conversation_automation_rules").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const toggleAutomationRule = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: uuid, is_active: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { error } = await supabase
      .from("conversation_automation_rules")
      .update({ is_active: data.is_active }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const seedDefaultAutomationRules = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => listSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: n, error } = await supabase.rpc("seed_default_automation_rules", {
      p_restaurant_id: data.restaurant_id,
    });
    if (error) throw new Error(error.message);
    return { inserted: n as number };
  });

// ---------- Dashboard / Timelines ----------
export const getConversationsDashboard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => listSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: row, error } = await supabase.rpc("get_conversations_dashboard", {
      p_restaurant_id: data.restaurant_id,
    });
    if (error) throw new Error(error.message);
    return row as {
      open_count: number; unanswered_count: number; avg_response_seconds: number;
      messages_sent_today: number; messages_received_today: number; failures_today: number;
    };
  });

export const getOrderCommunicationTimeline = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ order_id: uuid }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: rows, error } = await supabase.rpc("get_order_communication_timeline", {
      p_order_id: data.order_id,
    });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const getCustomerConversationTimeline = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ customer_id: uuid }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: row, error } = await supabase.rpc("get_customer_conversation_timeline", {
      p_customer_id: data.customer_id,
    });
    if (error) throw new Error(error.message);
    return row as { customer: any; messages: any[]; orders: any[] };
  });
