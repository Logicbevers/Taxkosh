"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);
    if (!mounted) return null;

    return (
        <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle theme"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="rounded-full text-muted-foreground hover:text-foreground"
        >
            {theme === "dark" ? (
                <Sun className="h-[1.1rem] w-[1.1rem] transition-all" />
            ) : (
                <Moon className="h-[1.1rem] w-[1.1rem] transition-all" />
            )}
        </Button>
    );
}
