import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, Calendar, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default async function NotificationsPage() {
    const session = await auth();
    if (!session?.user) redirect("/login");

    const notifications = await prisma.notification.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
    });

    return (
        <div className="container p-6 max-w-4xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Activity Feed</h1>
                    <p className="text-muted-foreground mt-1">Stay updated on your service requests and compliance tasks.</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bell className="h-6 w-6 text-primary" />
                </div>
            </div>

            <div className="grid gap-4">
                {notifications.length === 0 ? (
                    <Card className="border-dashed">
                        <CardContent className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
                            <Bell className="h-12 w-12 opacity-20 mb-4" />
                            <p>No notifications found yet.</p>
                        </CardContent>
                    </Card>
                ) : (
                    notifications.map((n) => (
                        <Card key={n.id} className={cn("overflow-hidden group hover:border-primary/30 transition-all", !n.isRead && "border-l-4 border-l-primary bg-primary/5")}>
                            <Link href={(n as any).serviceRequestId ? `/dashboard/services/${(n as any).serviceRequestId}` : "#"}>
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex gap-4">
                                            <div className={cn(
                                                "h-10 w-10 rounded-lg flex items-center justify-center shrink-0",
                                                n.type === "alert" ? "bg-red-500/10 text-red-500" : "bg-primary/10 text-primary"
                                            )}>
                                                {n.type === "alert" ? <AlertCircle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-semibold">{n.title}</h3>
                                                    {!n.isRead && <Badge variant="default" className="h-4 px-1.5 text-[10px] uppercase">New</Badge>}
                                                </div>
                                                <p className="text-sm text-muted-foreground leading-relaxed">
                                                    {n.message}
                                                </p>
                                                <div className="flex items-center gap-4 pt-2">
                                                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                        <Calendar className="h-3 w-3" />
                                                        {new Date(n.createdAt).toLocaleDateString()} at {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Link>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
