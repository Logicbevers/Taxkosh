"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/logo";
import { NotificationBell } from "./NotificationBell";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
    Sheet, 
    SheetContent, 
    SheetHeader, 
    SheetTitle, 
    SheetTrigger 
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { signOut } from "next-auth/react";

interface User {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
}

function isActive(pathname: string, href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname === href || pathname.startsWith(href + "/");
}

export function DashboardHeader({ user }: { user: User }) {
    const pathname = usePathname() ?? "/dashboard";
    // Radix widgets (Sheet, DropdownMenu) generate useId-based ids that differ
    // between SSR and client (next-themes shifts the fiber counter), so mount
    // them only after hydration to avoid an id mismatch.
    const [mounted, setMounted] = useState(false);
    // Deliberate: the one-shot hydration flag described above, not derived state. It
    // sets once on mount, so the cascading render this rule guards against can't occur.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    useEffect(() => setMounted(true), []);
    const linkClass = (href: string) =>
        cn(
            "transition-colors hover:text-primary",
            isActive(pathname, href) && "text-primary font-bold underline underline-offset-4"
        );
    return (
        <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75">
            <div className="container flex h-16 items-center justify-between">
                <div className="flex items-center gap-4">
                    {/* Mobile Menu — Radix, gated behind mount */}
                    {!mounted ? (
                        <div className="md:hidden size-9" aria-hidden />
                    ) : (
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="md:hidden">
                                <Menu className="h-5 w-5" />
                                <span className="sr-only">Toggle menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-[300px] sm:w-[400px]">
                            <SheetHeader className="text-left">
                                <SheetTitle className="flex items-center">
                                    <Logo size="md" />
                                </SheetTitle>
                            </SheetHeader>
                            <nav className="flex flex-col gap-4 mt-8 text-lg font-medium">
                                <Link href="/dashboard" className={linkClass("/dashboard")}>Dashboard</Link>
                                {user.role === "ADMIN" && (
                                    <Link href="/dashboard/admin" className={linkClass("/dashboard/admin")}>Admin OPS</Link>
                                )}
                                {user.role === "CA" && (
                                    <Link href="/dashboard/ca" className={linkClass("/dashboard/ca")}>CA Hub</Link>
                                )}
                                {(user.role === "INDIVIDUAL" || user.role === "BUSINESS") && (
                                    <>
                                        <Link href="/dashboard/services" className={linkClass("/dashboard/services")}>My Services</Link>
                                        {user.role === "INDIVIDUAL" && (
                                            <Link href="/dashboard/individual/itr-filing" className={linkClass("/dashboard/individual/itr-filing")}>File ITR</Link>
                                        )}
                                        {user.role === "BUSINESS" && (
                                            <Link href="/dashboard/business" className={linkClass("/dashboard/business")}>Business Hub</Link>
                                        )}
                                    </>
                                )}
                                <div className="pt-4 border-t mt-4 flex flex-col gap-4">
                                    <Link href="/dashboard/profile" className="text-sm text-muted-foreground hover:text-foreground">Profile Settings</Link>
                                    <Link href="/dashboard/notifications" className="text-sm text-muted-foreground hover:text-foreground">Notifications</Link>
                                </div>
                            </nav>
                        </SheetContent>
                    </Sheet>
                    )}

                    {/* Home, not /dashboard: the logo was the only plausible way back to the
                        public site and it pointed at the page you were already on, leaving no
                        route out of the dashboard. The nav below still links to /dashboard. */}
                    <Link href="/" className="flex items-center" aria-label="TaxKosh home">
                        <Logo size="md" className="[&>span:last-child]:hidden sm:[&>span:last-child]:inline-flex" />
                    </Link>

                    <nav className="hidden md:flex items-center gap-6 text-sm font-medium ml-4">
                        <Link href="/dashboard" className={linkClass("/dashboard")}>Dashboard</Link>
                        {user.role === "ADMIN" && (
                            <Link href="/dashboard/admin" className={linkClass("/dashboard/admin")}>
                                Admin OPS
                            </Link>
                        )}
                        {user.role === "CA" && (
                            <Link href="/dashboard/ca" className={linkClass("/dashboard/ca")}>CA Client Hub</Link>
                        )}
                        {(user.role === "INDIVIDUAL" || user.role === "BUSINESS") && (
                            <>
                                <Link href="/dashboard/services" className={linkClass("/dashboard/services")}>My Services</Link>
                                {user.role === "INDIVIDUAL" && (
                                    <Link href="/dashboard/individual/itr-filing" className={linkClass("/dashboard/individual/itr-filing")}>File ITR</Link>
                                )}
                                {user.role === "BUSINESS" && (
                                    <Link href="/dashboard/business" className={linkClass("/dashboard/business")}>Business Hub</Link>
                                )}
                            </>
                        )}
                    </nav>
                </div>

                <div className="flex items-center gap-2 sm:gap-4">
                    {!mounted ? (
                        <>
                            <div className="size-10" aria-hidden />
                            <div className="size-10 rounded-full border bg-muted" aria-hidden />
                        </>
                    ) : (
                    <>
                    <NotificationBell />

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="relative h-10 w-10 bg-muted rounded-full p-0 overflow-hidden border">
                                <Avatar className="h-10 w-10">
                                    <AvatarFallback className="bg-primary/10 text-primary font-bold">
                                        {user?.name?.[0] || user?.email?.[0] || "U"}
                                    </AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel className="font-normal">
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium leading-none">{user?.name}</p>
                                    <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                                <Link href="/dashboard/profile">Profile Settings</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href="/dashboard/billing">Billings & Invoices</Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                                className="text-destructive focus:text-destructive cursor-pointer"
                                onSelect={() => signOut({ callbackUrl: "/login" })}
                            >
                                Sign Out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    </>
                    )}
                </div>
            </div>
        </header>
    );
}
