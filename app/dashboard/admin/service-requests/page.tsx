"use client"

import { useEffect, useState, useCallback } from "react";
import { Search, Download, UploadCloud, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { StatusBadge, SLAIndicator, Pagination, TableSkeleton } from "@/components/admin";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import { cn } from "@/lib/utils";

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
        <div className="mx-auto max-w-7xl px-8 py-11 pb-24">
            {/* Header */}
            <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="font-serif text-[32px] text-foreground">Service requests</h1>
                    <p className="mt-1 text-[13px] text-muted-foreground">
                        Tracking <span className="font-bold text-primary">{total}</span> taxpayer requests across all statuses.
                    </p>
                </div>
                <div className="flex items-center gap-2.5">
                    <button
                        onClick={handleExportCSV}
                        disabled={isExporting}
                        className="inline-flex h-10 items-center gap-2 rounded-[9px] border border-border bg-card px-4 text-[13px] font-bold text-foreground transition-colors hover:bg-muted disabled:opacity-60"
                    >
                        <Download className="h-4 w-4" />
                        {isExporting ? "Exporting…" : "Export CSV"}
                    </button>
                    <Link
                        href="/dashboard/admin/import"
                        className="inline-flex h-10 items-center gap-2 rounded-[9px] bg-primary px-4 text-[13px] font-bold text-primary-foreground transition-transform hover:-translate-y-0.5"
                    >
                        <UploadCloud className="h-4 w-4" /> Import
                    </Link>
                </div>
            </div>

            {/* Filter bar */}
            <div className="mb-5 flex flex-wrap gap-2.5">
                <div className="relative min-w-[220px] flex-1">
                    <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search by name, email or service…"
                        className="h-10 rounded-[9px] pl-10"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="h-10 w-[200px] rounded-[9px] font-semibold">
                        <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                        {STATUS_OPTIONS.map((s) => (
                            <SelectItem key={s} value={s}>
                                {s === "ALL" ? "All statuses" : s.charAt(0) + s.slice(1).toLowerCase().replace(/_/g, " ")}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-2xl border border-border bg-card">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-muted">
                                {["Taxpayer", "Service", "Amount", "Status", "SLA", ""].map((h, i) => (
                                    <th
                                        key={i}
                                        className={cn(
                                            "border-b border-border px-4 py-3 text-left text-[11px] font-bold text-muted-foreground",
                                            i === 5 && "text-right",
                                        )}
                                    >
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="p-0">
                                        <TableSkeleton rows={6} columns={6} />
                                    </td>
                                </tr>
                            ) : filteredRequests.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-16 text-center text-sm text-muted-foreground">
                                        No requests found.
                                    </td>
                                </tr>
                            ) : (
                                filteredRequests.map((req) => (
                                    <tr key={req.id} className="group transition-colors hover:bg-muted/40">
                                        <td className="border-b border-border px-4 py-3.5">
                                            <div className="text-[13px] font-bold text-foreground">{req.user.name}</div>
                                            <div className="font-mono text-[11px] text-muted-foreground">{req.user.email}</div>
                                        </td>
                                        <td className="border-b border-border px-4 py-3.5 text-[13px]">
                                            {req.service?.name ?? "Unlinked"}
                                            {req.plan?.planName && (
                                                <span className="ml-2 text-[11px] text-muted-foreground">· {req.plan.planName}</span>
                                            )}
                                        </td>
                                        <td className="border-b border-border px-4 py-3.5 text-[13px] font-bold tabular-nums">
                                            ₹{(req.amount / 100).toLocaleString("en-IN")}
                                        </td>
                                        <td className="border-b border-border px-4 py-3.5">
                                            <StatusBadge status={req.status} />
                                        </td>
                                        <td className="border-b border-border px-4 py-3.5">
                                            <SLAIndicator hoursElapsed={req.hoursElapsed} status={req.slaStatus} />
                                        </td>
                                        <td className="border-b border-border px-4 py-3.5 text-right">
                                            <Link
                                                href={`/dashboard/admin/service-requests/${req.id}`}
                                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                                                aria-label="Open request"
                                            >
                                                <ChevronRight className="h-4 w-4" />
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                <Pagination page={page} total={total} limit={PAGE_SIZE} onPageChange={setPage} itemLabel="requests" />
            </div>

            {/* SLA legend */}
            <div className="mt-4 flex flex-wrap items-center gap-5 px-1 text-[11px] font-medium text-muted-foreground">
                <span className="flex items-center gap-1.5"><span className="h-[7px] w-[7px] rounded-full bg-status-healthy" /> Healthy</span>
                <span className="flex items-center gap-1.5"><span className="h-[7px] w-[7px] rounded-full bg-status-warning" /> Warning (&gt;75% SLA)</span>
                <span className="flex items-center gap-1.5"><span className="h-[7px] w-[7px] rounded-full bg-destructive" /> Critical / breach</span>
                <span className="ml-auto">SLA clock starts at PAID status</span>
            </div>
        </div>
    );
}
