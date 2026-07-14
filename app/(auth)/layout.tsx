import Link from "next/link";
import { Logo } from "@/components/logo";

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="grid min-h-screen bg-background lg:grid-cols-[0.85fr_1fr]">
            {/* Left brand panel — dark emerald with drifting blobs */}
            <div className="relative hidden flex-col justify-between overflow-hidden bg-[oklch(0.20_0.04_170)] p-12 lg:flex">
                <div className="pointer-events-none absolute -top-32 -right-28 h-[380px] w-[380px] rounded-full bg-primary/40 blur-2xl animate-tk-blob" />
                <div className="pointer-events-none absolute -bottom-36 -left-20 h-[320px] w-[320px] rounded-full bg-accent-strong/20 blur-3xl animate-tk-blob [animation-delay:-8s]" />

                <Link href="/" className="relative inline-flex">
                    <Logo size="md" inverted />
                </Link>

                <div className="relative">
                    <p className="max-w-[20ch] font-serif text-[34px] leading-tight text-white">
                        Taxes, filed properly — by people, not just software.
                    </p>
                    <p className="mt-4 max-w-[34ch] text-sm leading-relaxed text-[oklch(0.78_0.02_165)]">
                        Every return reviewed by a licensed CA. Fixed pricing, no surprises.
                    </p>
                </div>

                <div className="relative text-xs text-[oklch(0.65_0.02_165)]">
                    © {new Date().getFullYear()} TaxKosh LLP.
                </div>
            </div>

            {/* Right form panel */}
            <div className="flex items-center justify-center p-6 sm:p-12">
                <div className="w-full max-w-[380px]">
                    {/* Logo shown on mobile where the brand panel is hidden */}
                    <Link href="/" className="mb-8 inline-flex lg:hidden">
                        <Logo size="md" />
                    </Link>
                    {children}
                </div>
            </div>
        </div>
    );
}
