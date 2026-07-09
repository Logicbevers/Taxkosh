import Link from "next/link";
import { Logo } from "@/components/logo";

// Every link below resolves to a real, existing route to avoid dead-ends.
const footerLinks = {
    Services: [
        { label: "Income Tax Filing", href: "/services/income-tax" },
        { label: "GST Filing", href: "/services/gst" },
        { label: "TDS Returns", href: "/services/tds" },
        { label: "All Services", href: "/services" },
    ],
    Company: [
        { label: "Why TaxKosh", href: "/#why" },
        { label: "Contact", href: "/contact" },
    ],
    Legal: [
        { label: "Privacy Policy", href: "/privacy-policy" },
        { label: "Terms of Service", href: "/terms" },
        { label: "Refund Policy", href: "/refund-policy" },
        { label: "Grievance Officer", href: "/contact" },
    ],
    Support: [
        { label: "Help & Contact", href: "/contact" },
        { label: "Browse Services", href: "/services" },
        { label: "WhatsApp Support", href: "https://wa.me/919999999999" },
    ],
};

export function Footer() {
    return (
        <footer className="border-t border-border/60 bg-card">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                {/* Main footer grid */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-8 py-16">
                    {/* Brand column */}
                    <div className="col-span-2 md:col-span-1">
                        <Link href="/" className="inline-flex items-center mb-4">
                            <Logo size="md" />
                        </Link>
                        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                            India&apos;s tax &amp; compliance platform — file Income Tax, GST &amp; TDS with expert review.
                        </p>
                        {process.env.NEXT_PUBLIC_COMPANY_CIN && (
                            <p className="text-xs text-muted-foreground">
                                CIN: {process.env.NEXT_PUBLIC_COMPANY_CIN}
                            </p>
                        )}
                        {process.env.NEXT_PUBLIC_COMPANY_GSTIN && (
                            <p className="text-xs text-muted-foreground mt-1">
                                GSTIN: {process.env.NEXT_PUBLIC_COMPANY_GSTIN}
                            </p>
                        )}
                    </div>

                    {/* Link columns */}
                    {Object.entries(footerLinks).map(([category, links]) => (
                        <div key={category}>
                            <p className="text-xs font-semibold text-foreground uppercase tracking-wider mb-4">
                                {category}
                            </p>
                            <ul className="space-y-2.5">
                                {links.map((link) => (
                                    <li key={link.label}>
                                        <Link
                                            href={link.href}
                                            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Bottom bar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-6 border-t border-border/60 text-xs text-muted-foreground">
                    <p>
                        © {new Date().getFullYear()} TaxKosh Technologies Pvt. Ltd. All rights reserved.
                    </p>
                    <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                            Made in India 🇮🇳
                        </span>
                        <span>·</span>
                        <Link href="/privacy-policy" className="hover:text-foreground transition-colors">
                            Privacy
                        </Link>
                        <span>·</span>
                        <Link href="/terms" className="hover:text-foreground transition-colors">
                            Terms
                        </Link>
                        <span>·</span>
                        <Link href="/refund-policy" className="hover:text-foreground transition-colors">
                            Refunds
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
