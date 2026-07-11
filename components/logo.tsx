import { cn } from "@/lib/utils";

interface LogoProps {
    /** Icon + wordmark sizing. */
    size?: "sm" | "md" | "lg";
    /** Use on dark surfaces (hero, footer, admin sidebar) — lightens the "Tax" text. */
    inverted?: boolean;
    /** Show the emerald ₹ mark. */
    showMark?: boolean;
    className?: string;
}

const SIZES = {
    sm: { box: "h-6 w-6 rounded-[7px]", rupee: "text-[13px]", word: "text-[15px]" },
    md: { box: "h-[30px] w-[30px] rounded-[9px]", rupee: "text-[15px]", word: "text-[17px]" },
    lg: { box: "h-10 w-10 rounded-xl", rupee: "text-[20px]", word: "text-2xl" },
} as const;

/**
 * TaxKosh wordmark: an emerald rounded-square ₹ mark beside "Tax" (Manrope) +
 * "कोष" in amber (Devanagari / Hind). The single source of truth for the brand
 * lockup — render it inside a <Link> where a clickable logo is needed.
 */
export function Logo({ size = "md", inverted = false, showMark = true, className }: LogoProps) {
    const s = SIZES[size];
    return (
        <span className={cn("inline-flex items-center gap-2.5 font-bold tracking-tight select-none", className)}>
            {showMark && (
                <span className={cn(
                    "flex items-center justify-center shrink-0",
                    s.box,
                    // On dark surfaces the emerald mark would blend in, so use the amber mark.
                    inverted ? "bg-accent-strong text-accent-strong-foreground" : "bg-primary text-primary-foreground",
                )}>
                    <span className={cn("font-sans font-bold leading-none", s.rupee)}>₹</span>
                </span>
            )}
            <span className={cn("font-sans font-bold leading-none", s.word, inverted ? "text-white" : "text-foreground")}>
                Tax<span className="font-hind text-accent-strong font-bold">कोष</span>
            </span>
        </span>
    );
}
