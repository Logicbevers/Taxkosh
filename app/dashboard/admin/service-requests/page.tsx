"use client"

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Search, Filter, ChevronRight, Briefcase, Calendar,
    AlertCircle, Download, UploadCloud
} from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { StatusBadge, SLAIndicator, Pagination, TableSkeleton } from "@/components/admin";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";

interface ServiceRequest {
    id: string;
    status: string;
    amount: number;
    createdAt: string;
    slaStatus: "HEALTHY" | "WARNING" | "CRITICAL";
    hoursElapsed: number;
    razorpayPaymentId: string | null;
    user: { name: string; email: string };
    service: { name: string } | null;
    plan: { planName: string } | null;
}

const STATUS_OPTIONS = [
    "ALL", "CREATED", "PAYMENT_PENDING", "PAID", "DOCUMENTS_PENDING",
    "DOCUMENTS_SUBMITTED", "UNDER_PROCESS", "CLARIFICATION_REQUIRED",
    "READY_FOR_FILING", "FILED", "COMPLETED", "REJECTED"
];

const PAGE_SIZE = 20;

export default function ServiceRequestsAdminPage() {
    const [requests, setRequests] = useState<ServiceRequest[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState("");
    const debouncedSearch = useDebouncedValue(search, 300);
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [isExporting, setIsExporting] = useState(false);

    const fetchRequests = useCallback(async () => {
        setIsLoading(true);
        const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
        if (statusFilter !== "ALL") params.set("status", statusFilter);

        try {
            const res = await fetch(`/api/admin/service-requests?${params}`);
            const data = await res.json();
            setRequests(data.requests ?? []);
            setTotal(data.total ?? 0);
        } catch {
            setRequests([]);
        } finally {
            setIsLoading(false);
        }
    }, [page, statusFilter]);

    useEffect(() => { fetchRequests(); }, [fetchRequests]);
    useEffect(() => { setPage(1); }, [statusFilter]);

    const q = debouncedSearch.toLowerCase();
    const filteredRequests = requests.filter(req =>
        !q ||
        req.id.toLowerCase().includes(q) ||
        req.user.name.toLowerCase().includes(q) ||
        req.user.email.toLowerCase().includes(q) ||
        (req.service?.name ?? "").toLowerCase().includes(q)
    );

    const handleExportCSV = async () => {
        setIsExporting(true);
        try {
            // Fetch all pages for export
            const params = new URLSearchParams({ page: "1", limit: "1000" });
            if (statusFilter !== "ALL") params.set("status", statusFilter);
            const res = await fetch(`/api/admin/service-requests?${params}`);
            const data = await res.json();
            const all: ServiceRequest[] = data.requests ?? [];

            const rows = [
                ["Request ID", "Taxpayer Name", "Email", "Service", "Plan", "Status", "Amount (₹)", "Payment", "SLA Status", "Hours Elapsed", "Created At"],
                ...all.map(r => [
                    r.id,
                    r.user.name,
                    r.user.email,
                    r.service?.name ?? "—",
                    r.plan?.planName ?? "—",
                    r.status,
                    (r.amount / 100).toFixed(2),
                    r.razorpayPaymentId ? "Paid" : "Pending",
                    r.slaStatus,
                    String(r.hoursElapsed),
                    new Date(r.createdAt).toISOString(),
                ])
            ];

            const csv = rows.map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
            const blob = new Blob([csv], { type: "text/csv" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `taxkosh-requests-${new Date().toISOString().split("T")[0]}.csv`;
            a.click();
            URL.revokeObjectURL(url);
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto pb-24 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-4xl font-black tracking-tighter bg-gradient-to-r from-slate-900 via-slate-700 to-slate-400 bg-clip-text text-transparent dark:from-white dark:to-slate-400 uppercase">
                        Service Requests
                    </h1>
                    <p className="text-muted-foreground mt-2 text-sm font-medium">
                        Tracking <span className="text-primary font-bold">{total}</span> taxpayer requests across all statuses.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        className="h-12 rounded-2xl gap-2 font-black text-[10px] uppercase tracking-widest px-6"
                        onClick={handleExportCSV}
                        disabled={isExporting}
                    >
                        <Download className="w-4 h-4" />
                        {isExporting ? "Exporting..." : "Export CSV"}
                    </Button>
                    <Link href="/dashboard/admin/import">
                        <Button className="h-12 rounded-2xl gap-2 font-black text-[10px] uppercase tracking-widest px-6">
                            <UploadCloud className="w-4 h-4" /> Import
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 items-center bg-white/50 dark:bg-slate-900/50 p-6 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 dark:shadow-none border border-white dark:border-slate-800 backdrop-blur-xl">
                <div className="relative flex-1 min-w-[300px] group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors duration-300" />
                    <Input
                        placeholder="Search by ID, name, email or service..."
                        className="pl-12 bg-white dark:bg-slate-900 border-none shadow-inner focus-visible:ring-2 focus-visible:ring-primary/20 h-14 font-medium text-sm rounded-2xl"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="h-10 w-px bg-slate-200 dark:bg-slate-800 hidden md:block mx-2" />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[240px] bg-white dark:bg-slate-900 border-none h-14 shadow-inner rounded-2xl focus:ring-2 focus:ring-primary/20 font-black text-[10px] uppercase tracking-widest">
                        <div className="flex items-center gap-3">
                            <Filter className="w-4 h-4 text-primary" />
                            <SelectValue placeholder="All Statuses" />
                        </div>
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-none shadow-2xl p-2">
                        {STATUS_OPTIONS.map(s => (
                            <SelectItem key={s} value={s} className="rounded-xl font-bold py-3">
                                {s === "ALL" ? "All Statuses" : s.replace(/_/g, " ")}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Table */}
            <Card className="border-none shadow-2xl shadow-slate-200/50 dark:shadow-none dark:bg-slate-900/50 overflow-hidden rounded-[2.5rem] border border-white dark:border-slate-800 backdrop-blur-sm">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="py-6 pl-10 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Taxpayer</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Service</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Status</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Amount</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">SLA</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Registered</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-[0.3em] text-right pr-10 text-slate-400">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="p-0">
                                            <TableSkeleton rows={6} columns={6} />
                                        </TableCell>
                                    </TableRow>
                                ) : filteredRequests.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-32">
                                            <div className="max-w-xs mx-auto space-y-6 opacity-30">
                                                <div className="h-20 w-20 bg-slate-100 dark:bg-slate-800 rounded-[2rem] flex items-center justify-center mx-auto">
                                                    <Search className="h-10 w-10 text-slate-400" />
                                                </div>
                                                <p className="font-black text-xs uppercase tracking-widest text-slate-500">No requests found.</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredRequests.map((req) => (
                                        <TableRow key={req.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all duration-300 border-slate-50 dark:border-slate-900">
                                            <TableCell className="py-6 pl-10">
                                                <div className="flex flex-col">
                                                    <span className="font-mono text-[9px] font-black text-primary bg-primary/5 px-2 py-0.5 rounded w-fit mb-1 border border-primary/10 tracking-widest">
                                                        {req.id.split("-")[0].toUpperCase()}
                                                    </span>
                                                    <span className="font-black text-sm tracking-tight text-slate-900 dark:text-white">{req.user.name}</span>
                                                    <span className="text-[10px] text-slate-400 font-medium mt-0.5">{req.user.email}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2">
                                                        <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                                                        <span className="font-bold text-xs text-slate-700 dark:text-slate-300">{req.service?.name ?? "Unlinked"}</span>
                                                    </div>
                                                    <span className="text-[9px] w-fit font-black tracking-widest uppercase px-2 h-5 inline-flex items-center border border-slate-100 dark:border-slate-800 text-slate-400 rounded-lg">
                                                        {req.plan?.planName ?? "Bespoke"}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <StatusBadge status={req.status} />
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-black tabular-nums">₹{(req.amount / 100).toLocaleString()}</span>
                                                    <span className={`text-[9px] font-black uppercase mt-0.5 ${req.razorpayPaymentId ? "text-emerald-600" : "text-amber-500"}`}>
                                                        {req.razorpayPaymentId ? "● Paid" : "○ Pending"}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <SLAIndicator hoursElapsed={req.hoursElapsed} status={req.slaStatus} />
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
                                                    <Calendar className="w-3.5 h-3.5 opacity-40" />
                                                    {new Date(req.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right pr-10">
                                                <Button variant="ghost" size="icon" asChild className="h-10 w-10 rounded-2xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-slate-900 transition-all duration-300 shadow-sm">
                                                    <Link href={`/dashboard/admin/service-requests/${req.id}`}>
                                                        <ChevronRight className="w-4 h-4" />
                                                    </Link>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    <Pagination page={page} total={total} limit={PAGE_SIZE} onPageChange={setPage} itemLabel="requests" />
                </CardContent>
            </Card>

            {/* SLA Legend */}
            <div className="flex items-center gap-6 px-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-slate-400" /> Healthy</div>
                <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-amber-500" /> Warning (&gt;75% SLA)</div>
                <div className="flex items-center gap-2 text-rose-500"><span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" /> SLA Breach</div>
                <div className="flex items-center gap-2 ml-auto"><AlertCircle className="w-3 h-3" /> SLA clock starts at PAID status</div>
            </div>
        </div>
    );
}
