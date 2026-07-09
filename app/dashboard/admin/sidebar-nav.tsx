"use client"

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
    name: string;
    href: string;
    icon: LucideIcon;
}

import {
    LayoutDashboard,
    ClipboardList,
    Users,
    Settings,
    Activity,
    GitBranch,
    UploadCloud
} from "lucide-react";

export function SidebarNav() {
    const pathname = usePathname();

    const navigation = [
        { name: "Overview", href: "/dashboard/admin", icon: LayoutDashboard },
        { name: "Catalog", href: "/dashboard/admin/catalog", icon: GitBranch },
        { name: "Service Requests", href: "/dashboard/admin/service-requests", icon: ClipboardList },
        { name: "Customers", href: "/dashboard/admin/customers", icon: Users },
        { name: "Bulk Import", href: "/dashboard/admin/import", icon: UploadCloud },
        { name: "Audit Logs", href: "/dashboard/admin/audit-logs", icon: Activity },
        { name: "Settings", href: "/dashboard/admin/settings", icon: Settings },
    ];

    return (
        <nav className="flex-1 p-6 space-y-2 overflow-y-auto scrollbar-none">
            <p className="px-4 py-2 text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 mb-4">Core Operations</p>
            {navigation.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/dashboard/admin" && pathname.startsWith(item.href));
                
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            "flex items-center gap-3 px-4 py-3 rounded-2xl transition-all group relative overflow-hidden active:scale-95",
                            isActive 
                                ? "bg-white/[0.08] text-white shadow-lg shadow-black/20" 
                                : "text-slate-500 hover:bg-white/[0.04] hover:text-slate-200"
                        )}
                    >
                        {isActive && (
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-primary rounded-r-full shadow-[0_0_12px_rgba(var(--primary),0.5)]" />
                        )}
                        <item.icon className={cn(
                            "w-4 h-4 transition-colors duration-300",
                            isActive ? "text-primary" : "group-hover:text-primary"
                        )} />
                        <span className={cn(
                            "font-bold text-sm tracking-tight transition-all duration-300",
                            isActive ? "translate-x-1" : "group-hover:translate-x-1"
                        )}>
                            {item.name}
                        </span>
                    </Link>
                );
            })}
        </nav>
    );
}
