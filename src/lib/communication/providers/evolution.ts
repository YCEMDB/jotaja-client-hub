import type {
  CommunicationProvider, ChannelMessage, ProviderConfig,
  ProviderCredentials, SendResult, HealthCheckResult, InboundStatusUpdate, InboundMessage,
} from "../types";

// Evolution API — Adapter.
// Docs: https://doc.evolution-api.com/
// Config esperado: { endpoint, instance }
// Creds: { token }  (Bearer/apikey header 'apikey')
async function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return await Promise.race([
    p,
    new Promise<T>((_, rej) => setTimeout(() => rej(new Error("timeout")), ms)),
  ]);
}

function normalizePhone(to: string): string {
  const digits = to.replace(/\D/g, "");
  return digits;
}

export const EvolutionProvider: CommunicationProvider = {
  code: "evolution",
  channel: "whatsapp",

  async sendMessage(msg: ChannelMessage, config: ProviderConfig, creds: ProviderCredentials): Promise<SendResult> {
    const endpoint = String(config.endpoint || "").replace(/\/+$/, "");
    const instance = String(config.instance || "");
    const token = creds.token || creds.api_key;
    if (!endpoint || !instance || !token) {
      return { ok: false, latency_ms: 0, error_code: "config_invalid", error_message: "endpoint/instance/token ausentes", retryable: false };
    }

    const url = `${endpoint}/message/sendText/${encodeURIComponent(instance)}`;
    const started = Date.now();
    try {
      const res = await withTimeout(fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: token,
        },
        body: JSON.stringify({
          number: normalizePhone(msg.to),
          text: msg.body,
        }),
      }), 15000);

      const latency = Date.now() - started;
      const raw = await res.json().catch(() => ({}));
      if (!res.ok) {
        return {
          ok: false, latency_ms: latency,
          error_code: `http_${res.status}`,
          error_message: (raw && (raw.message || raw.error)) || res.statusText,
          retryable: res.status >= 500 || res.status === 429,
          raw,
        };
      }
      const providerId = raw?.key?.id || raw?.messageId || raw?.id || null;
      return { ok: true, provider_message_id: providerId ?? undefined, latency_ms: latency, raw };
    } catch (e) {
      const latency = Date.now() - started;
      const message = e instanceof Error ? e.message : String(e);
      return { ok: false, latency_ms: latency, error_code: "network", error_message: message, retryable: true };
    }
  },

  async testConnection(config: ProviderConfig, creds: ProviderCredentials): Promise<HealthCheckResult> {
    const endpoint = String(config.endpoint || "").replace(/\/+$/, "");
    const instance = String(config.instance || "");
    const token = creds.token || creds.api_key;
    if (!endpoint || !instance || !token) {
      return { health: "down", latency_ms: 0, error: "endpoint/instance/token ausentes" };
    }
    const started = Date.now();
    try {
      const res = await withTimeout(fetch(
        `${endpoint}/instance/connectionState/${encodeURIComponent(instance)}`,
        { headers: { apikey: token } },
      ), 8000);
      const latency = Date.now() - started;
      const raw = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { health: "down", latency_ms: latency, error: `http_${res.status}`, info: raw };
      }
      const state = raw?.instance?.state || raw?.state || "unknown";
      const health = state === "open" ? "healthy" : (state === "connecting" ? "degraded" : "down");
      return { health, latency_ms: latency, info: raw };
    } catch (e) {
      return { health: "down", latency_ms: Date.now() - started, error: e instanceof Error ? e.message : String(e) };
    }
  },

  async parseWebhook(_headers: Headers, rawBody: string): Promise<InboundStatusUpdate[]> {
    try {
      const body = JSON.parse(rawBody);
      const events = Array.isArray(body?.data) ? body.data : (Array.isArray(body) ? body : [body]);
      const out: InboundStatusUpdate[] = [];
      for (const ev of events) {
        const id = ev?.key?.id || ev?.messageId || ev?.id;
        const s = String(ev?.status || ev?.messageStatus || "").toLowerCase();
        if (!id) continue;
        const map: Record<string, InboundStatusUpdate["status"]> = {
          server_ack: "sent", sent: "sent",
          delivery_ack: "delivered", delivered: "delivered",
          read: "read",
          failed: "failed", error: "failed",
        };
        const status = map[s];
        if (status) out.push({ provider_message_id: String(id), status });
      }
      return out;
    } catch {
      return [];
    }
  },

  // Sprint 4.2 — Interpreta mensagens recebidas do webhook Evolution API.
  async parseInbound(_headers: Headers, rawBody: string): Promise<InboundMessage[]> {
    try {
      const body = JSON.parse(rawBody);
      const events = Array.isArray(body?.data) ? body.data : (Array.isArray(body) ? body : [body]);
      const out: InboundMessage[] = [];
      for (const ev of events) {
        // Evolution: eventos "messages.upsert" com key.fromMe = false
        const fromMe = ev?.key?.fromMe === true;
        if (fromMe) continue;
        const remoteJid: string | undefined = ev?.key?.remoteJid || ev?.remoteJid;
        if (!remoteJid) continue;
        const from = String(remoteJid).replace(/@.*/, "").replace(/\D/g, "");
        if (!from) continue;
        const msg = ev?.message ?? {};
        const text: string =
          msg?.conversation ||
          msg?.extendedTextMessage?.text ||
          msg?.imageMessage?.caption ||
          msg?.videoMessage?.caption ||
          msg?.buttonsResponseMessage?.selectedDisplayText ||
          msg?.listResponseMessage?.title ||
          "";
        if (!text || typeof text !== "string") continue;
        const providerId = ev?.key?.id || ev?.messageId || ev?.id;
        const ts = ev?.messageTimestamp
          ? new Date(Number(ev.messageTimestamp) * 1000).toISOString()
          : undefined;
        out.push({
          provider_message_id: providerId ? String(providerId) : undefined,
          from,
          from_name: ev?.pushName ?? null,
          body: text.slice(0, 4000),
          timestamp: ts,
          raw: ev,
          normalized: { source: "evolution", event: body?.event ?? null },
        });
      }
      return out;
    } catch {
      return [];
    }
  },
};
