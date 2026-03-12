import { auth, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { FileText, Receipt, BarChart3, Building2, LogOut, Users, Settings, ShoppingBag, ArrowRight, Plus } from "lucide-react";
import Link from "next/link";
import { GstSummaryChart } from "@/components/gst/summary-chart";

export default async function BusinessDashboard() {
    const session = await auth();
    if (!session) redirect("/login");

    const profile = await prisma.gstProfile.findUnique({
        where: { userId: session.user.id }
    });

    const isGstSetup = !!profile;

    // Fetch this month's data implicitly (or overall for demo if not many records)
    // To make the chart look good, we aggregate all invoices by type
    const salesAgg = await prisma.invoice.aggregate({
        _sum: { totalAmount: true, totalCgst: true, totalSgst: true, totalIgst: true },
        where: { userId: session.user.id, type: 'SALES' }
    });

    const purchasesAgg = await prisma.invoice.aggregate({
        _sum: { totalAmount: true, totalCgst: true, totalSgst: true, totalIgst: true },
        where: { userId: session.user.id, type: 'PURCHASE' }
    });

    const salesTax = (salesAgg._sum.totalCgst || 0) + (salesAgg._sum.totalSgst || 0) + (salesAgg._sum.totalIgst || 0);
    const itc = (purchasesAgg._sum.totalCgst || 0) + (purchasesAgg._sum.totalSgst || 0) + (purchasesAgg._sum.totalIgst || 0);
    const netPayable = salesTax - itc > 0 ? salesTax - itc : 0;

    const chartData = [
        { name: "Current Period", liability: salesTax, itc: itc, payable: netPayable }
    ];

    return (
        <div className="min-h-screen bg-muted/20 flex flex-col md:flex-row">
            {/* Sidebar */}
            <aside className="w-full md:w-64 md:min-h-screen bg-card border-r border-border/60 flex flex-col p-4 gap-1 shrink-0">
                <Link href="/" className="flex items-center gap-2 font-bold text-lg mb-6 px-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                        <FileText className="h-3.5 w-3.5" />
                    </span>
                    Tax<span className="text-primary">Kosh</span>
                </Link>
                <nav className="flex flex-col gap-1 flex-1">
                    {[
                        { icon: BarChart3, label: "Overview", href: "/dashboard/business" },
                        { icon: Settings, label: "GST Details", href: "/dashboard/business/profile" },
                        { icon: Receipt, label: "Sales (GSTR-1)", href: "/dashboard/business/sales" },
                        { icon: ShoppingBag, label: "Purchases (ITC)", href: "/dashboard/business/purchases" },
                        { icon: FileText, label: "File Returns", href: "/dashboard/business/returns" },
                    ].map(({ icon: Icon, label, href }) => (
                        <Link key={label} href={href} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                            <Icon className="h-4 w-4" /> {label}
                        </Link>
                    ))}
                </nav>
                <form action={async () => { "use server"; await signOut({ redirectTo: "/login" }); }}>
                    <Button type="submit" variant="ghost" size="sm" className="w-full justify-start gap-3 text-muted-foreground mt-4 md:mt-0">
                        <LogOut className="h-4 w-4" /> Sign Out
                    </Button>
                </form>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-6 md:p-8 overflow-y-auto">
                <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <p className="text-sm text-muted-foreground">Business Dashboard</p>
                        <h1 className="text-2xl font-bold">{profile?.legalName || session.user.name || session.user.email}</h1>
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-violet-500/10 text-violet-600 dark:text-violet-400 px-2.5 py-1 rounded-full mt-2">
                            <Building2 className="h-3 w-3" /> {isGstSetup ? `GSTIN: ${profile.gstin}` : "Business Owner"}
                        </span>
                    </div>

                    {!isGstSetup && (
                        <Button asChild variant="outline" className="border-amber-500/50 text-amber-600 dark:text-amber-500 hover:bg-amber-500/10 gap-2">
                            <Link href="/dashboard/business/profile">
                                Set Up GSTIN <ArrowRight className="h-4 w-4" />
                            </Link>
                        </Button>
                    )}
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {[
                        { label: "Total Sales", value: `₹${(salesAgg._sum.totalAmount || 0).toLocaleString()}`, color: "text-foreground" },
                        { label: "Tax Liability", value: `₹${salesTax.toLocaleString()}`, color: "text-red-500" },
                        { label: "Input Tax Credit (ITC)", value: `₹${itc.toLocaleString()}`, color: "text-emerald-500" },
                        { label: "Net GST Payable", value: `₹${netPayable.toLocaleString()}`, color: "text-blue-500 font-extrabold" },
                    ].map((s) => (
                        <div key={s.label} className="bg-card border border-border/60 rounded-xl p-5 hover:border-primary/30 transition-colors">
                            <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
                            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Chart Area */}
                    <div className="lg:col-span-2 bg-card border border-border/60 rounded-xl p-6">
                        <h2 className="font-semibold mb-6 flex items-center justify-between">
                            Tax Liability vs ITC (Current Period)
                            <Button asChild variant="ghost" size="sm" className="h-8 text-xs">
                                <Link href="/dashboard/business/returns">View Returns</Link>
                            </Button>
                        </h2>
                        <GstSummaryChart data={salesTax || itc ? chartData : []} />
                    </div>

                    {/* Quick Links / Status Area */}
                    <div className="bg-card border border-border/60 rounded-xl p-6 flex flex-col">
                        <h2 className="font-semibold mb-4">Pending Filings</h2>
                        <div className="space-y-3 flex-1">
                            {[
                                { task: "GSTR-1", due: "11th of month", status: "Pending", link: "/dashboard/business/returns" },
                                { task: "GSTR-3B", due: "20th of month", status: "Pending", link: "/dashboard/business/returns" },
                            ].map((d) => (
                                <Link key={d.task} href={d.link} className="flex items-center justify-between py-3 border-b border-border/40 last:border-0 hover:bg-muted/30 px-2 -mx-2 rounded transition-colors group">
                                    <div>
                                        <p className="text-sm font-medium group-hover:text-primary transition-colors">{d.task}</p>
                                        <p className="text-xs text-muted-foreground">{d.due}</p>
                                    </div>
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-500">
                                        {d.status}
                                    </span>
                                </Link>
                            ))}
                        </div>
                        <Button asChild className="w-full mt-4 gap-2">
                            <Link href="/dashboard/business/sales"><Plus className="h-4 w-4" /> Add Sales Invoice</Link>
                        </Button>
                        <Button asChild variant="outline" className="w-full mt-2 gap-2">
                            <Link href="/dashboard/business/purchases"><Plus className="h-4 w-4" /> Add Purchase</Link>
                        </Button>
                    </div>
                </div>
            </main>
        </div>
    );
}
