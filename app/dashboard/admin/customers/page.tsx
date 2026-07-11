"use client"

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, User, Mail, Calendar, ChevronRight, Download, ShieldCheck, Globe, Settings2, Fingerprint } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Pagination, TableSkeleton } from "@/components/admin";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";

interface Customer {
    id: string;
    name: string | null;
    email: string;
    role: string;
    emailVerified: string | null;
    createdAt: string;
    pan: string | null;
    phone: string | null;
    _count?: { serviceRequests: number };
}

const PAGE_SIZE = 25;

export default function AdminCustomersPage() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const debouncedSearch = useDebouncedValue(search, 300);
    const [roleFilter, setRoleFilter] = useState("ALL");
    const [isLoading, setIsLoading] = useState(true);
    const [isExporting, setIsExporting] = useState(false);

    const fetchCustomers = useCallback(async () => {
        setIsLoading(true);
        const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
        if (debouncedSearch) params.set("search", debouncedSearch);
        if (roleFilter !== "ALL") params.set("role", roleFilter);
        try {
            const res = await fetch(`/api/admin/customers?${params}`);
            const data = await res.json();
            setCustomers(data.customers ?? []);
            setTotal(data.total ?? 0);
        } catch {
            setCustomers([]);
        } finally {
            setIsLoading(false);
        }
    }, [page, debouncedSearch, roleFilter]);

    useEffect(() => { fetchCustomers(); }, [fetchCustomers]);
    useEffect(() => { setPage(1); }, [debouncedSearch, roleFilter]);

    const handleExportCSV = async () => {
        setIsExporting(true);
        try {
            const res = await fetch(`/api/admin/customers?page=1&limit=5000`);
            const data = await res.json();
            const all: Customer[] = data.customers ?? [];
            const rows = [
                ["Name", "Email", "Role", "Email Verified", "Phone", "Requests", "Joined"],
                ...all.map(c => [
                    c.name ?? "",
                    c.email,
                    c.role,
                    c.emailVerified ? "Yes" : "No",
                    c.phone ?? "",
                    String(c._count?.serviceRequests ?? 0),
                    new Date(c.createdAt).toISOString(),
                ])
            ];
            const csv = rows.map(r => r.map(v => `"${v.replace(/"/g, '""')}"`).join(",")).join("\n");
            const blob = new Blob([csv], { type: "text/csv" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `taxkosh-customers-${new Date().toISOString().split("T")[0]}.csv`;
            a.click();
            URL.revokeObjectURL(url);
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto pb-24 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="font-serif text-[32px] text-foreground">
                        Taxpayer Registry
                    </h1>
                    <p className="text-muted-foreground mt-2 text-sm font-medium">
                        <span className="text-primary font-bold">{total}</span> verified individual and corporate taxpayers.
                    </p>
                </div>
                <Button variant="outline" className="h-12 rounded-2xl gap-2 font-black text-[10px] uppercase tracking-widest px-6" onClick={handleExportCSV} disabled={isExporting}>
                    <Download className="w-4 h-4" />
                    {isExporting ? "Exporting..." : "Export CSV"}
                </Button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 items-center bg-white/50 dark:bg-slate-900/50 p-6 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 dark:shadow-none border border-white dark:border-slate-800 backdrop-blur-xl">
                <div className="relative flex-1 min-w-[300px] group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                    <Input
                        placeholder="Search by name or email..."
                        className="pl-12 bg-white dark:bg-slate-900 border-none shadow-inner focus-visible:ring-2 focus-visible:ring-primary/20 h-14 font-medium text-sm rounded-2xl"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="h-10 w-px bg-slate-200 dark:bg-slate-800 hidden md:block mx-2" />
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-[200px] bg-white dark:bg-slate-900 border-none h-14 shadow-inner rounded-2xl font-black text-[10px] uppercase tracking-widest">
                        <SelectValue placeholder="All Roles" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl p-2">
                        {["ALL", "INDIVIDUAL", "BUSINESS", "CA"].map(r => (
                            <SelectItem key={r} value={r} className="rounded-xl font-bold py-3">
                                {r === "ALL" ? "All Roles" : r}
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
                                    <TableHead className="py-6 pl-10 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                                        <div className="flex items-center gap-2"><Fingerprint className="w-4 h-4" /> Taxpayer</div>
                                    </TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                                        <div className="flex items-center gap-2"><Globe className="w-4 h-4" /> Role</div>
                                    </TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                                        <div className="flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> Verification</div>
                                    </TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Requests</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                                        <div className="flex items-center gap-2"><Calendar className="w-4 h-4" /> Joined</div>
                                    </TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-[0.3em] text-right pr-10 text-slate-400">
                                        <div className="flex items-center gap-2 justify-end"><Settings2 className="w-4 h-4" /> Actions</div>
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="p-0">
                                            <TableSkeleton rows={6} columns={5} />
                                        </TableCell>
                                    </TableRow>
                                ) : customers.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="py-40 text-center">
                                            <div className="flex flex-col items-center gap-6 opacity-30">
                                                <div className="h-20 w-20 bg-slate-100 dark:bg-slate-800 rounded-[2rem] flex items-center justify-center mx-auto">
                                                    <User className="h-10 w-10 text-slate-400" />
                                                </div>
                                                <p className="font-black text-xs uppercase tracking-widest text-slate-500">No taxpayers found.</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    customers.map((user) => (
                                        <TableRow key={user.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all duration-300 border-slate-50 dark:border-slate-900">
                                            <TableCell className="py-6 pl-10">
                                                <div className="flex items-center gap-4">
                                                    <Avatar className="h-11 w-11 rounded-2xl ring-2 ring-white dark:ring-slate-900 shadow-md">
                                                        <AvatarFallback className="bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 text-slate-900 dark:text-white font-black uppercase text-sm">
                                                            {user.name?.[0] ?? user.email?.[0]}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex flex-col">
                                                        <p className="font-black text-sm text-slate-900 dark:text-white tracking-tight">
                                                            {user.name ?? "Anonymous"}
                                                        </p>
                                                        <p className="text-[10px] text-slate-400 font-medium mt-0.5 flex items-center gap-1">
                                                            <Mail className="w-3 h-3 opacity-40" /> {user.email}
                                                        </p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="text-[9px] font-black tracking-widest uppercase px-3 h-6 rounded-xl border-slate-200 dark:border-slate-700 text-slate-500">
                                                    {user.role}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border w-fit ${user.emailVerified ? "bg-emerald-500/5 border-emerald-500/10 text-emerald-600" : "bg-amber-500/5 border-amber-500/10 text-amber-600"}`}>
                                                    <div className={`h-1.5 w-1.5 rounded-full ${user.emailVerified ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
                                                    <span className="text-[9px] font-black uppercase tracking-widest">
                                                        {user.emailVerified ? "Verified" : "Pending"}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="font-black text-sm text-slate-900 dark:text-white tabular-nums">
                                                    {user._count?.serviceRequests ?? 0}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-black text-slate-900 dark:text-white tabular-nums">
                                                        {new Date(user.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                                                    </span>
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-0.5">Joined</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right pr-10">
                                                <Button variant="ghost" size="icon" asChild className="h-10 w-10 rounded-2xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-slate-900 transition-all duration-300 shadow-sm">
                                                    <Link href={`/dashboard/admin/customers/${user.id}`}>
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

                    <Pagination page={page} total={total} limit={PAGE_SIZE} onPageChange={setPage} itemLabel="taxpayers" />
                </CardContent>
            </Card>
        </div>
    );
}
