"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Plus, FileText, Users, CreditCard,
    AlertCircle, CheckCircle2, Clock
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export default function TdsDashboard() {
    const [summary, setSummary] = useState<any>(null);
    const [returns, setReturns] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                const [sumRes, retRes] = await Promise.all([
                    fetch("/api/tds/summary"),
                    fetch("/api/tds/returns")
                ]);
                const sumData = await sumRes.json();
                const retData = await retRes.json();
                setSummary(sumData);
                setReturns(retData);
            } catch (error) {
                console.error("Fetch TDS data error:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    const stats = [
        { label: "Total TDS Liability", value: summary?.totalLiability || 0, icon: AlertCircle, color: "text-amber-600" },
        { label: "Total Deposited", value: summary?.totalDeposited || 0, icon: CheckCircle2, color: "text-emerald-600" },
        { label: "Pending Deposit", value: summary?.pendingDeposit || 0, icon: Clock, color: summary?.pendingDeposit > 0 ? "text-rose-600" : "text-muted-foreground" },
    ];

    return (
        <div className="p-8 space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">TDS Management</h1>
                    <p className="text-muted-foreground">Manage quarterly returns, deductees, and challan reconciliation.</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" asChild>
                        <Link href="/dashboard/business/tds/deductees">
                            <Users className="mr-2 h-4 w-4" /> Manage Deductees
                        </Link>
                    </Button>
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> New TDS Return
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {stats.map((s) => (
                    <Card key={s.label}>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
                            <s.icon className={`h-4 w-4 ${s.color}`} />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">₹{s.value.toLocaleString("en-IN")}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Monthly/Quarterly Returns Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Quarterly Returns (FY 2024-25)</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="relative w-full overflow-auto">
                        <table className="w-full caption-bottom text-sm">
                            <thead className="[&_tr]:border-b">
                                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Period</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Form Type</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Entries</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="[&_tr:last-child]:border-0">
                                {returns.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="p-4 text-center text-muted-foreground">No returns found for this period.</td>
                                    </tr>
                                ) : (
                                    returns.map((ret) => (
                                        <tr key={ret.id} className="border-b transition-colors hover:bg-muted/50">
                                            <td className="p-4 align-middle">Q{ret.quarter} ({ret.financialYear})</td>
                                            <td className="p-4 align-middle font-mono text-xs">{ret.formType}</td>
                                            <td className="p-4 align-middle">{ret._count?.entries || 0} Deductees</td>
                                            <td className="p-4 align-middle">
                                                <Badge variant={ret.status === "FILED" ? "default" : "secondary"}>
                                                    {ret.status}
                                                </Badge>
                                            </td>
                                            <td className="p-4 align-middle">
                                                <Button variant="ghost" size="sm" asChild>
                                                    <Link href={`/dashboard/business/tds/returns/${ret.id}`}>View Details</Link>
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Quick Tips/Compliance */}
            <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Filing Reminder</AlertTitle>
                <AlertDescription>
                    TDS returns for Q4 (Jan-Mar) are due by May 31. Ensure all challans are mapped correctly to avoid interest penalties.
                </AlertDescription>
            </Alert>
        </div>
    );
}
