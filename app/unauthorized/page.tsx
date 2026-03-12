import { Button } from "@/components/ui/button";
import { ShieldAlert, ArrowLeft, Home } from "lucide-react";
import Link from "next/link";

export default function UnauthorizedPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-[conic-gradient(at_top_right,_var(--tw-gradient-stops))] from-slate-100 via-slate-50 to-slate-100 dark:from-slate-900 dark:via-background dark:to-slate-900 px-4">
            <div className="max-w-md w-full relative group">
                {/* Decorative blur elements */}
                <div className="absolute -inset-1 bg-gradient-to-r from-destructive/20 to-orange-500/20 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>

                <div className="relative bg-card/80 backdrop-blur-xl border border-border/40 rounded-2xl p-10 shadow-2xl text-center space-y-6">
                    <div className="mx-auto h-24 w-24 bg-gradient-to-br from-destructive/20 to-destructive/5 rounded-full flex items-center justify-center mb-2 ring-1 ring-destructive/20 animate-pulse">
                        <ShieldAlert className="h-12 w-12 text-destructive" />
                    </div>

                    <div className="space-y-2">
                        <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/70">
                            Access Denied
                        </h1>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                            This zone is restricted. Your current security clearance level doesn't grant access to this sector.
                        </p>
                    </div>

                    <div className="h-px bg-gradient-to-r from-transparent via-border/60 to-transparent my-4"></div>

                    <div className="grid grid-cols-1 gap-3">
                        <Button asChild className="h-12 shadow-md hover:shadow-lg transition-all rounded-xl gap-2 font-semibold">
                            <Link href="/dashboard"><Home className="h-4 w-4" /> Return to Dashboard</Link>
                        </Button>
                        <Button variant="ghost" asChild className="h-12 rounded-xl gap-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
                            <Link href="/"><ArrowLeft className="h-4 w-4" /> Back to Landing</Link>
                        </Button>
                    </div>

                    <p className="text-[11px] text-muted-foreground/60 uppercase tracking-widest font-bold">
                        Error Code: 403_UNAUTHORIZED_ACCESS
                    </p>
                </div>
            </div>
        </div>
    );
}

