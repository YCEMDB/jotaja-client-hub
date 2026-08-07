import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

export type PaymentProvider = 'mercadopago' | 'pagbank' | 'stripe' | 'asaas' | 'stone' | 'cielo' | 'pagarme' | 'paypal';

export interface IMesivoPaymentProvider {
  getAuthorizationUrl(restaurantId: string): Promise<string>;
  exchangeAuthorizationCode(code: string, state: string): Promise<{
    providerAccountId: string;
    accessToken: string;
    refreshToken?: string;
    expiresAt?: Date;
    metadata: Record<string, any>;
  }>;
  refreshToken(restaurantId: string, refreshToken: string): Promise<{
    accessToken: string;
    refreshToken?: string;
    expiresAt?: Date;
    metadata?: Record<string, any>;
  }>;
  disconnect(restaurantId: string): Promise<void>;
}

export class PaymentProviderError extends Error {
  constructor(public code: string, message: string) {
    super(message);
    this.name = "PaymentProviderError";
  }
}

export async function getProviderAdapter(provider: PaymentProvider): Promise<IMesivoPaymentProvider> {
  switch (provider) {
    case 'mercadopago':
      const { MercadoPagoAdapter } = await import("./adapters/mercadopago.adapter");
      return MercadoPagoAdapter;
    default:
      throw new PaymentProviderError("unsupported_provider", `Provider ${provider} is not supported yet.`);
  }
}

