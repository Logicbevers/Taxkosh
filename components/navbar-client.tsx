"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Menu, ChevronDown, Folder, LayoutDashboard, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Cat {
    slug: string;
    name: string;
}

interface NavUser {
    name: string | null;
    email: string | null;
    role: string | null;
}

const secondaryLinks = [
    { label: "Pricing", href: "/#pricing" },
    { label: "Why TaxKosh", href: "/#why" },
    { label: "How it works", href: "/#how-it-works" },
];

export function NavbarClient({ categories, user }: { categories: Cat[]; user: NavUser | null }) {
    const [open, setOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);
    const dashboardHref = user?.role === "ADMIN" ? "/dashboard/admin" : "/dashboard";

    // Dedupe categories by name for the dropdown (defensive against seed dupes)
    const seenNames = new Set<string>();
    const uniqueCats = categories.filter(c => {
        const key = c.name.toLowerCase().trim();
        if (seenNames.has(key)) return false;
        seenNames.add(key);
        return true;
    });

    if (!mounted) {
        return (
            <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/60 bg-background/90 backdrop-blur-md supports-[backdrop-filter]:bg-background/75 shadow-[0_1px_3px_rgb(0_0_0/0.04)]">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                    {/* Real link even before hydration so the logo is always clickable. */}
                    <Link href="/" className="flex items-center">
                        <Logo size="md" />
                    </Link>
                </div>
            </header>
        );
    }

    return (
        <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/60 bg-background/90 backdrop-blur-md supports-[backdrop-filter]:bg-background/75 shadow-[0_1px_3px_rgb(0_0_0/0.04)]">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                {/* Logo */}
                <Link href="/" className="flex items-center">
                    <Logo size="md" />
                </Link>

                {/* Desktop nav */}
                <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-foreground/70">
                    {/* Services dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="inline-flex items-center gap-1 transition-colors hover:text-foreground focus:outline-none focus-visible:text-foreground">
                                Services
                                <ChevronDown className="h-3.5 w-3.5" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-64">
                            <DropdownMenuLabel className="text-xs uppercase tracking-widest text-muted-foreground">
                                Browse by Category
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {uniqueCats.length === 0 ? (
                                <DropdownMenuItem disabled>No categories available</DropdownMenuItem>
                            ) : (
                                uniqueCats.map(c => (
                                    <DropdownMenuItem key={c.slug} asChild>
                                        <Link href={`/services/${c.slug}`} className="flex items-center gap-2 cursor-pointer">
                                            <Folder className="w-4 h-4 text-primary" />
                                            {c.name}
                                        </Link>
                                    </DropdownMenuItem>
                                ))
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                                <Link href="/services" className="cursor-pointer text-primary font-medium">
                                    View all services →
                                </Link>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {secondaryLinks.map((link) => (
                        <Link
                            key={link.label}
                            href={link.href}
                            className="transition-colors hover:text-foreground"
                        >
                            {link.label}
                        </Link>
                    ))}
                </nav>

                {/* Right Actions */}
                <div className="flex items-center gap-2">
                    <ThemeToggle />

                    {user ? (
                        <>
                            <Button variant="ghost" size="sm" className="hidden md:inline-flex gap-1.5" asChild>
                                <Link href={dashboardHref}>
                                    <LayoutDashboard className="h-4 w-4" /> Dashboard
                                </Link>
                            </Button>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="hidden md:inline-flex rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary" aria-label="Account menu">
                                        <Avatar className="h-9 w-9 border">
                                            <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                                                {(user.name?.[0] ?? user.email?.[0] ?? "U").toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56">
                                    <DropdownMenuLabel className="font-normal">
                                        <div className="flex flex-col space-y-1">
                                            <p className="text-sm font-medium leading-none">{user.name ?? "TaxKosh User"}</p>
                                            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                                        </div>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem asChild>
                                        <Link href={dashboardHref} className="cursor-pointer">Dashboard</Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link href="/dashboard/profile" className="cursor-pointer">Profile Settings</Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        className="text-destructive focus:text-destructive cursor-pointer"
                                        onSelect={() => signOut({ callbackUrl: "/" })}
                                    >
                                        <LogOut className="h-4 w-4 mr-2" /> Sign out
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </>
                    ) : (
                        <>
                            <Button variant="ghost" size="sm" className="hidden md:inline-flex" asChild>
                                <Link href="/login">Login</Link>
                            </Button>
                            <Button size="sm" className="hidden md:inline-flex" asChild>
                                <Link href="/register">Start Filing Free</Link>
                            </Button>
                        </>
                    )}

                    {/* Mobile menu */}
                    <Sheet open={open} onOpenChange={setOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
                                <Menu className="h-5 w-5" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="right" className="w-72">
                            <div className="flex flex-col gap-6 pt-8">
                                <Link href="/" className="flex items-center" onClick={() => setOpen(false)}>
                                    <Logo size="md" />
                                </Link>
                                <nav className="flex flex-col gap-4 text-sm font-medium">
                                    <div>
                                        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Services</p>
                                        <div className="flex flex-col gap-2 pl-2">
                                            {uniqueCats.map(c => (
                                                <Link
                                                    key={c.slug}
                                                    href={`/services/${c.slug}`}
                                                    onClick={() => setOpen(false)}
                                                    className="text-muted-foreground hover:text-foreground transition-colors"
                                                >
                                                    {c.name}
                                                </Link>
                                            ))}
                                            <Link
                                                href="/services"
                                                onClick={() => setOpen(false)}
                                                className="text-primary font-medium mt-1"
                                            >
                                                View all →
                                            </Link>
                                        </div>
                                    </div>
                                    {secondaryLinks.map((link) => (
                                        <Link
                                            key={link.label}
                                            href={link.href}
                                            className="text-muted-foreground hover:text-foreground transition-colors"
                                            onClick={() => setOpen(false)}
                                        >
                                            {link.label}
                                        </Link>
                                    ))}
                                </nav>
                                <div className="flex flex-col gap-2 pt-2 border-t border-border">
                                    {user ? (
                                        <>
                                            <Button variant="outline" size="sm" asChild>
                                                <Link href={dashboardHref} onClick={() => setOpen(false)}>Dashboard</Link>
                                            </Button>
                                            <Button variant="ghost" size="sm" className="text-destructive" onClick={() => { setOpen(false); signOut({ callbackUrl: "/" }); }}>
                                                Sign out
                                            </Button>
                                        </>
                                    ) : (
                                        <>
                                            <Button variant="outline" size="sm" asChild>
                                                <Link href="/login" onClick={() => setOpen(false)}>Login</Link>
                                            </Button>
                                            <Button size="sm" asChild>
                                                <Link href="/register" onClick={() => setOpen(false)}>Start Filing Free</Link>
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </header>
    );
}
