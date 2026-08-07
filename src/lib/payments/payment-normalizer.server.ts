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
    if (rawEvent.force_error) throw new Error("Forced normalization error");

    let eventType = rawEvent.action || rawEvent.type || "unknown";
    let status: PaymentEventStatus = 'PENDING';
    let amount = rawEvent.data?.transaction_amount || rawEvent.transaction_amount;
    let externalEventId = String(rawEvent.id || rawEvent.data?.id || Date.now());

    // Mapeamento específico Mercado Pago
    if (provider === 'mercadopago') {
      if (eventType === 'payment.created') status = 'PENDING';
      if (eventType === 'payment.updated') {
        const mpStatus = rawEvent.data?.status || rawEvent.status;
        if (mpStatus === 'approved') status = 'PAID';
        if (mpStatus === 'rejected' || mpStatus === 'cancelled') status = 'FAILED';
        if (mpStatus === 'refunded') status = 'REFUNDED';
        if (mpStatus === 'in_process') status = 'AUTHORIZED';
      }
    }

    return {
      id: crypto.randomUUID(),
      provider,
      restaurant_id: restaurantId,
      account_id: accountId,
      external_event_id: externalEventId,
      event_type: eventType,
      status,
      occurred_at: rawEvent.occurred_at || new Date().toISOString(),
      amount: amount ? Number(amount) : undefined,
      currency: rawEvent.data?.currency_id || rawEvent.currency_id || 'BRL'
    };
  }

};
