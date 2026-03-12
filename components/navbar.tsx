"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const navLinks = [
    { label: "Services", href: "#services" },
    { label: "Pricing", href: "#pricing" },
    { label: "Why TaxKosh", href: "#why" },
    { label: "Testimonials", href: "#testimonials" },
];

export function Navbar() {
    const [open, setOpen] = useState(false);

    return (
        <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                        <FileText className="h-4 w-4" />
                    </span>
                    <span>
                        Tax<span className="text-primary">Kosh</span>
                    </span>
                </Link>

                {/* Desktop nav */}
                <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
                    {navLinks.map((link) => (
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
                    <Button variant="ghost" size="sm" className="hidden md:inline-flex" asChild>
                        <Link href="/login">Login</Link>
                    </Button>
                    <Button size="sm" className="hidden md:inline-flex" asChild>
                        <Link href="/register">Start Filing Free</Link>
                    </Button>

                    {/* Mobile menu */}
                    <Sheet open={open} onOpenChange={setOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
                                <Menu className="h-5 w-5" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="right" className="w-72">
                            <div className="flex flex-col gap-6 pt-8">
                                <Link href="/" className="flex items-center gap-2 font-bold text-lg" onClick={() => setOpen(false)}>
                                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                                        <FileText className="h-3.5 w-3.5" />
                                    </span>
                                    Tax<span className="text-primary">Kosh</span>
                                </Link>
                                <nav className="flex flex-col gap-4 text-sm font-medium">
                                    {navLinks.map((link) => (
                                        <Link
                                            key={link.label}
                                            href={link.href}
                                            className="text-muted-foreground transition-colors hover:text-foreground"
                                            onClick={() => setOpen(false)}
                                        >
                                            {link.label}
                                        </Link>
                                    ))}
                                </nav>
                                <div className="flex flex-col gap-2 pt-2 border-t border-border">
                                    <Button variant="outline" size="sm" asChild>
                                        <Link href="/login" onClick={() => setOpen(false)}>Login</Link>
                                    </Button>
                                    <Button size="sm" asChild>
                                        <Link href="/register" onClick={() => setOpen(false)}>Start Filing Free</Link>
                                    </Button>
                                </div>
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </header>
    );
}
