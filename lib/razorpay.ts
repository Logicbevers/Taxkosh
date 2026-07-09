import Razorpay from "razorpay";

function getRazorpayKeys() {
    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    if (!key_id || !key_secret) {
        throw new Error("RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET env vars must be set");
    }
    return { key_id, key_secret };
}

/**
 * True only when real Razorpay credentials are present. Placeholder values from
 * `.env.example` (e.g. `placeholder`, `your_...`, a stub key id) are truthy but
 * useless, so we detect and reject them. When this returns false the app runs in
 * demo-payment mode: the checkout is simulated end-to-end without contacting the
 * gateway, so stakeholders can walk the full flow before real keys are wired in.
 */
export function isRazorpayConfigured(): boolean {
    const id = process.env.RAZORPAY_KEY_ID?.trim();
    const secret = process.env.RAZORPAY_KEY_SECRET?.trim();
    if (!id || !secret) return false;
    if (!id.startsWith("rzp_")) return false;
    // A real key secret is ~20+ random chars; reject obvious placeholders.
    if (/placeholder|^place|your|example|xxxx|changeme|<|>/i.test(secret)) return false;
    if (secret.length < 16) return false;
    return true;
}

// Lazily instantiated so missing env vars throw at call time, not module load
let _razorpay: Razorpay | null = null;
export function getRazorpay(): Razorpay {
    if (!_razorpay) {
        _razorpay = new Razorpay(getRazorpayKeys());
    }
    return _razorpay;
}

// Keep named export for backwards compatibility — proxies to lazy singleton
export const razorpay = new Proxy({} as Razorpay, {
    get(_target, prop: string | symbol) {
        return (getRazorpay() as unknown as Record<string | symbol, unknown>)[prop];
    }
});

// Pricing fallback for when no plan is found — amounts in PAISE (₹1 = 100 paise)
const DEFAULT_PRICES: Record<string, number> = {
    ITR_FILING: 999 * 100,
    GST_FILING: 499 * 100,
    TDS_FILING: 749 * 100,
    BUSINESS_COMPLIANCE: 4999 * 100,
};

export function getServicePricingInPaise(category: string): number {
    return DEFAULT_PRICES[category] ?? 999 * 100;
}
