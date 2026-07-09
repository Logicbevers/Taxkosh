import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ServiceCatalog } from "./service-catalog"
import { Calendar, FileText, ChevronRight, Briefcase } from "lucide-react"

const STATUS_COLORS: Record<string, string> = {
    CREATED: "bg-slate-500/10 text-slate-600 border-slate-500/20",
    PAYMENT_PENDING: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    PAID: "bg-green-500/10 text-green-600 border-green-500/20",
    DOCUMENTS_PENDING: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
    DOCUMENTS_SUBMITTED: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    UNDER_PROCESS: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
    CLARIFICATION_REQUIRED: "bg-orange-500/10 text-orange-600 border-orange-500/20",
    READY_FOR_FILING: "bg-teal-500/10 text-teal-600 border-teal-500/20",
    FILED: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    COMPLETED: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    REJECTED: "bg-rose-500/10 text-rose-600 border-rose-500/20",
};

export default async function ServicesDashboard() {
    const session = await auth()
    if (!session?.user?.id) {
        redirect("/login")
    }

    // Fetch dynamic category hierarchy
    const categories = await prisma.category.findMany({
        where: { status: "active" },
        include: {
            subCategories: {
                where: { status: "active" },
                include: {
                    services: {
                        where: { status: "active" },
                        include: {
                            plans: {
                                where: { status: "active" },
                                orderBy: { price: "asc" }
                            }
                        }
                    }
                }
            }
        },
        orderBy: { displayOrder: "asc" }
    });

    const requests = await prisma.serviceRequest.findMany({
        where: { userId: session.user.id },
        include: {
            service: true,
            plan: true,
            documents: true
        },
        orderBy: { createdAt: "desc" },
    })

    return (
        <div className="container p-6 space-y-12 max-w-7xl mx-auto">
            <div>
                <h1 className="text-4xl font-black tracking-tight bg-gradient-to-br from-slate-900 to-slate-500 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">Compliance Hub</h1>
                <p className="text-muted-foreground mt-2 font-medium">
                    Initiate new workflows or track your ongoing compliance tasks.
                </p>
            </div>

            {/* Dynamic Catalog Selection */}
            <div className="bg-slate-50/50 dark:bg-slate-900/20 border border-slate-100 dark:border-slate-800 rounded-3xl p-8">
                <ServiceCatalog categories={categories} />
            </div>

            <div className="space-y-6 pt-8 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-black tracking-tight">Active Workflows</h2>
                    {requests.length > 0 && (
                        <Badge variant="outline" className="font-mono text-xs uppercase tracking-widest">{requests.length} Total</Badge>
                    )}
                </div>
                
                {requests.length === 0 ? (
                    <div className="text-center py-20 border-2 rounded-[2rem] border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20">
                        <div className="h-16 w-16 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm border border-slate-100 dark:border-slate-700">
                            <Briefcase className="w-8 h-8 text-slate-300" />
                        </div>
                        <p className="font-black text-sm uppercase tracking-widest text-slate-400">Zero Active Workflows</p>
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {requests.map((req) => (
                            <Link key={req.id} href={`/dashboard/services/${req.id}`} className="block group">
                                <Card className="hover:border-primary/50 transition-all hover:shadow-lg focus-within:ring-2 focus-within:ring-primary/20 h-full flex flex-col p-6 rounded-3xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl group-hover:bg-primary/10 transition-colors">
                                            <FileText className="w-5 h-5 text-slate-400 group-hover:text-primary transition-colors" />
                                        </div>
                                        <Badge variant="outline" className={`font-black text-[9px] uppercase tracking-widest px-3 h-6 rounded-xl border ${STATUS_COLORS[req.status] || "bg-slate-100 text-slate-600"}`}>
                                            {req.status.replace(/_/g, " ")}
                                        </Badge>
                                    </div>
                                    
                                    <h3 className="font-bold text-lg leading-tight mb-2 group-hover:text-primary transition-colors">
                                        {req.service?.name || "Managed Service"}
                                    </h3>
                                    
                                    <div className="mt-auto pt-4 flex flex-col gap-2">
                                        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                                            <Calendar className="w-3.5 h-3.5" />
                                            <span>Initiated {req.createdAt.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                        </div>
                                        
                                        <div className="flex items-center justify-between border-t border-dashed pt-3 mt-1">
                                            <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">
                                                {req.plan?.planName || "SYSTEM TIER"}
                                            </span>
                                            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                                        </div>
                                    </div>
                                </Card>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
