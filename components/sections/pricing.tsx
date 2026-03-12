import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Check, Zap } from "lucide-react";
import Link from "next/link";

const plans = [
    {
        name: "Individual",
        price: "₹999",
        period: "/year",
        description: "Perfect for salaried employees & simple ITR filers.",
        badge: null,
        cta: "Get Started",
        features: [
            "ITR-1 & ITR-2 filing",
            "Salary & HRA calculation",
            "80C deduction optimizer",
            "Form 26AS auto-import",
            "Email & chat support",
            "Acknowledgement tracking",
        ],
        highlight: false,
    },
    {
        name: "Business",
        price: "₹2,999",
        period: "/year",
        description: "For freelancers, small businesses & proprietors.",
        badge: "Most Popular",
        cta: "Start Free Trial",
        features: [
            "Everything in Individual",
            "ITR-3 & ITR-4 filing",
            "GST filing (GSTR-1 & 3B)",
            "TDS return filing",
            "Business expense tracking",
            "Dedicated CA review",
            "WhatsApp support",
        ],
        highlight: true,
    },
    {
        name: "CA Pro",
        price: "₹9,999",
        period: "/year",
        description: "For Chartered Accountants managing multiple clients.",
        badge: null,
        cta: "Contact Sales",
        features: [
            "Everything in Business",
            "Unlimited client filings",
            "ROC & MCA compliance",
            "Bulk GSTR-9 filing",
            "White-label portal",
            "Priority phone support",
            "API access",
        ],
        highlight: false,
    },
];

export function Pricing() {
    return (
        <section id="pricing" className="py-24 px-4 bg-muted/30">
            <div className="mx-auto max-w-7xl">
                <div className="text-center mb-14">
                    <p className="text-sm font-semibold text-primary tracking-widest uppercase mb-3">
                        Transparent Pricing
                    </p>
                    <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
                        Plans for Every Taxpayer
                    </h2>
                    <p className="text-muted-foreground max-w-lg mx-auto">
                        GST inclusive pricing. No hidden fees. Cancel anytime.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                    {plans.map((plan) => (
                        <Card
                            key={plan.name}
                            className={`relative flex flex-col border transition-all duration-300 ${plan.highlight
                                    ? "border-primary shadow-xl shadow-primary/15 scale-[1.03] bg-card"
                                    : "border-border/60 hover:border-primary/30 hover:shadow-md"
                                }`}
                        >
                            {plan.badge && (
                                <div className="absolute -top-3.5 left-0 right-0 flex justify-center">
                                    <Badge className="gap-1 px-3 py-1">
                                        <Zap className="h-3 w-3" />
                                        {plan.badge}
                                    </Badge>
                                </div>
                            )}
                            <CardHeader className="pb-4 pt-8">
                                <p className="text-sm font-semibold text-muted-foreground mb-1">{plan.name}</p>
                                <div className="flex items-end gap-1">
                                    <span className="text-4xl font-bold tracking-tight">{plan.price}</span>
                                    <span className="text-muted-foreground text-sm mb-1">{plan.period}</span>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
                            </CardHeader>
                            <CardContent className="flex flex-col gap-5 flex-1">
                                <Button
                                    size="default"
                                    variant={plan.highlight ? "default" : "outline"}
                                    className="w-full"
                                    asChild
                                >
                                    <Link href="#contact">{plan.cta}</Link>
                                </Button>
                                <ul className="space-y-2.5">
                                    {plan.features.map((f) => (
                                        <li key={f} className="flex items-start gap-2.5 text-sm">
                                            <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                                            <span className="text-muted-foreground">{f}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <p className="text-center text-xs text-muted-foreground mt-8">
                    All prices are exclusive of 18% GST. &nbsp;|&nbsp; Payment secured by Razorpay.
                </p>
            </div>
        </section>
    );
}
