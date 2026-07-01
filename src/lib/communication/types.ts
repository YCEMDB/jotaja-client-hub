// Sprint 4.1 — tipos genéricos, desacoplados de canal/provedor.
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
}
