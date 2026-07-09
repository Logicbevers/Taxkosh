import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Briefcase, ArrowRight, Clock } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getPublicSubCategory } from "@/lib/catalog";

export async function generateMetadata({
    params,
}: {
    params: Promise<{ category: string; sub: string }>;
}) {
    const p = await params;
    const data = await getPublicSubCategory(p.category, p.sub);
    if (!data) return { title: "Not found — TaxKosh" };
    return {
        title: `${data.sub.name} — ${data.category.name} — TaxKosh`,
        description: data.sub.description ?? `Browse ${data.sub.name} services offered by TaxKosh.`,
    };
}

export default async function SubCategoryPage({
    params,
}: {
    params: Promise<{ category: string; sub: string }>;
}) {
    const p = await params;
    const data = await getPublicSubCategory(p.category, p.sub);
    if (!data) notFound();
    const { category, sub } = data;

    return (
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            {/* Breadcrumb */}
            <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted-foreground mb-6">
                <Link href="/services" className="hover:text-foreground transition-colors">Services</Link>
                <ChevronRight className="w-3 h-3" />
                <Link href={`/services/${category.slug}`} className="hover:text-foreground transition-colors">
                    {category.name}
                </Link>
                <ChevronRight className="w-3 h-3" />
                <span className="text-foreground font-medium">{sub.name}</span>
            </nav>

            <header className="mb-10">
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{sub.name}</h1>
                {sub.description && (
                    <p className="text-muted-foreground mt-2 max-w-2xl">{sub.description}</p>
                )}
            </header>

            {sub.services.length === 0 ? (
                <div className="py-16 text-center text-muted-foreground border-2 border-dashed rounded-2xl">
                    No services under this sub-category yet.
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {sub.services.map((s) => (
                        <Link
                            key={s.id}
                            href={`/services/${category.slug}/${p.sub}/${s.slug}`}
                            className="focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-2xl"
                        >
                            <Card className="group h-full border border-border/60 hover:border-primary/40 hover:-translate-y-1 hover:shadow-lg transition-all cursor-pointer">
                                <CardHeader>
                                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                                        <Briefcase className="w-5 h-5 text-primary" />
                                    </div>
                                    <h2 className="text-lg font-semibold leading-tight">{s.name}</h2>
                                </CardHeader>
                                <CardContent className="flex flex-col gap-3">
                                    <p className="text-sm text-muted-foreground line-clamp-3">
                                        {s.description ?? "Full description and pricing plans available on the detail page."}
                                    </p>
                                    <div className="flex items-center justify-between pt-2 text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1.5">
                                            <Clock className="w-3.5 h-3.5" />
                                            {s.slaHours}h delivery
                                        </span>
                                        <span className="text-primary font-medium flex items-center gap-1 group-hover:gap-1.5 transition-all">
                                            View plans <ArrowRight className="w-3.5 h-3.5" />
                                        </span>
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
