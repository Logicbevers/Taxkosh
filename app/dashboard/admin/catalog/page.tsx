import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CatalogTreeClient } from "./CatalogTreeClient";

export const metadata = { title: "Catalog — TaxKosh Admin" };

export default async function CatalogPage() {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") redirect("/login");

    const nodes = await prisma.catalogNode.findMany({
        orderBy: [{ depth: "asc" }, { displayOrder: "asc" }, { name: "asc" }],
    });

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Service Catalog</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Build an unlimited-depth hierarchy. Mark any node as a service leaf to set its price and required documents.
                </p>
            </div>
            <CatalogTreeClient initialNodes={nodes} />
        </div>
    );
}
