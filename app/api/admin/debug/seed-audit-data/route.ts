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

        // Seed a Document
        // Required fields: userId, fileName, fileSize, documentType
        const doc = await prisma.document.create({
            data: {
                userId: user.id,
                fileName: "Audit_Test_Doc.pdf",
                fileSize: 1024,
                documentType: DocumentType.OTHER,
                s3Key: "test-audit-key-123"
            }
        });

        // Seed a TaxReturn draft
        // Required fields: userId
        // Note: Assessment year defaults to 2025-26 in schema
        const taxReturn = await prisma.taxReturn.create({
            data: {
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
