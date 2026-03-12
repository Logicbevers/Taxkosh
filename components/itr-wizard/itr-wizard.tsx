"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { useForm, UseFormReturn, FormProvider } from "react-hook-form";
import { IncomeSources, Deductions } from "@/lib/tax-calculator/types";
import { WizardLayout } from "./wizard-layout";

export interface ITRFormData {
    personal: {
        pan: string;
        aadhaar: string;
        age: number;
        hasBusinessIncome: boolean;
    };
    income: IncomeSources;
    deductions: Deductions;
}

// ─── Default State ──────────────────────────────────────────

const defaultFormState: ITRFormData = {
    personal: {
        pan: "",
        aadhaar: "",
        age: 30,
        hasBusinessIncome: false,
    },
    income: {
        salary: 0,
        exemptAllowances: 0,
        houseProperty: 0,
        capitalGains: { shortTerm: [], longTerm: [] },
        businessProfession: { regular: 0, presumptive44AD: 0, presumptive44ADA: 0 },
        otherSources: { interestFixed: 0, interestSavings: 0, dividends: 0, other: 0 }
    },
    deductions: {
        section80C: 0,
        section80D: { selfAmount: 0, parentsAmount: 0, isSelfSenior: false, isParentsSenior: false },
        section80CCD1B: 0,
        section80G: 0,
        section80TTA: 0,
        section80TTB: 0,
        section24b: 0,
        standardDeduction: 0,
    }
};

// ─── Wizard Context ─────────────────────────────────────────

type Step = "PERSONAL" | "INCOME" | "DEDUCTIONS" | "COMPUTATION" | "EXPORT";

interface WizardContextType {
    currentStep: Step;
    setStep: (step: Step) => void;
    nextStep: () => void;
    prevStep: () => void;
    isSaving: boolean;
    savedReturnId: string | null;
}

const WizardContext = createContext<WizardContextType | null>(null);

export function useITRWizard() {
    const ctx = useContext(WizardContext);
    if (!ctx) throw new Error("useITRWizard must be used within ITRWizardProvider");
    return ctx;
}

// ─── Root Wrapper Component ─────────────────────────────────

const STEPS_ORDER: Step[] = ["PERSONAL", "INCOME", "DEDUCTIONS", "COMPUTATION", "EXPORT"];

export function ITRWizard() {
    const [currentStep, setStep] = useState<Step>("PERSONAL");
    const [isSaving, setIsSaving] = useState(false);
    const [savedReturnId, setSavedReturnId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const methods = useForm<ITRFormData>({
        defaultValues: defaultFormState,
        mode: "onChange",
    });

    // ─── Pre-populate from saved draft on mount ──────────────
    useEffect(() => {
        async function loadDraft() {
            try {
                const res = await fetch("/api/itr/latest");
                if (!res.ok) return;
                const { taxReturn } = await res.json();
                if (!taxReturn) return;

                setSavedReturnId(taxReturn.id);

                // Restore each section if it was saved
                if (taxReturn.personalData && Object.keys(taxReturn.personalData).length > 0) {
                    methods.setValue("personal", taxReturn.personalData as ITRFormData["personal"]);
                }
                if (taxReturn.incomeData && Object.keys(taxReturn.incomeData).length > 0) {
                    methods.setValue("income", taxReturn.incomeData as ITRFormData["income"]);
                }
                if (taxReturn.deductionsData && Object.keys(taxReturn.deductionsData).length > 0) {
                    methods.setValue("deductions", taxReturn.deductionsData as ITRFormData["deductions"]);
                }

                // If previously completed, jump to last useful step
                if (taxReturn.status === "SUBMITTED") {
                    setStep("EXPORT");
                } else if (taxReturn.deductionsData && Object.keys(taxReturn.deductionsData).length > 0) {
                    setStep("COMPUTATION");
                } else if (taxReturn.incomeData && Object.keys(taxReturn.incomeData).length > 0) {
                    setStep("DEDUCTIONS");
                }
            } catch {
                // Silently fail — user just starts fresh
            } finally {
                setIsLoading(false);
            }
        }
        loadDraft();
    }, [methods]);

    // ─── Auto-save helper ────────────────────────────────────
    const saveDraft = useCallback(async (formData: ITRFormData, computedData?: {
        netTaxLiability?: number;
        grossTaxLiability?: number;
        selectedRegime?: "NEW" | "OLD";
    }) => {
        setIsSaving(true);
        try {
            const res = await fetch("/api/itr/save", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    assessmentYear: "2025-26",
                    personalData: formData.personal,
                    incomeData: formData.income,
                    deductionsData: formData.deductions,
                    ...computedData,
                }),
            });
            if (res.ok) {
                const { taxReturn } = await res.json();
                if (taxReturn?.id) setSavedReturnId(taxReturn.id);
            }
        } catch {
            // Non-blocking — wizard continues even if save fails
        } finally {
            setIsSaving(false);
        }
    }, []);

    const nextStep = useCallback(async () => {
        const idx = STEPS_ORDER.indexOf(currentStep);
        if (idx < STEPS_ORDER.length - 1) {
            // Auto-save current state before advancing
            await saveDraft(methods.getValues());
            setStep(STEPS_ORDER[idx + 1]);
        }
    }, [currentStep, methods, saveDraft]);

    const prevStep = () => {
        const idx = STEPS_ORDER.indexOf(currentStep);
        if (idx > 0) setStep(STEPS_ORDER[idx - 1]);
    };

    if (isLoading) {
        return (
            <div className="max-w-4xl mx-auto flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-3 text-muted-foreground">
                    <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm">Loading your draft...</p>
                </div>
            </div>
        );
    }

    return (
        <WizardContext.Provider value={{ currentStep, setStep, nextStep, prevStep, isSaving, savedReturnId }}>
            <FormProvider {...methods}>
                <WizardLayout />
            </FormProvider>
        </WizardContext.Provider>
    );
}
