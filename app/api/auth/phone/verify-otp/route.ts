import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
    phone: z.string().regex(/^[6-9]\d{9}$/),
    code: z.string().length(6).regex(/^\d{6}$/),
});

const ATTEMPT_WINDOW_MS = 600_000; // 10 minutes
const MAX_ATTEMPTS      = 5;       // max wrong guesses per window per user

export async function POST(req: Request) {
    const guard = await requireAuth();
    if (!guard.ok) return guard.response;

    const userId = guard.session.user.id;

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const { phone, code } = parsed.data;

    // Brute-force guard: count failed attempts in the last window
    const recentAttempts = await prisma.phoneOTP.count({
        where: {
            userId,
            usedAt: null,
            createdAt: { gt: new Date(Date.now() - ATTEMPT_WINDOW_MS) },
        },
    });
    if (recentAttempts > MAX_ATTEMPTS) {
        return NextResponse.json(
            { error: "Too many failed attempts. Please request a new OTP." },
            { status: 429 }
        );
    }

    const otp = await prisma.phoneOTP.findFirst({
        where: {
            userId,
            phone,
            code,
            usedAt: null,
            expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: "desc" },
    });

    if (!otp) {
        return NextResponse.json(
            { error: "Invalid or expired OTP. Please request a new one." },
            { status: 400 }
        );
    }

    // Mark OTP used and update user phone + phoneVerified atomically
    await prisma.$transaction([
        prisma.phoneOTP.update({ where: { id: otp.id }, data: { usedAt: new Date() } }),
        prisma.user.update({ where: { id: userId }, data: { phone, phoneVerified: new Date() } }),
    ]);

    return NextResponse.json({ success: true, message: "Phone verified successfully." });
}
