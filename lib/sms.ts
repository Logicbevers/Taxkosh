/**
 * SMS gateway — MSG91 (phone OTP delivery).
 *
 * The OTP itself is generated, stored, rate-limited and verified by our own
 * code (see app/api/auth/phone/*). MSG91 is used purely as the delivery
 * channel: we hand it the 6-digit code and a DLT-approved template, and it
 * sends the SMS. This keeps all verification logic in our DB and avoids
 * depending on MSG91's OTP store.
 *
 * Graceful fallback: when no MSG91 key is configured, sends are "simulated"
 * (the code is logged / surfaced in dev) and flows that gate on a verified
 * phone treat the step as optional — see isSmsConfigured().
 */

const PLACEHOLDER = /your|placeholder|example|<|>/i;

/** MSG91 auth key, or null when unset/placeholder. */
function msg91AuthKey(): string | null {
    const key = process.env.MSG91_AUTH_KEY?.trim();
    return key && !PLACEHOLDER.test(key) ? key : null;
}

/**
 * True when a real SMS provider is configured. Callers use this to decide
 * whether to require phone verification at all (skip it when no provider can
 * actually deliver an OTP).
 */
export function isSmsConfigured(): boolean {
    const candidates = [
        process.env.MSG91_AUTH_KEY,
        process.env.FAST2SMS_API_KEY,
        process.env.TWILIO_ACCOUNT_SID,
    ];
    return candidates.some((v) => v && !PLACEHOLDER.test(v));
}

export interface SmsSendResult {
    /** True when no real provider ran (dev/unconfigured) — the code was not
     *  actually texted, so callers may surface it in dev. */
    simulated: boolean;
    /** Present when a configured provider was attempted but failed. */
    error?: string;
}

const MSG91_OTP_ENDPOINT = "https://control.msg91.com/api/v5/otp";
const SEND_TIMEOUT_MS = 8_000;

/**
 * Deliver a one-time code to an Indian mobile number via MSG91.
 *
 * @param phone 10-digit Indian mobile (no country code), already validated.
 * @param code  the 6-digit OTP we generated and stored.
 */
export async function sendOtpSms(phone: string, code: string): Promise<SmsSendResult> {
    const authKey = msg91AuthKey();
    const templateId = process.env.MSG91_OTP_TEMPLATE_ID?.trim();

    // No MSG91 key → simulate (dev/local). Surface the code to the log so the
    // flow is still testable without a provider.
    if (!authKey) {
        console.log(`[SMS simulated] OTP for +91${phone}: ${code}`);
        return { simulated: true };
    }

    // Key present but no template → misconfiguration. MSG91 OTP sends REQUIRE a
    // DLT-approved template id; fail loudly rather than silently dropping OTPs.
    if (!templateId) {
        console.error(
            "MSG91_AUTH_KEY is set but MSG91_OTP_TEMPLATE_ID is missing — cannot send OTP SMS."
        );
        return { simulated: false, error: "SMS template not configured" };
    }

    // MSG91 expects the number with the country code (91) and no '+'.
    const mobile = `91${phone}`;
    const url =
        `${MSG91_OTP_ENDPOINT}?template_id=${encodeURIComponent(templateId)}` +
        `&mobile=${mobile}&otp=${code}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), SEND_TIMEOUT_MS);
    try {
        const res = await fetch(url, {
            method: "POST",
            headers: { authkey: authKey, "Content-Type": "application/json" },
            signal: controller.signal,
        });
        // MSG91 returns { type: "success" | "error", message: "<id or reason>" }
        const data = await res.json().catch(() => ({} as { type?: string; message?: string }));
        if (!res.ok || data?.type === "error") {
            const reason =
                typeof data?.message === "string" ? data.message : `HTTP ${res.status}`;
            console.error("MSG91 OTP send failed:", reason);
            return { simulated: false, error: "Could not send OTP right now" };
        }
        return { simulated: false };
    } catch (err) {
        const aborted = err instanceof Error && err.name === "AbortError";
        console.error("MSG91 OTP request error:", aborted ? "timeout" : err);
        return { simulated: false, error: "SMS provider unreachable" };
    } finally {
        clearTimeout(timeout);
    }
}
