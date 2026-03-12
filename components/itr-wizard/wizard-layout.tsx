"use client";

import { useITRWizard } from "./itr-wizard";
import { Check } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

import { PersonalInfoStep } from "./steps/personal-info";
import { IncomeSourcesStep } from "./steps/income-sources";
import { DeductionsStep } from "./steps/deductions";
import { ComputationStep } from "./steps/computation";
import { ExportStep } from "./steps/export";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const STEPS = [
    { id: "PERSONAL", label: "Personal Info" },
    { id: "INCOME", label: "Income Sources" },
    { id: "DEDUCTIONS", label: "Deductions" },
    { id: "COMPUTATION", label: "Tax Computation" },
    { id: "EXPORT", label: "File & Export" },
] as const;

export function WizardLayout() {
    const { currentStep } = useITRWizard();

    const currentIndex = STEPS.findIndex((s) => s.id === currentStep);

    return (
        <div className="max-w-4xl mx-auto w-full flex flex-col gap-8 pb-20">

            {/* Header Stepper */}
            <div className="bg-card border border-border/60 rounded-xl p-6 hidden md:block">
                <nav aria-label="Progress">
                    <ol role="list" className="flex items-center">
                        {STEPS.map((step, index) => {
                            const isCompleted = index < currentIndex;
                            const isCurrent = index === currentIndex;

                            return (
                                <li key={step.id} className={cn("relative pr-8 sm:pr-20", index === STEPS.length - 1 && "pr-0")}>
                                    <div className="flex items-center gap-3">
                                        <div
                                            className={cn(
                                                "relative flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors",
                                                isCompleted ? "border-primary bg-primary text-primary-foreground" :
                                                    isCurrent ? "border-primary bg-background text-primary" :
                                                        "border-muted-foreground/30 text-muted-foreground"
                                            )}
                                        >
                                            {isCompleted ? (
                                                <Check className="h-4 w-4" aria-hidden="true" />
                                            ) : (
                                                <span className="text-xs font-semibold">{index + 1}</span>
                                            )}
                                        </div>
                                        <span className={cn(
                                            "text-sm font-medium",
                                            isCompleted ? "text-foreground" :
                                                isCurrent ? "text-primary" : "text-muted-foreground"
                                        )}>
                                            {step.label}
                                        </span>
                                    </div>
                                    {/* Line connecting steps */}
                                    {index !== STEPS.length - 1 && (
                                        <div className={cn(
                                            "absolute left-8 top-4 ml-4 h-0.5 w-[calc(100%-4rem)]",
                                            isCompleted ? "bg-primary" : "bg-border/60"
                                        )} />
                                    )}
                                </li>
                            );
                        })}
                    </ol>
                </nav>
            </div>

            {/* Main Form Content Area */}
            <div className="bg-card border border-border/60 rounded-xl shadow-sm overflow-hidden">
                {currentStep === "PERSONAL" && <PersonalInfoStep />}
                {currentStep === "INCOME" && <IncomeSourcesStep />}
                {currentStep === "DEDUCTIONS" && <DeductionsStep />}
                {currentStep === "COMPUTATION" && <ComputationStep />}
                {currentStep === "EXPORT" && <ExportStep />}
            </div>

        </div>
    );
}
