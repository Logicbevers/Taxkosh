import Link from "next/link";
import { cn } from "@/lib/utils";

/** Pill switcher between the Log in and Create account screens. */
export function AuthTabs({ active }: { active: "login" | "signup" }) {
    const base =
        "flex-1 h-9 rounded-full text-[13px] font-bold inline-flex items-center justify-center transition-colors";
    const on = "bg-card text-foreground shadow-sm";
    const off = "text-muted-foreground hover:text-foreground";
    return (
        <div className="mb-8 flex rounded-full bg-muted p-1">
            <Link href="/login" className={cn(base, active === "login" ? on : off)}>
                Log in
            </Link>
            <Link href="/register" className={cn(base, active === "signup" ? on : off)}>
                Create account
            </Link>
        </div>
    );
}
