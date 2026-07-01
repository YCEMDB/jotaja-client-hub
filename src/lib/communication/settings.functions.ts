import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getProvider } from "./registry";
import type { CommHealth } from "./types";

// ---------- Schemas ----------
const upsertSchema = z.object({
  id: z.string().uuid().optional(),
  restaurant_id: z.string().uuid(),
  provider_code: z.string().min(1).max(64),
  channel: z.enum(["whatsapp","sms","email","push","telegram","instagram","messenger","voice"]),
  display_name: z.string().min(1).max(120),
  config: z.record(z.any()).default({}),
  webhook_secret: z.string().max(200).nullable().optional(),
  is_active: z.boolean().default(true),
  token: z.string().max(2000).nullable().optional(),
  api_key: z.string().max(2000).nullable().optional(),
});

const idOnly = z.object({ id: z.string().uuid() });
const listSchema = z.object({ restaurant_id: z.string().uuid() });
const testSchema = z.object({ id: z.string().uuid() });

// ---------- List ----------
export const listCommunicationSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => listSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: rows, error } = await supabase
      .from("communication_settings")
      .select("id, restaurant_id, provider_code, channel, display_name, config, is_active, health, last_sync_at, last_error, last_latency_ms, created_at, updated_at")
      .eq("restaurant_id", data.restaurant_id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

// ---------- Upsert ----------
export const upsertCommunicationSetting = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => upsertSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    // Verifica permissão via RPC (RLS já bloqueia, mas dá erro claro).
    const { data: allowed } = await supabase.rpc("is_team_owner", {
      _uid: context.userId, _restaurant_id: data.restaurant_id,
    });
    if (!allowed) throw new Error("forbidden");

    const row = {
      restaurant_id: data.restaurant_id,
      provider_code: data.provider_code,
      channel: data.channel,
      display_name: data.display_name,
      config: data.config,
      webhook_secret: data.webhook_secret ?? null,
      is_active: data.is_active,
    };
    let settingsId = data.id;
    if (settingsId) {
      const { error } = await supabase
        .from("communication_settings")
        .update(row).eq("id", settingsId);
      if (error) throw new Error(error.message);
    } else {
      const { data: inserted, error } = await supabase
        .from("communication_settings")
        .insert(row).select("id").single();
      if (error) throw new Error(error.message);
      settingsId = inserted!.id;
    }

    // Segredos server-side (upsert em tabela protegida).
    if (data.token !== undefined || data.api_key !== undefined) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const patch: Record<string, unknown> = { settings_id: settingsId };
      if (data.token !== undefined) patch.token = data.token;
      if (data.api_key !== undefined) patch.api_key = data.api_key;
      const { error } = await supabaseAdmin
        .from("communication_secrets")
        .upsert(patch, { onConflict: "settings_id" });
      if (error) throw new Error(error.message);
    }

    return { ok: true, id: settingsId };
  });

// ---------- Delete (soft) ----------
export const deleteCommunicationSetting = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => idOnly.parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("communication_settings")
      .update({ deleted_at: new Date().toISOString(), is_active: false })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- Test connection ----------
export const testCommunicationConnection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => testSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: settings, error } = await supabase
      .from("communication_settings")
      .select("id, provider_code, config, restaurant_id")
      .eq("id", data.id)
      .maybeSingle();
    if (error || !settings) throw new Error("not_found");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: sec } = await supabaseAdmin
      .from("communication_secrets")
      .select("token, api_key, extra")
      .eq("settings_id", data.id)
      .maybeSingle();

    const provider = getProvider(settings.provider_code);
    const result = await provider.testConnection(
      settings.config as Record<string, unknown>,
      { token: sec?.token ?? undefined, api_key: sec?.api_key ?? undefined, extra: (sec?.extra as any) ?? {} },
    );

    await supabaseAdmin.rpc("set_settings_health", {
      p_settings_id: data.id,
      p_health: result.health as CommHealth,
      p_latency_ms: result.latency_ms,
      p_error: result.error ?? null,
    });

    return result;
  });
