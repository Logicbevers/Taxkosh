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

// Tint-fill + solid-text pills using the brand status tokens.
const STYLE_MAP: Record<StatusKind, string> = {
    COMPLETED: "bg-status-healthy/15 text-status-healthy",
    FILED: "bg-status-healthy/15 text-status-healthy",
    ACTIVE: "bg-status-healthy/15 text-status-healthy",

    PAID: "bg-primary/12 text-primary",
    READY_FOR_FILING: "bg-primary/12 text-primary",

    UNDER_PROCESS: "bg-status-pending/15 text-status-pending",
    IN_PROGRESS: "bg-status-pending/15 text-status-pending",
    DOCUMENTS_SUBMITTED: "bg-status-pending/15 text-status-pending",

    CLARIFICATION_REQUIRED: "bg-status-pending/15 text-status-pending",
    DOCUMENTS_PENDING: "bg-status-pending/15 text-status-pending",
    PAYMENT_PENDING: "bg-status-pending/15 text-status-pending",
    PENDING: "bg-status-pending/15 text-status-pending",

    CREATED: "bg-muted text-muted-foreground",
    INACTIVE: "bg-muted text-muted-foreground",

    REJECTED: "bg-destructive/12 text-destructive",
    OVERDUE: "bg-destructive/12 text-destructive",
};

interface StatusBadgeProps {
    status: StatusKind | string;
    className?: string;
    children?: React.ReactNode;
}

// "UNDER_PROCESS" → "Under process"
function sentenceCase(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase().replace(/_/g, " ");
}

export function StatusBadge({ status, className, children }: StatusBadgeProps) {
    const style = STYLE_MAP[status as StatusKind] ?? "bg-muted text-muted-foreground";
    const label = children ?? sentenceCase(status);
    return (
        <span
            className={cn(
                "inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold",
                style,
                className
            )}
            data-status={status}
        >
            {label}
        </span>
    );
}
