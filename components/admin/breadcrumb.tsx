import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Crumb {
    label: string;
    href?: string;
}

interface BreadcrumbProps {
    items: Crumb[];
    className?: string;
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
    return (
        <nav
            aria-label="Breadcrumb"
            className={cn(
                "flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400",
                className
            )}
        >
            {items.map((item, i) => {
                const isLast = i === items.length - 1;
                return (
                    <span key={i} className="flex items-center gap-1.5">
                        {item.href && !isLast ? (
                            <Link
                                href={item.href}
                                className="hover:text-primary transition-colors"
                            >
                                {item.label}
                            </Link>
                        ) : (
                            <span className={isLast ? "text-slate-900 dark:text-white" : ""}>
                                {item.label}
                            </span>
                        )}
                        {!isLast && <ChevronRight className="w-3 h-3 opacity-40" />}
                    </span>
                );
            })}
        </nav>
    );
}
