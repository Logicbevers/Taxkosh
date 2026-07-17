import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { forgotPasswordSchema } from "@/lib/validations";
import { sendVerificationEmail } from "@/lib/email";
import { TokenType } from "@prisma/client";
import { rateLimit } from "@/lib/middleware-utils";
import { getClientIp } from "@/lib/api-auth";

/**
 * Re-issue an email-verification link.
 *
 * Registration was the only place that ever sent one, and the tokens expire after
 * 24h — so anyone who missed the window was locked out permanently: the link can't
 * be reused, re-registering is refused (email taken), and production blocks
 * unverified logins. This is the recovery path.
 *
 * Deliberately mirrors forgot-password: same 5-per-15-minutes budget, same
 * always-succeed response shape. The generic message is load-bearing — a response
 * that differed for unknown/already-verified addresses would turn this into an
 * account-enumeration oracle.
 */
export async function POST(req: NextRequest) {
    const ip = getClientIp(req);
    const rl = await rateLimit(ip, 5, 15 * 60 * 1000, "resend-verification");
    if (!rl.success) {
        return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
    }

    // Same wording on every path below — do not make this conditional.
    const genericResponse = NextResponse.json({
        message: "If this email needs verification, a new link has been sent.",
    });

    try {
        const parsed = forgotPasswordSchema.safeParse(await req.json());
        if (!parsed.success) {
            return NextResponse.json({ error: "Invalid email" }, { status: 400 });
        }

        const { email } = parsed.data;
        const user = await prisma.user.findUnique({ where: { email } });

        // Unknown address, OAuth-only account, or already verified — nothing to do,
        // and the caller must not be able to tell which.
        if (!user || !user.password || user.emailVerified) {
            return genericResponse;
        }

        // Retire outstanding links so only the newest one works.
        await prisma.userToken.updateMany({
            where: { userId: user.id, type: TokenType.EMAIL_VERIFICATION, usedAt: null },
            data: { usedAt: new Date() },
        });

        const tokenRecord = await prisma.userToken.create({
            data: {
                userId: user.id,
                token: crypto.randomBytes(32).toString("hex"),
                type: TokenType.EMAIL_VERIFICATION,
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            },
        });

        await sendVerificationEmail(email, tokenRecord.token);
        return genericResponse;
    } catch (error) {
        console.error("Resend verification error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
