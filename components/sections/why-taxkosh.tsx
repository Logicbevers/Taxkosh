import { Card, CardContent } from "@/components/ui/card";
import { BadgeIndianRupee, ShieldCheck, Users } from "lucide-react";

// Every claim below describes how the platform actually works today —
// no capability we haven't built, no metric we can't back.
const pillars = [
    {
        icon: <Users className="h-6 w-6 text-primary" />,
        title: "Expert CA Review",
        description:
            "Every return is prepared and reviewed by an ICAI-registered Chartered Accountant before it is filed. Real people doing accountable work — not an automated guess.",
    },
    {
        icon: <ShieldCheck className="h-6 w-6 text-emerald-500" />,
        title: "Secure Document Vault",
        description:
            "Your documents live in an encrypted, access-controlled vault and are used only for your filing. We never sell or share your data with third parties.",
    },
    {
        icon: <BadgeIndianRupee className="h-6 w-6 text-accent-strong" />,
        title: "Fixed, Upfront Pricing",
        description:
            "Every service shows its full fee before you pay. No sliding scales, no per-document add-ons, no surprises when the work is done.",
    },
];

// Honest platform capabilities rather than unverified vanity metrics.
const stats = [
    { value: "Fixed", label: "Upfront pricing, no surprises" },
    { value: "CA-reviewed", label: "Before every filing" },
    { value: "ITR · GST · TDS", label: "One platform" },
    { value: "Encrypted", label: "Access-controlled vault" },
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
                    <h2 className="font-serif text-4xl sm:text-5xl mb-4">
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
