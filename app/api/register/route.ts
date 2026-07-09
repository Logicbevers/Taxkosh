import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma, logAudit } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations";
import { sendVerificationEmail } from "@/lib/email";
import { TokenType, AuditAction } from "@prisma/client";
import { rateLimit } from "@/lib/middleware-utils";
import { getClientIp } from "@/lib/api-auth";

export async function POST(req: NextRequest) {
    const ip = getClientIp(req);
    const rl = rateLimit(ip, 5, 60 * 60 * 1000, "register"); // 5 registrations per hour per IP
    if (!rl.success) {
        return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
    }

    try {
        const body = await req.json();
        const parsed = registerSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
                { status: 400 }
            );
        }

        const { name, email, password, role } = parsed.data;

        // Check existing user
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return NextResponse.json(
                { error: "An account with this email already exists" },
                { status: 409 }
            );
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        // Belt-and-suspenders: self-registration can never produce an ADMIN account,
        // even if the schema validation is ever relaxed.
        const safeRole = (["INDIVIDUAL", "BUSINESS", "CA"] as const).includes(role as never)
            ? role
            : ("INDIVIDUAL" as const);

        // KYC (PAN / Aadhaar / GSTIN) is collected later on the profile page,
        // not at signup — keeps registration to a fast 4-field form.
        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: safeRole,
            },
        });

        // Log audit event
        await logAudit({
            userId: user.id,
            action: AuditAction.PROFILE_UPDATE, // Initial profile creation
            details: {
                event: "User Registration",
                role,
                emailMasked: email.replace(/(..)(.*)(@.*)/, "$1***$3")
            },
            req
        });

        const tokenRecord = await prisma.userToken.create({
            data: {
                userId: user.id,
                token: crypto.randomBytes(32).toString("hex"),
                type: TokenType.EMAIL_VERIFICATION,
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            },
        });

        // Send verification email (non-blocking — don't fail if email fails)
        try {
            await sendVerificationEmail(email, tokenRecord.token);
        } catch (emailErr) {
            console.error("Failed to send verification email:", emailErr);
        }

        return NextResponse.json(
            { message: "Account created! Please check your email to verify your account." },
            { status: 201 }
        );
    } catch (error) {
        console.error("Registration error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
