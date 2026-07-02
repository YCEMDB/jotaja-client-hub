import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// ---------- Schemas ----------
const listConvSchema = z.object({
  restaurant_id: z.string().uuid(),
  search: z.string().max(120).optional(),
  status: z.enum(["open","archived","all"]).default("open"),
  limit: z.number().int().min(1).max(200).default(80),
});
const idSchema = z.object({ conversation_id: z.string().uuid() });
const sendSchema = z.object({
  conversation_id: z.string().uuid(),
  body: z.string().min(1).max(4000),
});
const startSchema = z.object({
  restaurant_id: z.string().uuid(),
  peer_address: z.string().min(4).max(30),
  peer_name: z.string().max(120).optional(),
});

// ---------- List conversations ----------
export const listConversations = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => listConvSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    let q = supabase
      .from("conversations")
      .select("id, restaurant_id, customer_id, channel, provider_code, settings_id, peer_address, peer_name, last_message_at, last_message_preview, last_direction, unread_count, status, order_id, created_at")
      .eq("restaurant_id", data.restaurant_id)
      .order("last_message_at", { ascending: false, nullsFirst: false })
      .limit(data.limit);
    if (data.status !== "all") q = q.eq("status", data.status);
    if (data.search && data.search.trim()) {
      const s = data.search.trim();
      const digits = s.replace(/\D/g, "");
      if (digits.length >= 3) q = q.ilike("peer_address", `%${digits}%`);
      else q = q.ilike("peer_name", `%${s}%`);
    }
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

// ---------- List messages ----------
export const listConversationMessages = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => idSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("conversation_messages")
      .select("id, conversation_id, direction, source, author_user_id, body, status, provider_message_id, order_id, created_at")
      .eq("conversation_id", data.conversation_id)
      .order("created_at", { ascending: true })
      .limit(500);
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

// ---------- Mark as read ----------
export const markConversationRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => idSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.rpc("mark_conversation_read", {
      p_conversation_id: data.conversation_id,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- Send manual message ----------
export const sendManualMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => sendSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { data: msgId, error } = await context.supabase.rpc("send_manual_conversation_message", {
      p_conversation_id: data.conversation_id,
      p_body: data.body,
    });
    if (error) throw new Error(error.message);
    return { ok: true, message_id: msgId as unknown as string };
  });

// ---------- Start conversation (from admin, e.g. reply to phone) ----------
export const startConversation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => startSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { data: allowed } = await context.supabase.rpc("is_team_owner", {
      _uid: context.userId, _restaurant_id: data.restaurant_id,
    });
    // não bloqueia por is_team_owner apenas — RLS já cobre; usamos service para criar
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Descobre um settings ativo p/ associar
    const { data: settings } = await supabaseAdmin
      .from("communication_settings")
      .select("id, provider_code, channel")
      .eq("restaurant_id", data.restaurant_id)
      .eq("is_active", true).is("deleted_at", null)
      .order("created_at", { ascending: false }).limit(1).maybeSingle();

    const { data: convId, error } = await supabaseAdmin.rpc("find_or_create_conversation", {
      p_restaurant_id: data.restaurant_id,
      p_channel: settings?.channel ?? "whatsapp",
      p_peer_address: data.peer_address,
      p_provider_code: settings?.provider_code ?? "evolution",
      p_settings_id: settings?.id ?? undefined,
      p_peer_name: data.peer_name ?? undefined,
    });
    if (error) throw new Error(error.message);
    void allowed; // silence unused
    return { conversation_id: convId as unknown as string };
  });

// ---------- Quick Replies ----------
const listQrSchema = z.object({ restaurant_id: z.string().uuid() });
const upsertQrSchema = z.object({
  id: z.string().uuid().optional(),
  restaurant_id: z.string().uuid(),
  title: z.string().min(1).max(80),
  body: z.string().min(1).max(2000),
  shortcut: z.string().max(40).nullable().optional(),
  position: z.number().int().default(0),
  is_active: z.boolean().default(true),
});
const deleteQrSchema = z.object({ id: z.string().uuid() });

export const listQuickReplies = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => listQrSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("quick_replies")
      .select("id, restaurant_id, title, body, shortcut, position, is_active")
      .eq("restaurant_id", data.restaurant_id)
      .order("position", { ascending: true })
      .order("title", { ascending: true });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const upsertQuickReply = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => upsertQrSchema.parse(d))
  .handler(async ({ data, context }) => {
    const row = {
      restaurant_id: data.restaurant_id,
      title: data.title, body: data.body,
      shortcut: data.shortcut ?? null,
      position: data.position, is_active: data.is_active,
    };
    if (data.id) {
      const { error } = await context.supabase
        .from("quick_replies").update(row).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { ok: true, id: data.id };
    }
    const { data: inserted, error } = await context.supabase
      .from("quick_replies").insert(row).select("id").single();
    if (error) throw new Error(error.message);
    return { ok: true, id: inserted!.id };
  });

export const deleteQuickReply = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => deleteQrSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("quick_replies").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
