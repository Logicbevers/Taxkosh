"use client";

import { useState, useEffect } from "react";
import { InvoiceForm } from "@/components/gst/invoice-form";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, ArrowDownToLine, Receipt, Loader2, Calendar } from "lucide-react";

export default function SalesPage() {
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [invoices, setInvoices] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadInvoices = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/gst/invoices?type=SALES");
            if (res.ok) {
                const data = await res.json();
                setInvoices(data.invoices);
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadInvoices();
    }, []);

    const handleSuccess = () => {
        setIsAddOpen(false);
        loadInvoices();
    };

    return (
        <div className="max-w-6xl mx-auto py-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Sales & Outward Supplies</h1>
                    <p className="text-muted-foreground">Manage your sales invoices for GSTR-1.</p>
                </div>
                <Button onClick={() => setIsAddOpen(true)} className="gap-2">
                    <Plus className="h-4 w-4" /> Record Sale
                </Button>
            </div>

            <div className="bg-card border border-border/60 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-muted/20 text-muted-foreground border-b border-border/60">
                            <tr>
                                <th className="px-6 py-4 font-medium">Invoice No</th>
                                <th className="px-6 py-4 font-medium">Date</th>
                                <th className="px-6 py-4 font-medium">Customer</th>
                                <th className="px-6 py-4 font-medium">GSTIN/Type</th>
                                <th className="px-6 py-4 text-right font-medium">Taxable Val</th>
                                <th className="px-6 py-4 text-right font-medium">Total Tax</th>
                                <th className="px-6 py-4 text-right font-medium">Invoice Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                                        Loading sales...
                                    </td>
                                </tr>
                            ) : invoices.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center">
                                        <div className="mx-auto h-12 w-12 bg-muted rounded-full flex items-center justify-center mb-3">
                                            <Receipt className="h-6 w-6 text-muted-foreground" />
                                        </div>
                                        <p className="font-medium">No sales recorded yet</p>
                                        <p className="text-sm text-muted-foreground">Add your first invoice to get started.</p>
                                    </td>
                                </tr>
                            ) : (
                                invoices.map((inv) => (
                                    <tr key={inv.id} className="hover:bg-muted/10 transition-colors">
                                        <td className="px-6 py-4 font-medium">{inv.invoiceNumber}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                                {new Date(inv.date).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">{inv.counterpartyName || "Cash Sale"}</td>
                                        <td className="px-6 py-4">
                                            {inv.counterpartyGstin ? (
                                                <span className="font-mono text-xs bg-primary/10 text-primary px-2 py-1 rounded">B2B: {inv.counterpartyGstin}</span>
                                            ) : (
                                                <span className="text-xs bg-muted px-2 py-1 rounded text-muted-foreground">B2C</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">₹{inv.totalTaxableValue.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-right">₹{(inv.totalCgst + inv.totalSgst + inv.totalIgst).toLocaleString()}</td>
                                        <td className="px-6 py-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                                            ₹{inv.totalAmount.toLocaleString()}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogContent className="max-w-5xl">
                    <DialogHeader className="mb-4">
                        <DialogTitle className="text-2xl">Record New Sale</DialogTitle>
                    </DialogHeader>
                    <InvoiceForm type="SALES" onSuccess={handleSuccess} />
                </DialogContent>
            </Dialog>
        </div>
    );
}
