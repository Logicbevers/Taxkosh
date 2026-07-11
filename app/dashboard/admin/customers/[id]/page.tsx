import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { notFound, redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    ArrowLeft, User, Mail, Phone, ShieldCheck, Calendar,
    ClipboardList, FileText, CreditCard
} from "lucide-react";
import Link from "next/link";
import { maskPAN } from "@/lib/security";

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (session?.user?.role !== UserRole.ADMIN) redirect("/dashboard");

    const { id } = await params;

    const customer = await prisma.user.findUnique({
        where: { id },
        include: {
            serviceRequests: {
                include: { service: true, plan: true },
                orderBy: { createdAt: "desc" },
                take: 20,
            },
            documents: { orderBy: { uploadedAt: "desc" }, take: 10 },
            platformInvoices: { orderBy: { createdAt: "desc" }, take: 10 },
        },
    });

    if (!customer) notFound();

    const totalSpend = customer.platformInvoices.reduce((sum, inv) => sum + inv.total, 0);
    const completedRequests = customer.serviceRequests.filter(r =>
        r.status === "COMPLETED" || r.status === "FILED"
    ).length;

    const statusColor: Record<string, string> = {
        FILED: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
        COMPLETED: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
        REJECTED: "bg-rose-500/10 text-rose-600 border-rose-500/20",
        UNDER_PROCESS: "bg-status-pending/15 text-status-pending border-transparent",
        PAID: "bg-teal-500/10 text-teal-600 border-teal-500/20",
        PAYMENT_PENDING: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    };

    return (
        <div className="p-8 space-y-8 max-w-5xl mx-auto pb-24 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild className="rounded-full hover:bg-primary/10 hover:text-primary">
                    <Link href="/dashboard/admin/customers"><ArrowLeft className="w-4 h-4" /></Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white uppercase">
                        {customer.name ?? "Anonymous Taxpayer"}
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1 flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5" /> {customer.email}
                    </p>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: "Total Requests", value: customer.serviceRequests.length, icon: ClipboardList, color: "text-blue-600", bg: "bg-blue-500/10" },
                    { label: "Completed", value: completedRequests, icon: ShieldCheck, color: "text-emerald-600", bg: "bg-emerald-500/10" },
                    { label: "Documents", value: customer.documents.length, icon: FileText, color: "text-purple-600", bg: "bg-purple-500/10" },
                    { label: "Total Spend", value: `₹${(totalSpend / 100).toLocaleString()}`, icon: CreditCard, color: "text-amber-600", bg: "bg-amber-500/10" },
                ].map(kpi => (
                    <Card key={kpi.label} className="border-none shadow-xl dark:bg-slate-900/50 rounded-3xl">
                        <CardContent className="p-6">
                            <div className={`w-10 h-10 rounded-2xl ${kpi.bg} flex items-center justify-center mb-3`}>
                                <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
                            </div>
                            <div className="text-2xl font-black text-slate-900 dark:text-white">{kpi.value}</div>
                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">{kpi.label}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Profile Info */}
                <Card className="border-none shadow-xl dark:bg-slate-900/50 rounded-3xl lg:col-span-1">
                    <CardHeader className="border-b border-slate-100 dark:border-slate-800 py-5 px-6">
                        <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 flex items-center gap-2">
                            <User className="w-4 h-4" /> Profile
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-3">
                        {[
                            { label: "Role", value: customer.role },
                            { label: "PAN", value: maskPAN(customer.pan) },
                            { label: "Phone", value: customer.phone ?? "—" },
                            { label: "GSTIN", value: customer.gstin ?? "—" },
                            { label: "Email Status", value: customer.emailVerified ? "Verified" : "Pending" },
                            { label: "Joined", value: new Date(customer.createdAt).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" }) },
                        ].map(row => (
                            <div key={row.label} className="flex justify-between items-center py-2 border-b border-slate-50 dark:border-slate-800 last:border-0">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{row.label}</span>
                                <span className="font-bold text-xs text-slate-900 dark:text-white">{row.value}</span>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* Service Requests */}
                <Card className="border-none shadow-xl dark:bg-slate-900/50 rounded-3xl lg:col-span-2">
                    <CardHeader className="border-b border-slate-100 dark:border-slate-800 py-5 px-6 flex flex-row items-center justify-between">
                        <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 flex items-center gap-2">
                            <ClipboardList className="w-4 h-4" /> Service Requests
                        </CardTitle>
                        <span className="text-[10px] font-black text-slate-400">Last 20</span>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-slate-50 dark:divide-slate-800">
                            {customer.serviceRequests.length === 0 ? (
                                <div className="py-16 text-center text-slate-400">
                                    <ClipboardList className="w-8 h-8 mx-auto mb-3 opacity-30" />
                                    <p className="text-xs font-black uppercase tracking-widest opacity-50">No requests yet</p>
                                </div>
                            ) : customer.serviceRequests.map(req => (
                                <div key={req.id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-[9px] text-primary bg-primary/5 px-2 py-0.5 rounded border border-primary/10">
                                                {req.id.split("-")[0].toUpperCase()}
                                            </span>
                                            <span className="font-bold text-xs text-slate-900 dark:text-white">
                                                {req.service?.name ?? "Managed Service"}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                            <Calendar className="w-3 h-3" />
                                            {new Date(req.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                                            <span>·</span>
                                            <span className="font-black">₹{(req.amount / 100).toLocaleString()}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Badge variant="outline" className={`text-[9px] font-black tracking-wide uppercase px-2 h-5 border rounded-lg ${statusColor[req.status] ?? "bg-slate-100 text-slate-500"}`}>
                                            {req.status.replace(/_/g, " ")}
                                        </Badge>
                                        <Button variant="ghost" size="icon" asChild className="h-8 w-8 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Link href={`/dashboard/admin/service-requests/${req.id}`}>
                                                <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
                                            </Link>
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
