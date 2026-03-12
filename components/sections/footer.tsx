import Link from "next/link";
import { FileText } from "lucide-react";

const footerLinks = {
    Services: [
        { label: "Income Tax Filing", href: "#services" },
        { label: "GST Filing", href: "#services" },
        { label: "TDS Returns", href: "#services" },
        { label: "ROC Compliance", href: "#services" },
        { label: "CA Consultation", href: "#pricing" },
    ],
    Company: [
        { label: "About Us", href: "/about" },
        { label: "Careers", href: "/careers" },
        { label: "Blog", href: "/blog" },
        { label: "Press", href: "/press" },
        { label: "Contact", href: "/contact" },
    ],
    Legal: [
        { label: "Privacy Policy", href: "/privacy-policy" },
        { label: "Terms of Service", href: "/terms" },
        { label: "Refund Policy", href: "/refund-policy" },
        { label: "Grievance Officer", href: "/grievance" },
        { label: "Cookie Policy", href: "/cookies" },
    ],
    Support: [
        { label: "Help Center", href: "/help" },
        { label: "Filing Guides", href: "/guides" },
        { label: "Tax Calculator", href: "/calculator" },
        { label: "ITR Due Dates 2025", href: "/due-dates" },
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
                        <Link href="/" className="flex items-center gap-2 font-bold text-lg mb-4">
                            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                                <FileText className="h-3.5 w-3.5" />
                            </span>
                            Tax<span className="text-primary">Kosh</span>
                        </Link>
                        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                            India's smartest tax & compliance platform. Trusted by 50,000+ taxpayers.
                        </p>
                        <p className="text-xs text-muted-foreground">
                            CIN: U72900MH2024PTC000000
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                            GSTIN: 27AABCT1234A1Z5
                        </p>
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
