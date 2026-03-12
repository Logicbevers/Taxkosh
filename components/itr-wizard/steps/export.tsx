"use client";

import { useFormContext } from "react-hook-form";
import { type ITRFormData } from "../itr-wizard";
import { useITRWizard } from "../itr-wizard";
import { compareRegimes } from "@/lib/tax-calculator/compute";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle2, FileJson, FileText, UploadCloud, Send, Loader2 } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useState } from "react";

export function ExportStep() {
    const { watch } = useFormContext<ITRFormData>();
    const { prevStep, isSaving, savedReturnId } = useITRWizard();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitResult, setSubmitResult] = useState<{ ackNumber: string; submittedAt: string } | null>(null);
    const [submitError, setSubmitError] = useState<string | null>(null);

    const formData = watch();
    const { optimal, newCompute, oldCompute } = compareRegimes(
        formData.income,
        formData.deductions,
        formData.personal.age || 30
    );

    const bestCompute = optimal === "NEW" ? newCompute : oldCompute;

    const handleSubmitITR = async () => {
        setIsSubmitting(true);
        setSubmitError(null);
        try {
            const res = await fetch("/api/itr/submit", { method: "POST" });
            const data = await res.json();
            if (!res.ok) {
                // If already submitted, show the existing ACK
                if (res.status === 409 && data.ackNumber) {
                    setSubmitResult({ ackNumber: data.ackNumber, submittedAt: new Date().toISOString() });
                } else {
                    setSubmitError(data.error || "Failed to submit ITR");
                }
            } else {
                setSubmitResult({ ackNumber: data.ackNumber, submittedAt: data.submittedAt });
            }
        } catch {
            setSubmitError("Network error. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDownloadJSON = () => {
        const payload = {
            FormName: formData.personal.hasBusinessIncome ? "ITR-4" : "ITR-1",
            AssessmentYear: "2025-26",
            PersonalInfo: {
                PAN: formData.personal.pan.toUpperCase(),
                Aadhaar: `XXXX-XXXX-${formData.personal.aadhaar}`,
            },
            Computation: {
                GrossTotalIncome: bestCompute.grossTotalIncome,
                DeductionsUnderChapVIA: bestCompute.totalDeductions,
                TotalIncome: bestCompute.taxableIncome,
                NetTaxLiability: bestCompute.netTaxLiability,
                SelectedRegime: optimal
            }
        };

        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `ITR_Export_${formData.personal.pan || 'DRAFT'}_AY2526.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleDownloadPDF = () => {
        const doc = new jsPDF();

        doc.setFontSize(20);
        doc.text("TaxKosh - Income Tax Computation", 14, 22);

        doc.setFontSize(11);
        doc.text(`Assessment Year: 2025-26`, 14, 32);
        doc.text(`PAN: ${formData.personal.pan.toUpperCase() || 'NOT PROVIDED'}`, 14, 38);
        doc.text(`Selected Regime: ${optimal} REGIME`, 14, 44);
        if (submitResult?.ackNumber) {
            doc.text(`ACK Number: ${submitResult.ackNumber}`, 14, 50);
        }

        const tableData = [
            ["Gross Total Income", `Rs. ${bestCompute.grossTotalIncome.toLocaleString()}`],
            ["Less: Deductions (Chapter VI-A)", `Rs. ${bestCompute.totalDeductions.toLocaleString()}`],
            ["Total Taxable Income", `Rs. ${bestCompute.taxableIncome.toLocaleString()}`],
            ["Tax on Total Income", `Rs. ${bestCompute.grossTax.toLocaleString()}`],
            ["Less: Rebate u/s 87A", `Rs. ${bestCompute.rebate87A.toLocaleString()}`],
            ["Add: Surcharge", `Rs. ${bestCompute.surcharge.toLocaleString()}`],
            ["Add: Health & Education Cess (4%)", `Rs. ${bestCompute.healthAndEducationCess.toLocaleString()}`],
            ["Net Tax Liability", `Rs. ${bestCompute.netTaxLiability.toLocaleString()}`]
        ];

        autoTable(doc, {
            startY: submitResult?.ackNumber ? 60 : 55,
            head: [['Particulars', 'Amount (INR)']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [59, 130, 246] },
            columnStyles: {
                0: { cellWidth: 120 },
                1: { cellWidth: 60, halign: 'right' }
            },
            didParseCell: function (data) {
                if (data.row.index === tableData.length - 1) {
                    data.cell.styles.fontStyle = 'bold';
                }
            }
        });

        doc.save(`Tax_Computation_${formData.personal.pan || 'DRAFT'}.pdf`);
    };

    return (
        <div className="flex flex-col h-full bg-card min-h-[500px]">
            <div className="p-8 pb-6 border-b border-border/60 text-center pt-16">
                <div className="mx-auto h-20 w-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                </div>
                <h2 className="text-3xl font-bold tracking-tight mb-3">Computation Complete</h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                    Your tax liability of <strong className="text-foreground">₹{bestCompute.netTaxLiability.toLocaleString('en-IN')}</strong> under the {optimal === 'NEW' ? 'New' : 'Old'} Regime has been finalized.
                </p>

                {/* Submit Result Banner */}
                {submitResult && (
                    <div className="mt-6 mx-auto max-w-lg p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-left">
                        <p className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4" /> ITR Successfully Submitted!
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                            Acknowledgement Number: <span className="font-mono font-bold text-foreground">{submitResult.ackNumber}</span>
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Please save this number for your records.
                        </p>
                    </div>
                )}

                {submitError && (
                    <div className="mt-4 mx-auto max-w-lg p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-sm text-destructive">
                        {submitError}
                    </div>
                )}
            </div>

            <div className="p-8 flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto w-full">

                {/* PDF Export */}
                <div className="bg-card border border-border/60 hover:border-primary/50 transition-colors rounded-xl p-8 flex flex-col items-center text-center group cursor-pointer" onClick={handleDownloadPDF}>
                    <div className="h-16 w-16 bg-red-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <FileText className="h-8 w-8 text-red-500" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Download PDF Report</h3>
                    <p className="text-sm text-muted-foreground mb-6">A detailed computation sheet ready for your records or CA review.</p>
                    <Button variant="secondary" className="w-full">Generate PDF</Button>
                </div>

                {/* JSON Export */}
                <div className="bg-card border border-border/60 hover:border-primary/50 transition-colors rounded-xl p-8 flex flex-col items-center text-center group cursor-pointer" onClick={handleDownloadJSON}>
                    <div className="h-16 w-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <FileJson className="h-8 w-8 text-blue-500" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Export ITR Utility JSON</h3>
                    <p className="text-sm text-muted-foreground mb-6">Pre-filled JSON schema. Upload directly to the Income Tax Portal offline utility.</p>
                    <Button variant="secondary" className="w-full">Download JSON</Button>
                </div>

                {/* Submit ITR */}
                <div className="md:col-span-2 bg-gradient-to-r from-primary/10 to-transparent border border-primary/20 rounded-xl p-6 flex items-center gap-6">
                    <div className="h-12 w-12 bg-primary/20 rounded-full flex items-center justify-center shrink-0">
                        <Send className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                        <h4 className="font-bold text-lg">Submit ITR to TaxKosh</h4>
                        <p className="text-sm text-muted-foreground">
                            {submitResult
                                ? `Submitted ✓ — ACK: ${submitResult.ackNumber}`
                                : "Mark your return as submitted and receive an acknowledgement number for your records."}
                        </p>
                    </div>
                    <Button
                        onClick={handleSubmitITR}
                        disabled={isSubmitting || !!submitResult}
                        className="ml-auto shrink-0 gap-2"
                    >
                        {isSubmitting ? (
                            <><Loader2 className="h-4 w-4 animate-spin" /> Submitting...</>
                        ) : submitResult ? (
                            <><CheckCircle2 className="h-4 w-4" /> Submitted</>
                        ) : (
                            <><Send className="h-4 w-4" /> Submit ITR</>
                        )}
                    </Button>
                </div>

                {/* E-File Coming Soon */}
                <div className="md:col-span-2 bg-muted/40 border border-border/40 rounded-xl p-6 flex items-center gap-6 opacity-60">
                    <div className="h-12 w-12 bg-muted rounded-full flex items-center justify-center shrink-0">
                        <UploadCloud className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                        <h4 className="font-bold text-lg text-muted-foreground">Direct e-Filing</h4>
                        <p className="text-sm text-muted-foreground">Direct integration with the Income Tax Portal API is currently in beta.</p>
                    </div>
                    <Button disabled className="ml-auto shrink-0">Coming Soon</Button>
                </div>

            </div>

            <div className="p-6 border-t border-border/60 flex items-center justify-between">
                <Button variant="outline" onClick={prevStep} className="gap-2">
                    <ArrowLeft className="h-4 w-4" /> Back to Computation
                </Button>
                {isSaving && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <Loader2 className="h-3 w-3 animate-spin" /> Saving...
                    </span>
                )}
            </div>
        </div>
    );
}
