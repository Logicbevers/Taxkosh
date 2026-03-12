import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid";
import {
    ShieldCheck,
    FileText,
    BarChart3,
    Users,
    BadgeCheck,
    Clock,
    ArrowRight,
} from "lucide-react";

const Skeleton = ({ className = "" }: { className?: string }) => (
    <div
        className={`flex flex-1 w-full h-full min-h-[6rem] rounded-xl relative overflow-hidden ${className}`}
    >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent" />
        <div className="absolute bottom-3 right-3 opacity-10">
            <div className="h-16 w-16 rounded-full border-4 border-primary" />
        </div>
    </div>
);

const features = [
    {
        title: "ITR Filing in 10 Minutes",
        description:
            "Auto-import salary & investment data from Form 26AS. Our AI spots deductions you didn't know existed.",
        header: <Skeleton className="bg-primary/5 border border-primary/10" />,
        icon: <FileText className="h-4 w-4 text-primary" />,
        className: "md:col-span-2",
    },
    {
        title: "GST & TDS Returns",
        description:
            "Automated GSTR-1, GSTR-3B & TDS reconciliation. Never miss a due date.",
        header: <Skeleton className="bg-violet-500/5 border border-violet-500/10" />,
        icon: <BarChart3 className="h-4 w-4 text-violet-500" />,
        className: "",
    },
    {
        title: "CA Expert Review",
        description:
            "Every return reviewed by a certified Chartered Accountant before submission.",
        header: <Skeleton className="bg-emerald-500/5 border border-emerald-500/10" />,
        icon: <BadgeCheck className="h-4 w-4 text-emerald-500" />,
        className: "",
    },
    {
        title: "Bank-Grade Security",
        description:
            "256-bit AES encryption, ISO 27001 certified infrastructure, and zero data sharing with third parties.",
        header: <Skeleton className="bg-primary/5 border border-primary/10" />,
        icon: <ShieldCheck className="h-4 w-4 text-primary" />,
        className: "md:col-span-2",
    },
];

export function Hero() {
    return (
        <section className="relative min-h-screen flex flex-col items-center justify-center pt-24 pb-20 px-4 overflow-hidden">
            {/* Background glow */}
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[700px] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center text-center max-w-4xl mx-auto mb-14">
                <Badge variant="secondary" className="mb-5 gap-1.5 px-3 py-1 text-xs font-medium">
                    <Clock className="h-3 w-3" />
                    FY 2024–25 Filing Season Now Open
                </Badge>

                <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-tight mb-6">
                    File Your Taxes.{" "}
                    <span className="text-primary">Stress-Free.</span>
                </h1>

                <p className="text-lg text-muted-foreground max-w-2xl mb-8">
                    India's smartest tax platform for individuals, businesses & CAs.
                    File ITR, GST, TDS & ROC compliance — guided by AI, reviewed by experts.
                </p>

                <div className="flex flex-col sm:flex-row gap-3">
                    <Button size="lg" className="gap-2 px-8" asChild>
                        <Link href="/register">
                            Start Filing Free <ArrowRight className="h-4 w-4" />
                        </Link>
                    </Button>
                    <Button size="lg" variant="outline" asChild>
                        <Link href="#services">Talk to a CA →</Link>
                    </Button>
                </div>

                {/* Trust badges */}
                <div className="mt-10 flex flex-wrap justify-center gap-6 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> ISO 27001 Certified
                    </span>
                    <span className="flex items-center gap-1.5">
                        <BadgeCheck className="h-3.5 w-3.5 text-primary" /> GSTIN Verified Platform
                    </span>
                    <span className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-violet-500" /> 50,000+ Happy Taxpayers
                    </span>
                </div>
            </div>

            {/* Bento Grid */}
            <div className="relative z-10 w-full max-w-4xl mx-auto">
                <BentoGrid>
                    {features.map((f, i) => (
                        <BentoGridItem
                            key={i}
                            title={f.title}
                            description={f.description}
                            header={f.header}
                            icon={f.icon}
                            className={f.className}
                        />
                    ))}
                </BentoGrid>
            </div>
        </section>
    );
}
