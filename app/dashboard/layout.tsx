import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();
    if (!session?.user) redirect("/login");

    return (
        <div className="min-h-screen flex flex-col">
            <DashboardHeader user={session.user} />
            <div className="flex-1 bg-muted/20">
                {children}
            </div>
        </div>
    );
}
