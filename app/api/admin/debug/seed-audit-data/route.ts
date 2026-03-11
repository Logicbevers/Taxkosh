import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { DocumentType } from "@prisma/client";

export async function POST(req: Request) {
    if (process.env.NODE_ENV === "production" && !process.env.TESTING_MODE) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const { email } = await req.json();

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        // Clean up any existing test documents for this user to avoid conflicts
        await prisma.document.deleteMany({ where: { userId: user.id } });

        // Seed a Document
        const doc = await prisma.document.create({
            data: {
                userId: user.id,
                fileName: "Audit_Test_Doc.pdf",
                fileSize: 1024,
                documentType: DocumentType.OTHER,
                s3Key: `audit-s3-${user.id.slice(-4)}-${Date.now()}`
            }
        });

        // Seed a TaxReturn draft using upsert
        const taxReturn = await prisma.taxReturn.upsert({
            where: {
                userId_assessmentYear: {
                    userId: user.id,
                    assessmentYear: "2025-26"
                }
            },
            update: {
                status: "DRAFT",
                incomeData: {}
            },
            create: {
                userId: user.id,
                assessmentYear: "2025-26",
                status: "DRAFT",
                incomeData: {}
            }
        });

        return NextResponse.json({
            docId: doc.id,
            taxReturnId: taxReturn.id
        });
    } catch (error) {
        console.error("DATA SEED ERROR:", error);
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}
