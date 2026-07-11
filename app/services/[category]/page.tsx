import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ChevronRight, Folder, Briefcase, Clock } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getPublicCategoryBySlug, nameToSlug } from "@/lib/catalog";

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }) {
    const { category: catSlug } = await params;
    const category = await getPublicCategoryBySlug(catSlug);
    if (!category) return { title: "Category not found — TaxKosh" };
    return {
        title: `${category.name} services — TaxKosh`,
        description: category.description ?? `Browse every ${category.name} service TaxKosh offers.`,
    };
}

export default async function CategoryPage({
    params,
}: {
    params: Promise<{ category: string }>;
}) {
    const { category: catSlug } = await params;
    const category = await getPublicCategoryBySlug(catSlug);
    if (!category) notFound();

    return (
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            {/* Breadcrumb */}
            <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted-foreground mb-6">
                <Link href="/services" className="hover:text-foreground transition-colors">
                    Services
                </Link>
                <ChevronRight className="w-3 h-3" />
                <span className="text-foreground font-medium">{category.name}</span>
            </nav>

            <header className="mb-10">
                <div className="flex items-center gap-4 mb-4">
                    <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                        <Folder className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="font-serif text-4xl sm:text-5xl">{category.name}</h1>
                        {category.description && (
                            <p className="text-muted-foreground mt-1">{category.description}</p>
                        )}
                    </div>
                </div>
            </header>

            {category.subCategories.length === 0 ? (
                <div className="py-16 text-center text-muted-foreground border-2 border-dashed rounded-2xl">
                    No services under this category yet.
                </div>
            ) : (
                <div className="space-y-10">
                    {category.subCategories.map((sub) => {
                        const subSlug = nameToSlug(sub.name);
                        return (
                            <section key={sub.id}>
                                <div className="flex items-baseline justify-between mb-4">
                                    <div>
                                        <h2 className="text-xl font-semibold">{sub.name}</h2>
                                        {sub.description && (
                                            <p className="text-sm text-muted-foreground mt-0.5">{sub.description}</p>
                                        )}
                                    </div>
                                    <Link
                                        href={`/services/${category.slug}/${subSlug}`}
                                        className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
                                    >
                                        See all <ArrowRight className="w-3 h-3" />
                                    </Link>
                                </div>

                                {sub.services.length === 0 ? (
                                    <p className="text-sm text-muted-foreground italic">Coming soon.</p>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {sub.services.map((s) => (
                                            <Link
                                                key={s.id}
                                                href={`/services/${category.slug}/${subSlug}/${s.slug}`}
                                                aria-label={`View ${s.name}`}
                                                className="focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl"
                                            >
                                                <Card className="group h-full border border-border/60 hover:border-primary/40 hover:shadow-md transition-all cursor-pointer">
                                                    <CardHeader className="pb-2">
                                                        <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center mb-2">
                                                            <Briefcase className="w-4 h-4 text-primary" />
                                                        </div>
                                                        <h3 className="font-semibold text-sm leading-tight">{s.name}</h3>
                                                    </CardHeader>
                                                    <CardContent className="pt-0 flex flex-col gap-3">
                                                        <p className="text-xs text-muted-foreground line-clamp-2">
                                                            {s.description ?? "View full details and pricing"}
                                                        </p>
                                                        <div className="flex items-center justify-between text-[10px] text-muted-foreground uppercase tracking-wider">
                                                            <span className="flex items-center gap-1">
                                                                <Clock className="w-3 h-3" />
                                                                {s.slaHours}h SLA
                                                            </span>
                                                            <ArrowRight className="w-3 h-3 text-primary opacity-0 group-hover:opacity-100 transition-all" />
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </section>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
