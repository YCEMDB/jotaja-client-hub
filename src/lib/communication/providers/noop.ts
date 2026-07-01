import type { CommunicationProvider } from "../types";

export const NoopProvider: CommunicationProvider = {
  code: "noop",
  channel: "whatsapp",
  async sendMessage(msg) {
    // Dev fallback — apenas ecoa; nunca deve ser usado em produção.
    console.log("[NoopProvider] send", msg);
    return { ok: true, provider_message_id: `noop-${Date.now()}`, latency_ms: 1 };
  },
  async testConnection() {
    return { health: "unknown", latency_ms: 0, error: "noop provider" };
  },
};
