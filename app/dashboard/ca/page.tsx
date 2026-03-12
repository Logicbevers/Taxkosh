import { auth, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FileText, Users, BarChart3, LogOut, BadgeCheck } from "lucide-react";
import Link from "next/link";

export default async function CADashboard() {
    const session = await auth();
    if (!session) redirect("/login");

    return (
        <div className="min-h-screen bg-muted/20 flex">
            <aside className="w-64 min-h-screen bg-card border-r border-border/60 flex flex-col p-4 gap-1">
                <Link href="/" className="flex items-center gap-2 font-bold text-lg mb-6 px-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                        <FileText className="h-3.5 w-3.5" />
                    </span>
                    Tax<span className="text-primary">Kosh</span>
                </Link>
                <nav className="flex flex-col gap-1 flex-1">
                    {[
                        { icon: BarChart3, label: "Client Overview", href: "/dashboard/ca" },
                        { icon: Users, label: "My Clients", href: "#" },
                        { icon: FileText, label: "Bulk Filing", href: "#" },
                        { icon: BadgeCheck, label: "Review Queue", href: "#" },
                    ].map(({ icon: Icon, label, href }) => (
                        <Link key={label} href={href} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                            <Icon className="h-4 w-4" /> {label}
                        </Link>
                    ))}
                </nav>
                <form action={async () => { "use server"; await signOut({ redirectTo: "/login" }); }}>
                    <Button type="submit" variant="ghost" size="sm" className="w-full justify-start gap-3 text-muted-foreground">
                        <LogOut className="h-4 w-4" /> Sign Out
                    </Button>
                </form>
            </aside>

            <main className="flex-1 p-8">
                <div className="mb-8">
                    <p className="text-sm text-muted-foreground">CA Pro Dashboard</p>
                    <h1 className="text-2xl font-bold">{session.user.name ?? session.user.email}</h1>
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-full mt-2">
                        <BadgeCheck className="h-3 w-3" /> Chartered Accountant
                    </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
                    {[
                        { label: "Total Clients", value: "0", sub: "Add your first client" },
                        { label: "Filings Pending", value: "0", sub: "This month" },
                        { label: "Filings Done", value: "0", sub: "FY 2024-25" },
                        { label: "Review Queue", value: "0", sub: "Awaiting sign-off" },
                    ].map((s) => (
                        <div key={s.label} className="bg-card border border-border/60 rounded-xl p-5">
                            <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
                            <p className="text-2xl font-bold text-primary">{s.value}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{s.sub}</p>
                        </div>
                    ))}
                </div>
                <div className="bg-card border border-border/60 rounded-xl p-6 text-center py-12">
                    <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" />
                    <p className="font-medium text-muted-foreground">No clients yet</p>
                    <p className="text-sm text-muted-foreground/60 mt-1">Import existing clients or invite them to join TaxKosh</p>
                    <Button className="mt-4" size="sm">Add First Client</Button>
                </div>
            </main>
        </div>
    );
}
