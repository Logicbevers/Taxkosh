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
    AlertCircle,
    Activity
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function AdminDashboardPage() {
    const session = await auth();

    // Aggregates for the dashboard
    const [stats, totalUsers, recentLogs] = await Promise.all([
        prisma.serviceRequest.groupBy({
            by: ['status'],
            _count: { _all: true }
        }),
        prisma.user.count({
            where: { role: { in: [UserRole.INDIVIDUAL, UserRole.BUSINESS] } }
        }),
        prisma.auditLog.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: { user: { select: { name: true } } }
        })
    ]);

    const totalRequests = stats.reduce((acc: number, curr: any) => acc + (curr._count?._all || 0), 0);
    const pendingRequests = stats.find((s: any) => s.status === 'DOCUMENTS_SUBMITTED' || s.status === 'PAID')?._count?._all || 0;
    const processingRequests = stats.find((s: any) => s.status === 'UNDER_PROCESS')?._count?._all || 0;
    const completedRequests = stats.find((s: any) => s.status === 'COMPLETED' || s.status === 'FILED')?._count?._all || 0;

    const kpis = [
        { 
            name: "Service Requests", 
            value: totalRequests, 
            icon: ClipboardList, 
            color: "text-blue-600", 
            bg: "bg-blue-500/10",
            description: `${pendingRequests} awaiting action`
        },
        { 
            name: "Active Customers", 
            value: totalUsers, 
            icon: CheckCircle2, 
            color: "text-emerald-600", 
            bg: "bg-emerald-500/10",
            description: "Onboarded users"
        },
        { 
            name: "In Treatment", 
            value: processingRequests, 
            icon: Clock, 
            color: "text-purple-600", 
            bg: "bg-purple-500/10",
            description: "Active workflows"
        },
        { 
            name: "Success Rate", 
            value: totalRequests > 0 ? `${Math.round((completedRequests / totalRequests) * 100)}%` : "0%", 
            icon: AlertCircle, 
            color: "text-amber-600", 
            bg: "bg-amber-500/10",
            description: "Completed filings"
        },
    ];

    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto pb-24 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-4xl font-black tracking-tighter bg-gradient-to-r from-slate-900 via-slate-700 to-slate-400 bg-clip-text text-transparent dark:from-white dark:to-slate-400 uppercase leading-none">
                        Operational Intelligence
                    </h1>
                    <p className="text-muted-foreground mt-2 text-sm font-medium tracking-tight">
                        Platform-wide performance <span className="text-primary font-bold">heuristics</span> and systemic event monitoring.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-emerald-500 bg-emerald-500/10 px-6 py-3 rounded-2xl border border-emerald-500/20 shadow-2xl shadow-emerald-500/10 backdrop-blur-sm">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                        Node Active
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {kpis.map((kpi) => (
                    <Card key={kpi.name} className="border-none shadow-2xl shadow-slate-200/50 dark:shadow-none dark:bg-slate-900/50 backdrop-blur-md group hover:-translate-y-1 transition-all duration-500 relative overflow-hidden rounded-3xl border border-white/20 dark:border-slate-800">
                        <div className={`absolute top-0 left-0 w-1.5 h-full opacity-30 ${kpi.bg.replace('/10', '/60')} transition-all group-hover:w-2`} />
                        <CardHeader className="flex flex-row items-center justify-between pb-4 pt-6 px-6">
                            <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 group-hover:text-primary transition-colors duration-300">
                                {kpi.name}
                            </CardTitle>
                            <div className={`p-3 rounded-2xl ${kpi.bg} border border-white/10 shadow-inner group-hover:scale-110 transition-transform duration-500`}>
                                <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
                            </div>
                        </CardHeader>
                        <CardContent className="px-6 pb-6">
                            <div className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white leading-none tabular-nums group-hover:tracking-tight transition-all duration-500">{kpi.value}</div>
                            <div className="flex items-center gap-2 mt-4 bg-slate-50 dark:bg-slate-800/50 w-fit px-3 py-1.5 rounded-full border border-slate-100 dark:border-slate-800">
                                <div className={`h-1.5 w-1.5 rounded-full ${kpi.color.replace('text-', 'bg-')} shadow-[0_0_8px_currentColor]`} />
                                <p className="text-[9px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest leading-none">{kpi.description}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-2 border-none shadow-2xl shadow-slate-200/50 dark:shadow-none dark:bg-slate-900/50 overflow-hidden relative rounded-[2.5rem] border border-white/20 dark:border-slate-800 backdrop-blur-sm">
                    <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex flex-row items-center justify-between py-8 px-10">
                        <div>
                            <CardTitle className="text-xl font-black tracking-tight uppercase">Systemic Activity Pulse</CardTitle>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mt-1">Real-time mutation stream</p>
                        </div>
                        <Badge variant="outline" className="border-primary/20 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.2em] py-2 px-4 shadow-[0_0_15px_rgba(var(--primary),0.1)] rounded-xl">Live Feed</Badge>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                            {recentLogs.map((log) => (
                                <div key={log.id} className="flex items-center justify-between py-6 px-10 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-all duration-500 group">
                                    <div className="flex items-center gap-6">
                                        <div className="relative">
                                            <div className="h-12 w-12 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center text-slate-400 border border-slate-100 dark:border-slate-700 group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all duration-500 shadow-sm">
                                                <Activity className="w-6 h-6" />
                                            </div>
                                            <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-white dark:bg-slate-900 flex items-center justify-center border border-slate-100 dark:border-slate-800 shadow-sm">
                                                <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.8)]" />
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-slate-900 dark:text-white tracking-tight uppercase group-hover:text-primary transition-colors">{log.action.replace(/_/g, " ")}</p>
                                            <div className="flex items-center gap-3 mt-1.5">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{log.user?.name || "System Kernel"}</span>
                                                <div className="h-px w-3 bg-slate-200 dark:bg-slate-800" />
                                                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase opacity-60">
                                                    {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1.5">
                                        <code className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg leading-none text-slate-500 dark:text-slate-400 border border-slate-200/50 dark:border-slate-700/50">{log.ipAddress || "::1"}</code>
                                        <span className="text-[9px] font-black text-slate-300 tracking-widest uppercase">Origin Trace</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <div className="flex flex-col gap-8">
                    <Card className="border-none shadow-2xl shadow-primary/20 bg-slate-900 text-white overflow-hidden relative group rounded-[2.5rem]">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full -mr-32 -mt-32 blur-[100px] group-hover:scale-125 transition-transform duration-700 opacity-50" />
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/10 rounded-full -ml-16 -mb-16 blur-[60px] group-hover:scale-125 transition-transform duration-700 opacity-50" />
                        
                        <CardHeader className="relative z-10 pt-10 px-10 pb-0">
                            <CardTitle className="text-primary text-[10px] font-black uppercase tracking-[0.4em]">Customer Velocity</CardTitle>
                        </CardHeader>
                        <CardContent className="relative z-10 pb-12 pt-6 flex flex-col items-center">
                            <div className="text-8xl font-black tracking-tighter mb-4 bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent">+{totalUsers}</div>
                            <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.3em] mb-10">Net Entity Growth (Tier 1)</p>
                            
                            <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden mb-6 border border-white/10 shadow-inner">
                                <div className="bg-gradient-to-r from-primary to-indigo-500 w-[78%] h-full rounded-full shadow-[0_0_20px_rgba(var(--primary-rgb),0.6)] animate-pulse" />
                            </div>
                            
                            <div className="flex items-center gap-3 bg-white/5 px-6 py-3 rounded-2xl border border-white/10 backdrop-blur-md">
                                <div className="h-2 w-2 rounded-full bg-primary animate-ping" />
                                <p className="text-[10px] font-black uppercase tracking-widest text-white/80">Optimal Sync</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-2xl shadow-slate-200/50 dark:shadow-none dark:bg-slate-900/50 rounded-[2.5rem] border border-white/20 dark:border-slate-800 backdrop-blur-sm overflow-hidden flex-1">
                        <CardHeader className="pb-6 pt-10 px-10 flex flex-row items-center justify-between">
                            <CardTitle className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Quick Access</CardTitle>
                            <Activity className="w-4 h-4 text-primary animate-pulse" />
                        </CardHeader>
                        <CardContent className="px-6 space-y-4">
                            <Button variant="ghost" className="w-full justify-between rounded-[1.5rem] bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-slate-900 active:scale-95 transition-all py-8 h-auto border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 duration-500">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-2xl bg-primary/10 group-hover:bg-white/10 transition-colors">
                                        <ClipboardList className="w-5 h-5 text-primary" />
                                    </div>
                                    <div className="flex flex-col items-start">
                                        <span className="text-sm font-black tracking-tight uppercase">Operational Review</span>
                                        <span className="text-[10px] opacity-40 font-black uppercase tracking-widest mt-0.5">Pending Action Items</span>
                                    </div>
                                </div>
                                <div className="bg-primary text-white h-8 w-8 rounded-xl flex items-center justify-center text-xs font-black tabular-nums shadow-lg shadow-primary/40">
                                    {pendingRequests}
                                </div>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
