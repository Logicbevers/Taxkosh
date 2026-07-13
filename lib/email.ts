import { sendMail } from "@/lib/mailer";
import { verificationEmail, passwordResetEmail, emailBaseUrl } from "@/lib/email-templates";

const APP_URL = emailBaseUrl();

// ─── Email Verification ─────────────────────────────────────
export async function sendVerificationEmail(email: string, token: string) {
    const verifyUrl = `${APP_URL}/verify-email?token=${token}`;
    const { subject, html } = verificationEmail(verifyUrl);
    const res = await sendMail({ to: email, subject, html });
    if (res.simulated) {
        // Dev convenience: surface the link so you can click it without a mailbox.
        console.log(`[Dev] Verification link for ${email}: ${verifyUrl}`);
    }
    return res;
}

// ─── Password Reset ─────────────────────────────────────────
export async function sendPasswordResetEmail(email: string, token: string) {
    const resetUrl = `${APP_URL}/reset-password?token=${token}`;
    const { subject, html } = passwordResetEmail(resetUrl);
    const res = await sendMail({ to: email, subject, html });
    if (res.simulated) {
        console.log(`[Dev] Reset link for ${email}: ${resetUrl}`);
    }
    return res;
}
