import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * DEV-ONLY: Marks all users as email-verified so local login testing works
 * without a real SMTP/Resend API key.
 *
 * Requires the DEV_SECRET env var to be present in the request header
 * (x-dev-secret) so this endpoint cannot be triggered by an unauthenticated
 * third party even in non-production environments (e.g. staging).
 */
export async function GET(req: NextRequest) {
    if (process.env.NODE_ENV === "production") {
        return NextResponse.json({ error: "Not available in production" }, { status: 403 });
    }

    const devSecret = process.env.DEV_SECRET;
    const provided = req.headers.get("x-dev-secret");
    if (!devSecret || !provided || provided !== devSecret) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
