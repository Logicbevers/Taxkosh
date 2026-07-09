import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const guard = await requireAdmin();
    if (!guard.ok) return guard.response;

    try {
        const { content } = await req.json();

        if (!content || typeof content !== "string" || content.trim().length === 0) {
            return NextResponse.json({ error: "Note content is required" }, { status: 400 });
        }
        if (content.length > 5000) {
            return NextResponse.json({ error: "Note content must be under 5000 characters" }, { status: 400 });
        }

        const resolvedParams = await params;

        const note = await prisma.internalNote.create({
            data: {
                serviceRequestId: resolvedParams.id,
                authorId: guard.session.user.id,
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
    const guard = await requireAdmin();
    if (!guard.ok) return guard.response;

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
