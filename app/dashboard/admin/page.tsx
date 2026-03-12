import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import {
    ClipboardList,
    CheckCircle2,
    Clock,
    AlertCircle
} from "lucide-react";

export default async function AdminDashboardPage() {
    const session = await auth();

    // Aggregates for the dashboard
    const stats = await prisma.serviceRequest.groupBy({
        by: ['status'],
        _count: { _all: true }
    });

    const totalRequests = stats.reduce((acc: number, curr: any) => acc + (curr._count?._all || 0), 0);
    const pendingRequests = stats.find((s: any) => s.status === 'DOCUMENTS_SUBMITTED')?._count?._all || 0;
    const reviewRequests = stats.find((s: any) => s.status === 'UNDER_REVIEW')?._count?._all || 0;
    const completedRequests = stats.find((s: any) => s.status === 'COMPLETED' || s.status === 'FILED')?._count?._all || 0;

    const kpis = [
        { name: "Total Requests", value: totalRequests, icon: ClipboardList, color: "text-blue-600" },
        { name: "Pending Review", value: pendingRequests, icon: Clock, color: "text-orange-600" },
        { name: "Under Review", value: reviewRequests, icon: AlertCircle, color: "text-purple-600" },
        { name: "Completed", value: completedRequests, icon: CheckCircle2, color: "text-emerald-600" },
    ];

    return (
        <div className="p-8 space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Operations Overview</h1>
                <p className="text-muted-foreground mt-1">Platform-wide service performance and request volume.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {kpis.map((kpi) => (
                    <Card key={kpi.name} className="border-none shadow-sm dark:bg-slate-900">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                {kpi.name}
                            </CardTitle>
                            <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{kpi.value}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="dark:bg-slate-900 border-none shadow-sm">
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm text-muted-foreground py-8 text-center border-2 border-dashed rounded-lg">
                            Live activity feed implementation coming soon.
                        </div>
                    </CardContent>
                </Card>

                <Card className="dark:bg-slate-900 border-none shadow-sm">
                    <CardHeader>
                        <CardTitle>Team Performance</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm text-muted-foreground py-8 text-center border-2 border-dashed rounded-lg">
                            Executive SLA performance charts coming soon.
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
