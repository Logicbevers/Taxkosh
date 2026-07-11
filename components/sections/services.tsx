import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Receipt, Landmark, Building2, Folder, ArrowRight } from "lucide-react";
import { getPublicCategories } from "@/lib/catalog";

// Match seeded category slugs to nicer icons on the landing page.
// Any category not in this map falls back to a generic Folder icon.
const iconMap: Record<string, { icon: React.ReactNode; tag?: string }> = {
    "income-tax": { icon: <FileText className="h-6 w-6 text-primary" />, tag: "Most Popular" },
    "gst": { icon: <Receipt className="h-6 w-6 text-accent-strong" /> },
    "tds": { icon: <Landmark className="h-6 w-6 text-emerald-500" /> },
    "tds-compliance": { icon: <Landmark className="h-6 w-6 text-emerald-500" /> },
    "roc": { icon: <Building2 className="h-6 w-6 text-amber-500" /> },
    "roc-compliance": { icon: <Building2 className="h-6 w-6 text-amber-500" /> },
    "audit-services": { icon: <Building2 className="h-6 w-6 text-amber-500" /> },
};

const genericHighlights: Record<string, string[]> = {
    "income-tax": ["Form 26AS auto-import", "HRA & LTA claims", "Capital gains reporting"],
    "gst": ["GSTR reconciliation", "E-invoice compliance", "GST registration"],
    "tds": ["24Q / 26Q returns", "Challan reconciliation", "Correction filing"],
    "tds-compliance": ["24Q / 26Q returns", "Challan reconciliation", "Correction filing"],
};

export async function Services() {
    const categories = await getPublicCategories();

    // Dedupe by name (some setups have historical duplicates from repeated seeding)
    const seen = new Set<string>();
    const displayCategories = categories
        .filter(c => {
            const key = c.name.toLowerCase().trim();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        })
        .slice(0, 4);

    return (
        <section id="services" className="py-24 px-4">
            <div className="mx-auto max-w-7xl">
                <div className="text-center mb-14">
                    <p className="text-sm font-semibold text-primary tracking-widest uppercase mb-3">
                        What We Do
                    </p>
                    <h2 className="font-serif text-4xl sm:text-5xl mb-4">
                        Complete Tax & Compliance Solutions
                    </h2>
                    <p className="text-muted-foreground max-w-xl mx-auto">
                        One platform for every tax obligation — browse services below, no login needed.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {displayCategories.map((c) => {
                        const meta = iconMap[c.slug] ?? { icon: <Folder className="h-6 w-6 text-primary" /> };
                        const highlights =
                            genericHighlights[c.slug] ??
                            c.subCategories.slice(0, 3).map(s => s.name);

                        return (
                            <Link
                                key={c.id}
                                href={`/services/${c.slug}`}
                                aria-label={`Explore ${c.name}`}
                                className="focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg"
                            >
                                <Card className="group relative flex flex-col h-full cursor-pointer border border-border/60 bg-card hover:border-primary/40 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
                                    {meta.tag && (
                                        <span className="absolute top-3 right-3 rounded-full bg-primary/10 text-primary text-[10px] font-semibold px-2 py-0.5 tracking-wide">
                                            {meta.tag}
                                        </span>
                                    )}
                                    <CardHeader className="pb-3">
                                        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                                            {meta.icon}
                                        </div>
                                        <h3 className="font-semibold text-base leading-tight">{c.name}</h3>
                                    </CardHeader>
                                    <CardContent className="flex flex-col gap-4 flex-1">
                                        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                                            {c.description ?? `Compliance and filing services under ${c.name}.`}
                                        </p>
                                        {highlights.length > 0 && (
                                            <ul className="space-y-1.5 mt-auto">
                                                {highlights.slice(0, 3).map((h) => (
                                                    <li key={h} className="text-xs text-muted-foreground flex items-center gap-1.5">
                                                        <span className="h-1 w-1 rounded-full bg-primary flex-shrink-0" />
                                                        {h}
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                        <span className="mt-2 w-full inline-flex items-center justify-between text-sm font-medium text-primary group-hover:gap-1.5 transition-all">
                                            Explore <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                                        </span>
                                    </CardContent>
                                </Card>
                            </Link>
                        );
                    })}
                </div>

                <div className="text-center mt-10">
                    <Button size="lg" asChild>
                        <Link href="/services">
                            Browse full service catalog <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </div>
            </div>
        </section>
    );
}
