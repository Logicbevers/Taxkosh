"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Plus, ChevronLeft, Download, FileText,
    AlertCircle, CheckCircle2, Landmark,
    Trash2,
    Calendar,
    Receipt
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { TDS_SECTIONS } from "@/lib/tds";

export default function TdsReturnDetail() {
    const { id } = useParams();
    const router = useRouter();
    const [tdsReturn, setTdsReturn] = useState<any>(null);
    const [deductees, setDeductees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Form states
    const [entryOpen, setEntryOpen] = useState(false);
    const [challanOpen, setChallanOpen] = useState(false);

    useEffect(() => {
        fetchData();
    }, [id]);

    async function fetchData() {
        try {
            const [retRes, dedRes] = await Promise.all([
                fetch(`/api/tds/returns/${id}`),
                fetch("/api/tds/deductees")
            ]);
            const retData = await retRes.json();
            const dedData = await dedRes.json();
            setTdsReturn(retData);
            setDeductees(dedData);
        } catch (error) {
            console.error("Fetch data error:", error);
        } finally {
            setLoading(false);
        }
    }

    async function handleAddEntry(e: React.FormEvent) {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        const data = {
            type: "ENTRY",
            deducteeId: formData.get("deducteeId"),
            sectionCode: formData.get("sectionCode"),
            dateOfPayment: formData.get("dateOfPayment"),
            amountPaid: Number(formData.get("amountPaid")),
            tdsRate: Number(formData.get("tdsRate"))
        };

        const res = await fetch(`/api/tds/returns/${id}`, {
            method: "POST",
            body: JSON.stringify(data)
        });

        if (res.ok) {
            setEntryOpen(false);
            fetchData();
        }
    }

    async function handleAddChallan(e: React.FormEvent) {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        const data = {
            type: "CHALLAN",
            bsrCode: formData.get("bsrCode"),
            dateOfDeposit: formData.get("dateOfDeposit"),
            challanSerial: formData.get("challanSerial"),
            amount: Number(formData.get("amount")),
            interest: Number(formData.get("interest")) || 0,
            penalty: Number(formData.get("penalty")) || 0
        };

        const res = await fetch(`/api/tds/returns/${id}`, {
            method: "POST",
            body: JSON.stringify(data)
        });

        if (res.ok) {
            setChallanOpen(false);
            fetchData();
        }
    }

    if (loading) return <div className="p-12 text-center">Loading...</div>;

    const totalLiability = tdsReturn?.entries?.reduce((sum: number, e: any) => sum + e.totalTds, 0) || 0;
    const totalDeposited = tdsReturn?.challans?.reduce((sum: number, c: any) => sum + c.amount, 0) || 0;

    return (
        <div className="p-8 space-y-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard/business/tds")}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">
                            TDS Return: Q{tdsReturn.quarter} ({tdsReturn.financialYear})
                        </h1>
                        <Badge variant="outline" className="mt-1">{tdsReturn.formType}</Badge>
                    </div>
                </div>
                <div className="flex gap-3">
                    <Dialog open={entryOpen} onOpenChange={setEntryOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline"><Plus className="mr-2 h-4 w-4" /> Add Entry</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add TDS Entry</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleAddEntry} className="space-y-4 pt-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Select Deductee</label>
                                    <Select name="deducteeId" required>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Search vendor/employee" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {deductees.map(d => (
                                                <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Section Code</label>
                                        <Select name="sectionCode" defaultValue="194C">
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {TDS_SECTIONS.map(s => <SelectItem key={s.code} value={s.code}>{s.label} ({s.code})</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Payment Date</label>
                                        <Input name="dateOfPayment" type="date" required />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Amount Paid</label>
                                        <Input name="amountPaid" type="number" placeholder="₹" required />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">TDS Rate (%)</label>
                                        <Input name="tdsRate" type="number" step="0.1" placeholder="2.0" required />
                                    </div>
                                </div>
                                <Button type="submit" className="w-full">Save Entry</Button>
                            </form>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={challanOpen} onOpenChange={setChallanOpen}>
                        <DialogTrigger asChild>
                            <Button variant="default"><Landmark className="mr-2 h-4 w-4" /> Add Challan</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Record Tax Deposit (Challan)</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleAddChallan} className="space-y-4 pt-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">BSR Code</label>
                                        <Input name="bsrCode" placeholder="7 digits" maxLength={7} required />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Challan Serial</label>
                                        <Input name="challanSerial" placeholder="5 digits" maxLength={5} required />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Deposit Date</label>
                                        <Input name="dateOfDeposit" type="date" required />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Total Amount</label>
                                        <Input name="amount" type="number" placeholder="₹" required />
                                    </div>
                                </div>
                                <Button type="submit" className="w-full">Link Challan</Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader><CardTitle className="text-sm">Summary Status</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Total Liability</span>
                            <span className="font-bold">₹{totalLiability.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Total Deposited</span>
                            <span className="font-bold text-emerald-600">₹{totalDeposited.toLocaleString()}</span>
                        </div>
                        <div className="pt-2 border-t flex justify-between">
                            <span className="font-bold">Net Payable</span>
                            <span className={`font-bold ${totalLiability > totalDeposited ? 'text-rose-600' : 'text-emerald-600'}`}>
                                ₹{Math.max(0, totalLiability - totalDeposited).toLocaleString()}
                            </span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="md:col-span-2">
                    <CardHeader><CardTitle className="text-sm">Compliance Check</CardTitle></CardHeader>
                    <CardContent>
                        {totalLiability <= totalDeposited ? (
                            <div className="flex items-center gap-3 text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-lg">
                                <CheckCircle2 className="h-5 w-5" />
                                <span className="text-sm font-medium">All deductions are backed by valid challans. Ready to File.</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3 text-rose-600 bg-rose-50 dark:bg-rose-900/20 p-4 rounded-lg">
                                <AlertCircle className="h-5 w-5" />
                                <span className="text-sm font-medium">Shortage of ₹{(totalLiability - totalDeposited).toLocaleString()} detected. Deposit balance before filing.</span>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Entries Table */}
            <Card>
                <CardHeader><CardTitle className="text-lg">Deductions (Entries)</CardTitle></CardHeader>
                <CardContent>
                    <div className="relative w-full overflow-auto">
                        <table className="w-full text-sm">
                            <thead className="border-b">
                                <tr className="text-muted-foreground">
                                    <th className="h-10 px-4 text-left">Deductee</th>
                                    <th className="h-10 px-4 text-left">Section</th>
                                    <th className="h-10 px-4 text-left">Date</th>
                                    <th className="h-10 px-4 text-right">Paid Amount</th>
                                    <th className="h-10 px-4 text-right">TDS Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tdsReturn?.entries?.map((e: any) => (
                                    <tr key={e.id} className="border-b">
                                        <td className="p-4">{e.deductee.name}</td>
                                        <td className="p-4 font-mono text-xs">{e.sectionCode}</td>
                                        <td className="p-4">{new Date(e.dateOfPayment).toLocaleDateString()}</td>
                                        <td className="p-4 text-right">₹{e.amountPaid.toLocaleString()}</td>
                                        <td className="p-4 text-right font-bold text-primary">₹{e.totalTds.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Challans Table */}
            <Card>
                <CardHeader><CardTitle className="text-lg">Challans (Tax Deposits)</CardTitle></CardHeader>
                <CardContent>
                    <div className="relative w-full overflow-auto">
                        <table className="w-full text-sm">
                            <thead className="border-b">
                                <tr className="text-muted-foreground">
                                    <th className="h-10 px-4 text-left">BSR Code</th>
                                    <th className="h-10 px-4 text-left">Serial</th>
                                    <th className="h-10 px-4 text-left">Date</th>
                                    <th className="h-10 px-4 text-right">Interest</th>
                                    <th className="h-10 px-4 text-right">Total Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tdsReturn?.challans?.map((c: any) => (
                                    <tr key={c.id} className="border-b">
                                        <td className="p-4 font-mono">{c.bsrCode}</td>
                                        <td className="p-4 font-mono">{c.challanSerial}</td>
                                        <td className="p-4">{new Date(c.dateOfDeposit).toLocaleDateString()}</td>
                                        <td className="p-4 text-right">₹{c.interest.toLocaleString()}</td>
                                        <td className="p-4 text-right font-bold text-emerald-600">₹{c.amount.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
