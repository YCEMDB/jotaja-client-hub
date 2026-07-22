import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const DEFAULT_MESSAGE = "Estamos realizando uma manutenção programada para melhorar ainda mais a sua experiência. Voltaremos em breve.";

export const getMaintenanceStatus = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: modeData, error: modeError } = await supabaseAdmin
    .from("app_settings")
    .select("value")
    .eq("key", "maintenance_mode")
    .maybeSingle();

  if (modeError) {
    console.error("getMaintenanceStatus: failed to read maintenance_mode", modeError);
  }

  const active = modeData?.value === true || modeData?.value === "true";

  const { data: messageData } = await supabaseAdmin
    .from("app_settings")
    .select("value")
    .eq("key", "maintenance_message")
    .maybeSingle();

  const message = typeof messageData?.value === "string" && messageData.value.trim().length > 0
    ? messageData.value
    : DEFAULT_MESSAGE;

  return { active, message };
});

export const checkCurrentUserIsSuperAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "super_admin")
      .limit(1);

    if (error) {
      console.error("checkCurrentUserIsSuperAdmin: error checking role", error);
      return { isSuperAdmin: false };
    }

    return { isSuperAdmin: data && data.length > 0 };
  });

const setMaintenanceSchema = z.object({
  active: z.boolean(),
  message: z.string().max(500).optional(),
  reason: z.string().min(5).max(500),
});

export const setMaintenanceMode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => setMaintenanceSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: roles, error: roleError } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "super_admin")
      .limit(1);

    if (roleError || !roles || roles.length === 0) {
      throw new Response("Forbidden: super-admin only", { status: 403 });
    }

    const { data: modeResult, error: modeError } = await context.supabase.rpc("admin_upsert_setting", {
      p_key: "maintenance_mode",
      p_value: data.active,
      p_reason: data.reason,
    } as never);

    if (modeError) {
      console.error("setMaintenanceMode: failed to update maintenance_mode", modeError);
      throw new Response("Erro ao atualizar modo de manutenção", { status: 500 });
    }

    if (data.message !== undefined) {
      const { error: messageError } = await context.supabase.rpc("admin_upsert_setting", {
        p_key: "maintenance_message",
        p_value: data.message,
        p_reason: data.reason,
      } as never);

      if (messageError) {
        console.error("setMaintenanceMode: failed to update maintenance_message", messageError);
        throw new Response("Erro ao atualizar mensagem de manutenção", { status: 500 });
      }
    }

    return { ok: true, active: data.active, result: modeResult };
  });
