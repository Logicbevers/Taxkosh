import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DocumentType } from "@prisma/client";
import { uploadToS3 } from "@/lib/s3";
import { scanBuffer, verifyMagicBytes } from "@/lib/virus-scan";

const ALLOWED_TYPES = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const formData = await req.formData();
        const file = formData.get("file") as File | null;
        const documentType = (formData.get("documentType") as string | null) ?? "OTHER";
        const taxReturnId = formData.get("taxReturnId") as string | null;
        const serviceRequestId = formData.get("serviceRequestId") as string | null;
        const label = formData.get("label") as string | null;

        // Validate serviceRequestId belongs to this user
        if (serviceRequestId) {
            const sr = await prisma.serviceRequest.findUnique({ where: { id: serviceRequestId } });
            if (!sr || sr.userId !== session.user.id) {
                return NextResponse.json({ error: "Invalid service request" }, { status: 403 });
            }
        }

        // Validate taxReturnId belongs to this user (IDOR guard).
        if (taxReturnId) {
            const tr = await prisma.taxReturn.findUnique({ where: { id: taxReturnId } });
            if (!tr || tr.userId !== session.user.id) {
                return NextResponse.json({ error: "Invalid tax return" }, { status: 403 });
            }
        }

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json(
                { error: "Invalid file type. Allowed: PDF, JPEG, PNG, WEBP" },
                { status: 400 }
            );
        }

        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                { error: "File too large. Maximum size: 10 MB" },
                { status: 400 }
            );
        }

        const buffer = Buffer.from(await file.arrayBuffer());

        // Defense in depth: the bytes must actually match the declared type — a
        // renamed executable claiming to be a PDF is rejected here.
        if (!verifyMagicBytes(buffer, file.type)) {
            return NextResponse.json(
                { error: "File contents don't match its type. Please upload a genuine PDF or image." },
                { status: 400 }
            );
        }

        // Malware scan (Cloudmersive when configured, heuristic otherwise).
        const scan = await scanBuffer(buffer, file.name);
        if (!scan.clean) {
            return NextResponse.json(
                { error: scan.reason ?? "File failed the malware scan" },
                { status: 400 }
            );
        }

        const s3Key = await uploadToS3(buffer, file.name, file.type);
        const storagePath: string | null = null;

        // Validate documentType enum
        const validDocTypes = Object.values(DocumentType);
        const docType = validDocTypes.includes(documentType as DocumentType)
            ? (documentType as DocumentType)
            : DocumentType.OTHER;

        // Save metadata to DB
        const document = await prisma.document.create({
            data: {
                userId: session.user.id,
                taxReturnId: taxReturnId || null,
                serviceRequestId: serviceRequestId || null,
                documentType: docType,
                fileName: file.name,
                fileSize: file.size,
                label: label || null,
                s3Key,
                mimeType: file.type,
                isEncrypted: true,
                storagePath,
            },
        });

        return NextResponse.json({ success: true, document });
    } catch (error) {
        console.error("[Document Upload Error]", error);
        return NextResponse.json({ error: "Failed to upload document" }, { status: 500 });
    }
}
