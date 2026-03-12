"use client";

import { useFormContext } from "react-hook-form";
import { type ITRFormData } from "../itr-wizard";
import { useITRWizard } from "../itr-wizard";
import { compareRegimes } from "@/lib/tax-calculator/compute";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft, Calculator, TrendingDown, CheckSquare } from "lucide-react";

export function ComputationStep() {
    const { watch } = useFormContext<ITRFormData>();
    const { nextStep, prevStep } = useITRWizard();

    const formData = watch();

    const { optimal, savings, newCompute, oldCompute } = compareRegimes(
        formData.income,
        formData.deductions,
        formData.personal.age || 30
    );

    const formatCurrency = (val: number) => `₹${val.toLocaleString('en-IN')}`;

    const renderComparisonCol = (title: string, compute: typeof newCompute, highlighted: boolean) => (
        <div className={`p-5 rounded-xl border ${highlighted ? "border-primary bg-primary/5 shadow-md shadow-primary/10 relative" : "border-border/60 bg-card"}`}>
            {highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                    <CheckSquare className="h-3 w-3" /> Recommended
                </div>
            )}
            <h3 className={`text-center font-bold text-lg mb-6 ${highlighted ? "text-primary" : "text-muted-foreground"}`}>{title}</h3>

            <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center py-2 border-b border-border/40">
                    <span className="text-muted-foreground">Gross Total Income</span>
                    <span className="font-medium">{formatCurrency(compute.grossTotalIncome)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border/40">
                    <span className="text-muted-foreground">Total Deductions</span>
                    <span className="font-medium text-destructive">-{formatCurrency(compute.totalDeductions)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border/40">
                    <span className="font-medium text-foreground">Net Taxable Income</span>
                    <span className="font-bold">{formatCurrency(compute.taxableIncome)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border/40">
                    <span className="text-muted-foreground">Tax on Income</span>
                    <span className="font-medium">{formatCurrency(compute.grossTax)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border/40">
                    <span className="text-muted-foreground">Rebate (87A)</span>
                    <span className="font-medium text-emerald-500">-{formatCurrency(compute.rebate87A)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border/40">
                    <span className="text-muted-foreground">Surcharge + Cess (4%)</span>
                    <span className="font-medium">{formatCurrency(compute.surcharge + compute.healthAndEducationCess)}</span>
                </div>
                <div className={`flex justify-between items-center pt-4 pb-2 mt-2 ${highlighted ? "border-t border-primary/20" : ""}`}>
                    <span className="text-base font-bold text-foreground">Net Tax Liability</span>
                    <span className={`text-xl font-bold ${highlighted ? "text-primary" : "text-foreground"}`}>
                        {formatCurrency(compute.netTaxLiability)}
                    </span>
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col h-full">
            <div className="p-8 pb-6 border-b border-border/60">
                <h2 className="text-2xl font-bold tracking-tight mb-2 flex items-center gap-3">
                    <Calculator className="h-6 w-6 text-primary" /> Tax Computation (AY 2025-26)
                </h2>
                <p className="text-muted-foreground">We have compared both tax regimes. Here is the most optimal way to file.</p>

                {savings > 0 ? (
                    <div className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-start gap-4">
                        <TrendingDown className="h-6 w-6 text-emerald-500 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-emerald-700 dark:text-emerald-400 font-semibold mb-1">
                                You save {formatCurrency(savings)} by choosing the {optimal === "NEW" ? "New" : "Old"} Tax Regime!
                            </p>
                            <p className="text-emerald-600/80 dark:text-emerald-400/80 text-xs">
                                Based on your deductions and income structure, this is the legal minimum tax payable under Indian Income Tax rules.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="mt-4 p-3 bg-muted rounded-lg text-sm text-muted-foreground">
                        Tax liability is identical in both regimes. We recommend the New Regime for simpler filing.
                    </div>
                )}
            </div>

            <div className="p-8 flex-1 bg-muted/5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
                    {renderComparisonCol("New Tax Regime", newCompute, optimal === "NEW")}
                    {renderComparisonCol("Old Tax Regime", oldCompute, optimal === "OLD")}
                </div>
            </div>

            <div className="p-6 bg-card border-t border-border/60 flex justify-between items-center">
                <Button variant="outline" onClick={prevStep} className="gap-2">
                    <ArrowLeft className="h-4 w-4" /> Back to Deductions
                </Button>
                <Button onClick={nextStep} className="gap-2">
                    Proceed to File & Export <ArrowRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
