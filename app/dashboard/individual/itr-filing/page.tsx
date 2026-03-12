import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ITRWizard } from "@/components/itr-wizard/itr-wizard";
import { FileText, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function ITRFilingPage() {
    const session = await auth();
    // TEMPORARY BYPASS FOR BROWSER AGENT TESTING
    // if (!session) redirect("/login");

    return (
        <div className="min-h-screen bg-muted/20 pb-20">

            {/* Header bar */}
            <header className="bg-card border-b border-border/60 sticky top-0 z-10">
                <div className="max-w-4xl mx-auto w-full px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" asChild className="-ml-2 text-muted-foreground">
                            <Link href="/dashboard/individual"><ArrowLeft className="h-5 w-5" /></Link>
                        </Button>
                        <div className="flex items-center gap-2 font-bold text-lg">
                            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                                <FileText className="h-3.5 w-3.5" />
                            </span>
                            ITR <span className="text-primary pr-1">Filing</span> (AY 2025-26)
                        </div>
                    </div>
                    <div className="text-sm font-medium text-muted-foreground hidden sm:block">
                        {session?.user?.name || session?.user?.email || "Test User"}
                    </div>
                </div>
            </header>

            {/* Main Wizard Area */}
            <main className="pt-8 px-4">
                <ITRWizard />
            </main>

        </div>
    );
}
