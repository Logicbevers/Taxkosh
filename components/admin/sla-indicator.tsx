import { cn } from "@/lib/utils";

export type SLAStatus = "HEALTHY" | "WARNING" | "CRITICAL" | "OVERDUE";

// Dot + label using status tokens (calm design — no heavy pill).
const STYLE_MAP: Record<SLAStatus, string> = {
    HEALTHY: "text-status-healthy",
    WARNING: "text-status-warning",
    CRITICAL: "text-destructive",
    OVERDUE: "text-destructive",
};

const LABEL_MAP: Record<SLAStatus, string> = {
    HEALTHY: "Healthy",
    WARNING: "Warning",
    CRITICAL: "Critical",
    OVERDUE: "Overdue",
};

interface SLAIndicatorProps {
    /** Hours elapsed since SLA clock started */
    hoursElapsed: number;
    /** Pre-computed status (preferred) */
    status?: SLAStatus;
    /** Or pass a deadline + SLA window to auto-compute status */
    slaLimitHours?: number;
    className?: string;
}

export function computeSlaStatus(hoursElapsed: number, slaLimitHours: number): SLAStatus {
    if (hoursElapsed >= slaLimitHours) return "OVERDUE";
    if (hoursElapsed > slaLimitHours * 0.9) return "CRITICAL";
    if (hoursElapsed > slaLimitHours * 0.75) return "WARNING";
    return "HEALTHY";
}

export function SLAIndicator({ hoursElapsed, status, slaLimitHours, className }: SLAIndicatorProps) {
    const resolvedStatus: SLAStatus =
        status ?? (slaLimitHours != null ? computeSlaStatus(hoursElapsed, slaLimitHours) : "HEALTHY");
    const critical = resolvedStatus === "CRITICAL" || resolvedStatus === "OVERDUE";
    return (
        <span
            className={cn(
                "inline-flex items-center gap-1.5 text-[11px] font-bold",
                STYLE_MAP[resolvedStatus],
                className
            )}
            title={`SLA elapsed ${hoursElapsed}h${slaLimitHours ? ` of ${slaLimitHours}h budget` : ""}`}
            data-sla={resolvedStatus}
        >
            <span className={cn("h-[7px] w-[7px] rounded-full bg-current", critical && "animate-pulse")} />
            {LABEL_MAP[resolvedStatus]}
        </span>
    );
}
