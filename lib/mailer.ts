import { Resend } from "resend";

/**
 * Single transactional-email sender for the whole app.
 *
 *  - No RESEND_API_KEY in dev  → logs and returns { simulated: true } (never throws)
 *  - No RESEND_API_KEY in prod → logs an error and returns { sent: false }
 *  - Key present               → sends via Resend, catching errors so a failed
 *                                email never breaks the calling request flow.
 */

const FROM = process.env.EMAIL_FROM ?? "TaxKosh <noreply@taxkosh.in>";

/**
 * A real Resend key looks like `re_` + ~20+ random chars. Placeholder values
 * from .env.example (`re_your_resend_api_key`, `re_<...>`, etc.) are truthy but
 * useless — treating them as "configured" would silently fail every send. So we
 * detect and reject obvious placeholders and fall back to dev simulation.
 */
function getValidResendKey(): string | null {
    const key = process.env.RESEND_API_KEY?.trim();
    if (!key) return null;
    if (!key.startsWith("re_")) return null;
    const looksPlaceholder =
        /your|placeholder|example|xxxx|<|>/i.test(key) || key.length < 20;
    return looksPlaceholder ? null : key;
}

let client: Resend | null = null;
function getClient(key: string): Resend {
    if (!client) client = new Resend(key);
    return client;
}

export interface SendMailResult {
    sent: boolean;
    simulated?: boolean;
}

export async function sendMail(opts: {
    to: string;
    subject: string;
    html: string;
    attachments?: { filename: string; content: Buffer }[];
}): Promise<SendMailResult> {
    const { to, subject, html, attachments } = opts;
    const key = getValidResendKey();

    if (!key) {
        if (process.env.NODE_ENV !== "production") {
            console.log(`[Dev email] → ${to} · ${subject}  (RESEND_API_KEY not configured — email simulated)`);
            return { sent: false, simulated: true };
        }
        console.error(`RESEND_API_KEY not set/invalid — email not sent: "${subject}" to ${to}`);
        return { sent: false };
    }

    try {
        // The Resend SDK resolves with { data, error } instead of throwing on API
        // failures — an unverified domain, a bad key, a bounce. Ignoring `error` made
        // every failed send report success: callers were told the mail was delivered,
        // nothing was logged, and register's fallback never fired.
        const { error } = await getClient(key).emails.send({ from: FROM, to, subject, html, attachments });
        if (error) {
            console.error(`Email send failed: "${subject}" to ${to}`, error);
            return { sent: false };
        }
        return { sent: true };
    } catch (e) {
        // Still needed: network/transport errors do throw.
        console.error(`Email send failed: "${subject}" to ${to}`, e);
        return { sent: false };
    }
}
