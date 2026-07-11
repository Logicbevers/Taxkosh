import { auth } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/logo";
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

    const initial = (session.user.name?.[0] ?? session.user.email?.[0] ?? "A").toUpperCase();

    return (
        <div className="flex h-[calc(100vh-64px)] overflow-hidden">
            {/* Dark emerald admin sidebar — signals internal/admin context */}
            <aside className="flex w-60 shrink-0 flex-col bg-[oklch(0.20_0.04_170)] text-white">
                <div className="flex items-center gap-2 border-b border-white/10 px-5 pb-5 pt-6">
                    <Link href="/dashboard/admin" className="inline-flex items-center gap-2">
                        <Logo size="sm" inverted />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[oklch(0.65_0.02_165)]">
                            Admin
                        </span>
                    </Link>
                </div>

                <SidebarNav />

                <div className="mt-auto border-t border-white/10 p-4">
                    <div className="flex items-center gap-3 px-1">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-strong text-[13px] font-extrabold text-accent-strong-foreground">
                            {initial}
                        </div>
                        <div className="flex min-w-0 flex-col">
                            <span className="truncate text-[13px] font-bold">{session.user.name ?? "Admin"}</span>
                            <span className="truncate text-[11px] text-[oklch(0.65_0.02_165)]">{session.user.email}</span>
                        </div>
                    </div>
                </div>
            </aside>

            <main className="flex-1 overflow-y-auto bg-background">{children}</main>
        </div>
    );
}
