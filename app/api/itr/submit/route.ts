import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function generateAckNumber(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "TK-";
    for (let i = 0; i < 10; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

export async function POST() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        // Find the user's draft for current AY
        const existing = await prisma.taxReturn.findFirst({
            where: {
                userId: session.user.id,
                assessmentYear: "2025-26",
            },
        });

        if (!existing) {
            return NextResponse.json(
                { error: "No ITR draft found. Please complete the ITR wizard first." },
                { status: 404 }
            );
        }

        if (existing.status === "SUBMITTED") {
            return NextResponse.json(
                { error: "ITR already submitted", ackNumber: existing.ackNumber },
                { status: 409 }
            );
        }

        const ackNumber = generateAckNumber();

        // Atomic: updateMany with a status filter makes the duplicate-submission
        // check and the status write a single DB operation, preventing a double-click
        // race where both requests read DRAFT and then overwrite each other's ackNumber.
        const result = await prisma.taxReturn.updateMany({
            where: { id: existing.id, status: "DRAFT" },
            data: { status: "SUBMITTED", ackNumber, submittedAt: new Date() },
        });

        if (result.count === 0) {
            // A concurrent request already submitted — return its ackNumber.
            const current = await prisma.taxReturn.findUnique({
                where: { id: existing.id },
                select: { ackNumber: true },
            });
            return NextResponse.json(
                { error: "ITR already submitted", ackNumber: current?.ackNumber },
                { status: 409 }
            );
        }

        const updated = await prisma.taxReturn.findUniqueOrThrow({
            where: { id: existing.id },
        });

        // Audit Logging
        const { logAudit } = await import("@/lib/prisma");
        const { AuditAction } = await import("@prisma/client");
        await logAudit({
            userId: session.user.id,
            action: AuditAction.ITR_SUBMISSION,
            entityId: updated.id,
            entityType: "TaxReturn",
            details: { ackNumber: updated.ackNumber }
        });

        return NextResponse.json({
            success: true,
            ackNumber: updated.ackNumber,
            submittedAt: updated.submittedAt,
        });
    } catch (error) {
        console.error("[ITR Submit Error]", error);
        return NextResponse.json({ error: "Failed to submit ITR" }, { status: 500 });
    }
}
