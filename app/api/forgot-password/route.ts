import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { forgotPasswordSchema } from "@/lib/validations";
import { sendPasswordResetEmail } from "@/lib/email";
import { TokenType } from "@prisma/client";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const parsed = forgotPasswordSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json({ error: "Invalid email" }, { status: 400 });
        }

        const { email } = parsed.data;
        const user = await prisma.user.findUnique({ where: { email } });

        // Always return success to prevent email enumeration
        if (!user || !user.password) {
            return NextResponse.json({
                message: "If this email exists, a reset link has been sent.",
            });
        }

        // Invalidate any existing reset tokens
        await prisma.userToken.updateMany({
            where: {
                userId: user.id,
                type: TokenType.PASSWORD_RESET,
                usedAt: null,
            },
            data: { usedAt: new Date() },
        });

        // Create new token (1h expiry)
        const tokenRecord = await prisma.userToken.create({
            data: {
                userId: user.id,
                type: TokenType.PASSWORD_RESET,
                expiresAt: new Date(Date.now() + 60 * 60 * 1000),
            },
        });

        await sendPasswordResetEmail(email, tokenRecord.token);

        return NextResponse.json({
            message: "If this email exists, a reset link has been sent.",
        });
    } catch (error) {
        console.error("Forgot password error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
