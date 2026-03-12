"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Loader2, Save } from "lucide-react";

export type InvoiceType = "SALES" | "PURCHASE";

interface InvoiceFormProps {
    type: InvoiceType;
    onSuccess?: () => void;
}

interface InvoiceFormData {
    invoiceNumber: string;
    date: string;
    counterpartyName: string;
    counterpartyGstin: string;
    items: {
        description: string;
        hsnSac: string;
        quantity: number;
        rate: number;
        taxableValue: number;
        cgstRate: number;
        sgstRate: number;
        igstRate: number;
        cgstAmount: number;
        sgstAmount: number;
        igstAmount: number;
    }[];
}

export function InvoiceForm({ type, onSuccess }: InvoiceFormProps) {
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState("");

    const { register, control, handleSubmit, watch, setValue } = useForm<InvoiceFormData>({
        defaultValues: {
            invoiceNumber: "",
            date: new Date().toISOString().split("T")[0],
            counterpartyName: "",
            counterpartyGstin: "",
            items: [
                {
                    description: "",
                    hsnSac: "",
                    quantity: 1,
                    rate: 0,
                    taxableValue: 0,
                    cgstRate: 0,
                    sgstRate: 0,
                    igstRate: 0,
                    cgstAmount: 0,
                    sgstAmount: 0,
                    igstAmount: 0,
                }
            ]
        }
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "items"
    });

    // Watch items to auto-calc line totals
    const watchedItems = watch("items");

    // Helper to calculate amounts on blur/change
    const recalculateLine = (index: number) => {
        const item = watchedItems[index];
        const tv = (Number(item.quantity) || 0) * (Number(item.rate) || 0);

        setValue(`items.${index}.taxableValue`, tv);
        setValue(`items.${index}.cgstAmount`, (tv * (Number(item.cgstRate) || 0)) / 100);
        setValue(`items.${index}.sgstAmount`, (tv * (Number(item.sgstRate) || 0)) / 100);
        setValue(`items.${index}.igstAmount`, (tv * (Number(item.igstRate) || 0)) / 100);
    };

    const onSubmit = async (data: InvoiceFormData) => {
        setIsSaving(true);
        setError("");

        // Ensure numbers are properly typed before sending
        const formattedData = {
            ...data,
            type,
            items: data.items.map(item => ({
                ...item,
                quantity: Number(item.quantity),
                rate: Number(item.rate),
                taxableValue: Number(item.taxableValue),
                cgstRate: Number(item.cgstRate),
                sgstRate: Number(item.sgstRate),
                igstRate: Number(item.igstRate),
                cgstAmount: Number(item.cgstAmount),
                sgstAmount: Number(item.sgstAmount),
                igstAmount: Number(item.igstAmount),
            }))
        };

        try {
            const res = await fetch("/api/gst/invoices", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formattedData),
            });
            if (res.ok) {
                onSuccess?.();
            } else {
                const errData = await res.json();
                setError(errData.error || "Failed to save invoice");
            }
        } catch (e) {
            setError("Network error occurred.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                    <Label>Invoice Number *</Label>
                    <Input placeholder="INV-001" {...register("invoiceNumber")} required />
                </div>
                <div className="space-y-1.5">
                    <Label>Invoice Date *</Label>
                    <Input type="date" {...register("date")} required />
                </div>
                <div className="space-y-1.5">
                    <Label>{type === "SALES" ? "Customer" : "Vendor"} Name</Label>
                    <Input placeholder="Business Name" {...register("counterpartyName")} />
                </div>
                <div className="space-y-1.5">
                    <Label>{type === "SALES" ? "Customer" : "Vendor"} GSTIN</Label>
                    <Input placeholder="e.g. 22AAAAA0000A1Z5" className="uppercase" maxLength={15} {...register("counterpartyGstin")} />
                </div>
            </div>

            <div className="border border-border/60 rounded-xl overflow-hidden">
                <div className="bg-muted/20 p-3 border-b border-border/60 font-medium text-sm grid grid-cols-12 gap-2">
                    <div className="col-span-3">Item Description</div>
                    <div className="col-span-1">HSN/SAC</div>
                    <div className="col-span-1 text-right">Qty</div>
                    <div className="col-span-1 text-right">Rate</div>
                    <div className="col-span-2 text-right">Amount</div>
                    <div className="col-span-1 text-right">CGST %</div>
                    <div className="col-span-1 text-right">SGST %</div>
                    <div className="col-span-1 text-right">IGST %</div>
                    <div className="col-span-1 text-center">Act</div>
                </div>

                <div className="divide-y divide-border/40">
                    {fields.map((field, index) => (
                        <div key={field.id} className="p-3 grid grid-cols-12 gap-2 items-center">
                            <div className="col-span-3">
                                <Input
                                    placeholder="Service/Product"
                                    {...register(`items.${index}.description`)}
                                    required
                                />
                            </div>
                            <div className="col-span-1">
                                <Input
                                    placeholder="HSN"
                                    className="px-1 text-center"
                                    {...register(`items.${index}.hsnSac`)}
                                />
                            </div>
                            <div className="col-span-1">
                                <Input
                                    type="number" min="0.01" step="any"
                                    className="px-1 text-right"
                                    {...register(`items.${index}.quantity`)}
                                    required
                                    onBlur={() => recalculateLine(index)}
                                />
                            </div>
                            <div className="col-span-1">
                                <Input
                                    type="number" min="0" step="any"
                                    className="px-1 text-right"
                                    {...register(`items.${index}.rate`)}
                                    required
                                    onBlur={() => recalculateLine(index)}
                                />
                            </div>
                            <div className="col-span-2">
                                <Input
                                    type="number"
                                    readOnly
                                    className="px-1 text-right bg-muted/20"
                                    {...register(`items.${index}.taxableValue`)}
                                />
                            </div>
                            <div className="col-span-1">
                                <Input
                                    type="number" min="0" step="1"
                                    className="px-1 text-right"
                                    {...register(`items.${index}.cgstRate`)}
                                    onBlur={() => recalculateLine(index)}
                                />
                            </div>
                            <div className="col-span-1">
                                <Input
                                    type="number" min="0" step="1"
                                    className="px-1 text-right"
                                    {...register(`items.${index}.sgstRate`)}
                                    onBlur={() => recalculateLine(index)}
                                />
                            </div>
                            <div className="col-span-1">
                                <Input
                                    type="number" min="0" step="1"
                                    className="px-1 text-right"
                                    {...register(`items.${index}.igstRate`)}
                                    onBlur={() => recalculateLine(index)}
                                />
                            </div>
                            <div className="col-span-1 text-center">
                                <Button
                                    type="button" variant="ghost" size="icon"
                                    onClick={() => remove(index)}
                                    disabled={fields.length === 1}
                                    className="text-destructive hover:bg-destructive/10"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="p-3 bg-muted/10 border-t border-border/60">
                    <Button
                        type="button" variant="secondary" size="sm" className="gap-2"
                        onClick={() => append({ description: "", hsnSac: "", quantity: 1, rate: 0, taxableValue: 0, cgstRate: 0, sgstRate: 0, igstRate: 0, cgstAmount: 0, sgstAmount: 0, igstAmount: 0 })}
                    >
                        <Plus className="h-4 w-4" /> Add Line Item
                    </Button>
                </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => onSuccess?.()}>Cancel</Button>
                <Button type="submit" disabled={isSaving} className="gap-2">
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save {type === "SALES" ? "Sale Invoice" : "Purchase Record"}
                </Button>
            </div>
        </form>
    );
}
