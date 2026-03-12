import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TokenType } from "@prisma/client";

export async function GET(req: NextRequest) {
    const token = req.nextUrl.searchParams.get("token");

    if (!token) {
        return NextResponse.redirect(
            new URL("/login?error=missing-token", req.url)
        );
    }

    try {
        const tokenRecord = await prisma.userToken.findUnique({
            where: { token },
            include: { user: true },
        });

        if (
            !tokenRecord ||
            tokenRecord.type !== TokenType.EMAIL_VERIFICATION ||
            tokenRecord.usedAt ||
            tokenRecord.expiresAt < new Date()
        ) {
            return NextResponse.redirect(
                new URL("/login?error=invalid-token", req.url)
            );
        }

        // Mark email as verified and token as used
        await prisma.$transaction([
            prisma.user.update({
                where: { id: tokenRecord.userId },
                data: { emailVerified: new Date() },
            }),
            prisma.userToken.update({
                where: { id: tokenRecord.id },
                data: { usedAt: new Date() },
            }),
        ]);

        return NextResponse.redirect(
            new URL("/login?verified=true", req.url)
        );
    } catch (error) {
        console.error("Email verification error:", error);
        return NextResponse.redirect(
            new URL("/login?error=server-error", req.url)
        );
    }
}
