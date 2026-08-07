import { supabase } from "@/integrations/supabase/client";
import { getSupabaseAdmin } from "./webhook-handler.server";
import { PaymentProvider, getProviderAdapter } from "./framework";

export type PaymentEventStatus = 'PENDING' | 'AUTHORIZED' | 'PAID' | 'FAILED' | 'CANCELLED' | 'REFUNDED';

export interface InternalPaymentEvent {
  id: string;
  provider: PaymentProvider;
  restaurant_id: string;
  account_id: string;
  external_event_id: string;
  payment_id?: string;
  event_type: string;
  amount?: number;
  currency?: string;
  status: PaymentEventStatus;
  occurred_at: string;
}

/**
 * Responsabilidade:
 * Transformar eventos externos em modelo interno único.
 */
export const PaymentNormalizer = {
  normalize(provider: PaymentProvider, accountId: string, restaurantId: string, rawEvent: any): InternalPaymentEvent {
    // Mapeamento básico comum extraído do adapter
    return {
      id: crypto.randomUUID(),
      provider,
      restaurant_id: restaurantId,
      account_id: accountId,
      external_event_id: String(rawEvent.id || rawEvent.data?.id || Date.now()),
      event_type: rawEvent.action || rawEvent.type || "unknown",
      status: 'PENDING', // Default, será refinado pelo processador
      occurred_at: new Date().toISOString(),
      amount: rawEvent.data?.transaction_amount || rawEvent.transaction_amount,
      currency: rawEvent.data?.currency_id || rawEvent.currency_id || 'BRL'
    };
  }
};
