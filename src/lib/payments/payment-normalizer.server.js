/**
 * Responsabilidade:
 * Transformar eventos externos em modelo interno único.
 */
export const PaymentNormalizer = {
    normalize(provider, accountId, restaurantId, rawEvent) {
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
