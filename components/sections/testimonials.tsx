import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";

const testimonials = [
    {
        name: "Priya Sharma",
        role: "Software Engineer",
        city: "Bengaluru, Karnataka",
        rating: 5,
        text: "I used to dread ITR season every year. TaxKosh auto-imported my Form 16 and identified an ₹18,000 refund I didn't know I was owed. Filed in under 12 minutes. Absolute game-changer.",
        initials: "PS",
        color: "bg-primary/20 text-primary",
    },
    {
        name: "Rahul Mehta",
        role: "Small Business Owner",
        city: "Ahmedabad, Gujarat",
        rating: 5,
        text: "Managing GST for my trading business was a nightmare before TaxKosh. Now GSTR-3B practically files itself. The CA review before submission gives me peace of mind. Worth every rupee.",
        initials: "RM",
        color: "bg-violet-500/20 text-violet-500",
    },
    {
        name: "Anita Desai",
        role: "CA — Desai & Associates",
        city: "Mumbai, Maharashtra",
        rating: 5,
        text: "The CA Pro plan transformed my practice. I manage 60+ client filings from a single dashboard. Bulk GSTR-9, director KYC in one click, and the API integration with my existing tools is seamless.",
        initials: "AD",
        color: "bg-emerald-500/20 text-emerald-500",
    },
];

function Stars({ count }: { count: number }) {
    return (
        <div className="flex gap-0.5">
            {Array.from({ length: count }).map((_, i) => (
                <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            ))}
        </div>
    );
}

export function Testimonials() {
    return (
        <section id="testimonials" className="py-24 px-4 bg-muted/30">
            <div className="mx-auto max-w-7xl">
                <div className="text-center mb-14">
                    <p className="text-sm font-semibold text-primary tracking-widest uppercase mb-3">
                        Testimonials
                    </p>
                    <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
                        Trusted Across India
                    </h2>
                    <p className="text-muted-foreground max-w-lg mx-auto">
                        From salaried employees in Bengaluru to CAs in Mumbai — India's taxpayers
                        choose TaxKosh.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {testimonials.map((t) => (
                        <Card
                            key={t.name}
                            className="border border-border/60 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
                        >
                            <CardContent className="pt-6 flex flex-col gap-4">
                                <Stars count={t.rating} />
                                <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                                    &ldquo;{t.text}&rdquo;
                                </p>
                                <div className="flex items-center gap-3 pt-2 border-t border-border/60">
                                    <div
                                        className={`h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${t.color}`}
                                    >
                                        {t.initials}
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold leading-tight">{t.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {t.role} · {t.city}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    );
}
