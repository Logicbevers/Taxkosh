import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * DEBUG ONLY: Verify user email for testing.
 */
export async function POST(req: NextRequest) {
    if (process.env.NODE_ENV === "production" && !process.env.TESTING_MODE) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json({ error: "Email is required" }, { status: 400 });
        }

        const user = await prisma.user.update({
            where: { email },
            data: { emailVerified: new Date() }
        });

        return NextResponse.json({ message: `Email for ${email} verified`, user });
    } catch (error) {
        console.error("Verify email error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
