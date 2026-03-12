import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

export async function GET() {
    const session = await auth();
    if (session?.user?.role !== UserRole.ADMIN) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const team = await prisma.user.findMany({
        where: {
            role: {
                in: [UserRole.TAX_EXECUTIVE, UserRole.SENIOR_REVIEWER]
            }
        },
        select: {
            id: true,
            name: true,
            email: true,
            role: true
        }
    });

    return NextResponse.json(team);
}
