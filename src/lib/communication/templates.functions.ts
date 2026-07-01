import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { renderTemplate, extractVariables } from "./render";

const CHANNELS = ["whatsapp","sms","email","push","telegram","instagram","messenger","voice"] as const;
const CATEGORIES = ["orders","payment","delivery","marketing","crm","system"] as const;

const listSchema = z.object({ restaurant_id: z.string().uuid() });

const upsertSchema = z.object({
  id: z.string().uuid().optional(),
  restaurant_id: z.string().uuid(),
  channel: z.enum(CHANNELS),
  category: z.enum(CATEGORIES),
  code: z.string().min(1).max(80).regex(/^[a-z0-9_]+$/, "code deve ser snake_case"),
  name: z.string().min(1).max(120),
  subject: z.string().max(200).nullable().optional(),
  body: z.string().min(1).max(4000),
  is_active: z.boolean().default(true),
  createNewVersion: z.boolean().default(false),
});

const previewSchema = z.object({
  body: z.string().max(4000),
  subject: z.string().max(200).optional(),
  variables: z.record(z.any()).default({}),
});

export const listCommunicationTemplates = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => listSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("communication_templates")
      .select("*")
      .or(`restaurant_id.eq.${data.restaurant_id},restaurant_id.is.null`)
      .is("deleted_at", null)
      .order("category").order("code").order("version", { ascending: false });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const upsertCommunicationTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => upsertSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const variables = extractVariables(data.body);

    if (data.id && !data.createNewVersion) {
      const { error } = await supabase.from("communication_templates").update({
        name: data.name, subject: data.subject ?? null, body: data.body,
        channel: data.channel, category: data.category,
        is_active: data.is_active, variables,
      }).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { ok: true, id: data.id };
    }

    // Nova versão: incrementa version
    let version = 1;
    let parent_id: string | null = null;
    if (data.id) {
      const { data: old } = await supabase.from("communication_templates")
        .select("id, version").eq("id", data.id).maybeSingle();
      if (old) { version = old.version + 1; parent_id = old.id; }
    } else {
      const { data: existing } = await supabase.from("communication_templates")
        .select("version").eq("restaurant_id", data.restaurant_id)
        .eq("code", data.code).is("deleted_at", null)
        .order("version", { ascending: false }).limit(1).maybeSingle();
      if (existing) version = existing.version + 1;
    }

    const { data: inserted, error } = await supabase.from("communication_templates").insert({
      restaurant_id: data.restaurant_id,
      channel: data.channel, category: data.category,
      code: data.code, name: data.name, subject: data.subject ?? null,
      body: data.body, variables, version, parent_id, is_active: data.is_active,
    }).select("id").single();
    if (error) throw new Error(error.message);
    return { ok: true, id: inserted!.id };
  });

export const deleteCommunicationTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("communication_templates")
      .update({ deleted_at: new Date().toISOString(), is_active: false })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const previewCommunicationTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => previewSchema.parse(d))
  .handler(async ({ data }) => ({
    subject: renderTemplate(data.subject, data.variables),
    body: renderTemplate(data.body, data.variables),
    variables: extractVariables(data.body),
  }));
