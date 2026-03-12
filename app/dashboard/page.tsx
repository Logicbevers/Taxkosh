import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    FileText,
    ArrowRight,
    AlertCircle,
    CheckCircle2,
    Clock,
    PlusCircle,
    LayoutDashboard,
    Briefcase,
    Receipt
} from "lucide-react";
import Link from "next/link";
import { ServiceRequestStatus, ServiceCategory } from "@prisma/client";

const STATUS_CONFIG: Record<ServiceRequestStatus, { label: string, color: string, icon: any }> = {
    PENDING_PAYMENT: { label: "Action: Payment", color: "text-amber-600 bg-amber-50 border-amber-200", icon: Clock },
    PAYMENT_CONFIRMED: { label: "Processing", color: "text-blue-600 bg-blue-50 border-blue-200", icon: CheckCircle2 },
    PENDING_DOCUMENTS: { label: "Action: Upload Docs", color: "text-amber-600 bg-amber-50 border-amber-200", icon: AlertCircle },
    DOCUMENTS_SUBMITTED: { label: "Under Review", color: "text-indigo-600 bg-indigo-50 border-indigo-200", icon: Clock },
    UNDER_REVIEW: { label: "Under Review", color: "text-indigo-600 bg-indigo-50 border-indigo-200", icon: Clock },
    CLARIFICATION_REQUIRED: { label: "Action: Clarify", color: "text-destructive bg-destructive/5 border-destructive/20", icon: AlertCircle },
    COMPLETED: { label: "Completed", color: "text-emerald-600 bg-emerald-50 border-emerald-200", icon: CheckCircle2 },
    FILED: { label: "Success: Filed", color: "text-emerald-600 bg-emerald-50 border-emerald-200", icon: CheckCircle2 },
    REJECTED: { label: "Rejected", color: "text-destructive bg-destructive/5 border-destructive/20", icon: AlertCircle },
};

export default async function DashboardPage() {
    const session = await auth();
    if (!session?.user) redirect("/login");

    const requests = await prisma.serviceRequest.findMany({
        where: { userId: session.user.id },
        orderBy: { updatedAt: "desc" },
        take: 5
    });

    const actionRequired = requests.filter(r =>
        ([ServiceRequestStatus.PENDING_DOCUMENTS, ServiceRequestStatus.CLARIFICATION_REQUIRED, ServiceRequestStatus.PENDING_PAYMENT] as ServiceRequestStatus[]).includes(r.status)
    );

    return (
        <div className="container p-6 space-y-8 max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Welcome back, {session.user.name?.split(" ")[0]}</h1>
                    <p className="text-muted-foreground mt-1">Here's an overview of your tax and compliance profile.</p>
                </div>
                <Button asChild className="gap-2 shadow-sm">
                    <Link href="/dashboard/services">
                        <PlusCircle className="w-4 h-4" /> Start New Service
                    </Link>
                </Button>
            </div>

            {/* High Priority Alerts */}
            {actionRequired.length > 0 && (
                <div className="grid gap-4">
                    {actionRequired.map(req => (
                        <Link key={req.id} href={`/dashboard/services/${req.id}`}>
                            <div className="flex items-center justify-between p-4 rounded-xl border border-amber-200 bg-amber-50/50 dark:bg-amber-900/10 dark:border-amber-900/30 hover:shadow-md transition-all group">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                                        <AlertCircle className="h-5 w-5 text-amber-600" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-amber-900 dark:text-amber-100">
                                            Action Required: {req.category.replace(/_/g, " ")}
                                        </p>
                                        <p className="text-sm text-amber-700/80 dark:text-amber-400">
                                            {req.status === ServiceRequestStatus.CLARIFICATION_REQUIRED
                                                ? "Our expert needs more information to proceed."
                                                : "Please complete your document submission."}
                                        </p>
                                    </div>
                                </div>
                                <ArrowRight className="w-5 h-5 text-amber-400 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            <div className="grid md:grid-cols-3 gap-6">
                {/* Active Services List */}
                <Card className="md:col-span-2 shadow-sm overflow-hidden border-border/60">
                    <CardHeader className="bg-muted/30 pb-4">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">Recent Service Requests</CardTitle>
                            <Button variant="ghost" size="sm" asChild className="text-primary hover:text-primary/80">
                                <Link href="/dashboard/services">View All</Link>
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {requests.length === 0 ? (
                            <div className="p-12 text-center">
                                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                                <p className="text-muted-foreground">No active service requests found.</p>
                                <Button variant="link" asChild><Link href="/dashboard/services">Start your first service</Link></Button>
                            </div>
                        ) : (
                            <div className="divide-y divide-border/40">
                                {requests.map(req => {
                                    const config = STATUS_CONFIG[req.status];
                                    const StatusIcon = config.icon;
                                    return (
                                        <Link key={req.id} href={`/dashboard/services/${req.id}`} className="block hover:bg-muted/20 transition-colors">
                                            <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-lg bg-primary/5 flex items-center justify-center">
                                                        <FileText className="h-5 w-5 text-primary" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">{req.category.replace(/_/g, " ")}</p>
                                                        <p className="text-xs text-muted-foreground">Updated {new Date(req.updatedAt).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                                <Badge variant="outline" className={`px-2.5 py-1 flex items-center gap-1.5 ${config.color} border-none font-medium`}>
                                                    <StatusIcon className="w-3.5 h-3.5" />
                                                    {config.label}
                                                </Badge>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Role Specific Shortcuts */}
                <div className="space-y-6">
                    <Card className="shadow-sm border-border/60">
                        <CardHeader>
                            <CardTitle className="text-base">Tax Tools</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-3 p-4 pt-0">
                            {[
                                { icon: LayoutDashboard, label: "ITR Builder", sub: "Plan & File individual taxes", color: "text-blue-500", bg: "bg-blue-50", href: "/dashboard/individual" },
                                { icon: Briefcase, label: "Business Hub", sub: "GSTIN details & Invoices", color: "text-violet-500", bg: "bg-violet-50", href: "/dashboard/business" },
                                { icon: Receipt, label: "Tax Planner", sub: "Maximize deductions", color: "text-emerald-500", bg: "bg-emerald-50", href: "#" },
                            ].map((tool) => (
                                <Link key={tool.label} href={tool.href} className="flex items-center gap-3 p-3 rounded-xl border border-transparent hover:border-border hover:bg-muted/30 transition-all group">
                                    <div className={`h-10 w-10 rounded-lg ${tool.bg} flex items-center justify-center shrink-0`}>
                                        <tool.icon className={`h-5 w-5 ${tool.color}`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold truncate">{tool.label}</p>
                                        <p className="text-[11px] text-muted-foreground truncate">{tool.sub}</p>
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                                </Link>
                            ))}
                        </CardContent>
                    </Card>

                    <Card className="bg-primary/5 border-primary/10 shadow-none">
                        <CardContent className="p-6">
                            <h3 className="font-bold text-sm mb-2">Need Expert Help?</h3>
                            <p className="text-xs text-muted-foreground mb-4 leading-relaxed">Our tax professionals are available for 1-on-1 consultations to optimize your liability.</p>
                            <Button size="sm" variant="outline" className="w-full bg-background font-semibold">Book a Session</Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
