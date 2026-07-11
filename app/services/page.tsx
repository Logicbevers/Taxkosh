import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ArrowRight, Folder } from "lucide-react";
import { getPublicCategories } from "@/lib/catalog";

export const metadata = {
    title: "All Tax & Compliance Services — TaxKosh",
    description: "Browse the full TaxKosh catalog: Income Tax filing, GST returns, TDS, ROC compliance and more.",
};

export default async function ServicesIndexPage() {
    const categories = await getPublicCategories();

    return (
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <header className="text-center mb-12">
                <p className="text-xs font-bold text-primary tracking-wider uppercase mb-3">
                    Complete compliance catalog
                </p>
                <h1 className="font-serif text-4xl sm:text-5xl mb-4">
                    What do you need filed?
                </h1>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                    Browse categories, drill into the exact service you need, and pick a plan.
                    You only need to sign in when you&apos;re ready to file.
                </p>
            </header>

            {categories.length === 0 ? (
                <div className="py-16 text-center text-muted-foreground border-2 border-dashed rounded-2xl">
                    No services available at the moment.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {categories.map((c) => (
                        <Link
                            key={c.id}
                            href={`/services/${c.slug}`}
                            aria-label={`Browse ${c.name} services`}
                            className="focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-2xl"
                        >
                            <Card className="group h-full border border-border/60 hover:border-primary/40 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5 transition-all cursor-pointer">
                                <CardHeader>
                                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                                        <Folder className="w-5 h-5 text-primary" />
                                    </div>
                                    <h2 className="text-xl font-semibold">{c.name}</h2>
                                </CardHeader>
                                <CardContent className="flex flex-col gap-3">
                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                        {c.description ?? `Explore ${c.name} filing and compliance services.`}
                                    </p>
                                    <div className="flex items-center justify-between pt-2">
                                        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                                            {c._count.subCategories} {c._count.subCategories === 1 ? "type" : "types"}
                                        </span>
                                        <ArrowRight className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
