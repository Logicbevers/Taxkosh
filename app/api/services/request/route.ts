import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import z from "zod";

const createRequestSchema = z.object({
    category: z.enum(["ITR_FILING", "GST_FILING", "TDS_FILING", "BUSINESS_COMPLIANCE"]),
    notes: z.string().optional(),
});

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const json = await req.json();
        const body = createRequestSchema.parse(json);

        const serviceRequest = await prisma.serviceRequest.create({
            data: {
                userId: session.user.id,
                category: body.category,
                notes: body.notes,
                status: "PENDING_DOCUMENTS",
            },
        });

        return NextResponse.json(serviceRequest, { status: 201 });
    } catch (error: any) {
        console.error("Failed to create service request:", error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (id) {
            const serviceRequest = await prisma.serviceRequest.findUnique({
                where: {
                    id,
                    userId: session.user.id, // Ensure they only fetch their own
                },
                include: {
                    documents: true,
                },
            });

            if (!serviceRequest) {
                return NextResponse.json({ error: "Not found" }, { status: 404 });
            }

            return NextResponse.json(serviceRequest);
        }

        const serviceRequests = await prisma.serviceRequest.findMany({
            where: {
                userId: session.user.id,
            },
            include: {
                documents: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return NextResponse.json(serviceRequests);
    } catch (error) {
        console.error("Failed to fetch service requests:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
