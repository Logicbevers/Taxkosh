import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ArrowRight, Check, Clock } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { nameToSlug } from "@/lib/catalog";

/**
 * Landing pricing — real, per-service fixed fees pulled from the catalog.
 * This is the platform's single pricing model: one upfront fee per filing,
 * charged at checkout (no subscriptions). Prices shown are GST-inclusive,
 * matching how the invoice engine breaks out CGST/SGST from the total.
 */
export async function Pricing() {
    const services = await prisma.service.findMany({
        where: { status: "active", price: { gt: 0 } },
        orderBy: { price: "asc" },
        take: 4,
        include: { subCategory: { include: { category: true } } },
    });

    if (services.length === 0) return null;

    return (
        <section id="pricing" className="py-24 px-4 bg-muted/30">
            <div className="mx-auto max-w-7xl">
                <div className="text-center mb-14">
                    <p className="text-sm font-semibold text-primary tracking-widest uppercase mb-3">
                        Transparent Pricing
                    </p>
                    <h2 className="font-serif text-4xl sm:text-5xl mb-4">
                        One fixed fee per filing
                    </h2>
                    <p className="text-muted-foreground max-w-lg mx-auto">
                        See the full price before you pay — no subscriptions, no hidden
                        charges, no surprises at the end.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 items-stretch">
                    {services.map((s) => {
                        const href = `/services/${s.subCategory.category.slug}/${nameToSlug(s.subCategory.name)}/${s.slug}`;
                        return (
                            <Card
                                key={s.id}
                                className="flex flex-col border border-border/60 hover:border-primary/40 hover:shadow-md transition-all"
                            >
                                <CardHeader className="pb-3">
                                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                                        {s.subCategory.category.name}
                                    </p>
                                    <h3 className="font-semibold text-base leading-tight">{s.name}</h3>
                                </CardHeader>
                                <CardContent className="flex flex-col gap-4 flex-1">
                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                        {s.description || `Handled end-to-end by an ICAI-registered CA.`}
                                    </p>
                                    <div className="mt-auto">
                                        <p className="font-serif text-3xl">₹{s.price.toLocaleString("en-IN")}</p>
                                        <p className="mt-1 flex items-center gap-1 text-[11px] uppercase tracking-wider text-muted-foreground">
                                            <Clock className="h-3 w-3" /> {s.slaHours}h turnaround
                                        </p>
                                    </div>
                                    <Button asChild className="w-full">
                                        <Link href={href}>Select</Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                <div className="mt-10 flex flex-col items-center gap-4">
                    <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-primary" /> All prices include 18% GST</span>
                        <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-primary" /> GST invoice with every payment</span>
                        <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-primary" /> Pay only when you're ready to file</span>
                    </div>
                    <Button variant="outline" asChild>
                        <Link href="/services">
                            Browse the full catalog <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </div>
            </div>
        </section>
    );
}
