// Sprint 4.1 — tipos genéricos, desacoplados de canal/provedor.
// Sprint 4.2 — extensão: inbound bidirecional.
export type CommChannel =
  | "whatsapp" | "sms" | "email" | "push"
  | "telegram" | "instagram" | "messenger" | "voice";

export type CommHealth = "healthy" | "degraded" | "down" | "unknown";

export interface ChannelMessage {
  to: string;
  subject?: string | null;
  body: string;
  payload?: Record<string, unknown>;
}

export interface ProviderConfig {
  endpoint?: string;
  instance?: string;
  phone_number?: string;
  environment?: "production" | "sandbox";
  [k: string]: unknown;
}

export interface ProviderCredentials {
  token?: string;
  api_key?: string;
  extra?: Record<string, unknown>;
}

export interface SendResult {
  ok: boolean;
  provider_message_id?: string;
  latency_ms: number;
  error_code?: string;
  error_message?: string;
  retryable?: boolean;
  raw?: unknown;
}

export interface HealthCheckResult {
  health: CommHealth;
  latency_ms: number;
  error?: string;
  info?: unknown;
}

export interface InboundStatusUpdate {
  provider_message_id: string;
  status: "sent" | "delivered" | "read" | "failed";
  error?: string;
}

// Sprint 4.2 — Mensagem recebida (inbound bidirecional).
export interface InboundMessage {
  provider_message_id?: string;
  from: string;             // telefone/identificador do remetente
  from_name?: string | null;
  body: string;
  timestamp?: string;       // ISO
  raw?: unknown;
  normalized?: Record<string, unknown>;
}

export interface CommunicationProvider {
  code: string;
  channel: CommChannel;
  sendMessage(
    msg: ChannelMessage,
    config: ProviderConfig,
    creds: ProviderCredentials,
  ): Promise<SendResult>;
  testConnection(
    config: ProviderConfig,
    creds: ProviderCredentials,
  ): Promise<HealthCheckResult>;
  parseWebhook?(headers: Headers, rawBody: string): Promise<InboundStatusUpdate[]>;
  // Sprint 4.2 — retorna mensagens recebidas do webhook.
  parseInbound?(headers: Headers, rawBody: string): Promise<InboundMessage[]>;
}
