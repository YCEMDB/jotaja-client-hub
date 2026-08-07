export class PaymentProviderError extends Error {
    code;
    constructor(code, message) {
        super(message);
        this.code = code;
        this.name = "PaymentProviderError";
    }
}
export async function getProviderAdapter(provider) {
    switch (provider) {
        case 'mercadopago':
            const { MercadoPagoAdapter } = await import("./adapters/mercadopago.adapter");
            return MercadoPagoAdapter;
        default:
            throw new PaymentProviderError("unsupported_provider", `Provider ${provider} is not supported yet.`);
    }
}
