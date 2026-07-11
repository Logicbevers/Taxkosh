"use client"

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    ClipboardList,
    Users,
    Settings,
    Activity,
    GitBranch,
    UploadCloud,
} from "lucide-react";

const navigation = [
    { name: "Overview", href: "/dashboard/admin", icon: LayoutDashboard },
    { name: "Service requests", href: "/dashboard/admin/service-requests", icon: ClipboardList },
    { name: "Catalog", href: "/dashboard/admin/catalog", icon: GitBranch },
    { name: "Customers", href: "/dashboard/admin/customers", icon: Users },
    { name: "Bulk import", href: "/dashboard/admin/import", icon: UploadCloud },
    { name: "Audit logs", href: "/dashboard/admin/audit-logs", icon: Activity },
    { name: "Settings", href: "/dashboard/admin/settings", icon: Settings },
];

export function SidebarNav() {
    const pathname = usePathname();

    return (
        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-3">
            {navigation.map((item) => {
                const isActive =
                    pathname === item.href ||
                    (item.href !== "/dashboard/admin" && pathname.startsWith(item.href));
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            "flex items-center gap-2.5 rounded-[9px] px-3 py-2.5 text-[13.5px] transition-colors",
                            isActive
                                ? "bg-white/10 font-bold text-white"
                                : "font-medium text-[oklch(0.75_0.02_165)] hover:bg-white/[0.06] hover:text-white",
                        )}
                    >
                        <item.icon className="h-4 w-4" />
                        {item.name}
                    </Link>
                );
            })}
        </nav>
    );
}
