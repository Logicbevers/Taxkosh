import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import z from "zod";

// Statuses a regular (non-admin) user is allowed to self-set.
const USER_ALLOWED_STATUSES = ["DOCUMENTS_SUBMITTED"] as const;

// Full list that admins/staff may set.
const updateStatusSchema = z.object({
    status: z.enum([
        "DOCUMENTS_PENDING",
        "DOCUMENTS_SUBMITTED",
        "UNDER_PROCESS",
        "CLARIFICATION_REQUIRED",
        "COMPLETED",
        "FILED",
        "REJECTED",
    ]),
});

export async function POST(
    req: Request,
    { params }: any
) {
    try {
        const resolvedParams = await params;
        const id = resolvedParams.id;
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const json = await req.json();
        const body = updateStatusSchema.parse(json);

        const existing = await prisma.serviceRequest.findUnique({
            where: { id },
        });

        if (!existing) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        // Must own the request.
        if (existing.userId !== session.user.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Non-admin users may only transition their own request to DOCUMENTS_SUBMITTED.
        // All other status changes (COMPLETED, REJECTED, FILED, etc.) are admin-only.
        const adminRoles = ["ADMIN", "TAX_EXECUTIVE", "SENIOR_REVIEWER"];
        const isAdmin = adminRoles.includes((session.user as { role?: string }).role ?? "");
        if (!isAdmin && !USER_ALLOWED_STATUSES.includes(body.status as never)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const updatedRequest = await prisma.serviceRequest.update({
            where: {
                id,
            },
            data: {
                status: body.status,
            },
        });

        return NextResponse.json(updatedRequest);
    } catch (error: unknown) {
        console.error("Failed to update status:", error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
