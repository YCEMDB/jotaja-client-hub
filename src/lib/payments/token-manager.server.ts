import { supabase } from "@/integrations/supabase/client";
import { getProviderAdapter, PaymentProviderError } from "./framework";

/**
 * Política de renovação de tokens (Fase 4):
 * Janela de 24 horas antes da expiração + Jitter de +/- 30 minutos.
 */
const REFRESH_WINDOW_HOURS = 24;
const JITTER_MS = 30 * 60 * 1000;

export async function processTokenMaintenance() {
  const correlationId = crypto.randomUUID();
  console.log(`[token-manager] Starting maintenance job. CID: ${correlationId}`);

  const next24h = new Date(Date.now() + REFRESH_WINDOW_HOURS * 60 * 60 * 1000 + (Math.random() * 2 * JITTER_MS - JITTER_MS)).toISOString();
  
  // Buscar contas na tabela 'restaurant_payment_accounts'
  const { data: accounts, error } = await supabase
    .from("restaurant_payment_accounts")
    .select(`
      id,
      restaurant_id,
      provider,
      provider_status
    `)
    .eq("is_active", true)
    .eq("provider_status", "connected");

  if (error) {
    console.error(`[token-manager] Failed to fetch accounts. CID: ${correlationId}`, error);
    return { ok: false, error: "fetch_failed" };
  }

  const results = [];

  for (const account of (accounts || [])) {
    try {
      // Buscar o segredo para checar a expiração real (Server-side)
      const { data: secrets } = await supabase
        .from("restaurant_payment_secrets")
        .select("provider_token_expires_at, provider_refresh_token_encrypted")
        .eq("account_id", account.id)
        .maybeSingle();

      if (!secrets?.provider_token_expires_at) continue;

      const expiresAt = new Date(secrets.provider_token_expires_at);
      if (expiresAt.getTime() > new Date(next24h).getTime()) continue;

      console.log(`[token-manager] Account ${account.id} (${account.provider}) is in refresh window.`);

      // O worker_id é gerado aqui para acompanhar todo o ciclo atômico
      const workerId = crypto.randomUUID();
      const res = await runTokenRefresh(account.id, account.restaurant_id, account.provider as any, secrets.provider_refresh_token_encrypted, workerId);
      results.push({ account_id: account.id, restaurant_id: account.restaurant_id, provider: account.provider, status: res.status, worker_id: workerId });
    } catch (e) {
      console.error(`[token-manager] Critical error processing account ${account.id}. CID: ${correlationId}`, e);
      results.push({ account_id: account.id, restaurant_id: account.restaurant_id, provider: account.provider, status: "critical_error" });
    }
  }

  return { ok: true, results, correlationId };
}

async function runTokenRefresh(accountId: string, restaurantId: string, provider: any, refreshTokenEnc: string | null, workerId: string) {
  if (!refreshTokenEnc) return { status: "missing_refresh_token" };

  // 1. Tentar adquirir o lock atômico (Fase 4 - Pessimistic Locking)
  const { data: locked, error: lockErr } = await supabase.rpc("try_acquire_refresh_lock" as any, {
    p_account_id: accountId,
    p_worker_id: workerId
  });

  if (lockErr || !locked) {
    console.log(`[token-manager] Account ${accountId} is already locked by another worker. skipping. CID: ${workerId}`);
    return { status: "already_locked" };
  }

  try {
    const adapter = await getProviderAdapter(provider);

    // 2. Executar o refresh HTTP (Região Crítica)
    const refreshed = await adapter.refreshToken(restaurantId, refreshTokenEnc);

    // 3. Persistir via RPC da Fase 3: save_restaurant_payment_secrets
    const { error: saveErr } = await supabase.rpc("save_restaurant_payment_secrets" as any, {
      p_account_id: accountId,
      p_access_token_enc: refreshed.accessToken,
      p_refresh_token_enc: refreshed.refreshToken || refreshTokenEnc,
      p_expires_at: refreshed.expiresAt?.toISOString() || "",
      p_scopes: refreshed.metadata?.scopes || []
    });

    if (saveErr) throw saveErr;

    console.log(`[token-manager] Successfully refreshed ${provider} for account ${accountId}. CID: ${workerId}`);
    return { status: "success" };

  } catch (err: any) {
    if (err instanceof PaymentProviderError && err.code === "reauthentication_required") {
      console.warn(`[token-manager] Reauthentication required for account ${accountId}. Provider: ${provider}. CID: ${workerId}`);
      
      await supabase
        .from("restaurant_payment_accounts")
        .update({ provider_status: "reauthentication_required" as any, is_active: false })
        .eq("id", accountId);
        
      return { status: "revoked" };
    }

    console.error(`[token-manager] Failed to refresh ${provider} for account ${accountId}: ${err.message}. CID: ${workerId}`);
    return { status: "error", message: err.message };
  } finally {
    // 4. Liberação condicional do lock (Fase 4)
    await supabase.rpc("release_refresh_lock" as any, {
      p_account_id: accountId,
      p_worker_id: workerId
    });
  }
}
