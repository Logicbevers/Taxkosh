import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM ?? "TaxKosh <noreply@taxkosh.in>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// ─── Email Verification ─────────────────────────────────────
export async function sendVerificationEmail(email: string, token: string) {
  const verifyUrl = `${APP_URL}/verify-email?token=${token}`;

  if (process.env.TESTING_MODE || !process.env.RESEND_API_KEY) {
    console.log(`[TESTING] Verification link for ${email}: ${verifyUrl}`);
    return;
  }

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: "Verify your TaxKosh email address",
    html: `
      <div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;padding:40px 24px;background:#f9fafb;">
        <div style="background:#fff;border-radius:12px;padding:40px;border:1px solid #e5e7eb;">
          <h1 style="font-size:24px;font-weight:700;color:#111827;margin:0 0 8px;">Verify your email</h1>
          <p style="color:#6b7280;margin:0 0 24px;">Click the button below to verify your TaxKosh account.</p>
          <a href="${verifyUrl}" style="display:inline-block;background:#4f46e5;color:#fff;font-weight:600;padding:12px 28px;border-radius:8px;text-decoration:none;">Verify Email</a>
          <p style="color:#9ca3af;font-size:12px;margin-top:24px;">This link expires in 24 hours. If you didn't register, ignore this email.</p>
        </div>
      </div>
    `,
  });
}

// ─── Password Reset ─────────────────────────────────────────
export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${APP_URL}/reset-password?token=${token}`;

  if (process.env.TESTING_MODE || !process.env.RESEND_API_KEY) {
    console.log(`[TESTING] Reset link for ${email}: ${resetUrl}`);
    return;
  }

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: "Reset your TaxKosh password",
    html: `
      <div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;padding:40px 24px;background:#f9fafb;">
        <div style="background:#fff;border-radius:12px;padding:40px;border:1px solid #e5e7eb;">
          <h1 style="font-size:24px;font-weight:700;color:#111827;margin:0 0 8px;">Reset your password</h1>
          <p style="color:#6b7280;margin:0 0 24px;">We received a request to reset your TaxKosh password.</p>
          <a href="${resetUrl}" style="display:inline-block;background:#4f46e5;color:#fff;font-weight:600;padding:12px 28px;border-radius:8px;text-decoration:none;">Reset Password</a>
          <p style="color:#9ca3af;font-size:12px;margin-top:24px;">This link expires in 1 hour. If you didn't request a reset, ignore this email.</p>
        </div>
      </div>
    `,
  });
}
