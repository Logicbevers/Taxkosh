import { Card, CardContent } from "@/components/ui/card";
import { Brain, ShieldCheck, Users } from "lucide-react";

const pillars = [
    {
        icon: <Brain className="h-6 w-6 text-primary" />,
        title: "AI-Assisted Filing",
        description:
            "Our smart engine auto-reads your Form 16, 26AS & AIS to pre-fill your returns and find every eligible deduction — maximizing your refund with zero manual effort.",
    },
    {
        icon: <ShieldCheck className="h-6 w-6 text-emerald-500" />,
        title: "Bank-Grade Security",
        description:
            "Your data is encrypted with 256-bit AES at rest and in transit, hosted in the AWS Mumbai region with access-controlled document storage. We never sell your data.",
    },
    {
        icon: <Users className="h-6 w-6 text-violet-500" />,
        title: "CA Expert Review",
        description:
            "Every return is reviewed by a ICAI-registered Chartered Accountant before submission. Get a 30-minute CA consultation included in every Business & Pro plan.",
    },
];

// Honest platform capabilities rather than unverified vanity metrics.
const stats = [
    { value: "ITR 1–7", label: "All return types" },
    { value: "3-in-1", label: "Income Tax · GST · TDS" },
    { value: "CA-reviewed", label: "Before every filing" },
    { value: "AES-256", label: "Encrypted & private" },
];

export function WhyTaxKosh() {
    return (
        <section id="why" className="py-24 px-4">
            <div className="mx-auto max-w-7xl">
                {/* Header */}
                <div className="text-center mb-14">
                    <p className="text-sm font-semibold text-primary tracking-widest uppercase mb-3">
                        Why TaxKosh
                    </p>
                    <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
                        Built for the Indian Taxpayer
                    </h2>
                    <p className="text-muted-foreground max-w-xl mx-auto">
                        Not an afterthought — designed from the ground up for India's tax laws,
                        compliance deadlines, and financial realities.
                    </p>
                </div>

                {/* Feature pillars */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
                    {pillars.map((p) => (
                        <Card
                            key={p.title}
                            className="border border-border/60 hover:border-primary/30 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
                        >
                            <CardContent className="pt-6 flex flex-col gap-4">
                                <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center">
                                    {p.icon}
                                </div>
                                <h3 className="font-semibold text-base">{p.title}</h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    {p.description}
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Stats bar */}
                <div className="rounded-2xl border border-border/60 bg-card p-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                        {stats.map((s) => (
                            <div key={s.label}>
                                <p className="text-3xl font-bold text-primary mb-1">{s.value}</p>
                                <p className="text-sm text-muted-foreground">{s.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
