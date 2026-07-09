import { cn } from "@/lib/utils";

interface SkeletonProps {
    className?: string;
}

/** Generic skeleton block with shimmer animation. */
export function Skeleton({ className }: SkeletonProps) {
    return (
        <div
            className={cn(
                "animate-pulse rounded-md bg-slate-200/60 dark:bg-slate-800/60",
                className
            )}
        />
    );
}

interface TableSkeletonProps {
    /** Number of skeleton rows */
    rows?: number;
    /** Number of columns per row */
    columns?: number;
}

/** Skeleton placeholder for a data table while loading. */
export function TableSkeleton({ rows = 5, columns = 5 }: TableSkeletonProps) {
    return (
        <div className="space-y-3 p-6">
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                    {Array.from({ length: columns }).map((_, j) => (
                        <Skeleton
                            key={j}
                            className={cn(
                                "h-4",
                                j === 0 ? "w-1/4" : j === columns - 1 ? "w-16" : "flex-1"
                            )}
                        />
                    ))}
                </div>
            ))}
        </div>
    );
}

/** Skeleton card grid (for KPI placeholders). */
export function KpiSkeleton({ count = 4 }: { count?: number }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: count }).map((_, i) => (
                <div
                    key={i}
                    className="border-none shadow-2xl dark:bg-slate-900/50 rounded-3xl p-6 space-y-3"
                >
                    <Skeleton className="h-10 w-10 rounded-2xl" />
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-3 w-32" />
                </div>
            ))}
        </div>
    );
}
