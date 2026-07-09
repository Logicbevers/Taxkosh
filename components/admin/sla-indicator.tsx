import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export type SLAStatus = "HEALTHY" | "WARNING" | "CRITICAL" | "OVERDUE";

const STYLE_MAP: Record<SLAStatus, string> = {
    HEALTHY: "bg-slate-100 dark:bg-slate-800 text-slate-500",
    WARNING: "bg-amber-100 dark:bg-amber-900/30 text-amber-700",
    CRITICAL: "bg-rose-100 dark:bg-rose-900/30 text-rose-600 animate-pulse",
    OVERDUE: "bg-rose-500 text-white animate-pulse",
};

const LABEL_MAP: Record<SLAStatus, string> = {
    HEALTHY: "OK",
    WARNING: "WARN",
    CRITICAL: "BREACH",
    OVERDUE: "OVERDUE",
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
    return (
        <span
            className={cn(
                "inline-flex items-center gap-1 px-2 h-5 rounded-lg text-[9px] font-black tracking-widest uppercase border-none",
                STYLE_MAP[resolvedStatus],
                className
            )}
            title={`SLA elapsed ${hoursElapsed}h${slaLimitHours ? ` of ${slaLimitHours}h budget` : ""}`}
            data-sla={resolvedStatus}
        >
            <Clock className="w-2.5 h-2.5" />
            {hoursElapsed}h {LABEL_MAP[resolvedStatus]}
        </span>
    );
}
