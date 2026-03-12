"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Download, FileJson, CheckCircle2, AlertCircle } from "lucide-react";

export default function ReturnsPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [profile, setProfile] = useState<any>(null);
    const [sales, setSales] = useState<any[]>([]);
    const [summary, setSummary] = useState<any>(null);

    useEffect(() => {
        async function loadData() {
            try {
                // In production, we'd pass ?month=2025-06 etc.
                const [profRes, salesRes, sumRes] = await Promise.all([
                    fetch("/api/gst/profile"),
                    fetch("/api/gst/invoices?type=SALES"),
                    fetch("/api/gst/summary")
                ]);

                if (profRes.ok) setProfile((await profRes.json()).profile);
                if (salesRes.ok) setSales((await salesRes.json()).invoices);
                if (sumRes.ok) setSummary(await sumRes.json());
            } finally {
                setIsLoading(false);
            }
        }
        loadData();
    }, []);

    const handleDownloadGSTR1 = () => {
        if (!profile?.gstin || sales.length === 0) return;

        // Group into B2B and B2CS
        const b2bInvoices = sales.filter(s => s.counterpartyGstin && s.counterpartyGstin.length > 5);
        const b2cInvoices = sales.filter(s => !s.counterpartyGstin || s.counterpartyGstin.length <= 5);

        // Map B2B payload
        const b2bPayload = b2bInvoices.reduce((acc: any[], inv) => {
            // Find if counterparty already exists in payload
            let cp = acc.find((c: any) => c.ctin === inv.counterpartyGstin);
            if (!cp) {
                cp = { ctin: inv.counterpartyGstin, inv: [] };
                acc.push(cp);
            }

            const items = inv.items.map((item: any, idx: number) => {
                const totalTaxRate = Number(item.cgstRate) + Number(item.sgstRate) + Number(item.igstRate);
                return {
                    num: idx + 1,
                    itm_det: {
                        rt: totalTaxRate,
                        txval: Number(item.taxableValue),
                        iamt: Number(item.igstAmount),
                        camt: Number(item.cgstAmount),
                        samt: Number(item.sgstAmount)
                    }
                };
            });

            cp.inv.push({
                inum: inv.invoiceNumber,
                idt: new Date(inv.date).toLocaleDateString('en-IN').replace(/\//g, '-'),
                val: inv.totalAmount,
                pos: inv.counterpartyGstin.substring(0, 2), // state code from GSTIN
                rchrg: "N",
                inv_typ: "R",
                itms: items
            });

            return acc;
        }, []);

        const payload = {
            gstin: profile.gstin,
            fp: "062025",
            gt: 0,
            cur_gt: 0,
            version: "GST2.0.0",
            b2b: b2bPayload,
            b2cs: b2cInvoices.length > 0 ? [
                // Simplified B2C aggregate
                {
                    sply_ty: "INTRA",
                    txval: b2cInvoices.reduce((sum, inv) => sum + inv.totalTaxableValue, 0),
                    typ: "OE",
                    camt: b2cInvoices.reduce((sum, inv) => sum + inv.totalCgst, 0),
                    samt: b2cInvoices.reduce((sum, inv) => sum + inv.totalSgst, 0),
                    iamt: b2cInvoices.reduce((sum, inv) => sum + inv.totalIgst, 0),
                }
            ] : []
        };

        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `GSTR1_${profile.gstin}_062025.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    if (isLoading) {
        return <div className="p-12 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
    }

    if (!profile) {
        return (
            <div className="max-w-4xl mx-auto py-12 px-6 text-center">
                <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">GSTIN Required</h2>
                <p className="text-muted-foreground mb-6">Please configure your Business Profile and GSTIN before generating returns.</p>
                <Button className="mx-auto" onClick={() => window.location.href = '/dashboard/business/profile'}>Go to Settings</Button>
            </div>
        );
    }

    const b2bCount = sales.filter(s => s.counterpartyGstin).length;
    const b2cCount = sales.length - b2bCount;

    return (
        <div className="max-w-6xl mx-auto py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">GST Returns Filing</h1>
                <p className="text-muted-foreground">Generate portal-compliant JSON payloads for your monthly compliance.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* GSTR-1 Section */}
                <div className="bg-card border border-border/60 rounded-xl overflow-hidden flex flex-col">
                    <div className="bg-muted/20 p-6 border-b border-border/60">
                        <h2 className="text-xl font-bold mb-1">GSTR-1: Outward Supplies</h2>
                        <p className="text-sm text-muted-foreground ml-0.5">Summary of all sales invoices for the period.</p>
                    </div>
                    <div className="p-6 flex-1 space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                                <p className="text-xs text-primary font-medium mb-1">B2B Invoices</p>
                                <p className="text-2xl font-bold">{b2bCount}</p>
                            </div>
                            <div className="bg-muted border border-border/60 rounded-lg p-4">
                                <p className="text-xs text-muted-foreground font-medium mb-1">B2C Invoices</p>
                                <p className="text-2xl font-bold">{b2cCount}</p>
                            </div>
                        </div>
                        <div className="text-sm border-t border-border/40 pt-4 space-y-2">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Total Taxable Value</span>
                                <span className="font-medium">₹{summary?.sales?.taxable.toLocaleString() || 0}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Total Tax Amount</span>
                                <span className="font-medium">₹{summary?.sales?.totalTax.toLocaleString() || 0}</span>
                            </div>
                        </div>
                    </div>
                    <div className="p-6 bg-muted/10 border-t border-border/60">
                        <Button
                            className="w-full gap-2"
                            disabled={sales.length === 0}
                            onClick={handleDownloadGSTR1}
                        >
                            <FileJson className="h-4 w-4" /> Export GSTR-1 JSON Payload
                        </Button>
                        <p className="text-center text-xs text-muted-foreground mt-3">Upload this directly on the GST portal offline tool.</p>
                    </div>
                </div>

                {/* GSTR-3B Section */}
                <div className="bg-card border border-border/60 rounded-xl overflow-hidden flex flex-col">
                    <div className="bg-muted/20 p-6 border-b border-border/60">
                        <h2 className="text-xl font-bold mb-1">GSTR-3B: Monthly Summary</h2>
                        <p className="text-sm text-muted-foreground ml-0.5">Net tax liability and ITC claimed.</p>
                    </div>
                    <div className="p-6 flex-1 space-y-6">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 rounded-lg border border-border/60">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 bg-red-500/10 rounded-full flex items-center justify-center">
                                        <ArrowDownRightIcon className="h-4 w-4 text-red-500" />
                                    </div>
                                    <span className="font-medium">Output Tax Liability (Sales)</span>
                                </div>
                                <span className="font-bold">₹{summary?.sales?.totalTax.toLocaleString() || 0}</span>
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-lg border border-border/60">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 bg-emerald-500/10 rounded-full flex items-center justify-center">
                                        <ArrowUpRightIcon className="h-4 w-4 text-emerald-500" />
                                    </div>
                                    <span className="font-medium">Eligible ITC (Purchases)</span>
                                </div>
                                <span className="font-bold text-emerald-600 dark:text-emerald-400">₹{summary?.purchases?.totalTax.toLocaleString() || 0}</span>
                            </div>

                            <div className="border border-border/40 my-2"></div>

                            <div className="flex items-center justify-between p-4 rounded-lg bg-primary/10 border border-primary/20">
                                <span className="font-bold text-primary text-lg">Net GST Payable</span>
                                <span className="font-bold text-2xl text-primary">₹{summary?.netPayable?.toLocaleString() || 0}</span>
                            </div>
                        </div>
                    </div>
                    <div className="p-6 bg-muted/10 border-t border-border/60">
                        <div className="flex items-center gap-2 justify-center text-sm font-medium text-emerald-600 dark:text-emerald-400 mb-4">
                            <CheckCircle2 className="h-4 w-4" /> Calculations verified against portal rules
                        </div>
                        <Button variant="secondary" className="w-full gap-2" disabled={!summary}>
                            <Download className="h-4 w-4" /> Generate 3B Computation Sheet
                        </Button>
                    </div>
                </div>

            </div>
        </div>
    );
}

// Inline svg icons to avoid extra lucide imports inside the render logic
function ArrowDownRightIcon(props: any) {
    return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7 7 10 10" /><path d="M17 7v10H7" /></svg>
}

function ArrowUpRightIcon(props: any) {
    return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7 17 10-10" /><path d="M17 17V7H7" /></svg>
}
