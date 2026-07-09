import Link from "next/link";
import { ArrowRight, ShieldCheck, BadgeCheck, Landmark, CheckCircle2 } from "lucide-react";

/**
 * Marketing hero — dark emerald band with drifting gradient blobs, a serif
 * headline, and a tilted, gently-floating "filing status" card as the visual.
 * Animations are CSS-only (no JS), and honour prefers-reduced-motion.
 */
export function Hero() {
    return (
        <section className="relative overflow-hidden bg-[oklch(0.20_0.04_170)] text-white">
            {/* Drifting gradient blobs */}
            <div className="pointer-events-none absolute -top-36 -right-24 h-[460px] w-[460px] rounded-full bg-primary/50 blur-2xl animate-tk-blob" />
            <div className="pointer-events-none absolute -bottom-44 -left-20 h-[420px] w-[420px] rounded-full bg-accent-strong/25 blur-3xl animate-tk-blob [animation-delay:-8s]" />

            <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-6 py-24 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:py-32">
                {/* Copy */}
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <span className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-extrabold tracking-wide text-[oklch(0.85_0.1_165)]">
                        <span className="h-1.5 w-1.5 rounded-full bg-current" /> Tax filing &amp; consultancy
                    </span>

                    <h1 className="font-serif text-[2.6rem] leading-[1.05] text-balance sm:text-6xl md:text-[66px]">
                        Taxes, filed properly — by{" "}
                        <em className="text-accent-strong">people</em>, not just software.
                    </h1>

                    <p className="mt-6 max-w-[46ch] text-lg leading-relaxed text-[oklch(0.85_0.02_165)]">
                        ITR, GST and TDS filing with a real CA reviewing every return. Upload
                        documents when you&apos;re ready — not before you&apos;ve even chosen a service.
                    </p>

                    <div className="mt-9 flex flex-wrap gap-3.5">
                        <Link
                            href="/services"
                            className="inline-flex h-[54px] items-center gap-2 rounded-full bg-accent-strong px-8 text-base font-extrabold text-accent-strong-foreground shadow-[0_14px_30px_oklch(0.72_0.14_70/0.35)] transition-transform hover:-translate-y-0.5"
                        >
                            Start your ITR filing <ArrowRight className="h-4 w-4" />
                        </Link>
                        <Link
                            href="#services"
                            className="inline-flex h-[54px] items-center rounded-full border-[1.5px] border-white/30 px-8 text-base font-extrabold text-white transition-colors hover:bg-white/10"
                        >
                            Talk to a CA
                        </Link>
                    </div>

                    {/* Trust row */}
                    <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-xs font-medium text-[oklch(0.82_0.02_165)]">
                        <span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-accent-strong" /> Bank-grade encryption</span>
                        <span className="flex items-center gap-1.5"><BadgeCheck className="h-3.5 w-3.5 text-accent-strong" /> CA-reviewed filings</span>
                        <span className="flex items-center gap-1.5"><Landmark className="h-3.5 w-3.5 text-accent-strong" /> Direct e-filing</span>
                    </div>
                </div>

                {/* Floating filing-status card */}
                <div className="relative animate-in fade-in zoom-in-95 duration-1000">
                    <div className="animate-tk-float relative rounded-3xl bg-card p-7 text-card-foreground shadow-[0_40px_80px_oklch(0_0_0/0.35)]">
                        {/* Amber ₹ badge */}
                        <div className="absolute -top-5 -left-5 flex h-[68px] w-[68px] -rotate-[8deg] items-center justify-center rounded-[18px] bg-accent-strong text-[28px] font-bold text-accent-strong-foreground shadow-[0_16px_32px_oklch(0_0_0/0.3)]">
                            ₹
                        </div>

                        <div className="mb-5 flex items-center justify-between">
                            <span className="text-xs font-extrabold text-muted-foreground">ITR Filing (Salaried)</span>
                            <span className="inline-flex items-center gap-1 rounded-full bg-status-healthy/15 px-3 py-1 text-[11px] font-extrabold text-status-healthy">
                                <CheckCircle2 className="h-3 w-3" /> Filed
                            </span>
                        </div>

                        <div className="font-serif text-[46px] leading-none text-foreground">
                            ₹18,240{" "}
                            <span className="font-sans text-[15px] font-bold text-status-healthy">refund</span>
                        </div>
                        <p className="mt-1 text-[13px] text-muted-foreground">Acknowledged by CPC · 2 days ago</p>

                        <div className="mt-5 flex flex-col gap-2.5 border-t border-dashed border-border pt-4 text-[13px]">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Reviewed by</span>
                                <span className="font-bold">CA Ramesh Iyer</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Documents</span>
                                <span className="font-bold">Form 16, Bank statement</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
