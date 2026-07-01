import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getProvider } from "./registry";
import type { CommHealth } from "./types";

// Circuit breaker em memória (por instância do worker).
const FAILS = new Map<string, { count: number; skipUntil: number }>();
const FAIL_THRESHOLD = 5;
const SKIP_MS = 60_000;

function circuitOpen(settingsId: string | null): boolean {
  if (!settingsId) return false;
  const s = FAILS.get(settingsId);
  return !!(s && s.skipUntil > Date.now());
}
function circuitRecord(settingsId: string | null, ok: boolean) {
  if (!settingsId) return;
  const s = FAILS.get(settingsId) ?? { count: 0, skipUntil: 0 };
  if (ok) { FAILS.delete(settingsId); return; }
  s.count += 1;
  if (s.count >= FAIL_THRESHOLD) { s.skipUntil = Date.now() + SKIP_MS; s.count = 0; }
  FAILS.set(settingsId, s);
}

const inputSchema = z.object({
  batchSize: z.number().int().min(1).max(50).default(20),
  workerId: z.string().min(1).max(64).default("srv-fn"),
});

export const processCommunicationQueue = createServerFn({ method: "POST" })
  .inputValidator((d) => inputSchema.parse(d ?? {}))
  .handler(async ({ data }) => {
    // Sem middleware de auth: chamado por rota /api/public/* que valida apikey.
    // O próprio handler valida via header em produção.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: batch, error } = await supabaseAdmin.rpc("claim_communication_batch", {
      p_worker_id: data.workerId,
      p_size: data.batchSize,
      p_lock_seconds: 60,
    });
    if (error) throw new Error(error.message);
    const rows = (batch ?? []) as Array<{
      id: string; restaurant_id: string; settings_id: string | null;
      channel: string; template_id: string | null; to_address: string;
      rendered_subject: string | null; rendered_body: string | null;
      payload: Record<string, unknown>; attempts: number;
    }>;

    const results: Array<{ id: string; ok: boolean; error?: string }> = [];

    for (const row of rows) {
      if (!row.settings_id) {
        await supabaseAdmin.rpc("mark_communication_failed", {
          p_id: row.id, p_error_code: "no_settings",
          p_error_message: "Nenhum canal ativo configurado", p_retryable: false,
        });
        results.push({ id: row.id, ok: false, error: "no_settings" });
        continue;
      }
      if (circuitOpen(row.settings_id)) {
        await supabaseAdmin.rpc("mark_communication_failed", {
          p_id: row.id, p_error_code: "circuit_open",
          p_error_message: "Canal com muitas falhas, pausado", p_retryable: true,
        });
        results.push({ id: row.id, ok: false, error: "circuit_open" });
        continue;
      }

      const { data: settings } = await supabaseAdmin
        .from("communication_settings")
        .select("id, provider_code, config, restaurant_id, is_active")
        .eq("id", row.settings_id).maybeSingle();
      if (!settings || !settings.is_active) {
        await supabaseAdmin.rpc("mark_communication_failed", {
          p_id: row.id, p_error_code: "settings_inactive",
          p_error_message: "Canal inativo", p_retryable: false,
        });
        continue;
      }

      const { data: sec } = await supabaseAdmin
        .from("communication_secrets")
        .select("token, api_key, extra")
        .eq("settings_id", row.settings_id).maybeSingle();

      let provider;
      try { provider = getProvider(settings.provider_code); }
      catch (e) {
        await supabaseAdmin.rpc("mark_communication_failed", {
          p_id: row.id, p_error_code: "provider_missing",
          p_error_message: e instanceof Error ? e.message : String(e), p_retryable: false,
        });
        continue;
      }

      const send = await provider.sendMessage(
        { to: row.to_address, subject: row.rendered_subject, body: row.rendered_body ?? "" },
        settings.config as Record<string, unknown>,
        { token: sec?.token ?? undefined, api_key: sec?.api_key ?? undefined, extra: (sec?.extra as any) ?? {} },
      );

      // Log append-only
      await supabaseAdmin.from("communication_logs").insert({
        queue_id: row.id, restaurant_id: row.restaurant_id, settings_id: row.settings_id,
        direction: "outbound", attempt: row.attempts,
        status: send.ok ? "sent" : "failed",
        latency_ms: send.latency_ms,
        raw_response: (send.raw ?? null) as any,
        error: send.error_message ?? null,
      });

      if (send.ok) {
        await supabaseAdmin.rpc("mark_communication_sent", {
          p_id: row.id,
          p_provider_message_id: send.provider_message_id ?? null,
          p_latency_ms: send.latency_ms,
        });
        await supabaseAdmin.rpc("set_settings_health", {
          p_settings_id: row.settings_id,
          p_health: "healthy" as CommHealth, p_latency_ms: send.latency_ms, p_error: null,
        });
        circuitRecord(row.settings_id, true);
      } else {
        await supabaseAdmin.rpc("mark_communication_failed", {
          p_id: row.id,
          p_error_code: send.error_code ?? "unknown",
          p_error_message: send.error_message ?? "erro desconhecido",
          p_retryable: send.retryable ?? true,
        });
        await supabaseAdmin.rpc("set_settings_health", {
          p_settings_id: row.settings_id,
          p_health: "degraded" as CommHealth,
          p_latency_ms: send.latency_ms, p_error: send.error_message ?? null,
        });
        circuitRecord(row.settings_id, false);
      }
      results.push({ id: row.id, ok: send.ok, error: send.error_message });
    }
    return { processed: rows.length, results };
  });
