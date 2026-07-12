/**
 * SMS gateway configuration probe.
 *
 * No SMS provider is integrated yet (MSG91 / Fast2SMS / Twilio are the
 * candidates — see docs/INTEGRATIONS.md). Until one is configured, phone
 * verification cannot work for real users (the OTP is only surfaced in dev),
 * so flows that would otherwise gate on a verified phone number must treat
 * the step as optional. When a provider key is added, this returns true and
 * the phone-verification requirement re-enables automatically.
 */
export function isSmsConfigured(): boolean {
    const candidates = [
        process.env.MSG91_AUTH_KEY,
        process.env.FAST2SMS_API_KEY,
        process.env.TWILIO_ACCOUNT_SID,
    ];
    return candidates.some(
        (v) => v && !/your|placeholder|example|<|>/i.test(v)
    );
}
