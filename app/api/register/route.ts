import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma, logAudit } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations";
import { sendVerificationEmail } from "@/lib/email";
import { TokenType, AuditAction } from "@prisma/client";
import { encrypt } from "@/lib/security";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const parsed = registerSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
                { status: 400 }
            );
        }

        const { name, email, password, role, pan, gstin, aadhaarLast4 } = parsed.data;

        // Check existing user
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return NextResponse.json(
                { error: "An account with this email already exists" },
                { status: 409 }
            );
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        // Encrypt sensitive data for storage at rest
        const encryptedPan = pan ? encrypt(pan) : null;

        // Create user
        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role,
                pan: encryptedPan,
                gstin: gstin || null,
                aadhaar: aadhaarLast4 || null, // storing last 4 digits only per compliance
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

        // Create email verification token (24h expiry)
        const tokenRecord = await prisma.userToken.create({
            data: {
                userId: user.id,
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
