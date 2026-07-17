import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import z from "zod";

const createRequestSchema = z.object({
    serviceId: z.string().optional(),
    planId: z.string().optional(),
    notes: z.string().optional(),
});

export async function POST(req: Request) {
    try {
        const guard = await requireAuth();
        if (!guard.ok) return guard.response;

        const json = await req.json();
        const body = createRequestSchema.parse(json);

        const serviceRequest = await prisma.serviceRequest.create({
            data: {
                userId: guard.session.user.id,
                serviceId: body.serviceId,
                planId: body.planId,
                notes: body.notes,
                status: "CREATED",
            },
        });

        return NextResponse.json(serviceRequest, { status: 201 });
    } catch (error: unknown) {
        console.error("Failed to create service request:", error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        const guard = await requireAuth();
        if (!guard.ok) return guard.response;

        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (id) {
            const serviceRequest = await prisma.serviceRequest.findUnique({
                where: {
                    id,
                    userId: guard.session.user.id, // Ensure they only fetch their own
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
                userId: guard.session.user.id,
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
