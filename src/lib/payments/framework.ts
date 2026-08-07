import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

/**
 * Interface universal para Provedores de Pagamento (PPF)
 */
export interface IMesivoPaymentProvider {
  getAuthorizationUrl(restaurantId: string, state: string): Promise<string>;
  exchangeAuthorizationCode(code: string, state: string, restaurantId: string): Promise<{
    accountId: string;
    accessToken: string;
    refreshToken?: string;
    expiresAt?: Date;
    metadata: Record<string, any>;
  }>;
  getAccount(accessToken: string): Promise<{
    providerAccountId: string;
    metadata: Record<string, any>;
  }>;
}

/**
 * Erros padronizados do Framework
 */
export class PaymentProviderError extends Error {
  constructor(public code: string, message: string) {
    super(message);
    this.name = "PaymentProviderError";
  }
}
