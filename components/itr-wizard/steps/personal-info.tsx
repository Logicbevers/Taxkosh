"use client";

import { useFormContext } from "react-hook-form";
import { type ITRFormData } from "../itr-wizard";
import { useITRWizard } from "../itr-wizard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { ArrowRight, UserCircle, FileText, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner"; // Assuming sonner is available or similar toast library

export function PersonalInfoStep() {
    const { register, watch, setValue } = useFormContext<ITRFormData>();
    const { nextStep } = useITRWizard();
    const [isParsing, setIsParsing] = useState(false);

    const handleForm16Upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsParsing(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch("/api/itr/parse-form16", {
                method: "POST",
                body: formData,
            });
            const result = await res.json();

            if (result.success) {
                const data = result.data;
                // Auto-fill fields
                setValue("personal.pan", data.employerTan); // Just as example, real mapping needed
                setValue("income.salary", data.incomeFromSalary);
                setValue("income.exemptAllowances", data.allowancesExempt);
                setValue("deductions.section80C", data.deductions80C.total);

                toast.success("Form 16 parsed! Fields auto-filled.");
            } else {
                toast.error(result.error || "Failed to parse Form 16");
            }
        } catch (error) {
            toast.error("An error occurred while parsing the document.");
        } finally {
            setIsParsing(false);
        }
    };

    const hasBusinessIncome = watch("personal.hasBusinessIncome");
    // ... rest of logic

    // Determine ITR Form automatically
    let recommendedForm = "ITR-1 (Sahaj)";
    if (hasBusinessIncome) recommendedForm = "ITR-3 or ITR-4 (Sugam)";

    return (
        <div className="flex flex-col h-full">
            <div className="p-8 pb-6 border-b border-border/60">
                <h2 className="text-2xl font-bold tracking-tight mb-2">Personal Information</h2>
                <p className="text-muted-foreground">Verify your core details for tax filing.</p>
            </div>

            <div className="p-8 space-y-8 flex-1">
                {/* Form 16 Auto-fill Banner */}
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-start gap-4 text-left">
                        <div className="bg-emerald-500/20 p-3 rounded-lg">
                            <Sparkles className="h-6 w-6 text-emerald-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-emerald-900 leading-none mb-2">Auto-fill with Form 16</h3>
                            <p className="text-sm text-emerald-700/80 max-w-md">
                                Upload your Form 16 PDF and our AI will automatically extract salary and deduction details for you.
                            </p>
                        </div>
                    </div>
                    <div className="w-full md:w-auto">
                        <Input
                            type="file"
                            id="form16-upload"
                            accept=".pdf"
                            className="hidden"
                            onChange={handleForm16Upload}
                            disabled={isParsing}
                        />
                        <Button
                            variant="secondary"
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white border-none shadow-sm gap-2"
                            onClick={() => document.getElementById("form16-upload")?.click()}
                            disabled={isParsing}
                        >
                            {isParsing ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Parsing OCR...
                                </>
                            ) : (
                                <>
                                    <FileText className="h-4 w-4" />
                                    Upload Form 16
                                </>
                            )}
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="pan">PAN Number</Label>
                        <Input id="pan" placeholder="ABCDE1234F" className="uppercase" {...register("personal.pan")} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="aadhaar">Aadhaar (Last 4 digits)</Label>
                        <Input id="aadhaar" placeholder="1234" maxLength={4} {...register("personal.aadhaar")} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="age">Age (as of Mar 31, 2025)</Label>
                        <Input id="age" type="number" min={18} max={110} {...register("personal.age", { valueAsNumber: true })} />
                        <p className="text-[11px] text-muted-foreground">Required to determine Senior Citizen slab benefits.</p>
                    </div>
                </div>

                <Card className="bg-primary/5 border-primary/20">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                            <UserCircle className="h-5 w-5 text-primary" />
                            ITR Form Selection
                        </CardTitle>
                        <CardDescription>We will automatically select the right ITR form based on your profile.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-start gap-3">
                            <input
                                type="checkbox"
                                id="businessIncomeFlag"
                                className="mt-1 h-4 w-4 accent-primary"
                                {...register("personal.hasBusinessIncome")}
                            />
                            <div>
                                <Label htmlFor="businessIncomeFlag" className="font-medium">I have income from Business or Profession</Label>
                                <p className="text-xs text-muted-foreground mt-1">Check this if you are a freelancer, consultant, or business owner.</p>
                            </div>
                        </div>

                        <div className="mt-4 p-3 bg-card border border-border/60 rounded-lg flex justify-between items-center">
                            <span className="text-sm font-medium">Auto-selected Form:</span>
                            <span className="text-sm font-bold text-primary">{recommendedForm}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="p-6 bg-muted/30 border-t border-border/60 flex justify-end">
                <Button onClick={nextStep} className="gap-2">
                    Continue to Income <ArrowRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
