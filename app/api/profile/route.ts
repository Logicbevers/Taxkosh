import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { kycSchema } from "@/lib/validations";
import { encrypt } from "@/lib/security";
import { logAudit } from "@/lib/prisma";
import { AuditAction } from "@prisma/client";

/**
 * PATCH /api/profile
 * Lets a signed-in user save/update their KYC details (phone, PAN, Aadhaar last-4, GSTIN).
 * All fields optional so partial completion is allowed. PAN is encrypted at rest.
 */
export async function PATCH(req: Request) {
    const guard = await requireAuth();
    if (!guard.ok) return guard.response;

    const body = await req.json();
    const parsed = kycSchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json(
            { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
            { status: 400 }
        );
    }

    const { phone, pan, aadhaarLast4, gstin } = parsed.data;

    // Only write fields the user actually supplied (empty string = leave unchanged).
    const data: {
        phone?: string;
        pan?: string;
        aadhaar?: string;
        gstin?: string;
    } = {};
    if (phone) data.phone = phone;
    if (pan) data.pan = encrypt(pan.toUpperCase());
    if (aadhaarLast4) data.aadhaar = aadhaarLast4; // last 4 only, per UIDAI guidance
    if (gstin) data.gstin = gstin.toUpperCase();

    if (Object.keys(data).length === 0) {
        return NextResponse.json({ error: "No changes provided" }, { status: 400 });
    }

    await prisma.user.update({
        where: { id: guard.session.user.id },
        data,
    });

    await logAudit({
        userId: guard.session.user.id,
        action: AuditAction.PROFILE_UPDATE,
        details: { fields: Object.keys(data) },
        req,
    });

    return NextResponse.json({ success: true });
}
