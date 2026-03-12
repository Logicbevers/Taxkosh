import { auth } from "@/lib/auth";
import { signOut } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
    FileText, BarChart3, User, LogOut,
    Receipt, BadgeCheck, Shield
} from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function IndividualDashboard() {
    const session = await auth();
    if (!session) redirect("/login");

    // Fetch latest tax return for this user
    const taxReturn = await prisma.taxReturn.findFirst({
        where: { userId: session.user.id },
        orderBy: { updatedAt: "desc" },
    });

    // Derive display values from DB
    const itrStatus = taxReturn
        ? taxReturn.status === "SUBMITTED"
            ? "Submitted ✓"
            : taxReturn.status === "PROCESSED"
                ? "Processed ✓"
                : "Draft"
        : "Not Filed";

    const itrStatusColor =
        taxReturn?.status === "SUBMITTED" || taxReturn?.status === "PROCESSED"
            ? "text-emerald-500"
            : taxReturn?.status === "DRAFT"
                ? "text-sky-500"
                : "text-amber-500";

    const taxLiability = taxReturn?.netTaxLiability != null
        ? `₹${taxReturn.netTaxLiability.toLocaleString("en-IN")}`
        : "₹0";

    const refundStatus = taxReturn?.ackNumber
        ? `ACK: ${taxReturn.ackNumber}`
        : taxReturn
            ? "Awaiting submission"
            : "Pending filing";

    const stats = [
        { label: "ITR Status", value: itrStatus, sub: "FY 2024-25", color: itrStatusColor },
        { label: "Tax Liability", value: taxLiability, sub: taxReturn?.selectedRegime ? `${taxReturn.selectedRegime} Regime` : "Estimated", color: "text-foreground" },
        { label: "Refund Status", value: "—", sub: refundStatus, color: "text-muted-foreground" },
    ];

    return (
        <div className="min-h-screen bg-muted/20">
            {/* Sidebar + Main */}
            <div className="flex">
                {/* Sidebar */}
                <aside className="w-64 min-h-screen bg-card border-r border-border/60 flex flex-col p-4 gap-1">
                    <Link href="/" className="flex items-center gap-2 font-bold text-lg mb-6 px-2">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                            <FileText className="h-3.5 w-3.5" />
                        </span>
                        Tax<span className="text-primary">Kosh</span>
                    </Link>
                    <nav className="flex flex-col gap-1 flex-1">
                        {[
                            { icon: BarChart3, label: "Overview", href: "/dashboard/individual" },
                            { icon: FileText, label: "ITR Filing", href: "/dashboard/individual/itr-filing" },
                            { icon: Receipt, label: "Tax Planner", href: "#" },
                            { icon: User, label: "My Profile", href: "#" },
                        ].map(({ icon: Icon, label, href }) => (
                            <Link
                                key={label}
                                href={href}
                                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                            >
                                <Icon className="h-4 w-4" /> {label}
                            </Link>
                        ))}
                    </nav>
                    <form action={async () => {
                        "use server";
                        await signOut({ redirectTo: "/login" });
                    }}>
                        <Button type="submit" variant="ghost" size="sm" className="w-full justify-start gap-3 text-muted-foreground">
                            <LogOut className="h-4 w-4" /> Sign Out
                        </Button>
                    </form>
                </aside>

                {/* Main */}
                <main className="flex-1 p-8">
                    <div className="mb-8">
                        <p className="text-sm text-muted-foreground">Welcome back,</p>
                        <h1 className="text-2xl font-bold">{session.user.name ?? session.user.email}</h1>
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-primary/10 text-primary px-2.5 py-1 rounded-full mt-2">
                            <User className="h-3 w-3" /> Individual Taxpayer
                        </span>
                    </div>

                    {/* Quick Stats — Live from DB */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                        {stats.map((s) => (
                            <div key={s.label} className="bg-card border border-border/60 rounded-xl p-5">
                                <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
                                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">{s.sub}</p>
                            </div>
                        ))}
                    </div>

                    {/* Quick Actions */}
                    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Quick Actions</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[
                            {
                                icon: FileText,
                                label: taxReturn?.status === "DRAFT" ? "Continue ITR Filing" : "File ITR for FY 2024-25",
                                desc: "Due: July 31, 2025",
                                href: "/dashboard/individual/itr-filing"
                            },
                            { icon: BarChart3, label: "View Form 26AS", desc: "Check TDS credits", href: "#" },
                            { icon: BadgeCheck, label: "Book CA Consultation", desc: "30-min session free", href: "#" },
                            { icon: Shield, label: "Tax Calculator", desc: "Estimate liability", href: "#" },
                        ].map(({ icon: Icon, label, desc, href }) => (
                            <Link key={label} href={href} className="flex items-center gap-4 bg-card border border-border/60 hover:border-primary/30 rounded-xl p-4 text-left transition-all hover:shadow-sm group">
                                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                                    <Icon className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="font-medium text-sm">{label}</p>
                                    <p className="text-xs text-muted-foreground">{desc}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </main>
            </div>
        </div>
    );
}
