"use client";

import { useFormContext } from "react-hook-form";
import { type ITRFormData } from "../itr-wizard";
import { useITRWizard } from "../itr-wizard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft, ShieldCheck, Home, HeartPulse, PiggyBank } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export function DeductionsStep() {
    const { register, watch } = useFormContext<ITRFormData>();
    const { nextStep, prevStep } = useITRWizard();

    // Watch values to calculate visual caps
    const sec80C = Number(watch("deductions.section80C") || 0);
    const percent80C = Math.min(100, (sec80C / 150000) * 100);

    const sec24b = Number(watch("deductions.section24b") || 0);
    const percent24b = Math.min(100, (sec24b / 200000) * 100);

    return (
        <div className="flex flex-col h-full">
            <div className="p-8 pb-6 border-b border-border/60">
                <h2 className="text-2xl font-bold tracking-tight mb-2">Tax Deductions</h2>
                <p className="text-muted-foreground">Reduce your taxable income through Chapter VI-A investments.</p>
                <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-700 dark:text-amber-400 text-sm">
                    <strong>Note:</strong> Most of these deductions apply ONLY under the Old Tax Regime. The engine will calculate both and suggest the best one automatically.
                </div>
            </div>

            <div className="p-8 flex-1 bg-muted/10 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto">

                {/* Section 80C */}
                <div className="bg-card border border-border/60 rounded-xl p-5 shadow-sm space-y-4">
                    <div className="flex items-center gap-3 border-b border-border/40 pb-3">
                        <div className="bg-primary/10 p-2 rounded-lg"><PiggyBank className="h-5 w-5 text-primary" /></div>
                        <div>
                            <Label className="font-semibold text-base">Section 80C</Label>
                            <p className="text-[11px] text-muted-foreground">ELSS, EPF, PPF, LIC, Tuitions</p>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                            <Input type="number" className="pl-8" {...register("deductions.section80C", { valueAsNumber: true })} />
                        </div>
                        <div className="space-y-1">
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Filled: ₹{sec80C.toLocaleString()}</span>
                                <span>Max: ₹1,50,000</span>
                            </div>
                            <Progress value={percent80C} className="h-2" />
                            {sec80C > 150000 && <p className="text-[10px] text-amber-500 mt-1">Capped at 1.5L during calculation.</p>}
                        </div>
                    </div>
                </div>

                {/* Section 80D */}
                <div className="bg-card border border-border/60 rounded-xl p-5 shadow-sm space-y-4">
                    <div className="flex items-center gap-3 border-b border-border/40 pb-3">
                        <div className="bg-rose-500/10 p-2 rounded-lg"><HeartPulse className="h-5 w-5 text-rose-500" /></div>
                        <div>
                            <Label className="font-semibold text-base">Section 80D</Label>
                            <p className="text-[11px] text-muted-foreground">Health Insurance Premiums</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-xs">Self & Family</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                                <Input type="number" className="pl-8 text-sm h-9" {...register("deductions.section80D.selfAmount", { valueAsNumber: true })} />
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                                <input type="checkbox" id="selfSenior" className="rounded" {...register("deductions.section80D.isSelfSenior")} />
                                <label htmlFor="selfSenior" className="text-[10px] text-muted-foreground">Self is Senior (50k limit)</label>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs">Parents</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                                <Input type="number" className="pl-8 text-sm h-9" {...register("deductions.section80D.parentsAmount", { valueAsNumber: true })} />
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                                <input type="checkbox" id="parentsSenior" className="rounded" {...register("deductions.section80D.isParentsSenior")} />
                                <label htmlFor="parentsSenior" className="text-[10px] text-muted-foreground">Parents Senior (50k limit)</label>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section 24b */}
                <div className="bg-card border border-border/60 rounded-xl p-5 shadow-sm space-y-4">
                    <div className="flex items-center gap-3 border-b border-border/40 pb-3">
                        <div className="bg-emerald-500/10 p-2 rounded-lg"><Home className="h-5 w-5 text-emerald-500" /></div>
                        <div>
                            <Label className="font-semibold text-base">Section 24(b)</Label>
                            <p className="text-[11px] text-muted-foreground">Home Loan Interest</p>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                            <Input type="number" className="pl-8" {...register("deductions.section24b", { valueAsNumber: true })} />
                        </div>
                        <div className="space-y-1">
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Filled: ₹{sec24b.toLocaleString()}</span>
                                <span>Max: ₹2,00,000</span>
                            </div>
                            <Progress value={percent24b} className="h-2 bg-emerald-500/20" />
                        </div>
                    </div>
                </div>

                {/* Section 80CCD(1B) and 80G */}
                <div className="bg-card border border-border/60 rounded-xl p-5 shadow-sm space-y-4">
                    <div className="flex items-center gap-3 border-b border-border/40 pb-3">
                        <div className="bg-blue-500/10 p-2 rounded-lg"><ShieldCheck className="h-5 w-5 text-blue-500" /></div>
                        <div>
                            <Label className="font-semibold text-base">NPS & Donations</Label>
                            <p className="text-[11px] text-muted-foreground">80CCD(1B) and 80G</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-[11px]">80CCD(1B) NPS</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                                <Input type="number" className="pl-8 text-sm h-9" {...register("deductions.section80CCD1B", { valueAsNumber: true })} />
                            </div>
                            <p className="text-[9px] text-muted-foreground">Max ₹50,000</p>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[11px]">80G Donations</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                                <Input type="number" className="pl-8 text-sm h-9" {...register("deductions.section80G", { valueAsNumber: true })} />
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            <div className="p-6 bg-card border-t border-border/60 flex justify-between items-center">
                <Button variant="outline" onClick={prevStep} className="gap-2">
                    <ArrowLeft className="h-4 w-4" /> Back
                </Button>
                <Button onClick={nextStep} className="gap-2">
                    Compute Tax Liability <ArrowRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
