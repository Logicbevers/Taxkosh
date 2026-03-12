import { auth } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
    LayoutDashboard,
    ClipboardList,
    Users,
    Settings,
    ShieldAlert
} from "lucide-react";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();
    const userRole = session?.user?.role;

    const allowedRoles: UserRole[] = [UserRole.ADMIN, UserRole.TAX_EXECUTIVE, UserRole.SENIOR_REVIEWER];
    if (!session?.user?.id || !allowedRoles.includes(userRole as UserRole)) {
        redirect("/dashboard");
    }

    const navigation = [
        { name: "Overview", href: "/dashboard/admin", icon: LayoutDashboard },
        { name: "Service Requests", href: "/dashboard/admin/services", icon: ClipboardList },
        { name: "Team Management", href: "/dashboard/admin/team", icon: Users },
        { name: "Settings", href: "/dashboard/admin/settings", icon: Settings },
    ];

    return (
        <div className="flex min-h-screen">
            {/* Admin Sidebar */}
            <aside className="w-64 bg-slate-900 text-white flex flex-col shrink-0 border-r border-slate-800">
                <div className="p-6 border-b border-slate-800 flex items-center gap-2">
                    <ShieldAlert className="w-6 h-6 text-primary" />
                    <span className="font-bold text-xl tracking-tight">Ops Center</span>
                </div>
                <nav className="flex-1 p-4 space-y-1">
                    {navigation.map((item) => (
                        <Link
                            key={item.name}
                            href={item.href}
                            className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-all group"
                        >
                            <item.icon className="w-5 h-5 group-hover:text-primary" />
                            <span className="font-medium">{item.name}</span>
                        </Link>
                    ))}
                </nav>
                <div className="p-4 border-t border-slate-800">
                    <div className="flex items-center gap-3 px-4 py-2">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold uppercase">
                            {session.user.name?.[0] || session.user.email?.[0]}
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-sm font-medium truncate">{session.user.name || "Admin"}</span>
                            <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">{userRole}</span>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 bg-slate-50/50 dark:bg-slate-950 overflow-auto">
                {children}
            </main>
        </div>
    );
}
