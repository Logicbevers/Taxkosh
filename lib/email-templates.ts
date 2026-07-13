/**
 * Branded transactional email templates for TaxKosh.
 *
 * One shared HTML shell so every email (verification, reset, payment receipt,
 * status updates) looks consistent. Inline styles only — email clients strip
 * <style> blocks and external CSS.
 */

const BRAND = {
    name: "TaxKosh",
    primary: "#1a6b52",   // deep emerald (matches --primary)
    accent: "#c98a2b",    // amber (matches --accent-strong, used for कोष)
    dark: "#2a2822",      // warm near-black (matches --foreground)
    muted: "#6b7280",
    border: "#e5e7eb",
    bg: "#f7f6f2",        // warm off-white (matches --background)
};

/**
 * Base URL for links inside emails. Emails are opened away from the dev machine,
 * so a localhost link is always useless — fall back to the canonical live site
 * whenever the configured app URL is localhost or unset. Set EMAIL_LINK_URL to
 * override (e.g. to test local verify links).
 */
export function emailBaseUrl(): string {
    const override = process.env.EMAIL_LINK_URL?.trim();
    if (override) return override.replace(/\/$/, "");
    const url = process.env.NEXT_PUBLIC_APP_URL?.trim();
    if (!url || /localhost|127\.0\.0\.1/.test(url)) return "https://www.taxkosh.com";
    return url.replace(/\/$/, "");
}

const APP_URL = emailBaseUrl();
const SITE_HOST = APP_URL.replace(/^https?:\/\//, "").replace(/\/$/, "");

interface ShellOptions {
    heading: string;
    /** Main body HTML (already escaped/trusted) */
    body: string;
    /** Optional primary call-to-action */
    cta?: { label: string; href: string };
    /** Footer note override */
    footerNote?: string;
}

/** Wrap body content in the branded shell. */
export function emailShell({ heading, body, cta, footerNote }: ShellOptions): string {
    const ctaHtml = cta
        ? `<a href="${cta.href}" style="display:inline-block;background:${BRAND.primary};color:#ffffff;font-weight:600;padding:12px 28px;border-radius:8px;text-decoration:none;margin-top:8px;">${cta.label}</a>`
        : "";

    return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,sans-serif;background:${BRAND.bg};padding:32px 16px;">
      <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid ${BRAND.border};border-radius:14px;overflow:hidden;">
        <div style="padding:24px 32px;border-bottom:1px solid ${BRAND.border};">
          <span style="font-size:20px;font-weight:800;color:${BRAND.dark};">Tax<span style="color:${BRAND.accent};">कोष</span></span>
        </div>
        <div style="padding:32px;">
          <h1 style="font-size:22px;font-weight:700;color:${BRAND.dark};margin:0 0 12px;">${heading}</h1>
          <div style="color:${BRAND.muted};font-size:15px;line-height:1.6;">${body}</div>
          ${ctaHtml ? `<div style="margin-top:24px;">${ctaHtml}</div>` : ""}
        </div>
        <div style="padding:20px 32px;border-top:1px solid ${BRAND.border};background:${BRAND.bg};">
          <p style="color:#9ca3af;font-size:12px;margin:0;line-height:1.5;">
            ${footerNote ?? `This is an automated message from ${BRAND.name}. If you didn't expect it, you can safely ignore this email.`}
          </p>
          <p style="color:#9ca3af;font-size:12px;margin:8px 0 0;">© ${new Date().getFullYear()} ${BRAND.name} · <a href="${APP_URL}" style="color:${BRAND.muted};">${SITE_HOST}</a></p>
        </div>
      </div>
    </div>`;
}

// ─── Specific templates ─────────────────────────────────────

export function verificationEmail(verifyUrl: string) {
    return {
        subject: "Verify your TaxKosh email address",
        html: emailShell({
            heading: "Confirm your email",
            body: "Welcome to TaxKosh! Confirm your email address to activate your account and start filing.",
            cta: { label: "Verify email", href: verifyUrl },
            footerNote: "This link expires in 24 hours. If you didn't create a TaxKosh account, ignore this email.",
        }),
    };
}

export function passwordResetEmail(resetUrl: string) {
    return {
        subject: "Reset your TaxKosh password",
        html: emailShell({
            heading: "Reset your password",
            body: "We received a request to reset your TaxKosh password. Click below to choose a new one.",
            cta: { label: "Reset password", href: resetUrl },
            footerNote: "This link expires in 1 hour. If you didn't request a reset, your password is unchanged and you can ignore this email.",
        }),
    };
}

export function paymentReceiptEmail(opts: {
    userName: string;
    serviceName: string;
    planName: string | null;
    amountRupees: number;
    serviceRequestId: string;
    invoiceNumber?: string;
}) {
    const { userName, serviceName, planName, amountRupees, serviceRequestId, invoiceNumber } = opts;
    const body = `
      <p style="margin:0 0 16px;">Hi ${userName}, we've received your payment. Here's your receipt:</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr><td style="padding:8px 0;color:#6b7280;">Service</td><td style="padding:8px 0;text-align:right;color:#111827;font-weight:600;">${serviceName}</td></tr>
        ${planName ? `<tr><td style="padding:8px 0;color:#6b7280;">Plan</td><td style="padding:8px 0;text-align:right;color:#111827;font-weight:600;">${planName}</td></tr>` : ""}
        ${invoiceNumber ? `<tr><td style="padding:8px 0;color:#6b7280;">Invoice</td><td style="padding:8px 0;text-align:right;color:#111827;font-weight:600;">${invoiceNumber}</td></tr>` : ""}
        <tr><td style="padding:12px 0 0;color:#6b7280;border-top:1px solid #e5e7eb;">Amount paid</td><td style="padding:12px 0 0;text-align:right;color:#111827;font-weight:700;font-size:16px;border-top:1px solid #e5e7eb;">₹${amountRupees.toLocaleString("en-IN")}</td></tr>
      </table>
      <p style="margin:16px 0 0;">Next: upload your documents so our experts can begin.</p>`;
    return {
        subject: `Payment received — ${serviceName} · TaxKosh`,
        html: emailShell({
            heading: "Payment successful ✅",
            body,
            cta: { label: "Upload documents", href: `${APP_URL}/dashboard/services/${serviceRequestId}` },
        }),
    };
}

export function statusUpdateEmail(opts: {
    title: string;
    message: string;
    serviceRequestId: string;
}) {
    return {
        subject: `${opts.title} · TaxKosh`,
        html: emailShell({
            heading: opts.title,
            body: opts.message,
            cta: { label: "View request", href: `${APP_URL}/dashboard/services/${opts.serviceRequestId}` },
        }),
    };
}

/** Internal alert to the ops/CA team — CTA points at the ADMIN request page. */
export function adminAlertEmail(opts: {
    title: string;
    message: string;
    serviceRequestId: string;
}) {
    return {
        subject: `[Ops] ${opts.title} · TaxKosh`,
        html: emailShell({
            heading: opts.title,
            body: opts.message,
            cta: { label: "Open in admin", href: `${APP_URL}/dashboard/admin/service-requests/${opts.serviceRequestId}` },
            footerNote: "Internal notification for the TaxKosh operations team.",
        }),
    };
}
