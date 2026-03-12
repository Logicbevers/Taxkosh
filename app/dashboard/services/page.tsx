import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Receipt, ShieldCheck, Briefcase } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { CheckoutButton } from "@/components/services/CheckoutButton"
import { ServiceCategory } from "@prisma/client"
import { getServicePricingInPaise } from "@/lib/razorpay"

const SERVICES = [
    {
        category: "ITR_FILING",
        title: "Income Tax Return (ITR)",
        description: "File your annual income tax returns accurately and on time.",
        icon: FileText,
    },
    {
        category: "GST_FILING",
        title: "GST Filing",
        description: "Monthly or quarterly GST returns for your business.",
        icon: Receipt,
    },
    {
        category: "TDS_FILING",
        title: "TDS Returns",
        description: "File Tax Deducted at Source (TDS) returns seamlessly.",
        icon: ShieldCheck,
    },
    {
        category: "BUSINESS_COMPLIANCE",
        title: "Business Compliance",
        description: "Annual ROC filings and other statutory compliances.",
        icon: Briefcase,
    },
];

const STATUS_COLORS: Record<string, string> = {
    PENDING_DOCUMENTS: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    DOCUMENTS_SUBMITTED: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    UNDER_REVIEW: "bg-purple-500/10 text-purple-500 border-purple-500/20",
    CLARIFICATION_REQUIRED: "bg-orange-500/10 text-orange-500 border-orange-500/20",
    COMPLETED: "bg-green-500/10 text-green-500 border-green-500/20",
    FILED: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    REJECTED: "bg-red-500/10 text-red-500 border-red-500/20",
};

export default async function ServicesDashboard() {
    const session = await auth()
    if (!session?.user?.id) {
        redirect("/login")
    }

    const requests = await prisma.serviceRequest.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
    })

    return (
        <div className="container p-6 space-y-8 max-w-6xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Service Requests</h1>
                <p className="text-muted-foreground mt-2">
                    Start a new compliance service or track your existing requests.
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {SERVICES.map((s) => (
                    <Card key={s.category} className="flex flex-col">
                        <CardHeader>
                            <s.icon className="h-8 w-8 mb-2 text-primary" />
                            <CardTitle className="text-xl">{s.title}</CardTitle>
                            <CardDescription>{s.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="mt-auto pt-4">
                            <CheckoutButton
                                category={s.category}
                                title={s.title}
                                amount={getServicePricingInPaise(s.category as ServiceCategory)}
                            />
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="mt-12 space-y-4">
                <h2 className="text-2xl font-semibold tracking-tight">My Requests</h2>
                {requests.length === 0 ? (
                    <div className="text-center p-12 border rounded-lg border-dashed">
                        <p className="text-muted-foreground">You have no active service requests.</p>
                    </div>
                ) : (
                    <div className="space-y-4 pt-2">
                        {requests.map((req) => (
                            <Link key={req.id} href={`/dashboard/services/${req.id}`} className="block">
                                <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                                    <div className="p-4 flex items-center justify-between">
                                        <div>
                                            <p className="font-medium text-lg">
                                                {req.category.replace(/_/g, " ")}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                Started on {req.createdAt.toLocaleDateString()}
                                            </p>
                                        </div>
                                        <Badge variant="outline" className={`font-semibold ${STATUS_COLORS[req.status] || ""}`}>
                                            {req.status.replace(/_/g, " ")}
                                        </Badge>
                                    </div>
                                </Card>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
