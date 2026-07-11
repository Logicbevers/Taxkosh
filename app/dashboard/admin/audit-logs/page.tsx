import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Shield, Clock, User, Globe, Info } from "lucide-react";

export default async function AuditLogsPage() {
    const session = await auth();
    if (session?.user?.role !== UserRole.ADMIN) {
        redirect("/unauthorized");
    }

    const logs = await prisma.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true, email: true } } },
        take: 100
    });

    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto pb-24 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="font-serif text-[32px] text-foreground">
                        Security Event Trail
                    </h1>
                    <p className="text-muted-foreground mt-2 text-sm font-medium tracking-tight">
                        Immutable recording of <span className="text-primary font-bold">administrative activities</span> and system state mutations.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl flex flex-col items-end shadow-sm">
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground mb-1">Persistence Depth</span>
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-2xl font-black tabular-nums tracking-tighter text-slate-900 dark:text-white">{logs.length} <span className="text-xs font-medium text-slate-400 uppercase tracking-widest ml-1">Nodes</span></span>
                        </div>
                    </div>
                </div>
            </div>

            <Card className="border-none shadow-2xl shadow-slate-200/50 dark:shadow-none dark:bg-slate-900/50 overflow-hidden rounded-3xl backdrop-blur-sm border border-white/20 dark:border-slate-800">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="py-6 pl-8">
                                        <div className="flex items-center gap-2.5 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                                            <Clock className="w-3 h-3" /> Temporal Marker
                                        </div>
                                    </TableHead>
                                    <TableHead>
                                        <div className="flex items-center gap-2.5 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                                            <User className="w-3 h-3" /> Actor
                                        </div>
                                    </TableHead>
                                    <TableHead>
                                        <div className="flex items-center gap-2.5 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                                            <Shield className="w-3 h-3" /> Event Vector
                                        </div>
                                    </TableHead>
                                    <TableHead>
                                        <div className="flex items-center gap-2.5 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                                            <Globe className="w-3 h-3" /> IP Origin
                                        </div>
                                    </TableHead>
                                    <TableHead className="pr-8">
                                        <div className="flex items-center gap-2.5 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                                            <Info className="w-3 h-3" /> Contextual Payload
                                        </div>
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {logs.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-32">
                                            <div className="max-w-xs mx-auto space-y-4 opacity-50">
                                                <div className="h-16 w-16 bg-slate-100 dark:bg-slate-800 rounded-3xl flex items-center justify-center mx-auto text-slate-400">
                                                    <Shield className="w-8 h-8" />
                                                </div>
                                                <p className="text-[11px] font-black uppercase tracking-widest text-slate-500 italic">No security events recorded in the current epoch.</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    logs.map((log) => (
                                        <TableRow key={log.id} className="group hover:bg-muted/10 transition-colors border-slate-50 dark:border-slate-900">
                                            <TableCell className="py-5 pl-8">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-black text-slate-900 dark:text-slate-100 tracking-tight">
                                                        {new Date(log.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </span>
                                                    <span className="text-[10px] font-mono font-bold text-slate-400 mt-0.5 uppercase">
                                                        {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 font-black text-[10px] border border-white dark:border-slate-700 shadow-sm">
                                                        {(log.user?.name || "S")?.[0]?.toUpperCase()}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-xs tracking-tight text-slate-900 dark:text-slate-100">{log.user?.name || "System Core"}</span>
                                                        <span className="text-[10px] text-slate-400 font-medium lowercase">{log.user?.email || "internal@taxkosh.com"}</span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="text-[9px] font-black tracking-widest uppercase border-primary/20 bg-primary/5 text-primary px-3 py-1 rounded-lg">
                                                    {log.action}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Globe className="w-3 h-3 text-slate-300" />
                                                    <code className="text-[10px] font-mono font-black text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200/50 dark:border-slate-700">
                                                        {log.ipAddress || "::1"}
                                                    </code>
                                                </div>
                                            </TableCell>
                                            <TableCell className="pr-8 max-w-sm">
                                                <div className="bg-slate-900 dark:bg-black p-3 rounded-2xl border border-slate-800 shadow-inner group-hover:border-primary/30 transition-all">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">JSON Metadata</span>
                                                        <div className="h-1.5 w-1.5 rounded-full bg-primary/50" />
                                                    </div>
                                                    <pre className="text-[9px] font-mono whitespace-pre-wrap break-all text-emerald-500/80 overflow-y-auto max-h-24 scrollbar-thin scrollbar-thumb-slate-800 pb-1">
                                                        {JSON.stringify(log.details, null, 2)}
                                                    </pre>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
