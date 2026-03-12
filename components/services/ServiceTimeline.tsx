import { CheckCircle2, Circle, Clock, AlertCircle, FileCheck } from "lucide-react";
import { ServiceRequestStatus } from "@prisma/client";
import { cn } from "@/lib/utils";

interface Step {
    status: ServiceRequestStatus;
    label: string;
    description: string;
}

const steps: Step[] = [
    { status: ServiceRequestStatus.PENDING_PAYMENT, label: "Payment", description: "Service initiated" },
    { status: ServiceRequestStatus.PAYMENT_CONFIRMED, label: "Confirmed", description: "Payment verified" },
    { status: ServiceRequestStatus.DOCUMENTS_SUBMITTED, label: "Submitted", description: "Documents received" },
    { status: ServiceRequestStatus.UNDER_REVIEW, label: "Review", description: "Expert is checking" },
    { status: ServiceRequestStatus.FILED, label: "Filed", description: "Govt acknowledgement" },
];

export function ServiceTimeline({ currentStatus }: { currentStatus: ServiceRequestStatus }) {
    // Treat "CLARIFICATION_REQUIRED" as a sub-state of "UNDER_REVIEW" for the main line
    // but we will highlight it specially if active.

    const getStepState = (stepStatus: ServiceRequestStatus, index: number) => {
        const statusOrder = steps.map(s => s.status);
        const currentIndex = statusOrder.indexOf(
            currentStatus === ServiceRequestStatus.CLARIFICATION_REQUIRED
                ? ServiceRequestStatus.UNDER_REVIEW
                : currentStatus
        );
        const stepIndex = index;

        if (currentStatus === ServiceRequestStatus.REJECTED) return "rejected";
        if (stepIndex < currentIndex) return "completed";
        if (stepIndex === currentIndex) return "current";
        return "upcoming";
    };

    return (
        <div className="relative flex justify-between w-full max-w-4xl mx-auto py-8 px-4">
            {/* Background Line */}
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-muted -translate-y-1/2 z-0" />

            {steps.map((step, idx) => {
                const state = getStepState(step.status, idx);
                const isClarification = step.status === ServiceRequestStatus.UNDER_REVIEW && currentStatus === ServiceRequestStatus.CLARIFICATION_REQUIRED;

                return (
                    <div key={step.status} className="relative z-10 flex flex-col items-center group">
                        <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                            state === "completed" && "bg-emerald-500 border-emerald-500 text-white",
                            state === "current" && !isClarification && "bg-primary border-primary text-primary-foreground animate-pulse",
                            state === "current" && isClarification && "bg-amber-500 border-amber-500 text-white",
                            state === "upcoming" && "bg-background border-muted text-muted-foreground",
                            state === "rejected" && "bg-destructive border-destructive text-white"
                        )}>
                            {state === "completed" ? <CheckCircle2 className="w-5 h-5" /> :
                                isClarification ? <AlertCircle className="w-5 h-5" /> :
                                    <Circle className="w-5 h-5 fill-current" />}
                        </div>

                        <div className="absolute top-12 flex flex-col items-center min-w-[120px] text-center">
                            <span className={cn(
                                "text-xs font-bold uppercase tracking-wider mb-1",
                                state === "current" ? "text-foreground" : "text-muted-foreground"
                            )}>
                                {step.label}
                            </span>
                            <span className="text-[10px] text-muted-foreground leading-tight">
                                {isClarification ? "Action Required" : step.description}
                            </span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
