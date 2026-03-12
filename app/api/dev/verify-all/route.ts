import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * DEV-ONLY: Marks all users as email-verified so local login testing works
 * without a real SMTP/Resend API key.
 * Returns 403 in production — never exposed publicly.
 */
export async function GET() {
    if (process.env.NODE_ENV === "production") {
        return NextResponse.json({ error: "Not available in production" }, { status: 403 });
    }

    const result = await prisma.user.updateMany({
        where: { emailVerified: null },
        data: { emailVerified: new Date() },
    });

    return NextResponse.json({
        message: `✅ Verified ${result.count} user(s). You can now log in.`,
        count: result.count,
    });
}
