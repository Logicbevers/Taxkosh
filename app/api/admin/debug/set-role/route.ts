import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

/**
 * DEBUG ONLY: Set user role for testing.
 * In production, this should be disabled or strictly protected.
 */
export async function POST(req: NextRequest) {
    if (process.env.NODE_ENV === "production" && !process.env.TESTING_MODE) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { email, role } = await req.json();

        if (!email || !role) {
            return NextResponse.json({ error: "Email and role are required" }, { status: 400 });
        }

        const user = await prisma.user.update({
            where: { email },
            data: { role: role as UserRole }
        });

        return NextResponse.json({ message: `Role for ${email} updated up to ${role}`, user });
    } catch (error) {
        console.error("Set role error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
