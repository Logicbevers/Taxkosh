import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const guard = await requireAuth();
    if (!guard.ok) return guard.response;

    try {
        const notifications = await prisma.notification.findMany({
            where: { userId: guard.session.user.id },
            orderBy: { createdAt: "desc" },
            take: 20
        });

        const unreadCount = await prisma.notification.count({
            where: { userId: guard.session.user.id, isRead: false }
        });

        return NextResponse.json({ notifications, unreadCount });
    } catch (error) {
        console.error("Fetch Notifications Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PATCH() {
    const guard = await requireAuth();
    if (!guard.ok) return guard.response;

    try {
        await prisma.notification.updateMany({
            where: { userId: guard.session.user.id, isRead: false },
            data: { isRead: true }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Mark All Read Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
