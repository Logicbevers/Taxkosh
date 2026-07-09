import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getPublicService } from "@/lib/catalog";
import { auth } from "@/lib/auth";
import { ServicePurchaseFlow } from "@/components/services/ServicePurchaseFlow";

export async function generateMetadata({
    params,
}: {
    params: Promise<{ category: string; sub: string; service: string }>;
}) {
    const p = await params;
    const service = await getPublicService(p.category, p.sub, p.service);
    if (!service) return { title: "Service not found — TaxKosh" };
    return {
        title: `${service.name} — TaxKosh`,
        description: service.description ?? `${service.name} — file with TaxKosh in ${service.slaHours} hours.`,
    };
}

export default async function ServiceDetailPage({
    params,
    searchParams,
}: {
    params: Promise<{ category: string; sub: string; service: string }>;
    searchParams: Promise<{ checkout?: string }>;
}) {
    const p = await params;
    const search = await searchParams;
    const service = await getPublicService(p.category, p.sub, p.service);
    if (!service) notFound();

    const session = await auth();
    const isSignedIn = !!session?.user?.id;
    const parentCategory = service.subCategory.category;
    const parentSub = service.subCategory;

    const autoCheckout = isSignedIn && search.checkout === "1";

    return (
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            {/* Breadcrumb */}
            <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted-foreground mb-6 flex-wrap">
                <Link href="/services" className="hover:text-foreground transition-colors">Services</Link>
                <ChevronRight className="w-3 h-3" />
                <Link href={`/services/${parentCategory.slug}`} className="hover:text-foreground transition-colors">
                    {parentCategory.name}
                </Link>
                <ChevronRight className="w-3 h-3" />
                <Link href={`/services/${parentCategory.slug}/${p.sub}`} className="hover:text-foreground transition-colors">
                    {parentSub.name}
                </Link>
                <ChevronRight className="w-3 h-3" />
                <span className="text-foreground font-medium">{service.name}</span>
            </nav>

            {/* Hero */}
            <header className="mb-10">
                <Badge variant="secondary" className="mb-3">
                    <Clock className="w-3 h-3 mr-1" />
                    {service.slaHours}h SLA
                </Badge>
                <h1 className="text-3xl sm:text-5xl font-bold tracking-tight mb-3">{service.name}</h1>
                {service.description && (
                    <p className="text-base sm:text-lg text-muted-foreground max-w-3xl">
                        {service.description}
                    </p>
                )}
            </header>

            <div className="max-w-xl">
                <ServicePurchaseFlow
                    serviceId={service.id}
                    serviceName={service.name}
                    price={service.price}
                    requiredDocuments={service.requiredDocuments}
                    isSignedIn={isSignedIn}
                    returnPath={`/services/${parentCategory.slug}/${p.sub}/${p.service}`}
                    autoCheckout={autoCheckout}
                />
            </div>
        </div>
    );
}
