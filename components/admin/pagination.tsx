"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
    page: number;
    total: number;
    limit: number;
    onPageChange: (page: number) => void;
    /** Label like "requests", "customers", "logs" */
    itemLabel?: string;
}

export function Pagination({ page, total, limit, onPageChange, itemLabel = "items" }: PaginationProps) {
    const totalPages = Math.ceil(total / limit);
    if (totalPages <= 1) return null;

    // Sliding window: try to keep 5 page buttons visible, centered around `page`
    const windowSize = Math.min(5, totalPages);
    let start = Math.max(1, page - Math.floor(windowSize / 2));
    const end = Math.min(totalPages, start + windowSize - 1);
    start = Math.max(1, end - windowSize + 1);
    const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);

    return (
        <div className="flex items-center justify-between px-10 py-6 border-t border-slate-100 dark:border-slate-800">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Page {page} of {totalPages} · {total} total {itemLabel}
            </p>
            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 rounded-xl"
                    onClick={() => onPageChange(Math.max(1, page - 1))}
                    disabled={page === 1}
                    aria-label="Previous page"
                >
                    <ChevronLeft className="w-4 h-4" />
                </Button>
                {pages.map(p => (
                    <Button
                        key={p}
                        variant={p === page ? "default" : "outline"}
                        size="icon"
                        className="h-9 w-9 rounded-xl text-xs font-black"
                        onClick={() => onPageChange(p)}
                        aria-label={`Page ${p}`}
                        aria-current={p === page ? "page" : undefined}
                    >
                        {p}
                    </Button>
                ))}
                <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 rounded-xl"
                    onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    aria-label="Next page"
                >
                    <ChevronRight className="w-4 h-4" />
                </Button>
            </div>
        </div>
    );
}
