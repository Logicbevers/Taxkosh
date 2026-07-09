import { cn } from "@/lib/utils";

export type StatusKind =
    // Service request statuses
    | "CREATED"
    | "PAYMENT_PENDING"
    | "PAID"
    | "DOCUMENTS_PENDING"
    | "DOCUMENTS_SUBMITTED"
    | "UNDER_PROCESS"
    | "CLARIFICATION_REQUIRED"
    | "READY_FOR_FILING"
    | "FILED"
    | "COMPLETED"
    | "REJECTED"
    // Generic entity statuses
    | "ACTIVE"
    | "INACTIVE"
    | "PENDING"
    | "OVERDUE"
    | "IN_PROGRESS";

const STYLE_MAP: Record<StatusKind, string> = {
    // Success
    COMPLETED: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    FILED: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    ACTIVE: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",

    // Info / payment
    PAID: "bg-teal-500/10 text-teal-600 border-teal-500/20",
    READY_FOR_FILING: "bg-blue-500/10 text-blue-600 border-blue-500/20",

    // In progress
    UNDER_PROCESS: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
    IN_PROGRESS: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
    DOCUMENTS_SUBMITTED: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",

    // Warning
    CLARIFICATION_REQUIRED: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    DOCUMENTS_PENDING: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    PAYMENT_PENDING: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    PENDING: "bg-amber-500/10 text-amber-600 border-amber-500/20",

    // Neutral
    CREATED: "bg-slate-500/10 text-slate-500 border-slate-500/20",
    INACTIVE: "bg-slate-500/10 text-slate-500 border-slate-500/20",

    // Danger
    REJECTED: "bg-rose-500/10 text-rose-600 border-rose-500/20",
    OVERDUE: "bg-rose-500/10 text-rose-600 border-rose-500/20 animate-pulse",
};

interface StatusBadgeProps {
    status: StatusKind | string;
    className?: string;
    children?: React.ReactNode;
}

export function StatusBadge({ status, className, children }: StatusBadgeProps) {
    const style = STYLE_MAP[status as StatusKind] ?? "bg-slate-500/10 text-slate-500 border-slate-500/20";
    const label = children ?? status.replace(/_/g, " ");
    return (
        <span
            className={cn(
                "inline-flex items-center px-3 h-6 text-[9px] font-black tracking-wide uppercase whitespace-nowrap border-2 rounded-xl",
                style,
                className
            )}
            data-status={status}
        >
            {label}
        </span>
    );
}
