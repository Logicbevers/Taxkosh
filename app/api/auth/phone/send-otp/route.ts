import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { randomInt } from "crypto";
import { sendOtpSms } from "@/lib/sms";

const schema = z.object({
    phone: z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
});

const OTP_WINDOW_MS   = 60_000;   // 1 minute
const OTP_MAX_SENDS   = 3;        // max sends per window per user
const OTP_EXPIRY_MS   = 600_000;  // 10 minutes

export async function POST(req: Request) {
    const guard = await requireAuth();
    if (!guard.ok) return guard.response;

    const userId = guard.session.user.id;

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json(
            { error: parsed.error.flatten().fieldErrors.phone?.[0] ?? "Invalid phone number" },
            { status: 400 }
        );
    }

    const { phone } = parsed.data;

    // Rate limit: max OTP_MAX_SENDS sends per OTP_WINDOW_MS per user
    const recentCount = await prisma.phoneOTP.count({
        where: {
            userId,
            createdAt: { gt: new Date(Date.now() - OTP_WINDOW_MS) },
        },
    });
    if (recentCount >= OTP_MAX_SENDS) {
        return NextResponse.json(
            { error: "Too many OTP requests. Please wait a minute before trying again." },
            { status: 429 }
        );
    }

    // Invalidate any active OTPs for this user
    await prisma.phoneOTP.updateMany({
        where: { userId, usedAt: null, expiresAt: { gt: new Date() } },
        data: { expiresAt: new Date() },
    });

    const code = randomInt(100_000, 1_000_000).toString();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);

    await prisma.phoneOTP.create({
        data: { userId, phone, code, expiresAt },
    });

    // Deliver the code via MSG91 (simulated when no provider is configured).
    const sendResult = await sendOtpSms(phone, code);

    // A configured provider that fails to deliver should surface an error so the
    // user can retry — the stored OTP simply goes unused and expires.
    if (!sendResult.simulated && sendResult.error) {
        return NextResponse.json(
            { error: sendResult.error + ". Please try again." },
            { status: 502 }
        );
    }

    // Only expose the code client-side when it was NOT actually texted (i.e. no
    // provider) and we're not in production — never leak a real OTP.
    const isDev = process.env.NODE_ENV !== "production";
    const exposeCode = sendResult.simulated && isDev;

    return NextResponse.json({
        success: true,
        message: `OTP sent to +91 ${phone.slice(0, 2)}XXXXXX${phone.slice(-2)}`,
        ...(exposeCode ? { devOtp: code } : {}),
    });
}
