import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    FileText,
    Receipt,
    Landmark,
    Building2,
    ArrowRight,
} from "lucide-react";

const services = [
    {
        icon: <FileText className="h-6 w-6 text-primary" />,
        title: "Income Tax Filing",
        description:
            "ITR-1 to ITR-7 filing for individuals, salaried employees, freelancers & HUFs. AI-guided deduction maximization under 80C, 80D & more.",
        highlights: ["Form 26AS auto-import", "HRA & LTA claims", "Capital gains reporting"],
        tag: "Most Popular",
    },
    {
        icon: <Receipt className="h-6 w-6 text-violet-500" />,
        title: "GST Filing",
        description:
            "GSTR-1, GSTR-3B, GSTR-9 & GST registration for traders, manufacturers & service providers across India.",
        highlights: ["GSTR reconciliation", "E-invoice compliance", "GST registration"],
        tag: null,
    },
    {
        icon: <Landmark className="h-6 w-6 text-emerald-500" />,
        title: "TDS Filing",
        description:
            "Form 24Q, 26Q, 27Q returns with auto-computation of TDS liability, challan payments & correction statements.",
        highlights: ["24Q / 26Q returns", "Challan reconciliation", "Correction filing"],
        tag: null,
    },
    {
        icon: <Building2 className="h-6 w-6 text-amber-500" />,
        title: "ROC Compliance",
        description:
            "Annual filing, director KYC, charge satisfaction & MCA event-based compliances for Private Limited & OPC companies.",
        highlights: ["Annual returns (AOC-4, MGT-7)", "Director KYC (DIR-3)", "MCA event filings"],
        tag: null,
    },
];

export function Services() {
    return (
        <section id="services" className="py-24 px-4">
            <div className="mx-auto max-w-7xl">
                <div className="text-center mb-14">
                    <p className="text-sm font-semibold text-primary tracking-widest uppercase mb-3">
                        What We Do
                    </p>
                    <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
                        Complete Tax & Compliance Solutions
                    </h2>
                    <p className="text-muted-foreground max-w-xl mx-auto">
                        One platform for every tax obligation — from individual ITR to corporate
                        MCA compliance.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {services.map((s) => (
                        <Card
                            key={s.title}
                            className="group relative flex flex-col border border-border/60 bg-card hover:border-primary/40 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
                        >
                            {s.tag && (
                                <span className="absolute top-3 right-3 rounded-full bg-primary/10 text-primary text-[10px] font-semibold px-2 py-0.5 tracking-wide">
                                    {s.tag}
                                </span>
                            )}
                            <CardHeader className="pb-3">
                                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                                    {s.icon}
                                </div>
                                <h3 className="font-semibold text-base leading-tight">{s.title}</h3>
                            </CardHeader>
                            <CardContent className="flex flex-col gap-4 flex-1">
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    {s.description}
                                </p>
                                <ul className="space-y-1.5 mt-auto">
                                    {s.highlights.map((h) => (
                                        <li key={h} className="text-xs text-muted-foreground flex items-center gap-1.5">
                                            <span className="h-1 w-1 rounded-full bg-primary flex-shrink-0" />
                                            {h}
                                        </li>
                                    ))}
                                </ul>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="mt-2 w-full justify-between text-primary hover:text-primary hover:bg-primary/5 px-0"
                                >
                                    Learn More <ArrowRight className="h-3.5 w-3.5" />
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    );
}
