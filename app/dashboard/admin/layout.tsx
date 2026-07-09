import { auth } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
    LayoutDashboard,
    ClipboardList,
    Users,
    Settings,
    ShieldAlert,
    Layers,
    Briefcase,
    Activity
} from "lucide-react";
import { SidebarNav } from "./sidebar-nav";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();
    const userRole = session?.user?.role;
    if (!session?.user?.id || userRole !== UserRole.ADMIN) {
        redirect("/dashboard");
    }

    return (
        <div className="flex bg-slate-900 border-x border-slate-800 h-[calc(100vh-64px)] overflow-hidden">
            {/* Admin Sidebar */}
            <aside className="w-64 bg-slate-900 text-white flex flex-col shrink-0 border-r border-slate-800 shadow-2xl z-10 relative">
                {/* Visual Accent */}
                <div className="absolute top-0 right-0 w-[1px] h-full bg-gradient-to-b from-primary/50 via-transparent to-primary/50 opacity-20" />
                
                <div className="p-8 border-b border-white/[0.05] flex items-center gap-3">
                    <div className="bg-primary/20 p-2 rounded-xl border border-primary/30">
                        <ShieldAlert className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <span className="block font-black text-xs uppercase tracking-[0.3em] opacity-40">TaxKosh</span>
                        <span className="block font-bold text-lg leading-tight tracking-tight">Admin OS</span>
                    </div>
                </div>

                <SidebarNav />

                <div className="p-6 border-t border-white/[0.05] bg-black/20">
                    <div className="flex items-center gap-4 px-2">
                        <div className="relative">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-primary-foreground p-[1px]">
                                <div className="w-full h-full rounded-2xl bg-slate-900 flex items-center justify-center text-primary text-sm font-black uppercase">
                                    {session.user.name?.[0] || session.user.email?.[0]}
                                </div>
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-900" />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-sm font-bold truncate opacity-90">{session.user.name || "Admin User"}</span>
                            <span className="text-[10px] text-primary/70 font-black uppercase tracking-widest">{userRole} Node</span>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 bg-slate-50/50 dark:bg-slate-950 overflow-y-auto">
                {children}
            </main>
        </div>
    );
}
