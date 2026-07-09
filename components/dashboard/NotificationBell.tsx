"use client";

import { useEffect, useState } from "react";
import { Bell, Check, Loader2, X } from "lucide-react";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface Notification {
    id: string;
    title: string;
    message: string;
    type: string;
    isRead: boolean;
    serviceRequestId?: string;
    createdAt: string;
}

export function NotificationBell() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);

    const fetchNotifications = async () => {
        try {
            const res = await fetch("/api/notifications");
            const data = await res.json();
            if (data.notifications) {
                setNotifications(data.notifications);
                setUnreadCount(data.unreadCount);
            }
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Poll every 1 minute
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, []);

    const markAllAsRead = async () => {
        try {
            await fetch("/api/notifications", { method: "PATCH" });
            fetchNotifications();
        } catch (error) {
            console.error("Failed to mark notifications as read:", error);
        }
    };

    return (
        <Sheet open={open} onOpenChange={(val) => {
            setOpen(val);
            if (val) fetchNotifications();
        }}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-10 w-10 bg-slate-100 dark:bg-slate-900 rounded-full">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground border-2 border-background animate-in zoom-in">
                            {unreadCount}
                        </span>
                    )}
                </Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-md p-0 flex flex-col">
                <SheetHeader className="p-6 border-b bg-muted/30">
                    <div className="flex items-center justify-between">
                        <SheetTitle className="text-xl font-bold flex items-center gap-2">
                            Notifications
                            {unreadCount > 0 && (
                                <Badge variant="secondary" className="rounded-full px-2 py-0.5 text-xs">
                                    {unreadCount} new
                                </Badge>
                            )}
                        </SheetTitle>
                        {unreadCount > 0 && (
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 text-xs font-semibold text-primary"
                                onClick={markAllAsRead}
                            >
                                Mark all as read
                            </Button>
                        )}
                    </div>
                </SheetHeader>
                
                <ScrollArea className="flex-1">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-[300px] gap-3 text-muted-foreground">
                            <Loader2 className="h-8 w-8 animate-spin" />
                            <p className="text-sm font-medium">Checking for updates...</p>
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-[300px] gap-4 p-8 text-center">
                            <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center">
                                <Bell className="h-8 w-8 text-muted-foreground/50" />
                            </div>
                            <div>
                                <h4 className="font-semibold">All caught up!</h4>
                                <p className="text-sm text-muted-foreground mt-1">
                                    We'll notify you here when there are updates on your service requests.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="divide-y border-b">
                            {notifications.map((n) => (
                                <Link 
                                    key={n.id} 
                                    href={n.serviceRequestId ? `/dashboard/services/${n.serviceRequestId}` : "#"}
                                    onClick={() => setOpen(false)}
                                    className={cn(
                                        "flex flex-col gap-2 p-6 hover:bg-muted/50 transition-colors relative group",
                                        !n.isRead && "bg-primary/5"
                                    )}
                                >
                                    {!n.isRead && (
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                                    )}
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="font-black text-[10px] uppercase tracking-[0.2em] text-primary">
                                            {n.title}
                                        </span>
                                        <span className="text-[10px] font-medium text-muted-foreground">
                                            {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(n.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div className="space-y-1">
                                        <p className={cn(
                                            "text-sm leading-relaxed",
                                            !n.isRead ? "font-semibold text-foreground" : "text-muted-foreground"
                                        )}>
                                            {n.message}
                                        </p>
                                    </div>
                                    <div className="pt-2 flex items-center gap-1 text-[11px] font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                                        View Details <Check className="w-3 h-3" />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </ScrollArea>
                
                <div className="p-4 bg-muted/20 border-t">
                    <Button variant="outline" className="w-full font-bold" asChild onClick={() => setOpen(false)}>
                        <Link href="/dashboard/notifications">View All Activity</Link>
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    );
}
