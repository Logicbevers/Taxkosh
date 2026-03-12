import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { resetPasswordSchema } from "@/lib/validations";
import { TokenType } from "@prisma/client";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const parsed = resetPasswordSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
                { status: 400 }
            );
        }

        const { token, password } = parsed.data;

        const tokenRecord = await prisma.userToken.findUnique({
            where: { token },
        });

        if (
            !tokenRecord ||
            tokenRecord.type !== TokenType.PASSWORD_RESET ||
            tokenRecord.usedAt ||
            tokenRecord.expiresAt < new Date()
        ) {
            return NextResponse.json(
                { error: "Invalid or expired reset link. Please request a new one." },
                { status: 400 }
            );
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        await prisma.$transaction([
            prisma.user.update({
                where: { id: tokenRecord.userId },
                data: { password: hashedPassword },
            }),
            prisma.userToken.update({
                where: { id: tokenRecord.id },
                data: { usedAt: new Date() },
            }),
        ]);

        return NextResponse.json({
            message: "Password reset successfully. You can now log in.",
        });
    } catch (error) {
        console.error("Reset password error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
