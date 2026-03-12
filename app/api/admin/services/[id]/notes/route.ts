import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    const userRole = session?.user?.role;

    const allowedRoles: UserRole[] = [UserRole.ADMIN, UserRole.TAX_EXECUTIVE, UserRole.SENIOR_REVIEWER];
    if (!session?.user?.id || !allowedRoles.includes(userRole as UserRole)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    try {
        const { content } = await req.json();
        const resolvedParams = await params;

        const note = await prisma.internalNote.create({
            data: {
                serviceRequestId: resolvedParams.id,
                authorId: session.user.id,
                content
            },
            include: {
                author: {
                    select: { name: true, role: true }
                }
            }
        });

        return NextResponse.json(note);
    } catch (error) {
        console.error("Internal Note Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    const userRole = session?.user?.role;

    const allowedRoles: UserRole[] = [UserRole.ADMIN, UserRole.TAX_EXECUTIVE, UserRole.SENIOR_REVIEWER];
    if (!session?.user?.id || !allowedRoles.includes(userRole as UserRole)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const resolvedParams = await params;

    const notes = await prisma.internalNote.findMany({
        where: { serviceRequestId: resolvedParams.id },
        include: {
            author: {
                select: { name: true, role: true }
            }
        },
        orderBy: { createdAt: "asc" }
    });

    return NextResponse.json(notes);
}
